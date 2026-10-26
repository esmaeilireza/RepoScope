// lib/knowledge/structural.ts
//
// Server-only executor for the AST-based parsers under scripts/kg/.
//
// Two parsers exist today:
//   - scripts/kg/parse_sql_ast.py  (sqlglot)               → natural-key join detection
//   - scripts/kg/parse_ts_ast.mjs  (@typescript-eslint/parser) → any-type detection
//
// Both emit JSON to stdout. On success: exit 0, JSON on stdout.
// On parse failure: exit 2 with valid JSON on stdout carrying an `error`
// field. On usage failure (file missing, bad args): exit 1 with JSON on
// stdout. On interpreter missing: execFileSync throws ENOENT.
//
// This module MUST NOT import node:child_process or node:fs at the top
// level — Next.js will try to bundle them into the client. All Node builtins
// load via dynamic `import()` inside function bodies, and a `typeof window`
// guard refuses calls from a browser context.

export type StructuralParser = "sql" | "ts";

export type StructuralHit =
  | {
      kind: "natural_key_join";
      column: string;
      left_table: string;
      right_table: string;
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

const MAX_BUFFER = 8 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

export async function runStructuralParser(
  filePath: string,
  parser: StructuralParser,
): Promise<StructuralParseResult> {
  if (typeof window !== "undefined") {
    throw new Error(
      "runStructuralParser is server-only — do not call from a client component",
    );
  }

  const { execFileSync } = await import("node:child_process");
  const fs = await import("node:fs");
  const path = await import("node:path");

  const root = process.cwd();
  const scriptPath = path.join(root, ...SCRIPT_SEGMENTS[parser]);

  if (!fs.existsSync(scriptPath)) {
    return { file: filePath, hits: [], error: null, skipped: true, skipReason: "parser_missing" };
  }
  if (!fs.existsSync(filePath)) {
    return { file: filePath, hits: [], error: null, skipped: true, skipReason: "file_missing" };
  }

  const interpreter =
    parser === "sql" ? process.env.REPOSCOPE_PYTHON ?? "python" : "node";

  try {
    const raw = execFileSync(interpreter, [scriptPath, filePath], {
      encoding: "utf8",
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
    });
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      file: typeof parsed.file === "string" ? parsed.file : filePath,
      hits: normalizeHits(parsed),
      error: typeof parsed.error === "string" ? parsed.error : null,
      skipped: false,
    };
  } catch (err) {
    return handleExecError(err, filePath);
  }
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
        error: typeof parsed.error === "string" ? parsed.error : "parse failed",
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

// Defensive normalizer: accepts the key names the parsers are most likely
// to emit, so a small rename in one parser doesn't break the other. If a
// parser switches its output shape entirely, add the new key here — one
// place, not every caller.
function normalizeHits(parsed: Record<string, unknown>): StructuralHit[] {
  const hits: StructuralHit[] = [];

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
    });
  }

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