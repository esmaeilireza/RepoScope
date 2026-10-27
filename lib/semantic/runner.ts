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

        const result = await runOne(targetPath, content, check);
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
  filePath: string,
  content: string,
  check: RuleCheck,
): Promise<SemanticEvalResult> {
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