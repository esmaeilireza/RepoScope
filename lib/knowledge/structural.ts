// lib/knowledge/structural.ts
//
// Server-only executor for the AST-based parsers under scripts/kg/.
//
// Two parsers exist today:
//   - scripts/kg/parse_sql_ast.py  (sqlglot)               → natural-key join detection
//   - scripts/kg/parse_ts_ast.mjs  (@typescript-eslint/parser) → any-type detection
//
// Both emit JSON to stdout. On success: exit 0, JSON on stdout.
// On parse failure: exit 2 with valid JSON on stdout carrying a `parse_error`
// (or legacy `error`) field. On usage failure (file missing, bad args):
// exit 1 with JSON on stdout. On interpreter missing: execFileSync throws ENOENT.
//
// This module MUST NOT import node:child_process or node:fs at the top
// level — Next.js will try to bundle them into the client. All Node builtins
// load via dynamic `import()` inside function bodies, and a `typeof window`
// guard refuses calls from a browser context.

import { matchesGlob } from "../utils";
import type { Finding, RuleSpec } from "../types";

export type StructuralParser = "sql" | "ts";

export type StructuralHit =
  | {
      kind: "natural_key_join";
      column: string;
      left_table: string;
      right_table: string;
      // Richer fields from the SQL parser. When present they take
      // precedence over the reconstructed detail string because they
      // carry honest labelling ("SQL model" vs "Fact table") decided
      // by the AST classifier.
      table_alias?: string | null;
      line?: number | null;
      message?: string;
      suggestion?: string;
    }
  | {
      kind: "any";
      line: number;
      column: number;
      snippet: string;
    };

export type StructuralSkipReason =
  | "parser_missing"
  | "file_missing"
  | "timeout"
  | "malformed_json";

export interface StructuralParseResult {
  file: string;
  hits: StructuralHit[];
  error: string | null;
  skipped: boolean;
  skipReason?: StructuralSkipReason;
}

const SCRIPT_SEGMENTS: Record<StructuralParser, string[]> = {
  sql: ["scripts", "kg", "parse_sql_ast.py"],
  ts: ["scripts", "kg", "parse_ts_ast.mjs"],
};

let _rootDir: string = process.cwd();

export function setStructuralRootDir(dir: string): void {
  _rootDir = dir;
}

const MAX_BUFFER = 8 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

/**
 * Map a rule severity to a scoring weight.
 *
 * Mirrors the convention used elsewhere in the audit pipeline: critical
 * findings carry the largest weight, errors next, warnings and info
 * contribute nominally. Unknown severities fall back to `1` so a rule
 * with an unexpected status still registers on the score instead of
 * silently contributing zero.
 */
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
 * Run a single structural parser against a single file.
 *
 * @param filePath  repo-relative (e.g. `models/marts/facts/fct_orders.sql`)
 *                  or absolute path. Repo-relative paths are resolved
 *                  against `rootDir` when supplied, else against the
 *                  module-level `_rootDir` (set via `setStructuralRootDir`),
 *                  else against `process.cwd()`.
 * @param parser    which parser to invoke
 * @param rootDir   optional override for the repo root. Takes precedence
 *                  over `_rootDir`. Use this from request-scoped callers
 *                  (e.g. the orchestrator) that audit multiple repos in
 *                  the same process.
 */
