// lib/audit-orchestrator.ts
//
// Layer between the deterministic audit (lib/audit.ts :: generateFindings)
// and the semantic audit (lib/semantic/runner.ts :: runSemanticChecks).
//
// generateFindings() is synchronous by contract and stays untouched.
// This orchestrator is async and appends semantic findings from rules
// whose `checks` include a `semantic_eval` entry.
//
// Only runs when `fileContents` is provided — otherwise returns
// deterministic findings unchanged (fail-open, not fail-closed).

import { generateFindings } from "./audit";
import { runSemanticChecks } from "./semantic/runner";
import type { Finding, RuleSpec } from "./types";

// Local type alias so the orchestrator does not need to import
// GitHubTreeItem — the caller's tree shape is whatever generateFindings accepts.
type TreeItem = Parameters<typeof generateFindings>[1];

export async function generateAllFindings(
  meta: unknown,
  tree: TreeItem,
  claims: unknown[],
  diffs: unknown[],
  pulls: unknown[],
  defaultBranch: string,
  rules: RuleSpec[],
  fileContents?: Record<string, string>,
): Promise<Finding[]> {
  const base = generateFindings(
    meta,
    tree,
    claims,
    diffs,
    pulls,
    defaultBranch,
    fileContents,
  );

  if (!fileContents) return base;

  const semanticRules = rules.filter((r) =>
    Array.isArray(r.checks) &&
    r.checks.some((c) => c.type === "semantic_eval"),
  );

  if (semanticRules.length === 0) return base;

  const semantic = await runSemanticChecks(semanticRules, fileContents);
  return [...base, ...semantic];
}
