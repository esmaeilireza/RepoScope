#!/usr/bin/env tsx
// scripts/semantic-debug.ts
//
// Single-rule, single-band diagnostic for semantic calibration.
// Shows the model's FULL response (raw + parsed) so you can see the
// reasoning and missing[] even when the row PASSED — the calibrator only
// shows those on FAIL, which hides the diagnostic on false-positive PASSes.
//
// Usage:
//   npx tsx scripts/semantic-debug.ts <rule-id>
//   npx tsx scripts/semantic-debug.ts <rule-id> --band <good|borderline|bad>
//   npx tsx scripts/semantic-debug.ts webapp-csp-sem-001 --band bad
//   npx tsx scripts/semantic-debug.ts webapp-csp-sem-001 --band borderline
//   REPOSCOPE_MODEL=qwen2.5:latest npx tsx scripts/semantic-debug.ts ...
//
// Exit codes:
//   0 = diagnostic completed
//   1 = rule/fixture not found, or bad CLI args
//   2 = model error (generateJson threw)

import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import { generateJson } from "../lib/llm/ollama";
import { MAX_INPUT_CHARS } from "../lib/semantic/runner";

const SPECS_DIR = path.join(process.cwd(), "docs", "specs");
const FIXTURES_DIR = path.join(process.cwd(), "__tests__", "fixtures", "semantic");
const DEFAULT_MODEL = process.env.REPOSCOPE_MODEL ?? "reposcope-mistral:latest";
const TIMEOUT_MS = 180_000;

type Band = "good" | "borderline" | "bad";

interface Args {
  ruleId: string;
  bands: Band[];
}

interface FixtureMeta {
  rule_id: string;
  fixtures: Record<
    Band,
    { min_score: number; max_score: number; missing_allowlist: string[] }
  >;
}

interface RuleSpec {
  id: string;
  evaluation_prompt: string;
  threshold: number;
  max_input_chars: number;
  file_glob?: string;
  path_glob?: string;
}

interface ParsedModelOutput {
  score: number | null;
  missing: string[];
  reasoning: string;
}