export async function runStructuralParser(
  filePath: string,
  parser: StructuralParser,
  rootDir?: string,
): Promise<StructuralParseResult> {
  if (typeof window !== "undefined") {
    throw new Error(
      "runStructuralParser is server-only — do not call from a client component",
    );
  }

  const { execFileSync } = await import("node:child_process");
  const fs = await import("node:fs");
  const path = await import("node:path");

  const scriptPath = path.join(process.cwd(), ...SCRIPT_SEGMENTS[parser]);
  const effectiveRoot = rootDir ?? _rootDir;
  const resolvedFile = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(effectiveRoot, filePath);

  if (!fs.existsSync(scriptPath)) {
    return { file: filePath, hits: [], error: null, skipped: true, skipReason: "parser_missing" };
  }
  if (!fs.existsSync(resolvedFile)) {
    return { file: filePath, hits: [], error: null, skipped: true, skipReason: "file_missing" };
  }

  const interpreter =
    parser === "sql" ? process.env.REPOSCOPE_PYTHON ?? "python" : "node";

  try {
    const raw = execFileSync(interpreter, [scriptPath, resolvedFile], {
      encoding: "utf8",
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
    });
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      file: typeof parsed.file === "string" ? parsed.file : filePath,
      hits: normalizeHits(parsed),
      error: pickError(parsed),
      skipped: false,
    };
  } catch (err) {
    return handleExecError(err, filePath);
  }
}

function pickError(parsed: Record<string, unknown>): string | null {
  // The SQL parser uses `parse_error`; the TS parser and the legacy
  // SQL parser use `error`. Accept both so a parser refactor does not
  // silently drop error findings.
  if (typeof parsed.parse_error === "string" && parsed.parse_error) {
    return parsed.parse_error;
  }
  if (typeof parsed.error === "string" && parsed.error) {
    return parsed.error;
  }
  return null;
}

function handleExecError(
  err: unknown,
  filePath: string,
): StructuralParseResult {
  const e = err as NodeJS.ErrnoException & {
    signal?: string;
    stdout?: string | Buffer;
  };

  if (e.code === "ENOENT") {
    return { file: filePath, hits: [], error: null, skipped: true, skipReason: "parser_missing" };
  }
  if (e.signal === "SIGTERM" || e.code === "ETIMEDOUT") {
    return {
      file: filePath,
      hits: [],
      error: `parser timed out after ${TIMEOUT_MS}ms`,
      skipped: true,
      skipReason: "timeout",
    };
  }

  if (e.stdout) {
    const text = typeof e.stdout === "string" ? e.stdout : e.stdout.toString("utf8");
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return {
        file: typeof parsed.file === "string" ? parsed.file : filePath,
        hits: normalizeHits(parsed),
        error: pickError(parsed) ?? "parse failed",
        skipped: false,
      };
    } catch {
      // fall through to malformed
    }
  }

  return {
    file: filePath,
    hits: [],
    error: e.message ?? "unknown parser error",
    skipped: true,
    skipReason: "malformed_json",
  };
}

// Defensive normalizer: accepts the key names the current parsers emit,
// plus the legacy names. If a parser switches its output shape entirely,
// add the new key here — one place, not every caller.
//
// SQL parser (current):  { violations: [{ kind, column, table_alias, line, message, suggestion }] }
// SQL parser (legacy):   { natural_key_joins: [{ column, left_table, right_table }] }
// TS  parser (current):  { occurrences: [{ line, column, snippet }] }
function normalizeHits(parsed: Record<string, unknown>): StructuralHit[] {
  const hits: StructuralHit[] = [];

  // SQL parser: current `violations` array.
  const violations = Array.isArray(parsed.violations) ? parsed.violations : [];
  for (const v of violations) {
    if (typeof v !== "object" || v === null) continue;
    const o = v as Record<string, unknown>;
    if (o.kind !== "natural_key_join") continue;
    if (typeof o.column !== "string") continue;
    hits.push({
      kind: "natural_key_join",
      column: o.column,
      left_table: typeof o.left_table === "string" ? o.left_table : "",
      right_table: typeof o.right_table === "string" ? o.right_table : "",
      table_alias: typeof o.table_alias === "string" ? o.table_alias : null,
      line: typeof o.line === "number" ? o.line : null,
      message: typeof o.message === "string" ? o.message : undefined,
      suggestion: typeof o.suggestion === "string" ? o.suggestion : undefined,
    });
  }

  // SQL parser: legacy `natural_key_joins` array.
  const joins = Array.isArray(parsed.natural_key_joins)
    ? parsed.natural_key_joins
    : [];
  for (const j of joins) {
    if (typeof j !== "object" || j === null) continue;
    const o = j as Record<string, unknown>;
    if (typeof o.column !== "string") continue;
    hits.push({
      kind: "natural_key_join",
      column: o.column,
      left_table: typeof o.left_table === "string" ? o.left_table : "",
      right_table: typeof o.right_table === "string" ? o.right_table : "",
      table_alias: typeof o.table_alias === "string" ? o.table_alias : null,
      line: typeof o.line === "number" ? o.line : null,
      message: typeof o.message === "string" ? o.message : undefined,
      suggestion: typeof o.suggestion === "string" ? o.suggestion : undefined,
    });
  }

  // TS parser: current `occurrences` array.
  const occs = Array.isArray(parsed.occurrences) ? parsed.occurrences : [];
  for (const occ of occs) {
    if (typeof occ !== "object" || occ === null) continue;
    const o = occ as Record<string, unknown>;
    if (typeof o.line !== "number" || typeof o.column !== "number") continue;
    hits.push({
      kind: "any",
      line: o.line,
      column: o.column,
      snippet: typeof o.snippet === "string" ? o.snippet : "",
    });
  }

  return hits;
}

