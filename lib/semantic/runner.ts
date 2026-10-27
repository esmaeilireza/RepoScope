// lib/semantic/runner.ts
//
// The semantic evaluation feature. Reads YAML rule manifests whose checks
// have type: "semantic_eval", feeds each matching file to the local Ollama
// model, and emits a Finding when the model's score is below threshold.
//
// Contract:
//   - Fail-open: on LLM outage / invalid JSON / missing file -> skipped:true,
//     NO finding emitted.
//   - ruleId === rule.id, verbatim (no :${file} suffix).
//   - detail contains the model's reasoning (not the rule title).
//   - MAX_INPUT_CHARS is exported so the calibrator and the runner agree.
//
// Deterministic preflight:
//   For rules whose criteria are fully decidable from the file's syntax,
//   a lightweight check runs BEFORE the LLM call. See PREFLIGHT_RULES.
//   Rationale: `reposcope-mistral:latest` scored a natural-key-join dbt
//   model at 0.85 both before and after the prompt was sharpened to make
//   that defect absolute. The model was not reading the rule. A better
//   prompt is not the fix. Not using a probabilistic layer for a
//   deterministic property is the fix.

import type { Finding, RuleCheck, RuleSpec, SemanticEvalResult } from "../types";
import { generateJson } from "../llm/ollama";

export const MAX_INPUT_CHARS = 8000;

const BUDGET = {
  maxChecksPerRepo: 10,
  timeoutMs: 180_000, // cold-start of a 7B Q4_K_M can take 90-150s on Windows
} as const;

// Read from env so a user with mistral, qwen, or phi3 can run without editing code.
const MODEL_ID = process.env.REPOSCOPE_MODEL ?? "reposcope-mistral:latest";

const SYSTEM_PROMPT =
  'You are a senior engineering auditor. Reply with strict JSON only: { "score": number in [0,1], "missing": string[], "reasoning": string }';

// ─── Preflight: deterministic checks that must not depend on the LLM ─────

/**
 * Rules whose scoring criteria are fully decidable from the file's syntax.
 * A rule in this set runs through the deterministic preflight first; if
 * the preflight fires, the LLM is skipped entirely.
 *
 * Keep this list small and explicit. Adding a rule here is a statement
 * that the criterion is not a judgment call.
 */
const PREFLIGHT_RULES = new Set<string>(["dataops-kimball-sem-001"]);

// `ON lhs.col = rhs.col` — matches the join shape in dbt fact models.
// Deliberately simple: the structural layer already runs sqlglot AST walk
// for the same defect (dataops-kimball-ast-001). This is the fast path for
// the one rule where a 7B model empirically cannot override its own
// heuristic, not a general SQL parser.
const ON_CLAUSE_RE = /\bON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)\b/gi;

/**
 * Remove SQL line and block comments so the preflight does not match
 * commented-out joins. Cheap enough to run on every check.
 */
function stripSqlComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Return the offending column name if the SQL contains a JOIN ON clause
 * where at least one side lacks the `_sk` surrogate-key suffix.
 * Returns null when all joins are surrogate-keyed, or when the file has
 * no JOIN ON clause at all.
 */
function detectNaturalKeyJoin(content: string): string | null {
  const stripped = stripSqlComments(content);
  ON_CLAUSE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ON_CLAUSE_RE.exec(stripped)) !== null) {
    const left = m[1];
    const right = m[2];
    const leftIsSk = /_sk$/i.test(left);
    const rightIsSk = /_sk$/i.test(right);
    if (!leftIsSk || !rightIsSk) {
      return leftIsSk ? right : left;
    }
  }
  return null;
}

/**
 * Run deterministic preflight for rules in PREFLIGHT_RULES.
 *
 * Returns a fully-populated SemanticEvalResult when the preflight fires
 * (the caller should treat it as final and skip the LLM). Returns null
 * when the preflight does not apply or does not fire, so the caller can
 * proceed to the LLM.
 *
 * Exported so the calibrator can honour the same preflight and not test
 * the model against a band the deterministic layer already decides.
 *
 * The parameter is `{ id: string }` rather than `RuleSpec` because the
 * only field preflight reads is `id`. That keeps the call site in
 * scripts/semantic-calibrate.ts free of casts: its lightweight
 * `{ id, evaluation_prompt, threshold, max_input_chars }` entry is
 * structurally assignable to `{ id: string }`.
 */
export function preflight(
  rule: { id: string },
  content: string,
): SemanticEvalResult | null {
  if (!PREFLIGHT_RULES.has(rule.id)) return null;
  const offending = detectNaturalKeyJoin(content);
  if (offending === null) return null;
  return {
    passed: false,
    score: 0.15,
    missing: ["natural key joins"],
    reasoning:
      `Deterministic preflight detected a JOIN ON clause comparing natural-key ` +
      `column "${offending}". Kimball requires surrogate keys (_sk) on both ` +
      `sides. Scored without an LLM round-trip.`,
    tokens_used: 0,
    skipped: false,
  };
}

// ─── JSON parsing helpers ────────────────────────────────────────────────

type SemanticJson = { score?: unknown; missing?: unknown; reasoning?: unknown };

function parseSemanticJson(raw: string): SemanticJson | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as SemanticJson;
  } catch {
    return null;
  }
}