interface Diagnostic {
  band: Band;
  fixturePath: string;
  contentChars: number;
  truncatedChars: number;
  raw: string;
  parsed: ParsedModelOutput | null;
  expected: FixtureMeta["fixtures"][Band] | null;
  scoreOk: boolean | null;
  missingOk: boolean | null;
  error: string | null;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const explicitBands: Band[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--band" || arg === "-b") {
      const next = argv[++i];
      if (next === "good" || next === "borderline" || next === "bad") {
        explicitBands.push(next);
      } else {
        console.error(`[error] invalid --band value: ${next} (expected good|borderline|bad)`);
        process.exit(1);
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: npx tsx scripts/semantic-debug.ts <rule-id> [--band good|borderline|bad]...");
      process.exit(0);
    } else if (arg.startsWith("-")) {
      console.error(`[error] unknown flag: ${arg}`);
      process.exit(1);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length === 0) {
    console.error("Usage: npx tsx scripts/semantic-debug.ts <rule-id> [--band good|borderline|bad]");
    process.exit(1);
  }

  return {
    ruleId: positional[0],
    bands: explicitBands.length > 0 ? explicitBands : ["good", "borderline", "bad"],
  };
}

function loadRule(ruleId: string): RuleSpec | null {
  if (!fs.existsSync(SPECS_DIR)) return null;
  for (const file of fs.readdirSync(SPECS_DIR)) {
    if (!/\.ya?ml$/.test(file) || file.startsWith("_")) continue;
    const doc = yaml.load(fs.readFileSync(path.join(SPECS_DIR, file), "utf-8")) as
      | { rules?: Array<Record<string, unknown>> }
      | null;
    for (const rule of doc?.rules ?? []) {
      if (rule.id !== ruleId) continue;
      const checks = (rule.checks as Array<Record<string, unknown>>) ?? [];
      for (const check of checks) {
        if (check.type === "semantic_eval" && typeof check.evaluation_prompt === "string") {
          return {
            id: ruleId,
            evaluation_prompt: check.evaluation_prompt,
            threshold: typeof check.threshold === "number" ? check.threshold : 0.7,
            max_input_chars:
              typeof check.max_input_chars === "number"
                ? check.max_input_chars
                : MAX_INPUT_CHARS,
            file_glob: typeof check.file_glob === "string" ? check.file_glob : undefined,
            path_glob: typeof check.path_glob === "string" ? check.path_glob : undefined,
          };
        }
      }
    }
  }
  return null;
}

function loadMeta(ruleId: string): FixtureMeta | null {
  const metaPath = path.join(FIXTURES_DIR, ruleId, "meta.json");
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as FixtureMeta;
}

function pickFixture(ruleId: string, band: Band): string | null {
  const dir = path.join(FIXTURES_DIR, ruleId);
  for (const ext of [".md", ".yml", ".yaml", ".sql", ".js", ".ts"]) {
    const candidate = path.join(dir, `${band}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function parseModelOutput(raw: string): ParsedModelOutput | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return {
      score: typeof obj.score === "number" ? obj.score : null,
      missing: Array.isArray(obj.missing)
        ? (obj.missing as unknown[]).filter((x): x is string => typeof x === "string")
        : [],
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : "",
    };
  } catch {
    return null;
  }
}

async function diagnoseBand(
  model: string,
  rule: RuleSpec,
  meta: FixtureMeta | null,
  band: Band,
): Promise<Diagnostic | null> {
  const fixturePath = pickFixture(rule.id, band);
  if (!fixturePath) return null;

  const fullContent = fs.readFileSync(fixturePath, "utf-8");
  const content = fullContent.slice(0, rule.max_input_chars);

  const base: Diagnostic = {
    band,
    fixturePath,
    contentChars: fullContent.length,
    truncatedChars: content.length,
    raw: "",
    parsed: null,
    expected: meta?.fixtures[band] ?? null,
    scoreOk: null,
    missingOk: null,
    error: null,
  };

  let raw: string;
  try {
    raw = await generateJson({
      model,
      system:
        'You are a senior engineering auditor. Reply with strict JSON only: { "score": number, "missing": string[], "reasoning": string }',
      user: `${rule.evaluation_prompt}\n\n---\nFile: ${path.basename(fixturePath)}\n---\nContent:\n${content}`,
      timeoutMs: TIMEOUT_MS,
    });
  } catch (err) {
    return { ...base, error: (err as Error).message };
  }

  const parsed = parseModelOutput(raw);
  base.raw = raw;
  base.parsed = parsed;

  if (parsed && base.expected) {
    base.scoreOk =
      parsed.score !== null &&
      parsed.score >= base.expected.min_score &&
      parsed.score <= base.expected.max_score;
    base.missingOk = base.expected.missing_allowlist.every((fp) =>
      parsed.missing.some((m) => m.toLowerCase().includes(fp.toLowerCase())),
    );
  }

  return base;
}

function verdictOf(d: Diagnostic): string {
  if (d.error) return "ERROR";
  if (!d.parsed) return "UNPARSABLE";
  if (d.expected === null) return "NO_META";
  if (!d.scoreOk) return "FAIL_SCORE";
  if (!d.missingOk) return "FAIL_MISSING";
  return "PASS";
}

function printDiagnostic(d: Diagnostic): void {
  console.log(`───── ${d.band} ─────`);
  console.log(`fixture:   ${path.relative(process.cwd(), d.fixturePath)}`);
  console.log(`content:   ${d.contentChars} chars (${d.truncatedChars} sent to model)`);
  console.log(`verdict:   ${verdictOf(d)}`);

  if (d.error) {
    console.log(`error:     ${d.error}`);
    console.log();
    return;
  }

  if (!d.parsed) {
    console.log(`raw (unparsable):`);
    console.log(`  ${d.raw.slice(0, 400)}`);
    console.log();
    return;
  }

  const scoreStr = d.parsed.score === null ? "null" : d.parsed.score.toFixed(2);
  console.log(`score:     ${scoreStr}`);
  if (d.expected) {
    console.log(`expected:  [${d.expected.min_score.toFixed(2)}, ${d.expected.max_score.toFixed(2)}]`);
    console.log(`score ok:  ${d.scoreOk ? "YES" : "NO"}`);
  }
  console.log(`missing[]: ${d.parsed.missing.length === 0 ? "(empty)" : ""}`);
  for (const m of d.parsed.missing) console.log(`  - ${m}`);
  if (d.expected && d.expected.missing_allowlist.length > 0) {
    console.log(`allowlist: [${d.expected.missing_allowlist.join(", ")}]`);
    console.log(`allowlist ok: ${d.missingOk ? "YES" : "NO"}`);
  }
  console.log(`reasoning: ${d.parsed.reasoning || "(empty)"}`);
  console.log();
}

(async () => {
  const args = parseArgs(process.argv.slice(2));

  const rule = loadRule(args.ruleId);
  if (!rule) {
    console.error(`[error] rule not found: ${args.ruleId}`);
    console.error(`  searched: ${SPECS_DIR}/*.yaml (looking for id: "${args.ruleId}")`);
    process.exit(1);
  }

  const meta = loadMeta(args.ruleId);
  if (!meta) {
    console.warn(`[warn] meta.json not found for ${args.ruleId} — allowlist comparison skipped`);
  }

  console.log(`[rule]     ${args.ruleId}`);
  console.log(`[model]    ${DEFAULT_MODEL}`);
  console.log(`[threshold] ${rule.threshold}  [max_input_chars] ${rule.max_input_chars}`);
  console.log(`[prompt]   ${rule.evaluation_prompt.split("\n")[0].trim()}`);
  console.log();

  let modelError = false;

  for (const band of args.bands) {
    const d = await diagnoseBand(DEFAULT_MODEL, rule, meta, band);
    if (!d) {
      console.log(`───── ${band} ─────`);
      console.log(`[skip] no fixture found for band '${band}'`);
      console.log();
      continue;
    }
    if (d.error) modelError = true;
    printDiagnostic(d);
  }

  process.exit(modelError ? 2 : 0);
})();