export function formatStructuralDetail(hit: StructuralHit): string {
  if (hit.kind === "natural_key_join") {
    // Prefer the parser's own message when supplied — it already contains
    // the honest label ("Fact table" vs "SQL model") decided by the AST
    // classifier in parse_sql_ast.py.
    if (hit.message) return hit.message;
    const left = hit.left_table || "?";
    const right = hit.right_table || "?";
    return `natural-key join on ${hit.column} (${left} → ${right})`;
  }
  const snippet = hit.snippet ? ` — ${hit.snippet}` : "";
  return `any at line ${hit.line}:${hit.column}${snippet}`;
}

export function formatStructuralMetadata(
  result: StructuralParseResult,
): Record<string, unknown> {
  return {
    hits: result.hits,
    error: result.error,
    skipped: result.skipped,
    skipReason: result.skipReason,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Layer 2: rule-driven structural checks
// ──────────────────────────────────────────────────────────────────────

const SQL_EXTS = new Set([".sql"]);
const TS_EXTS = new Set([
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
]);

function getExtension(filePath: string): string {
  const slash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  const dot = filePath.lastIndexOf(".");
  if (dot === -1 || dot < slash) return "";
  return filePath.slice(dot).toLowerCase();
}

function parserForExtension(pathLike: string): StructuralParser | null {
  const ext = getExtension(pathLike);
  if (SQL_EXTS.has(ext)) return "sql";
  if (TS_EXTS.has(ext)) return "ts";
  return null;
}

function matchingFilesForGlob(
  glob: string,
  fileContents: Record<string, string>,
  parser: StructuralParser,
): string[] {
  const out: string[] = [];
  for (const filePath of Object.keys(fileContents)) {
    if (parserForExtension(filePath) !== parser) continue;
    if (!matchesGlob(glob, filePath)) continue;
    out.push(filePath);
  }
  return out;
}

function ruleIdOf(rule: RuleSpec): string {
  const r = rule as any;
  return r.id ?? r.ruleId ?? "unknown";
}

function buildStructuralFinding(
  rule: RuleSpec,
  filePath: string,
  hit: StructuralHit,
  parser: StructuralParser,
): Finding {
  const ruleAny = rule as any;
  const ruleId = ruleIdOf(rule);
  const severity = (ruleAny.severity ?? "warning") as Finding["severity"];
  const title: string = ruleAny.title ?? ruleId;

  // Prefer the per-violation suggestion (names the exact column to
  // replace) over the rule's generic fix.
  const fix: string =
    (hit.kind === "natural_key_join" && hit.suggestion) ||
    ruleAny.fix ||
    "";

  const finding: Finding = {
    ruleId,
    severity,
    title,
    detail: formatStructuralDetail(hit),
    fix,
    weight: severityWeight(severity),
  };

  (finding as any).file = filePath;
  if (hit.kind === "any") {
    (finding as any).line = hit.line;
  } else if (typeof hit.line === "number") {
    (finding as any).line = hit.line;
  }
  if (ruleAny.references) (finding as any).references = ruleAny.references;
  if (ruleAny.profile) (finding as any).profile = ruleAny.profile;

  // --- PATCH START: Flatten metadata for Option C recognition ---
  const parserName = parser === "sql" ? "sqlglot" : "typescript-eslint";

  const metadata: Record<string, unknown> = {
    layer: "structural",
    parser: parserName,
    kind: hit.kind,
    hit,
    // Keep nested structure for backward compatibility if needed
    structural: {
      parser,
      kind: hit.kind,
      hit,
    },
  };

  if (hit.kind === "natural_key_join") {
    metadata.violationKind = hit.kind;
    metadata.column = hit.column;
    metadata.tableAlias = hit.table_alias ?? null;
    metadata.line = hit.line ?? null;
    metadata.context = hit.message ?? formatStructuralDetail(hit);
  } else {
    metadata.line = hit.line;
    metadata.columnPosition = hit.column;
    metadata.context = hit.snippet;
  }

  (finding as any).metadata = metadata;
  // --- PATCH END ---

  return finding;
}

function buildParseErrorFinding(
  rule: RuleSpec,
  filePath: string,
  errorMessage: string,
  parser: StructuralParser,
): Finding {
  const ruleAny = rule as any;
  const ruleId = ruleIdOf(rule);
  const severity = (ruleAny.severity ?? "warning") as Finding["severity"];
  const title: string = ruleAny.title ?? ruleId;
  const lang = parser === "sql" ? "SQL" : "TypeScript";

  const finding: Finding = {
    ruleId,
    severity,
    title: `${title} (parse error)`,
    detail: `Could not parse ${lang} file: ${errorMessage}`,
    fix: "Check syntax or dialect detection for this file.",
    weight: severityWeight(severity),
  };

  (finding as any).file = filePath;
  if (ruleAny.references) (finding as any).references = ruleAny.references;
  if (ruleAny.profile) (finding as any).profile = ruleAny.profile;

  // --- PATCH START: Flatten metadata for Option C recognition ---
  const parserName = parser === "sql" ? "sqlglot" : "typescript-eslint";

  (finding as any).metadata = {
    layer: "structural",
    parser: parserName,
    kind: "parse_error",
    error: errorMessage,
    structural: {
      parser,
      kind: "parse_error",
      error: errorMessage,
    },
  };
  // --- PATCH END ---

  return finding;
}

export async function runStructuralChecks(
  rules: RuleSpec[],
  fileContents: Record<string, string>,
  options?: { maxChecks?: number; repoRoot?: string },
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const maxChecks = options?.maxChecks ?? Number.POSITIVE_INFINITY;
  const repoRoot = options?.repoRoot;
  let checksRun = 0;

  for (const rule of rules) {
    if (checksRun >= maxChecks) break;

    const checks: Array<any> = ((rule as any).checks ?? []) as Array<any>;
    for (const check of checks) {
      if (checksRun >= maxChecks) break;
      if (check?.type !== "structural_ast") continue;

      const fileGlob: string | undefined = check.file_glob ?? check.path_glob;
      if (!fileGlob) continue;

      const parser = parserForExtension(fileGlob);
      if (!parser) continue;

      const matchingFiles = matchingFilesForGlob(fileGlob, fileContents, parser);

      for (const filePath of matchingFiles) {
        if (checksRun >= maxChecks) break;
        checksRun += 1;

        const result = await runStructuralParser(filePath, parser, repoRoot);

        if (result.skipped) {
          // parser_missing / file_missing / timeout / malformed_json:
          // structural is best-effort per the orchestrator's contract,
          // so skip silently rather than emit a bogus finding.
          continue;
        }

        if (result.error) {
          findings.push(
            buildParseErrorFinding(rule, filePath, result.error, parser),
          );
        }

        for (const hit of result.hits) {
          findings.push(buildStructuralFinding(rule, filePath, hit, parser));
        }
      }
    }
  }

  return findings;
}