function toScore(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function weightFor(severity: Finding["severity"]): number {
  switch (severity) {
    case "critical": return 20;
    case "error":    return 15;
    case "warning":  return 10;
    case "info":     return 1;
  }
}

// ─── Glob matcher ────────────────────────────────────────────────────────

// Tiny glob matcher: handles the shapes our specs actually use
// (docs/runbooks/*.md, models/marts/facts/**/*.sql, and brace-expanded
// forms like {next.config.*,csp*.{ts,js,json}}).
// `*` matches any non-slash run; `**` matches anything, slashes included.
// `{a,b,c}` expands to alternation `(a|b|c)`; nested braces supported.
// `**/` matches zero or more directory components (glob semantics).
// Returns an array (not a Generator) so it type-checks under target < es2015.
function expandBraces(pattern: string): string {
  let prev: string;
  let out = pattern;
  do {
    prev = out;
    out = out.replace(/\{([^{}]+)\}/g, (_, group) =>
      "(" + group.split(",").join("|") + ")"
    );
  } while (out !== prev);
  return out;
}

export function resolveTargets(
  pattern: string,
  fileContents: Record<string, string>,
): string[] {
  if (!pattern.includes("*") && !pattern.includes("{")) {
    return pattern in fileContents ? [pattern] : [];
  }
  const expanded = expandBraces(pattern);
  const escaped = expanded
    // Escape regex metacharacters EXCEPT ( ) | which encode the alternation
    // produced by expandBraces() and must survive into the final regex.
    .replace(/[.+^${}\[\]\\]/g, "\\$&")
    // `**/` → matches zero or more directory components
    .replace(/\*\*\//g, "\u0001")
    // `**` → matches anything, slashes included
    .replace(/\*\*/g, "\u0000")
    // `*` → matches any non-slash run
    .replace(/\*/g, "[^/]*")
    .replace(/\u0001/g, "(?:[^/]+/)*")
    .replace(/\u0000/g, ".*");
  const re = new RegExp("^" + escaped + "$");
  return Object.keys(fileContents).filter((key) => re.test(key));
}

// ─── Public API ──────────────────────────────────────────────────────────

export async function runSemanticChecks(
  rules: RuleSpec[],
  fileContents: Record<string, string>,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  let checksRun = 0;
  let budgetExceeded = false;

  for (const rule of rules) {
    if (budgetExceeded) break;
    for (const check of rule.checks) {
      if (check.type !== "semantic_eval") continue;
      if (checksRun >= BUDGET.maxChecksPerRepo) { budgetExceeded = true; break; }

      const pattern = check.file_glob ?? check.path_glob;
      if (!pattern) continue;

      for (const targetPath of resolveTargets(pattern, fileContents)) {
        if (checksRun >= BUDGET.maxChecksPerRepo) { budgetExceeded = true; break; }
        const content = fileContents[targetPath];
        if (typeof content !== "string") continue;

        const result = await runOne(rule, targetPath, content, check);
        checksRun++;

        if (result.skipped) {
          // Visible diagnostic: skip is a legitimate fail-open, but a silent
          // skip masks the difference between "LLM was busy" and "rule was
          // never reached". stderr keeps this out of the JSON/CSV finding
          // stream. Grep audit logs for [semantic-skip] to audit skips.
          console.error(
            `[semantic-skip] ${rule.id} on ${targetPath}: ` +
            `${result.skipReason ?? "no-reason"} (score ${result.score.toFixed(2)})`
          );
          continue;
        }
        if (result.passed) {
          console.error(
            `[semantic-pass] ${rule.id} on ${targetPath}: ` +
            `score ${result.score.toFixed(2)} >= ${(check.threshold ?? 0.7).toFixed(2)}`
          );
          continue;
        }

        const threshold = check.threshold ?? 0.7;
        console.error(
          `[semantic-fail] ${rule.id} on ${targetPath}: ` +
          `score ${result.score.toFixed(2)} < ${threshold.toFixed(2)} — emitting finding`
        );
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          detail: `${check.message ?? rule.title}: ${result.reasoning || "(no reasoning)"} (score ${result.score.toFixed(2)} < ${threshold.toFixed(2)})`,
          fix: rule.fix,
          weight: weightFor(rule.severity),
          profile: rule.profile === "graph" ? "cross" : rule.profile,
          file: targetPath,
          references: rule.references,
          metadata: { missing: result.missing, reasoning: result.reasoning, score: result.score },
        });
      }
    }
  }

  return findings;
}

async function runOne(
  rule: RuleSpec,
  filePath: string,
  content: string,
  check: RuleCheck,
): Promise<SemanticEvalResult> {
  // Deterministic preflight first: no LLM, no timeout, no chance the model
  // overrides a rule that is fully decidable from the file's syntax.
  const preflighted = preflight(rule, content);
  if (preflighted !== null) return preflighted;

  const prompt = check.evaluation_prompt;
  if (!prompt) {
    return { passed: false, score: 0, missing: [], reasoning: "", tokens_used: 0, skipped: true, skipReason: "file_missing" };
  }

  const threshold = check.threshold ?? 0.7;
  const maxChars = check.max_input_chars ?? MAX_INPUT_CHARS;
  const input = content.length > maxChars ? content.slice(0, maxChars) : content;

  let raw: string;
  try {
    raw = await generateJson({
      model: MODEL_ID,
      system: SYSTEM_PROMPT,
      user: `${prompt}\n\nFile: ${filePath}\n\nContent:\n${input}`,
      timeoutMs: BUDGET.timeoutMs,
    });
  } catch {
    return { passed: false, score: 0, missing: [], reasoning: "", tokens_used: 0, skipped: true, skipReason: "llm_unavailable" };
  }

  const parsed = parseSemanticJson(raw);
  if (!parsed) {
    return { passed: false, score: 0, missing: [], reasoning: "", tokens_used: 0, skipped: true, skipReason: "invalid_json" };
  }

  const score = toScore(parsed.score);
  return {
    passed: score >= threshold,
    score,
    missing: toStringArray(parsed.missing),
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    tokens_used: Math.ceil(input.length / 4),
    skipped: false,
  };
}