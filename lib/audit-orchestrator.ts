// lib/audit-orchestrator.ts
//
// Layer between the deterministic audit (lib/audit.ts :: generateFindings),
// the structural audit (lib/knowledge/structural.ts :: runStructuralParser),
// and the semantic audit (lib/semantic/runner.ts :: runSemanticChecks).
//
// generateFindings() is synchronous by contract and stays untouched.
// This orchestrator is async and appends:
//   - structural_ast findings (deterministic, subprocess-based, Week-3)
//   - semantic_eval findings (LLM-backed, Week-1)
//
// Order matters: structural runs first (fast, deterministic, ~100ms per
// file), semantic runs second (slow, LLM-backed, 90-150s cold start).
// Findings appear in that order in the report so a diff between two runs
// has a stable prefix.
//
// Only runs when `fileContents` is provided — otherwise returns
// deterministic findings unchanged (fail-open, not fail-closed).
//
// Two calling conventions:
//   1. Webapp (default): omit `baseFindings`. The orchestrator calls
//      generateFindings(...) internally, preserving Week-1 behavior.
//   2. Dataops/IIoT: pass `baseFindings` with your own deterministic
//      findings. The orchestrator skips generateFindings to avoid
//      polluting profile-specific output with webapp findings.

import { generateFindings } from "./audit";
import {
  resolveTargets,
  runSemanticChecks,
  weightFor,
} from "./semantic/runner";
import {
  formatStructuralDetail,
  formatStructuralMetadata,
  runStructuralParser,
} from "./knowledge/structural";
import type { Finding, RuleSpec } from "./types";

// Local type alias so the orchestrator does not need to import
// GitHubTreeItem — the caller's tree shape is whatever generateFindings accepts.
type TreeItem = Parameters<typeof generateFindings>[1];

// Cap on structural checks per run. Each check = one execFileSync call at
// ~100ms per file. 50 checks ≈ 5 seconds worst case. A dbt project's
// fact-table directory rarely exceeds this; if it does, the cap makes the
// audit slow but not pathologically slow, and the very next run is warmer
// (filesystem cache).
const MAX_STRUCTURAL_CHECKS = 50;

export async function generateAllFindings(
  meta: unknown,
  tree: TreeItem,
  claims: unknown[],
  diffs: unknown[],
  pulls: unknown[],
  defaultBranch: string,
  rules: RuleSpec[],
  fileContents?: Record<string, string>,
  baseFindings?: Finding[],
): Promise<Finding[]> {
  // If the caller supplied their own deterministic findings (e.g., the
  // dataops or iiot auditors), use those. Otherwise fall back to the
  // webapp-specific generateFindings for backward compatibility.
  const base =
    baseFindings ??
    generateFindings(meta, tree, claims, diffs, pulls, defaultBranch, fileContents);

  if (!fileContents) return base;

  const semanticRules = rules.filter(
    (r) =>
      Array.isArray(r.checks) &&
      r.checks.some((c) => c.type === "semantic_eval"),
  );
  const structuralRules = rules.filter(
    (r) =>
      Array.isArray(r.checks) &&
      r.checks.some((c) => c.type === "structural_ast"),
  );

  if (semanticRules.length === 0 && structuralRules.length === 0) return base;

  // Deterministic before LLM: structural completes in ~100ms per file,
  // semantic requires a model warm-up of 90-150s on a cold start. Running
  // structural first means a structural throw surfaces before we wait on
  // the model, and report prefixes are stable across runs.
  const structural =
    structuralRules.length > 0
      ? await runStructuralChecks(structuralRules, fileContents)
      : [];
  const semantic =
    semanticRules.length > 0
      ? await runSemanticChecks(semanticRules, fileContents)
      : [];

  return [...base, ...structural, ...semantic];
}

async function runStructuralChecks(
  rules: RuleSpec[],
  fileContents: Record<string, string>,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  let checksRun = 0;

  for (const rule of rules) {
    if (checksRun >= MAX_STRUCTURAL_CHECKS) break;
    for (const check of rule.checks) {
      if (check.type !== "structural_ast") continue;
      const parser = check.parser;
      if (parser !== "sql" && parser !== "ts") continue;
      const pattern = check.file_glob ?? check.path_glob;
      if (!pattern) continue;

      for (const targetPath of resolveTargets(pattern, fileContents)) {
        if (checksRun >= MAX_STRUCTURAL_CHECKS) break;
        checksRun++;

        const result = await runStructuralParser(targetPath, parser);
        if (result.skipped) continue;
        if (result.hits.length === 0) continue;

        const first = result.hits[0];
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          detail: formatStructuralDetail(first),
          fix: rule.fix,
          weight: weightFor(rule.severity),
          profile: rule.profile === "graph" ? "cross" : rule.profile,
          file: targetPath,
          line: first.kind === "any" ? first.line : undefined,
          references: rule.references,
          metadata: formatStructuralMetadata(result),
        });
      }
    }
  }

  return findings;
}