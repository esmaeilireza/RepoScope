// lib/semantic/runner.ts
//
// RepoScope Layer 3: semantic / LLM evaluation.
//
// Design contract:
// - Semantic rules must not fabricate findings when the LLM was not actually used.
// - If the LLM is unavailable, invalid JSON is returned, budget is exceeded, or the file is missing:
//   skip silently / fail open. Do not emit a semantic finding.
// - If a structural AST rule already confirmed the same violation for the same file:
//   skip the semantic rule for that file.
// - If an explicit deterministic preflight confirms the violation:
//   skip the semantic rule for that file.
// - Only emit a semantic finding when the LLM returns a valid JSON result below threshold
//   AND the reply is internally consistent: reasoning is non-empty AND at least one
//   concrete missing construct is listed AND the model did not itself declare `passed: true`.
//
// Semantic output is a FALLBACK signal, not an authority.
// The LLM is permitted to emit a finding only when it provides a concrete, internally
// consistent violation. The normalization layer rejects self-contradictory replies rather
// than trusting whichever field the LLM happened to fill in last.
//
// Timeout note:
// - Default per-call timeout is 300_000 ms (5 min). A cold start of a 7B Q4_K_M
//   on Windows can take 90-150s before generation even begins, and the model still
//   has to process an up-to-8000-char prompt and emit valid JSON. 120s (the old
//   hardcoded value) aborts mid-generation and produces silent "skip" logs that
//   look like LLM unavailability.
// - Override via RunSemanticOptions.timeoutMs or env REPOSCOPE_SEMANTIC_TIMEOUT_MS.
//   Values below 10_000 ms are rejected (guard against typos like "10"); values
//   above 3_600_000 ms are clamped (guard against accidental 24h hangs).

import { matchesAnyGlob } from "../utils";
import type { Finding, RuleSpec } from "../types";

const MAX_INPUT_CHARS = 8000;
const DEFAULT_THRESHOLD = 0.7;
const DEFAULT_MAX_CHECKS = 10;
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.REPOSCOPE_MODEL ?? "reposcope-mistral:latest";

const MIN_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 3_600_000;
const FALLBACK_TIMEOUT_MS = 300_000;

function resolveTimeoutMs(override?: number): number {
  const candidates: unknown[] = [
    override,
    process.env.REPOSCOPE_SEMANTIC_TIMEOUT_MS,
    FALLBACK_TIMEOUT_MS,
  ];

  for (const raw of candidates) {
    const parsed =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number.parseFloat(raw)
          : Number.NaN;

    if (Number.isFinite(parsed) && parsed >= MIN_TIMEOUT_MS) {
      return Math.min(Math.floor(parsed), MAX_TIMEOUT_MS);
    }
  }

  return FALLBACK_TIMEOUT_MS;
}

const DEFAULT_TIMEOUT_MS = resolveTimeoutMs();

export interface RunSemanticOptions {
  maxChecks?: number;
  priorFindings?: Finding[];
  model?: string;
  ollamaUrl?: string;
  timeoutMs?: number;
  debug?: boolean;
}

/**
 * The reconciled shape the rest of the runner operates on.
 *
 *   passed  — final compliance verdict. `true` iff `score >= threshold`.
 *   score   — reconciled score in [0,1]. May be rewritten by the reconcile
 *             logic in normalizeSemanticResult(); do NOT treat this as the
 *             raw LLM score.
 *   missing — only non-empty string entries from the LLM's `missing` field.
 *   reasoning — trimmed reasoning string; may be empty if the LLM omitted it.
 *
 * NOTE: This is intentionally a DIFFERENT type from `SemanticEvalResult` in
 * lib/types.ts. That one carries `tokens_used`, `skipped`, and `skipReason`
 * because it is the cross-module result contract. This one is the local
 * reconciled view used only inside the runner.
 */
export interface SemanticResult {
  passed: boolean;
  score: number;
  missing: string[];
  reasoning: string;
}

/**
 * Loose shape accepted from the LLM. The LLM output is untrusted:
 * any of these fields may be missing, of the wrong type, or contradictory.
 */
export type SemanticRawResponse = Record<string, unknown>;

