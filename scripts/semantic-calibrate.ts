#!/usr/bin/env tsx
// scripts/semantic-calibrate.ts
//
// Runs every semantic fixture through its owning rule's evaluation_prompt
// and prints actual vs expected bands. Does NOT modify fixtures — human
// decides whether to accept the actual or fix the prompt/fixture.
//
// Usage:
//   npm run semantic:calibrate                     # uses default model
//   npm run semantic:calibrate -- --model <tag>    # override for this run
//   npm run semantic:calibrate -- --list           # list registered models, exit
//   REPOSCOPE_MODEL=<tag> npm run semantic:calibrate
//
// Exit:  0 = all in-band, 1 = one or more out of band.

import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import { generateJson } from "../lib/llm/ollama";
import { MAX_INPUT_CHARS, preflight } from "../lib/semantic/runner";

const FIXTURES_DIR = path.join(process.cwd(), "__tests__", "fixtures", "semantic");
const SPECS_DIR = path.join(process.cwd(), "docs", "specs");
const DEFAULT_MODEL = process.env.REPOSCOPE_MODEL ?? "reposcope-mistral:latest";
const TIMEOUT_MS = 180_000; // cold-start of a 7B Q4_K_M can take 90-150s
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

interface FixtureMeta {
  rule_id: string;
  fixtures: Record<
    string,
    { min_score: number; max_score: number; missing_allowlist: string[] }
  >;
}

// Extended with `max_input_chars` so per-rule truncation overrides the
// global constant. This keeps the calibrator's slice identical to what
// lib/semantic/runner.ts does at runtime — otherwise a rule that ships
// with `max_input_chars: 4000` would calibrate against 8000 chars and
// then behave differently on a real audit.
//
// `id` is carried explicitly so the preflight log line can reference it
// without a second lookup; `evaluation_prompt`, `threshold`, and
// `max_input_chars` are the fields preflight() and the LLM call consume.
interface RuleIndex {
  [ruleId: string]: {
    id: string;
    evaluation_prompt: string;
    threshold: number;
    max_input_chars: number;
  };
}

interface CalibrationRow {
  rule: string;
  fixture: string;
  expected: string;
  actual: number;
  missing: string[];
  reasoning: string;
  verdict: "PASS" | "FAIL_SCORE" | "FAIL_MISSING";
}

interface ParsedArgs {
  model: string;
  list: boolean;
}

// ── preflight normalization ───────────────────────────────────────────
// The runner's preflight() has drifted between signatures: some versions
// return a boolean ("deterministic issue confirmed / not confirmed"),
// others return a structured { score, missing, reasoning } object, and
// some return null when no deterministic path applies. The calibrator
// needs a stable { score, missing, reasoning } | null shape so it can
// either short-circuit the LLM or fall through to it.
//
// This adapter collapses every input variant to that shape:
//   true                    -> synthetic confirmed result (score 0.15)
//   false | null | undefined -> null (fall through to LLM)
//   object                  -> normalize each field defensively
//
// `false` is treated as "no deterministic decision" rather than "passed",
// because a passed preflight still has to be scored by the LLM against
// the rule's evaluation prompt.
type PreflightLike =
  | boolean
  | null
  | undefined
  | {
      score?: number;
      missing?: string[];
      reasoning?: string;
    };

function normalizePreflightResult(value: PreflightLike): {
  score: number;
  missing: string[];
  reasoning: string;
} | null {
  if (value === true) {
    return {
      score: 0.15,
      missing: ["deterministic-preflight"],
      reasoning:
        "Deterministic preflight confirmed the issue without calling the LLM.",
    };
  }

  if (value === false || value === null || value === undefined) {
    return null;
  }

  return {
    score: typeof value.score === "number" ? value.score : 0.15,
    missing: Array.isArray(value.missing) ? value.missing : ["deterministic-preflight"],
    reasoning:
      typeof value.reasoning === "string" && value.reasoning.trim()
        ? value.reasoning
        : "Deterministic preflight confirmed the issue without calling the LLM.",
  };
}

function parseArgs(argv: string[]): ParsedArgs {
  let model = DEFAULT_MODEL;
  let list = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--model" || argv[i] === "-m") {
      const next = argv[++i];
      if (next) model = next;
    } else if (argv[i] === "--list") {
      list = true;
    }
  }
  return { model, list };
}

