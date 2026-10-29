// lib/knowledge/deterministic.ts
//
// Layer-1 YAML dispatcher. Executes `pattern_match`, `file_exists`, and
// `file_absent` checks from specs.json against the in-memory tree and
// fileContents. Purely synchronous — no LLM, no subprocess, no timeouts.

import type { Finding, RuleCheck, RuleSpec } from "../types";
import { resolveTargets, weightFor } from "../semantic/runner";
import type { generateFindings } from "../audit";

type TreeItem = Parameters<typeof generateFindings>[1];

export function runDeterministicChecks(
  rules: RuleSpec[],
  tree: TreeItem,
  fileContents: Record<string, string>,
): Finding[] {
  const findings: Finding[] = [];

  // Authoritative path set for file_exists/file_absent. Uses tree (not
  // fileContents) because binary and oversized files may be in the tree
  // but skipped by readTextFiles.
  const pathSet: Record<string, string> = {};
  for (const item of tree) {
    if (item.type === "blob") pathSet[item.path] = "";
  }

  for (const rule of rules) {
    if (!Array.isArray(rule.checks)) continue;

    for (const check of rule.checks) {
      if (check.type === "pattern_match") {
        if (
          check.error_when &&
          check.error_when !== "pattern_present" &&
          check.error_when !== "pattern_absent"
        ) {
          // Spec author used a file-check enum on a pattern check.
          // Silently skipping is safer than guessing intent.
          console.warn(
            `[spec] rule ${rule.id}: error_when="${check.error_when}" not valid for pattern_match; skipping check`,
          );
          continue;
        }

        const glob = check.file_glob ?? check.path_glob;
        if (!glob || !check.pattern) continue;

        const targets = resolveTargets(glob, fileContents);
        if (targets.length === 0) continue;

        let re: RegExp;
        try {
          re = new RegExp(check.pattern);
        } catch {
          // A broken regex is a spec bug, not a runtime error. Warn so
          // the spec author sees it on the next run.
          console.warn(
            `[spec] rule ${rule.id}: invalid regex pattern="${check.pattern}"`,
          );
          continue;
        }

        let matchedFile: string | null = null;
        for (const file of targets) {
          if (re.test(fileContents[file])) {
            matchedFile = file;
            break;
          }
        }

        const errorOnPresent = check.error_when
          ? check.error_when === "pattern_present"
          : check.must_exist !== true;

        if (errorOnPresent && matchedFile !== null) {
          findings.push(
            buildFinding(rule, check, matchedFile, `Pattern present: ${check.pattern}`),
          );
        } else if (!errorOnPresent && matchedFile === null) {
          findings.push(
            buildFinding(rule, check, targets[0], `Pattern not found: ${check.pattern}`),
          );
        }
      } else if (check.type === "file_exists" || check.type === "file_absent") {
        // The valid enum values for file/absent checks are "file_absent"
        // (fire when the file is missing) and "file_present" (fire when
        // the file exists). Both are legitimate depending on the spec.
        if (
          check.error_when &&
          check.error_when !== "file_absent" &&
          check.error_when !== "file_present"
        ) {
          console.warn(
            `[spec] rule ${rule.id}: error_when="${check.error_when}" not valid for ${check.type}; skipping check`,
          );
          continue;
        }

        const globs = check.paths?.length
          ? check.paths
          : [check.file_glob, check.path_glob].filter((g): g is string => !!g);

        if (globs.length === 0) continue;

        let matchedFile: string | null = null;
        for (const glob of globs) {
          const targets = resolveTargets(glob, pathSet);
          if (targets.length > 0) {
            matchedFile = targets[0];
            break;
          }
        }

        const errorOnAbsent = check.error_when
          ? check.error_when === "file_absent"
          : check.type === "file_exists" && check.must_exist !== false;

        if (errorOnAbsent && matchedFile === null) {
          findings.push(buildFinding(rule, check, globs[0], "Required file not found"));
        } else if (!errorOnAbsent && matchedFile !== null) {
          findings.push(buildFinding(rule, check, matchedFile, "File should not exist"));
        }
      }
    }
  }

  return findings;
}

function buildFinding(
  rule: RuleSpec,
  check: RuleCheck,
  file: string,
  fallbackMessage: string,
): Finding {
  return {
    ruleId: rule.id,
    severity: rule.severity,
    title: rule.title,
    detail: check.message || fallbackMessage,
    fix: rule.fix,
    weight: weightFor(rule.severity),
    profile: rule.profile === "graph" ? "cross" : rule.profile,
    file,
    references: rule.references,
  };
}