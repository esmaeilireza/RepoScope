// lib/audit-orchestrator.ts
//
// Orchestrator for RepoScope's multi-layer audit pipeline.
//
// Layer 1: deterministic findings from lib/audit.ts
// Layer 2: structural/AST findings from lib/knowledge/structural.ts
// Layer 3: semantic/LLM findings from lib/semantic/runner.ts
// Layer 4: grounding enrichment from lib/knowledge/neo4j-client.ts
//
// Design rules:
// - Do not mutate lib/audit.ts.
// - Do not make deterministic findings depend on LLM availability.
// - If structural or semantic execution fails, fail open: log and continue.
// - Grounding is enrichment, not a hard dependency.
// - Verbose debug logs are gated behind REPOSCOPE_DEBUG=1.
// - Layer 3 receives Layer 1 + Layer 2 findings as priorFindings so semantic
//   rules can skip when structural AST already confirmed the same issue.
//
// Grounding output contract:
// - Grounding records are canonicalized and deduped by book::concept.
// - They are stored ONLY in `metadata.grounding`. `detail` is never mutated
//   with grounding text. The CLI is the single place that formats grounding
//   for humans.
//
// Cross-run dedupe contract:
// - `dedupeFindings()` and `dedupeFindingsAcrossRuns()` are exported so the
//   CLI can collapse duplicates caused by invoking the orchestrator once per
//   profile. The canonical dedupe key is:
//
//     ruleId::file::line::detailPrefix
//
//   If ruleId or file is absent, the fallback key is:
//
//     title::title::detailPrefix
//
import { generateFindings } from "./audit";
import { runSemanticChecks } from "./semantic/runner";
import { groundRule } from "./knowledge/neo4j-client";
import type { Finding, GitHubTreeItem, RuleSpec } from "./types";

export interface AuditOrchestratorOptions {
  maxSemanticChecks?: number;
  enableStructural?: boolean;
  enableSemantic?: boolean;
  /**
   * Absolute path to the repository being audited.
   *
   * Required for Layer 2 (structural/AST) so the Python parser
   * (`scripts/kg/parse_sql_ast.py`) can resolve repo-relative paths like
   * `models/marts/facts/fct_orders.sql` against the target repo root
   * instead of `process.cwd()`.
   */
  repoRoot?: string;
  onDiagnostic?: (message: string) => void;
}

type MaybePromise<T> = T | Promise<T>;

interface StructuralModule {
  runStructuralChecks?: (
    rules: RuleSpec[],
    fileContents: Record<string, string>,
    options?: { maxChecks?: number; repoRoot?: string },
  ) => MaybePromise<Finding[]>;
}

interface GroundingEntry {
  rule_id?: string;
  rule_title?: string;
  severity?: string;
  concept?: string;
  book?: string;
  source?: string;
  source_type?: string;
}

type FindingRecord = Finding & Record<string, unknown>;

function isDebugEnabled(): boolean {
  return process.env.REPOSCOPE_DEBUG === "1";
}

function diagnose(
  options: AuditOrchestratorOptions | undefined,
  message: string,
): void {
  if (options?.onDiagnostic) {
    options.onDiagnostic(message);
    return;
  }

  // Important layer failures should still be visible.
  console.error(`[audit-orchestrator] ${message}`);
}

function debugLog(
  options: AuditOrchestratorOptions | undefined,
  message: string,
): void {
  if (options?.onDiagnostic) {
    options.onDiagnostic(message);
    return;
  }

  if (isDebugEnabled()) {
    console.error(`[audit-orchestrator][debug] ${message}`);
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }

  try {
    return String(err);
  } catch {
    return "unknown error";
  }
}

