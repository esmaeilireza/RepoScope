#!/usr/bin/env tsx
// scripts/reposcope-audit.ts — CLI entry point for RepoScope.
//
// Usage:  npx --no-install reposcope [--repo <path>] [--profile <name>] [--strict]
//
// Reads <repo>/.git via the GitHub tree API OR from a local scan, runs
// generateFindings() + auditDataOpsRepository() + auditIIoTRepository(),
// merges the results, prints a table, and exits non-zero on violations
// if --strict is set.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { generateFindings, scoreAndExplain } from "../lib/audit";
import { auditDataOpsRepository } from "../lib/dataops-audit";
import { auditIIoTRepository } from "../lib/iiot-audit";
import type { GitHubTreeItem, Finding } from "../lib/types";

interface CliArgs {
  repo: string;
  profile: string | null;
  strict: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let repo = ".";
  let profile: string | null = null;
  let strict = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo" && args[i + 1]) { repo = args[++i]; }
    else if (args[i] === "--profile" && args[i + 1]) { profile = args[++i].toLowerCase(); }
    else if (args[i] === "--strict") { strict = true; }
  }
  return { repo, profile, strict };
}

function scanLocalTree(root: string): GitHubTreeItem[] {
  const out: GitHubTreeItem[] = [];
  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      if ([".git", "node_modules", ".next", ".venv", "dist", "build"].includes(name)) continue;
      const full = join(dir, name);
      // FIX: normalize to forward slashes so rule globs match on Windows.
      // `path.relative` returns "docs\\safety\\loto.md" on Windows, which
      // never matches `path.startsWith("docs/safety/")`.
      const rel = relative(root, full).replace(/\\/g, "/");
      const st = statSync(full);
      if (st.isDirectory()) {
        out.push({ path: rel, type: "tree" });
        walk(full);
      } else {
        out.push({ path: rel, type: "blob", size: st.size });
      }
    }
  }
  walk(root);
  return out;
}

function readTextFiles(root: string, tree: GitHubTreeItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  const textExt = /\.(py|ts|tsx|js|jsx|json|yaml|yml|toml|md|txt|cfg|ini|conf|sh)$/i;
  for (const item of tree) {
    if (item.type !== "blob") continue;
    if (!textExt.test(item.path)) continue;
    if ((item.size ?? 0) > 512 * 1024) continue;
    try {
      out[item.path] = readFileSync(join(root, item.path), "utf-8");
    } catch { /* skip */ }
  }
  return out;
}

function formatFinding(f: Finding): string {
  const badge = { critical: "CRIT", error: "ERR ", warning: "WARN", info: "INFO" }[f.severity];
  return `[${badge}] ${f.ruleId}\n        ${f.title}\n        Fix: ${f.fix}`;
}

function main() {
  const { repo, profile, strict } = parseArgs();
  if (!existsSync(repo)) {
    console.error(`[ERROR] Repo path does not exist: ${repo}`);
    process.exit(2);
  }

  console.log(`[INFO] RepoScope audit — target: ${repo}`);
  if (profile) console.log(`[INFO] Profile filter: ${profile}`);

  const tree = scanLocalTree(repo);
  const fileContents = readTextFiles(repo, tree);
  console.log(`[INFO] Scanned ${tree.filter(t => t.type === "blob").length} files\n`);

  // FIXED: Pass fileContents as the 7th argument to generateFindings
  const core = generateFindings({}, tree, [], [], [], "main", fileContents);
  
  const dataops = auditDataOpsRepository(tree, undefined, fileContents).checks
    .filter(c => c.status !== "pass")
    .map(c => ({
      ruleId: c.ruleId,
      severity: (c.status === "fail" ? "error" : "warning") as "error" | "warning",
      title: c.title,
      detail: c.message,
      fix: c.recommendation,
      weight: c.status === "fail" ? 15 : 10,
      // FIXED: Respect the optional profile override (e.g. for cross-001)
      profile: c.profile ?? ("dataops" as const), 
    }));

  const iiot = auditIIoTRepository(tree, fileContents).checks
    .filter(c => c.status !== "pass")
    .map(c => ({
      ruleId: c.ruleId,
      severity: (c.status === "fail" ? "error" : "warning") as "error" | "warning",
      title: c.title,
      detail: c.message,
      fix: c.recommendation,
      weight: c.status === "fail" ? 15 : 10,
      profile: "iiot" as const,
    }));

  const all: Finding[] = [...core, ...dataops, ...iiot];
  const filtered = profile
    ? all.filter(f => f.profile === profile || f.ruleId.startsWith(`${profile}-`))
    : all;

  if (filtered.length === 0) {
    console.log("[PASS] No violations found.\n");
    process.exit(0);
  }

  for (const f of filtered) console.log(formatFinding(f) + "\n");

  const score = scoreAndExplain(filtered);
  console.log(`[SUMMARY] ${filtered.length} finding(s) · score ${score.score}/100`);
  console.log(`          critical=${score.critical} error=${score.errors} warning=${score.warnings} info=${score.infos}`);

  process.exit(strict && filtered.length > 0 ? 1 : 0);
}

main();