type LooseFinding = Finding & Record<string, unknown>;
type LooseRule = RuleSpec & Record<string, unknown>;
type LooseCheck = Record<string, unknown>;

interface StructuralIndex {
  byRuleFile: Set<string>;
  byFile: Set<string>;
}

function debugEnabled(options?: RunSemanticOptions): boolean {
  return Boolean(options?.debug || process.env.REPOSCOPE_DEBUG === "1");
}

function severityWeight(severity: unknown): number {
  switch (String(severity ?? "").toLowerCase()) {
    case "critical":
      return 10;
    case "error":
      return 5;
    case "warning":
      return 2;
    case "info":
      return 1;
    default:
      return 1;
  }
}

/**
 * Normalize a path for glob matching.
 * - Converts Windows backslashes to forward slashes.
 * - Strips leading "./" so "**\/*.sql" matches both "./models/foo.sql"
 *   and "models/foo.sql" without special-casing.
 */
function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item));
  }

  return [];
}

/**
 * Normalize a glob-or-glob-list field to a flat string array.
 *
 * Empty strings are dropped because a stray `file_glob: ""` in YAML would
 * otherwise match nothing but still register as "at least one glob declared",
 * which suppresses the "no file_glob" diagnostic.
 */
function normalizeGlobList(value: unknown): string[] {
  const out: string[] = [];

  if (typeof value === "string" && value.length > 0) {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.length > 0) {
        out.push(item);
      }
    }
  }

  return out;
}

/**
 * Collect every glob field that could declare a semantic target.
 *
 * Variadic on purpose: the runner must accept globs from both the check
 * (per-check override) and the rule (rule-wide default). Passing only the
 * check would silently drop rules whose glob lives at the rule level.
 *
 * Accepts both singular and plural field names. Plural forms are new; the
 * singular forms (`file_glob`, `path_glob`) remain the canonical spelling
 * in YAML manifests, but plural forms let a rule express an explicit union
 * without a separate expansion pass.
 */
function collectGlobs(...sources: unknown[]): string[] {
  const out: string[] = [];

  for (const source of sources) {
    if (typeof source !== "object" || source === null) {
      continue;
    }

    const record = source as Record<string, unknown>;

    out.push(
      ...normalizeGlobList(record["file_glob"]),
      ...normalizeGlobList(record["path_glob"]),
      ...normalizeGlobList(record["file_globs"]),
      ...normalizeGlobList(record["path_globs"]),
      // Legacy aliases still honoured for backward compatibility with
      // rules written before the file_glob/path_glob split.
      ...normalizeGlobList(record["target_glob"]),
      ...normalizeGlobList(record["files"]),
    );
  }

  return out;
}

/**
 * Expand shell-style brace alternations into a flat list of globs.
 *
 * Brace expansion is done here, before the glob matcher runs, so that
 * `**\/*.{py,ts,js}` matches the three intended extensions regardless of
 * whether `matchesAnyGlob` understands `{a,b,c}` internally. The matcher
 * (in `../utils`) is treated as the single authority for path/glob
 * semantics; brace expansion is a pre-pass, not a second matcher.
 *
 * Handles nested braces: `a/{b,c/{d,e}}` → [`a/b`, `a/c/d`, `a/c/e`].
 * A glob with no brace returns [glob] unchanged.
 */
function expandBraces(glob: string): string[] {
  const open = glob.indexOf("{");
  if (open === -1) return [glob];

  let depth = 0;
  let close = -1;
  for (let i = open; i < glob.length; i++) {
    if (glob[i] === "{") depth++;
    else if (glob[i] === "}") {
      depth--;
      if (depth === 0) { close = i; break; }
    }
  }
  if (close === -1) return [glob];

  const before = glob.slice(0, open);
  const inner = glob.slice(open + 1, close);
  const after = glob.slice(close + 1);

  const parts: string[] = [];
  let d = 0, start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "{") d++;
    else if (ch === "}") d--;
    else if (ch === "," && d === 0) {
      parts.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(inner.slice(start));

  const out: string[] = [];
  for (const p of parts) {
    for (const e of expandBraces(before + p + after)) out.push(e);
  }
  return out;
}