function hasFileContents(
  fileContents: Record<string, string> | undefined,
): fileContents is Record<string, string> {
  return Boolean(fileContents && Object.keys(fileContents).length > 0);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function readLine(source: Record<string, unknown>): string {
  const value = source.line;

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function makeFindingKey(finding: Finding): string {
  const raw = finding as unknown as FindingRecord;

  const ruleId = readString(raw, "ruleId") ?? "";
  const file = readString(raw, "file") ?? readString(raw, "path") ?? "";
  const line = readLine(raw);
  const detail = readString(raw, "detail")?.slice(0, 120) ?? "";

  if (ruleId || file) {
    return `${ruleId}::${file}::${line}::${detail}`;
  }

  const title = readString(raw, "title") ?? "";
  return `title::${title}::${detail}`;
}

/**
 * Canonical finding dedupe.
 *
 * This is exported because the CLI may invoke the orchestrator once per
 * profile. In that case, duplicates can appear after merging profile runs.
 * The CLI must use this exact function, not an ad-hoc dedupe implementation.
 */
export function dedupeFindings(findings: readonly Finding[]): Finding[] {
  const seen = new Set<string>();
  const output: Finding[] = [];

  for (const finding of findings) {
    const key = makeFindingKey(finding);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(finding);
  }

  return output;
}

/**
 * Convenience helper for CLI code that collects findings from multiple
 * orchestrator runs, for example one run per profile.
 *
 * Usage:
 *   const finalFindings = dedupeFindingsAcrossRuns(dataopsFindings, webappFindings, iiotFindings);
 */
export function dedupeFindingsAcrossRuns(
  ...runs: readonly (readonly Finding[])[]
): Finding[] {
  const flattened: Finding[] = [];

  for (const run of runs) {
    for (const finding of run) {
      flattened.push(finding);
    }
  }

  return dedupeFindings(flattened);
}

function coerceFindingArray(value: unknown): Finding[] {
  if (Array.isArray(value)) {
    return value as Finding[];
  }

  return [];
}

// ── grounding normalization ─────────────────────────────────────────────
// Book titles arrive in multiple forms across rule specs and the KG
// (full title, short title, inconsistent casing). Collapse them to a
// stable canonical name so the CLI prints one line per book::concept,
// not one line per spelling.
function canonicalBookTitle(title: string): string {
  const t = title.trim();

  if (/^The Data Warehouse Toolkit/i.test(t)) {
    return "The Data Warehouse Toolkit";
  }

  if (/^Continuous Delivery/i.test(t)) {
    return "Continuous Delivery";
  }

  if (/^Designing Data-Intensive Applications/i.test(t)) {
    return "Designing Data-Intensive Applications";
  }

  if (/^Web Application Security/i.test(t)) {
    return "Web Application Security";
  }

  if (/^The DevOps Handbook/i.test(t)) {
    return "The DevOps Handbook";
  }

  if (/^Practical DataOps/i.test(t)) {
    return "Practical DataOps";
  }

  if (/^Fundamentals of Data Engineering/i.test(t)) {
    return "Fundamentals of Data Engineering";
  }

  if (/^Data Management at Scale/i.test(t)) {
    return "Data Management at Scale";
  }

  if (/^Site Reliability Engineering/i.test(t)) {
    return "Site Reliability Engineering";
  }

  return t;
}

/**
 * Canonicalize and dedupe grounding records.
 *
 * `book` and `source` are both normalized to the same canonical title
 * so downstream consumers can read either field.
 *
 * `concept` is trimmed; empty concepts are preserved because they still
 * uniquely identify a book-level citation.
 *
 * Records with no resolvable book/source are dropped, since they cannot
 * be printed meaningfully.
 *
 * Dedupe key is `book::concept`, so the same concept cited from two
 * different source types, for example `book` and `paper`, collapses to
 * one line.
 */
function normalizeGroundingRecords(
  records: readonly GroundingEntry[],
): GroundingEntry[] {
  const seen = new Set<string>();
  const out: GroundingEntry[] = [];

  for (const r of records) {
    const book = canonicalBookTitle(String(r.book ?? r.source ?? "").trim());

    if (!book) {
      continue;
    }

    const concept = String(r.concept ?? "").trim();
    const key = `${book}::${concept}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    out.push({
      ...r,
      book,
      source: book,
      concept,
    });
  }

  return out;
}

/**
 * Enrich findings with Neo4j citation grounding.
 *
 * This is best-effort:
 * - If `groundRule()` throws, findings are returned unchanged.
 * - If no grounding exists, findings are returned unchanged.
 * - If grounding exists, it is stored in `metadata.grounding` after
 *   canonicalization and dedupe.
 *
 * IMPORTANT:
 * `detail` is intentionally NOT modified here. The CLI is the single
 * formatter for grounding output. Duplicating grounding text into `detail`
 * causes the same citation to appear twice in the final report and pollutes
 * the dedupe key, because `detail` participates in that key.
 */
function enrichFindingsWithGrounding(
  findings: readonly Finding[],
  options?: AuditOrchestratorOptions,
): Finding[] {
  debugLog(
    options,
    `[enrichWithGrounding] called with ${findings.length} findings`,
  );

  return findings.map((finding) => {
    const raw = finding as unknown as FindingRecord;
    const ruleId = readString(raw, "ruleId");

    if (!ruleId) {
      return finding;
    }

    debugLog(options, `[enrichWithGrounding] processing ruleId: ${ruleId}`);

    let rawRecords: GroundingEntry[] = [];

    try {
      rawRecords = (groundRule(ruleId) ?? []) as GroundingEntry[];
    } catch (err) {
      diagnose(
        options,
        `Grounding lookup failed for ${ruleId}: ${errorMessage(err)}`,
      );
      return finding;
    }

    const records = normalizeGroundingRecords(rawRecords);

    if (!records.length) {
      return finding;
    }

    const existingMetadata = asRecord(raw.metadata);

    const updated = {
      ...raw,
      metadata: {
        ...existingMetadata,
        grounding: records,
      },
    } as unknown as Finding;

    return updated;
  });
}

function finalizeFindings(
  findings: Finding[],
  options?: AuditOrchestratorOptions,
): Finding[] {
  const deduped = dedupeFindings(findings);
  return enrichFindingsWithGrounding(deduped, options);
}

/**
 * Main orchestrator entry point.
 *
 * Callers should migrate from:
 *
 *   generateFindings(...)
 *
 * to:
 *
 *   await generateAllFindings(...)
 */
export async function generateAllFindings(
  meta: unknown,
  tree: GitHubTreeItem[],
  claims: unknown[],
  diffs: unknown[],
  pulls: unknown[],
  defaultBranch: string,
  rules: RuleSpec[],
  fileContents?: Record<string, string>,
  options?: AuditOrchestratorOptions,
): Promise<Finding[]> {
  // ---------------------------------------------------------------------------
  // Layer 1: deterministic findings
  // ---------------------------------------------------------------------------
  const deterministicFindings = coerceFindingArray(
    generateFindings(
      meta,
      tree,
      claims,
      diffs,
      pulls,
      defaultBranch,
      fileContents,
    ),
  );

  const findings: Finding[] = [...deterministicFindings];

  if (!rules || rules.length === 0) {
    return finalizeFindings(findings, options);
  }

  if (!hasFileContents(fileContents)) {
    diagnose(
      options,
      "No file contents supplied; skipping structural and semantic layers.",
    );
    return finalizeFindings(findings, options);
  }

  // ---------------------------------------------------------------------------
  // Layer 2: structural / AST findings
  // ---------------------------------------------------------------------------
  if (options?.enableStructural !== false) {
    try {
      const structuralModule = (await import(
        "./knowledge/structural"
      )) as unknown as StructuralModule;

      if (typeof structuralModule.runStructuralChecks === "function") {
        const structuralFindings = await structuralModule.runStructuralChecks(
          rules,
          fileContents,
          {
            maxChecks: options?.maxSemanticChecks,
            repoRoot: options?.repoRoot,
          },
        );

        findings.push(...coerceFindingArray(structuralFindings));
      } else {
        diagnose(
          options,
          "lib/knowledge/structural.ts does not export runStructuralChecks(); skipping Layer 2.",
        );
      }
    } catch (err) {
      diagnose(options, `Structural layer failed: ${errorMessage(err)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Layer 3: semantic / LLM findings
  //
  // Important:
  // We pass the current findings array as priorFindings.
  // This allows semantic rules to skip when structural AST already confirmed
  // the same issue for the same file.
  // ---------------------------------------------------------------------------
  if (options?.enableSemantic !== false) {
    try {
      const semanticFindings = await runSemanticChecks(
        rules,
        fileContents,
        {
          maxChecks: options?.maxSemanticChecks,
          priorFindings: findings,
        },
      );

      findings.push(...coerceFindingArray(semanticFindings));
    } catch (err) {
      diagnose(options, `Semantic layer failed: ${errorMessage(err)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Layer 4: grounding enrichment
  // ---------------------------------------------------------------------------
  return finalizeFindings(findings, options);
}