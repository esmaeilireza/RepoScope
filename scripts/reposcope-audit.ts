#!/usr/bin/env tsx
// scripts/reposcope-audit.ts — CLI entry point for RepoScope.
//
// Usage:  npx --no-install reposcope [--repo <path>] [--profile <name>] [--strict]
//
// Reads <repo>/.git via the GitHub tree API OR from a local scan, runs
// generateFindings() + auditDataOpsRepository() + auditIIoTRepository(),
// merges the results, prints a table, and exits non-zero on violations
// if --strict is set.
import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { setStructuralRootDir } from "../lib/knowledge/structural";
import { join, relative } from "node:path";
import { generateFindings, scoreAndExplain } from "../lib/audit";
import { generateAllFindings } from "../lib/audit-orchestrator";
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
  const textExt = /\.(py|ts|tsx|js|jsx|json|yaml|yml|toml|md|txt|cfg|ini|conf|sh|sql)$/i;
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

// ── Phase 2: repo-type routing with evidence ─────────────────────────
function routeRepo(repoPath: string): { profiles: string[]; evidence: Record<string, string[]> } {
  try {
    const raw = execSync(`python scripts/route_repo.py "${repoPath}"`, { encoding: "utf-8" });
    return JSON.parse(raw);
  } catch {
    return { profiles: ["webapp"], evidence: { webapp: ["fallback"] } };
  }
}

// ── Phase 3: industrial-ML filter ─────────────────────────────────
function runIndustrialMlFilter(repoPath: string): Record<string, { signals: string[]; notes: string[] }> {
  try {
    const raw = execSync(`python scripts/industrial_ml_filter.py "${repoPath}"`, { encoding: "utf-8" });
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Phase 4: grounded citations via Neo4j ─────────────────────────
function groundRule(ruleId: string): Array<{ rule: string; concept: string; book: string }> {
  try {
    const raw = execSync(`python scripts/kg/ground.py "${ruleId}"`, { encoding: "utf-8" });
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function main() {
  const { repo, profile, strict } = parseArgs();
  if (!existsSync(repo)) {
    console.error(`[ERROR] Repo path does not exist: ${repo}`);
    process.exit(2);
  }

  console.log(`[INFO] RepoScope audit — target: ${repo}`);
  if (profile) console.log(`[INFO] Profile filter: ${profile}`);

  // ── Phase 2: repo-type routing with evidence ─────────────────────
  const route = routeRepo(repo);
  console.log(`[ROUTE] profiles: ${route.profiles.join(", ")}`);
  for (const [profileName, evidence] of Object.entries(route.evidence)) {
    if (evidence.length > 0) {
      console.log(`[ROUTE] ${profileName} evidence: ${evidence.join(", ")}`);
    }
  }

  // ── Phase 3: industrial-ML filter ────────────────────────────────
  const iml = runIndustrialMlFilter(repo);
  if (Object.keys(iml).length > 0) {
    console.log(`[IML] industrial-ML context active: ${Object.keys(iml).join(", ")}`);
    for (const [cat, data] of Object.entries(iml)) {
      console.log(`[IML] ${cat}: signals=${data.signals.join(",")} | notes=${data.notes.length}`);
    }
  }

  // ── Fix 2: gate rule execution by route.profiles ─────────────────
  // Anything not in route.profiles is not evaluated, not printed, and
  // does not contribute to the score. In this codebase the "rule set"
  // is a set of audit functions rather than a specs.json bundle, so we
  // key the auditors by the profile they serve and skip the ones whose
  // profile is not route-active.
  const activeProfiles = new Set(route.profiles);
  if (profile && !activeProfiles.has(profile)) {
    console.log(
      `[WARN] --profile ${profile} is not in the routed set ` +
      `(${route.profiles.join(", ")}); no rules will execute.`
    );
  }

  setStructuralRootDir(resolvePath(repo));
  const tree = scanLocalTree(repo);
  const fileContents = readTextFiles(repo, tree);
  console.log(`[INFO] Scanned ${tree.filter(t => t.type === "blob").length} files\n`);

  // Register each auditor under the profile it serves. Auditors whose
  // profile is NOT in activeProfiles are never invoked.
  const profileAuditors: Record<
    string,
    (t: GitHubTreeItem[], fc: Record<string, string>) => Finding[] | Promise<Finding[]>
  > = {
    webapp: async (t, fc) => generateAllFindings({}, t, [], [], [], "main", loadRules("webapp"), fc),
    dataops: async (t, fc) => {
      const deterministic = auditDataOpsRepository(t, undefined, fc).checks
        .filter(c => c.status !== "pass")
        .map(c => ({
          ruleId: c.ruleId,
          severity: (c.status === "fail" ? "error" : "warning") as "error" | "warning",
          title: c.title,
          detail: c.message,
          fix: c.recommendation,
          weight: c.status === "fail" ? 15 : 10,
          // Respect the optional profile override (e.g. for cross-001)
          profile: c.profile ?? ("dataops" as const),
        }));
      return generateAllFindings(
        {}, t, [], [], [], "main", loadRules("dataops"), fc, deterministic,
      );
    },
    iiot: async (t, fc) => {
      const deterministic = auditIIoTRepository(t, fc).checks
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
      return generateAllFindings(
        {}, t, [], [], [], "main", loadRules("iiot"), fc, deterministic,
      );
    },
  };

  const all: Finding[] = [];
  for (const [routedProfile, runAudit] of Object.entries(profileAuditors)) {
    if (!activeProfiles.has(routedProfile)) continue;
    const profileFindings = await runAudit(tree, fileContents);
    all.push(...profileFindings);
  }

  // --profile is an *additional* narrowing on top of route gating.
  const filtered = profile
    ? all.filter(f => f.profile === profile || f.ruleId.startsWith(`${profile}-`))
    : all;

  if (filtered.length === 0) {
    console.log("[PASS] No violations found.\n");
    process.exit(0);
  }

  for (const f of filtered) {
    const _detailSuffix = f.detail && f.detail !== f.title && f.detail !== f.fix
      ? "\n        Detail: " + f.detail
      : "";
    console.log(formatFinding(f) + _detailSuffix + "\n");
    // Phase 4: ground this finding in Neo4j (skip general-* legacy rules)
    if (!f.ruleId.startsWith("general-")) {
      const grounding = groundRule(f.ruleId);
      for (const g of grounding) {
        console.log(`   Grounded in: ${g.book} - concept: ${g.concept}\n`);
      }
    }
  }

  const score = scoreAndExplain(filtered);
  console.log(`[SUMMARY] ${filtered.length} finding(s) | score ${score.score}/100`);
  console.log(`          critical=${score.critical} error=${score.errors} warning=${score.warnings} info=${score.infos}`);

  process.exit(strict && filtered.length > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
function loadRules(profile: string): any[] {
  const fs = require("fs");
  const path = require("path");
  const specsPath = path.join(process.cwd(), "public", "knowledge", "specs.json");
  if (!fs.existsSync(specsPath)) return [];
  const specs = JSON.parse(fs.readFileSync(specsPath, "utf8"));
  return specs[profile]?.rules ?? [];
}