function getCandidateFiles(
  check: LooseCheck,
  rule: LooseRule,
  fileContents: Record<string, string>,
): string[] {
  const globs = collectGlobs(check, rule);

  if (globs.length === 0) {
    return [];
  }

  // Brace expansion runs before the matcher. See expandBraces() above.
  const expandedGlobs = globs.flatMap(expandBraces);
  const files = Object.keys(fileContents);

  return files.filter((filePath) =>
    matchesAnyGlob(filePath, expandedGlobs),
  );
}

function getThreshold(check: LooseCheck, rule: LooseRule): number {
  const raw = check.threshold ?? rule.threshold;
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_THRESHOLD;
  }

  return Math.min(1, Math.max(0, parsed));
}

function getMaxInputChars(check: LooseCheck, rule: LooseRule): number {
  const raw = Number(check.max_input_chars ?? rule.max_input_chars ?? MAX_INPUT_CHARS);

  if (!Number.isFinite(raw) || raw < 100) {
    return MAX_INPUT_CHARS;
  }

  return Math.floor(raw);
}

function buildStructuralIndex(priorFindings?: Finding[]): StructuralIndex {
  const byRuleFile = new Set<string>();
  const byFile = new Set<string>();

  if (!priorFindings || priorFindings.length === 0) {
    return { byRuleFile, byFile };
  }

  for (const finding of priorFindings) {
    const f = finding as LooseFinding;
    const metadata = (f.metadata ?? {}) as Record<string, unknown>;
    const ruleId = String(f.ruleId ?? "");
    const file = normalizePath(String(f.file ?? f.path ?? ""));

    const isStructural =
      metadata.layer === "structural" ||
      /(?:^|[-_:])ast(?:[-_:]|$)/i.test(ruleId) ||
      /structural/i.test(String(metadata.parser ?? ""));

    if (!isStructural || !file) {
      continue;
    }

    byFile.add(file);

    if (ruleId) {
      byRuleFile.add(`${ruleId}::${file}`);
    }
  }

  return { byRuleFile, byFile };
}

function getDependencyRuleId(check: LooseCheck, rule: LooseRule): string | undefined {
  const direct = check.depends_on_rule_id ?? check.structural_rule_id;

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const depends = rule.depends_on;

  if (depends && typeof depends === "object") {
    const obj = depends as Record<string, unknown>;
    const nested = obj.rule_id ?? obj.ruleId;

    if (typeof nested === "string" && nested.trim()) {
      return nested.trim();
    }
  }

  const ruleDirect = rule.structural_rule_id;

  if (typeof ruleDirect === "string" && ruleDirect.trim()) {
    return ruleDirect.trim();
  }

  return undefined;
}

function shouldSkipDueToPriorStructural(
  check: LooseCheck,
  rule: LooseRule,
  normalizedFile: string,
  structuralIndex: StructuralIndex,
): boolean {
  const dependencyRuleId = getDependencyRuleId(check, rule);

  const skipFlag =
    check.skip_if_structural_confirmed ??
    rule.skip_if_structural_confirmed ??
    Boolean(dependencyRuleId);

  if (skipFlag === false || !skipFlag) {
    return false;
  }

  if (dependencyRuleId && structuralIndex.byRuleFile.has(`${dependencyRuleId}::${normalizedFile}`)) {
    return true;
  }

  const skipAnyStructuralForFile =
    check.skip_if_any_structural_for_file ??
    rule.skip_if_any_structural_for_file;

  if (skipAnyStructuralForFile && structuralIndex.byFile.has(normalizedFile)) {
    return true;
  }

  return false;
}

function getPreflightRegexes(check: LooseCheck): string[] {
  const preflight = check.preflight ?? check.deterministic_preflight;

  if (!preflight || typeof preflight !== "object") {
    return [];
  }

  const obj = preflight as Record<string, unknown>;

  if (obj.enabled === false) {
    return [];
  }

  const mode = typeof obj.mode === "string" ? obj.mode : "skip_if_confirmed";

  if (mode !== "skip_if_confirmed") {
    return [];
  }

  return collectStrings(obj.regexes ?? obj.patterns);
}