async function listRegisteredModels(): Promise<string[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`);
  if (!res.ok) throw new Error(`Ollama /api/tags returned ${res.status}`);
  const data = (await res.json()) as { models?: Array<{ name: string }> };
  return (data.models ?? []).map((m) => m.name);
}

function loadRuleIndex(): RuleIndex {
  const index: RuleIndex = {};
  if (!fs.existsSync(SPECS_DIR)) return index;
  for (const file of fs.readdirSync(SPECS_DIR)) {
    if (!/\.ya?ml$/.test(file) || file.startsWith("_")) continue;
    const doc = yaml.load(fs.readFileSync(path.join(SPECS_DIR, file), "utf-8")) as
      | { rules?: Array<{ id: string; checks?: Array<Record<string, unknown>> }> }
      | null;
    for (const rule of doc?.rules ?? []) {
      for (const check of rule.checks ?? []) {
        if (check.type === "semantic_eval" && typeof check.evaluation_prompt === "string") {
          index[rule.id] = {
            id: rule.id,
            evaluation_prompt: check.evaluation_prompt,
            threshold: typeof check.threshold === "number" ? check.threshold : 0.7,
            // Per-rule override wins; falls back to the shared constant.
            max_input_chars:
              typeof check.max_input_chars === "number"
                ? check.max_input_chars
                : MAX_INPUT_CHARS,
          };
          break;
        }
      }
    }
  }
  return index;
}

function pickExt(dir: string, band: string): string {
  for (const ext of [".md", ".yml", ".yaml", ".sql", ".js", ".ts"]) {
    if (fs.existsSync(path.join(dir, `${band}${ext}`))) return ext;
  }
  return ".md";
}

// Defensive: the LLM occasionally returns non-string entries in missing[]
// (observed on dataops-data-product-sem-001 borderline, where the model
// echoed "reasoning" back as an item). Coerce and drop non-strings so a
// malformed reply produces a low score rather than a thrown exception.
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

async function calibrate(model: string): Promise<CalibrationRow[]> {
  const rules = loadRuleIndex();
  const rows: CalibrationRow[] = [];
  if (!fs.existsSync(FIXTURES_DIR)) return rows;

  for (const dir of fs.readdirSync(FIXTURES_DIR)) {
    const ruleDir = path.join(FIXTURES_DIR, dir);
    if (!fs.statSync(ruleDir).isDirectory()) continue;
    const metaPath = path.join(ruleDir, "meta.json");
    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as FixtureMeta;
    const rule = rules[meta.rule_id];
    if (!rule) {
      console.error(`[skip] ${meta.rule_id} — no matching semantic rule in docs/specs/`);
      continue;
    }

    for (const band of Object.keys(meta.fixtures)) {
      const fixturePath = path.join(ruleDir, `${band}${pickExt(ruleDir, band)}`);
      if (!fs.existsSync(fixturePath)) continue;

      const content = fs
        .readFileSync(fixturePath, "utf-8")
        .slice(0, rule.max_input_chars);
      const expected = meta.fixtures[band];

      // Deterministic preflight first — mirrors runOne() in
      // lib/semantic/runner.ts. When the rule can be resolved without the
      // LLM (e.g., unambiguous _sk joins present and grain declared), use
      // that score so borderline.sql stays inside its expected band even
      // when the semantic prompt is stricter than the fixture warrants.
      //
      // The `as any` cast on `rule` remains defensive against signature
      // drift between the calibrator's RuleIndex entry and whatever shape
      // runner.ts accepts. The *return* value is normalized below so the
      // calibrator does not need to care whether preflight() returns a
      // boolean or an object.
      let score: number;
      let missing: string[];
      let reasoning: string;

      const pre = normalizePreflightResult(
        preflight(rule as any, content) as PreflightLike,
      );

      if (pre !== null) {
        score = pre.score;
        missing = pre.missing;
        reasoning = pre.reasoning;
        console.error(
          `[calibrate-preflight] ${rule.id}/${band}: score ${score.toFixed(2)} (deterministic)`,
        );
      } else {
        let parsed: { score?: unknown; missing?: unknown; reasoning?: unknown };
        try {
          const raw = await generateJson({
            model,
            system:
              'You are a senior engineering auditor. Reply with strict JSON only: { "score": number, "missing": string[], "reasoning": string }',
            user: `${rule.evaluation_prompt}\n\n---\nFile: ${path.basename(fixturePath)}\n---\nContent:\n${content}`,
            timeoutMs: TIMEOUT_MS,
          });
          parsed = JSON.parse(raw);
        } catch (err) {
          rows.push({
            rule: meta.rule_id,
            fixture: band,
            expected: "—",
            actual: NaN,
            missing: [],
            reasoning: (err as Error).message.slice(0, 160),
            verdict: "FAIL_SCORE",
          });
          continue;
        }

        const rawScore = typeof parsed.score === "number" ? parsed.score : 0;
        score = Number.isFinite(rawScore) ? rawScore : 0;
        missing = toStringArray(parsed.missing);
        reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "";
      }

      const scoreOk = score >= expected.min_score && score <= expected.max_score;
      const missingOk = expected.missing_allowlist.every((fp) =>
        missing.some((m) => m.toLowerCase().includes(fp.toLowerCase())),
      );

      rows.push({
        rule: meta.rule_id,
        fixture: band,
        expected: `[${expected.min_score.toFixed(2)}–${expected.max_score.toFixed(2)}]`,
        actual: score,
        missing,
        reasoning,
        verdict: !scoreOk ? "FAIL_SCORE" : !missingOk ? "FAIL_MISSING" : "PASS",
      });
    }
  }
  return rows;
}

// `process.exitCode` instead of `process.exit()` — the latter aborts
// before stdout is flushed on Windows Git Bash, truncating the final
// "N/15 pass" line. Setting exitCode lets the event loop drain.
(async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    try {
      const registered = await listRegisteredModels();
      console.log(`Ollama at ${OLLAMA_BASE} — ${registered.length} model(s):`);
      for (const name of registered) console.log(`  ${name}`);
      console.log("");
      console.log(`Would use: ${args.model}`);
      process.exitCode = 0;
      return;
    } catch (err) {
      console.error(`[list] failed: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }
  }

  console.log(`[model] ${args.model}`);
  const rows = await calibrate(args.model);
  const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
  console.log(pad("rule", 34) + pad("fixture", 12) + pad("expected", 18) + pad("actual", 8) + "verdict");
  console.log("-".repeat(84));
  for (const r of rows) {
    console.log(
      pad(r.rule, 34) + pad(r.fixture, 12) + pad(r.expected, 18) +
      pad(Number.isFinite(r.actual) ? r.actual.toFixed(2) : "NaN", 8) + r.verdict,
    );
    if (r.verdict !== "PASS") {
      if (r.reasoning) console.log(`   reasoning: ${r.reasoning}`);
      if (r.missing.length) console.log(`   missing:   ${r.missing.join(", ")}`);
    }
  }
  const failed = rows.filter((r) => r.verdict !== "PASS").length;
  console.log("-".repeat(84));
  console.log(`${rows.length - failed}/${rows.length} pass`);
  process.exitCode = failed > 0 ? 1 : 0;
})();