function preflightConfirmed(regexes: string[], content: string): boolean {
  for (const pattern of regexes) {
    try {
      const re = new RegExp(pattern, "ims");
      if (re.test(content)) {
        return true;
      }
    } catch {
      // Invalid regex in config: ignore this pattern, do not crash the audit.
    }
  }

  return false;
}

function buildPrompt(
  evaluationPrompt: string,
  filePath: string,
  content: string,
): string {
  return [
    evaluationPrompt.trim(),
    "",
    "Output contract:",
    "Return ONLY valid JSON with this exact shape:",
    '{"passed": true|false, "score": 0.0-1.0, "missing": ["..."], "reasoning": "..."}',
    "",
    "Rules:",
    '- "score" must be a number between 0 and 1.',
    '- "reasoning" must be a concise sentence naming the concrete issue, file construct, column, directive, or missing section.',
    '- If you set "passed" to false, you MUST also list at least one concrete construct in "missing". A failure with no named construct will be discarded.',
    '- Do not return markdown.',
    "- Do not return prose outside JSON.",
    "",
    `File: ${filePath}`,
    "",
    "Content:",
    content,
  ].join("\n");
}

async function callOllama(
  baseUrl: string,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0,
          top_p: 1,
          num_predict: 700,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Ollama HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;

    if (typeof payload.response === "string") {
      return payload.response;
    }

    const message = payload.message as Record<string, unknown> | undefined;

    if (message && typeof message.content === "string") {
      return message.content;
    }

    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    // Fall through to substring extraction.
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Reconcile the LLM's four fields (passed, score, missing, reasoning) into a
 * single internally consistent result.
 *
 * The LLM is not an authority on its own output. It routinely contradicts
 * itself:
 *   - `passed: true` while `score` is 0.3 (or vice versa)
 *   - `passed: false` with `missing: []` (a failure with no named construct)
 *   - `reasoning` that says "compliant" while `passed: false`
 *
 * We resolve contradictions by preferring the concrete signal (`missing`)
 * over the abstract one (`score`), and preferring explicit intent (`passed`)
 * over either:
 *
 *   1. `passed === true`                      → force score to 1 (pass).
 *   2. `passed === false` AND missing empty   → force score to 1 (discard).
 *      A claimed failure with no named construct is unactionable noise.
 *   3. `passed === false` AND missing present → clamp score below threshold.
 *      The LLM says "this is broken" and named why; honor that verdict even
 *      if it also filled in an optimistic score.
 *   4. `passed` missing entirely              → trust `score` as-is.
 *
 * The output `passed` field is derived from the reconciled score, never
 * copied from the raw response, so downstream code sees one consistent
 * verdict and cannot accidentally trust a contradictory field.
 */
export function normalizeSemanticResult(
  raw: SemanticRawResponse,
  threshold: number,
): SemanticResult {
  const scoreRaw = raw.score ?? raw.confidence ?? raw.rating;
  let score =
    typeof scoreRaw === "number"
      ? scoreRaw
      : Number.parseFloat(String(scoreRaw ?? ""));

  if (!Number.isFinite(score)) {
    score = raw.passed === true ? 1 : 0;
  }

  score = clamp01(score);

  // `missing` must contain concrete, non-empty strings. The LLM sometimes
  // emits `[""]` or `[null]` as a "no findings" placeholder; those are not
  // missing constructs and must not satisfy the makeSemanticFinding guard.
  const missing = Array.isArray(raw.missing)
    ? raw.missing.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const reasoning =
    typeof raw.reasoning === "string" ? raw.reasoning.trim() : "";

  const explicitPassed =
    typeof raw.passed === "boolean" ? raw.passed : null;

  let normalizedScore = score;

  // Explicit pass always suppresses the finding.
  if (explicitPassed === true) {
    normalizedScore = 1;
  }

  // A claimed failure with no concrete missing construct is not actionable.
  // Suppress it instead of emitting a vague semantic finding.
  if (explicitPassed === false && missing.length === 0) {
    normalizedScore = 1;
  }

  // A claimed failure with concrete missing constructs must sit below threshold.
  if (explicitPassed === false && missing.length > 0) {
    normalizedScore = Math.min(normalizedScore, threshold - 0.01);
  }

  const passed = normalizedScore >= threshold;

  return {
    passed,
    score: clamp01(normalizedScore),
    missing,
    reasoning,
  };
}

/**
 * Construct a semantic Finding from a reconciled result.
 *
 * This function is the last line of defense against semantic false positives.
 * It refuses to emit unless ALL FOUR of the following hold:
 *
 *   1. The reconciled verdict is `passed === false`.
 *   2. The reconciled score is strictly below threshold.
 *   3. At least one concrete missing construct is present.
 *   4. A non-empty reasoning string is present.
 *
 * Guards 1 and 2 are logically redundant given how normalizeSemanticResult()
 * derives `passed` from `score >= threshold`. They are kept as defense in
 * depth because a future refactor that introduces a SemanticResult from
 * another source (e.g. cached result, replay fixture) must still pass both
 * checks. Do not delete either guard without proving no other caller path
 * can construct a SemanticResult.
 */
function makeSemanticFinding(
  rule: LooseRule,
  check: LooseCheck,
  filePath: string,
  result: SemanticResult,
  threshold: number,
  model: string,
): Finding | null {
  if (result.passed) {
    return null;
  }

  if (result.score >= threshold) {
    return null;
  }

  if (result.missing.length === 0) {
    return null;
  }

  if (result.reasoning.length === 0) {
    return null;
  }

  // All four guards passed. `missing` is guaranteed non-empty after the
  // normalize step filtered out empty strings, and `reasoning` is already
  // trimmed. Use them directly.
  const reasoning = result.reasoning;
  const missing = result.missing;

  const detail = [
    reasoning,
    `Missing: ${missing.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const severity = String(check.severity ?? rule.severity ?? "error");

  const finding = {
    ruleId: String(rule.id ?? ""),
    severity,
    title: String(rule.title ?? rule.id ?? "Semantic evaluation failed"),
    detail,
    fix: String(check.fix ?? rule.fix ?? ""),
    weight: severityWeight(severity),
    file: filePath,
    path: filePath,
    references: rule.references,
    metadata: {
      layer: "semantic",
      model,
      score: result.score,
      threshold,
      missing,
      llm_used: true,
      skipped: false,
    },
  };

  return finding as Finding;
}

export async function runSemanticChecks(
  rules: RuleSpec[],
  fileContents: Record<string, string>,
  options: RunSemanticOptions = {},
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const maxChecks = options.maxChecks ?? DEFAULT_MAX_CHECKS;
  const url = options.ollamaUrl ?? DEFAULT_OLLAMA_URL;
  const model = options.model ?? DEFAULT_MODEL;
  const timeoutMs = resolveTimeoutMs(options.timeoutMs);
  const debug = debugEnabled(options);
  const structuralIndex = buildStructuralIndex(options.priorFindings);

  let llmCalls = 0;

  const log = (message: string): void => {
    if (debug) {
      console.error(`[semantic-runner] ${message}`);
    }
  };

  for (const rule of rules) {
    const looseRule = rule as LooseRule;
    const ruleId = String(looseRule.id ?? "").trim();

    if (!ruleId) {
      continue;
    }

    const checks = Array.isArray(looseRule.checks)
      ? (looseRule.checks as unknown as LooseCheck[])
      : [];

    for (const check of checks) {
      if (check.type !== "semantic_eval") {
        continue;
      }

      const evaluationPrompt = String(
        check.evaluation_prompt ?? looseRule.evaluation_prompt ?? "",
      ).trim();

      if (evaluationPrompt.length < 50) {
        log(`skip ${ruleId}: evaluation_prompt is missing or too short`);
        continue;
      }

      const threshold = getThreshold(check, looseRule);
      const maxInputChars = getMaxInputChars(check, looseRule);
      const candidateFiles = getCandidateFiles(check, looseRule, fileContents);

      if (candidateFiles.length === 0) {
        // Two distinct failure modes share this branch:
        //   (i)  the rule declares no glob at all → operator typo in YAML.
        //   (ii) the rule declares globs but none match → file set mismatch.
        // Both are diagnosable from the log line below; do not collapse
        // them into a silent skip.
        const declaredGlobs = collectGlobs(check, looseRule);
        const totalFiles = Object.keys(fileContents).length;
        const sampleKeys = Object.keys(fileContents).slice(0, 10);
        log(
          `skip ${ruleId}: no matching files for semantic rule ` +
            `(globs=${JSON.stringify(declaredGlobs)}, ` +
            `files_seen=${totalFiles}, ` +
            `sample=${JSON.stringify(sampleKeys)})`,
        );
        continue;
      }

      const preflightRegexes = getPreflightRegexes(check);

      for (const filePath of candidateFiles) {
        if (llmCalls >= maxChecks) {
          log(`stop: semantic LLM budget reached (${maxChecks})`);
          return findings;
        }

        const content = fileContents[filePath];

        if (!content || !content.trim()) {
          continue;
        }

        const normalizedFile = normalizePath(filePath);

        if (
          shouldSkipDueToPriorStructural(
            check,
            looseRule,
            normalizedFile,
            structuralIndex,
          )
        ) {
          log(
            `skip ${ruleId} on ${normalizedFile}: structural AST already confirmed the issue`,
          );
          continue;
        }

        if (
          preflightRegexes.length > 0 &&
          preflightConfirmed(preflightRegexes, content)
        ) {
          log(
            `skip ${ruleId} on ${normalizedFile}: deterministic preflight confirmed the issue`,
          );
          continue;
        }

        llmCalls += 1;

        const truncatedContent =
          content.length > maxInputChars
            ? `${content.slice(0, maxInputChars)}\n\n... truncated ...`
            : content;

        const prompt = buildPrompt(evaluationPrompt, normalizedFile, truncatedContent);

        try {
          const rawResponse = await callOllama(url, model, prompt, timeoutMs);
          const parsedJson = extractJsonObject(rawResponse);

          if (!parsedJson) {
            log(`skip ${ruleId} on ${normalizedFile}: invalid JSON from LLM`);
            continue;
          }

          const result = normalizeSemanticResult(parsedJson, threshold);
          const finding = makeSemanticFinding(
            looseRule,
            check,
            normalizedFile,
            result,
            threshold,
            model,
          );

          if (finding) {
            findings.push(finding);
          } else {
            log(
              `no semantic finding for ${ruleId} on ${normalizedFile}: ` +
                `score=${result.score.toFixed(2)} threshold=${threshold.toFixed(2)} ` +
                `passed=${result.passed} ` +
                `missing=${result.missing.length} ` +
                `reasoning_len=${result.reasoning.length} ` +
                `(a finding requires passed=false AND score<threshold AND missing non-empty AND reasoning non-empty)`,
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          log(`skip ${ruleId} on ${normalizedFile}: LLM failed: ${message}`);
        }
      }
    }
  }

  return findings;
}
// --- RepoScope compatibility exports added by troubleshooting patch ---
export { MAX_INPUT_CHARS };
export { DEFAULT_TIMEOUT_MS };

export function weightFor(severity: unknown): number {
  return severityWeight(severity);
}

export function resolveTargets(...args: unknown[]): string[] {
  if (args.length >= 3) {
    return getCandidateFiles(
      args[0] as LooseCheck,
      args[1] as unknown as LooseRule,
      args[2] as Record<string, string>,
    );
  }

  if (args.length === 2) {
    return getCandidateFiles(
      args[0] as LooseCheck,
      {} as unknown as LooseRule,
      args[1] as Record<string, string>,
    );
  }

  return [];
}

export function preflight(...args: unknown[]): boolean {
  if (args.length >= 2 && Array.isArray(args[0])) {
    return preflightConfirmed(args[0] as string[], String(args[1] ?? ""));
  }

  if (args.length >= 2) {
    const regexes = getPreflightRegexes(args[0] as LooseCheck);
    if (regexes.length === 0) {
      return false;
    }
    return preflightConfirmed(regexes, String(args[1] ?? ""));
  }

  return false;
}
// --- end compatibility exports ---