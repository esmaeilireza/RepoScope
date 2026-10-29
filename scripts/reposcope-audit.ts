#!/usr/bin/env tsx
// scripts/reposcope-audit.ts — CLI entry point for RepoScope.
//
// Usage:  npx --no-install reposcope [--repo <path>] [--profile <name>] [--strict] [--json]
//
// Reads <repo> from disk, applies conjunctive-evidence routing, runs the
// appropriate profile auditors, prints a table (or JSON), and exits non-zero
// on violations if --strict is set.
//
// Invariant: generateAllFindings() is called exactly ONCE per CLI run, with
// the union of active-profile rules. Per-profile orchestrator fan-out was the
// root cause of cross-profile duplicate findings; a single pass eliminates it
// at the source instead of papering over it with a CLI-side throw.
import { execFileSync } from "child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve as resolvePath, join, relative } from "node:path";
import { setStructuralRootDir } from "../lib/knowledge/structural";
import { scoreAndExplain } from "../lib/audit";
import { generateAllFindings, dedupeFindings } from "../lib/audit-orchestrator";
import { auditDataOpsRepository } from "../lib/dataops-audit";
import { auditIIoTRepository } from "../lib/iiot-audit";
import type { GitHubTreeItem, Finding } from "../lib/types";

// ── global dedupe helpers ──────────────────────────────────────────────
// The orchestrator dedupes internally; the CLI is the last barrier that
// must converge findings from any residual cross-profile fan-out. This
// layer MUST NOT throw — throwing here aborts the process before the
// JSON payload reaches stdout, which breaks `reposcope --json | jq`.
// Residual duplicates are a signal to investigate; they are never a
// fatal condition at the CLI boundary.
function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function dedupeKeyForFinding(finding: Finding): string {
  const record = finding as unknown as Record<string, unknown>;

  const file =
    optionalString(record.file) ??
    optionalString(record.path) ??
    "";

  const line = optionalNumber(record.line);

  const detail =
    typeof finding.detail === "string"
      ? finding.detail.slice(0, 120)
      : "";

  return `${finding.ruleId}::${file}::${line ?? ""}::${detail}`;
}

function dedupeFindingsGlobally(findings: readonly Finding[]): Finding[] {
  const seen = new Set<string>();
  const output: Finding[] = [];

  for (const finding of findings) {
    const key = dedupeKeyForFinding(finding);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(finding);
  }

  return output;
}

interface CliArgs {
  repo: string;
  profile: string | null;
  strict: boolean;
  json: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let repo = ".";
  let profile: string | null = null;
  let strict = false;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo" && args[i + 1]) repo = args[++i];
    else if (args[i] === "--profile" && args[i + 1]) profile = args[++i].toLowerCase();
    else if (args[i] === "--strict") strict = true;
    else if (args[i] === "--json") json = true;
  }
  return { repo, profile, strict, json };
}

// ── logging helpers ────────────────────────────────────────────────────
// In --json mode, all diagnostics go to stderr and stdout carries only the
// final JSON payload. This keeps `reposcope --json | jq` composable.
let jsonMode = false;
function log(msg: string): void {
  if (jsonMode) console.error(msg);
  else console.log(msg);
}

// ── tree scan + text load ─────────────────────────────────────────────
function scanLocalTree(root: string): GitHubTreeItem[] {
  const out: GitHubTreeItem[] = [];
  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      if ([".git", "node_modules", ".next", ".venv", "dist", "build"].includes(name)) continue;
      const full = join(dir, name);
      // Normalize to forward slashes so rule globs match on Windows.
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
  // .c/.h/.cpp/.hpp included so iiot's conjunctive check can read driver
  // source. `.sql` is required for Layer 2 structural_ast rules.
  const textExt = /\.(py|ts|tsx|js|jsx|json|yaml|yml|toml|md|txt|cfg|ini|conf|sh|sql|c|h|cpp|hpp)$/i;
  for (const item of tree) {
    if (item.type !== "blob") continue;
    if (!textExt.test(item.path)) continue;
    if ((item.size ?? 0) > 512 * 1024) continue;
    try {
      out[item.path] = readFileSync(join(root, item.path), "utf-8");
    } catch {
      /* skip unreadable */
    }
  }
  return out;
}

// ── subprocess helpers (execFileSync — no shell interpolation) ────────
function routeRepo(repoPath: string): { profiles: string[]; evidence: Record<string, string[]> } {
  try {
    const raw = execFileSync("python", ["scripts/route_repo.py", repoPath], {
      encoding: "utf-8",
    });
    return JSON.parse(raw);
  } catch {
    return { profiles: ["webapp"], evidence: { webapp: ["fallback"] } };
  }
}

function runIndustrialMlFilter(
  repoPath: string,
): Record<string, { signals: string[]; notes: string[] }> {
  try {
    const raw = execFileSync("python", ["scripts/industrial_ml_filter.py", repoPath], {
      encoding: "utf-8",
    });
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const groundCache = new Map<string, Array<{ rule: string; concept: string; book: string }>>();
function groundRule(ruleId: string): Array<{ rule: string; concept: string; book: string }> {
  if (groundCache.has(ruleId)) return groundCache.get(ruleId)!;
  let result: Array<{ rule: string; concept: string; book: string }> = [];
  try {
    const raw = execFileSync("python", ["scripts/kg/ground.py", ruleId], {
      encoding: "utf-8",
    });
    result = JSON.parse(raw);
  } catch {
    result = [];
  }
  groundCache.set(ruleId, result);
  return result;
}

// ── grounding rendering (single canonical formatter) ──────────────────
// Grounding is rendered in exactly one place. Sources, in priority order:
//   1. `metadata.grounding` populated by the audit orchestrator (canonical).
//   2. The Python `ground.py` fallback (legacy path for findings emitted
//      by lib/audit.ts directly, or by profile-specific auditors that do
//      not run through generateAllFindings()).
//
// If `detail` already contains a "Grounded in:" OR "Grounding:" block
// (legacy injection from an older code path), the separate renderer is
// suppressed. This guard is symmetric with the orchestrator's own
// re-injection guard in enrichFindingsWithGrounding(), which checks both
// patterns. Asymmetric guards were the source of the double-print bug
// seen in prior runs, where the same citation appeared once inline in
// `detail` and once again in the CLI summary.
interface GroundingRecord {
  book?: string;
  source?: string;
  concept?: string;
  source_type?: string;
  rule_id?: string;
  rule_title?: string;
  severity?: string;
}

interface FindingWithMetadata extends Finding {
  metadata?: {
    grounding?: GroundingRecord[];
    [key: string]: unknown;
  };
}

const DETAIL_GROUNDING_PATTERN = /(Grounded\s+in:|Grounding:)/i;

function renderGrounding(finding: Finding): string {
  const detail = typeof finding.detail === "string" ? finding.detail : "";

  // Legacy-guard: if detail already carries grounding text, do not print
  // a second copy. Matches both "Grounded in:" and "Grounding:" so the
  // guard is symmetric with the orchestrator's injection-side guard.
  if (DETAIL_GROUNDING_PATTERN.test(detail)) {
    return "";
  }

  // general-* findings are not grounded against a canonical book; skip.
  if (finding.ruleId.startsWith("general-")) {
    return "";
  }

  // Source 1: structured metadata from the orchestrator.
  const meta = (finding as FindingWithMetadata).metadata;
  const metaGrounding = meta?.grounding;

  const lines: string[] = [];

  if (Array.isArray(metaGrounding) && metaGrounding.length > 0) {
    for (const g of metaGrounding) {
      const book = String(g.book ?? g.source ?? "").trim();
      if (!book) continue;
      const concept = String(g.concept ?? "").trim();
      lines.push(concept ? `  - ${book} \u2192 ${concept}` : `  - ${book}`);
    }
  }

  // Source 2: Python ground.py fallback (legacy findings).
  if (lines.length === 0) {
    const grounding = groundRule(finding.ruleId);
    for (const g of grounding) {
      const book = String(g.book ?? "").trim();
      if (!book) continue;
      const concept = String(g.concept ?? "").trim();
      lines.push(concept ? `  - ${book} \u2192 ${concept}` : `  - ${book}`);
    }
  }

  if (lines.length === 0) return "";
  return `   Grounding:\n${lines.join("\n")}`;
}

// ── normalized dbt path helpers (Fix 3) ───────────────────────────────
// The scan tree emits paths relative to the repo root and normalized to
// forward slashes, but tooling or future scanners may emit nested paths
// (e.g. `__tests__/broken-dbt/models/...`). These helpers normalize both
// cases so the router does not silently drop dbt evidence.
function normalizeRelPath(p: string): string {
  return p.replaceAll("\\", "/");
}

function isDbtModelPath(p: string): boolean {
  const norm = normalizeRelPath(p).toLowerCase();
  return (
    (norm.startsWith("models/") || norm.includes("/models/")) &&
    norm.endsWith(".sql")
  );
}

function isDbtProjectFile(p: string): boolean {
  const norm = normalizeRelPath(p).toLowerCase();
  return (
    norm === "dbt_project.yml" ||
    norm === "dbt_project.yaml" ||
    norm.endsWith("/dbt_project.yml") ||
    norm.endsWith("/dbt_project.yaml")
  );
}

// ── conjunctive routing filter ────────────────────────────────────────
function hasConjunctiveEvidenceFor(
  profile: string,
  tree: GitHubTreeItem[],
  fileContents: Record<string, string>,
): { ok: boolean; reason: string } {
  if (profile === "iiot") {
    const driverImport =
      /\b(?:import\s+(?:pymodbus|opcua|snap7|pysnap7|asyncua|pycomm3)|from\s+(?:pymodbus|opcua|snap7|pysnap7|asyncua|pycomm3))\b/;
    for (const item of tree) {
      if (item.type !== "blob") continue;
      if (!/\.(py|c|cpp)$/i.test(item.path)) continue;
      const content = fileContents[item.path];
      if (content && driverImport.test(content)) {
        return { ok: true, reason: `${item.path} imports an industrial driver` };
      }
    }
    const plcSource = tree.find(
      (t) => t.type === "blob" && /\.(l5x|ap16|scl|st)$/i.test(t.path),
    );
    if (plcSource) return { ok: true, reason: `${plcSource.path} is PLC source` };
    return {
      ok: false,
      reason:
        "no .py/.c/.cpp source imports an industrial driver and no PLC " +
        "source files present; requirements.txt mention alone is not evidence",
    };
  }
  if (profile === "dataops") {
    // Fix 3: use normalized matchers so both `dbt_project.yml` and
    // `nested/dbt_project.yml` (and likewise `models/**/*.sql`) are
    // detected.
    const dbtProject = tree.find((t) => t.type === "blob" && isDbtProjectFile(t.path));
    if (dbtProject) return { ok: true, reason: dbtProject.path };

    const airflow = tree.find(
      (t) => t.type === "blob" && (t.path === "airflow.cfg" || t.path.startsWith("dags/")),
    );
    if (airflow) return { ok: true, reason: airflow.path };

    const dagster = tree.find(
      (t) =>
        t.type === "blob" &&
        (t.path === "dagster.yaml" || t.path === "workspace.yaml"),
    );
    if (dagster) return { ok: true, reason: dagster.path };

    const prefect = tree.find(
      (t) =>
        t.type === "blob" &&
        (t.path.endsWith("prefect.yaml") || t.path.startsWith("flows/")),
    );
    if (prefect) return { ok: true, reason: prefect.path };

    const modelsSql = tree.find((t) => t.type === "blob" && isDbtModelPath(t.path));
    if (modelsSql) return { ok: true, reason: modelsSql.path };

    return {
      ok: false,
      reason:
        "no dbt_project.yml, airflow/dagster/prefect config, or models/*.sql; " +
        "requirements.txt::pandas alone is not evidence",
    };
  }
  // webapp / general / cross: trust the router.
  return { ok: true, reason: "router evidence accepted" };
}

interface RouteResult {
  profiles: string[];
  evidence: Record<string, string[]>;
  dropped: Array<{ profile: string; reason: string }>;
}

function applyConjunctiveFilter(
  raw: { profiles: string[]; evidence: Record<string, string[]> },
  tree: GitHubTreeItem[],
  fileContents: Record<string, string>,
): RouteResult {
  const profiles: string[] = [];
  const evidence: Record<string, string[]> = {};
  const dropped: Array<{ profile: string; reason: string }> = [];

  for (const p of raw.profiles) {
    const check = hasConjunctiveEvidenceFor(p, tree, fileContents);
    if (check.ok) {
      profiles.push(p);
      evidence[p] = [...(raw.evidence[p] ?? []), `conjunctive: ${check.reason}`];
    } else {
      dropped.push({ profile: p, reason: check.reason });
    }
  }
  return { profiles, evidence, dropped };
}

// ── rule loading ──────────────────────────────────────────────────────
function loadRules(profile: string): any[] {
  const specsPath = join(process.cwd(), "public", "knowledge", "specs.json");
  if (!existsSync(specsPath)) return [];
  const specs = JSON.parse(readFileSync(specsPath, "utf8"));
  return specs[profile]?.rules ?? [];
}

// ── formatting ────────────────────────────────────────────────────────
function formatFinding(f: Finding): string {
  const badge = { critical: "CRIT", error: "ERR ", warning: "WARN", info: "INFO" }[
    f.severity
  ];
  return `[${badge}] ${f.ruleId}\n        ${f.title}\n        Fix: ${f.fix}`;
}

// ── deterministic (non-orchestrator) profile checks ───────────────────
// dataops and iiot ship deterministic auditors that do not fit the
// rule-engine signature. They still run per profile because they are
// independent of the semantic orchestrator, but their outputs participate
// in the same global dedupe pipeline.
function collectDeterministicFindings(
  tree: GitHubTreeItem[],
  fileContents: Record<string, string>,
  activeProfiles: Set<string>,
): Finding[] {
  const findings: Finding[] = [];

  if (activeProfiles.has("dataops")) {
    const checks = auditDataOpsRepository(tree, undefined, fileContents).checks
      .filter((c) => c.status !== "pass")
      .map(
        (c): Finding => ({
          ruleId: c.ruleId,
          severity: c.status === "fail" ? "error" : "warning",
          title: c.title,
          detail: c.message,
          fix: c.recommendation,
          weight: c.status === "fail" ? 15 : 10,
          profile: c.profile ?? ("dataops" as const),
        }),
      );
    findings.push(...checks);
  }

  if (activeProfiles.has("iiot")) {
    const checks = auditIIoTRepository(tree, fileContents).checks
      .filter((c) => c.status !== "pass")
      .map(
        (c): Finding => ({
          ruleId: c.ruleId,
          severity: c.status === "fail" ? "error" : "warning",
          title: c.title,
          detail: c.message,
          fix: c.recommendation,
          weight: c.status === "fail" ? 15 : 10,
          profile: "iiot" as const,
        }),
      );
    findings.push(...checks);
  }

  return findings;
}

// ── main ──────────────────────────────────────────────────────────────
async function main() {
  const { repo, profile, strict, json } = parseArgs();
  jsonMode = json;

  // Defense-in-depth for JSON mode. Library code (semantic runner,
  // structural parser, third-party deps) may call console.log directly;
  // every such call would corrupt the JSON payload on stdout. Redirect
  // console.log to stderr in JSON mode so only the explicit
  // process.stdout.write below reaches stdout.
  if (json) {
    console.log = (...args: unknown[]) => console.error(...args);
  }

  if (!existsSync(repo)) {
    console.error(`[ERROR] Repo path does not exist: ${repo}`);
    process.exit(2);
  }

  log(`[INFO] RepoScope audit — target: ${repo}`);
  if (profile) log(`[INFO] Profile filter: ${profile}`);

  // Fix 5.3: compute the canonical repo root once and pass it to every
  // downstream layer that may need to resolve repo-relative paths
  // (structural parser is the consumer today).
  const repoRoot = resolvePath(repo);

  setStructuralRootDir(repoRoot);
  const tree = scanLocalTree(repo);
  const fileContents = readTextFiles(repo, tree);
  log(`[INFO] Scanned ${tree.filter((t) => t.type === "blob").length} files`);

  // Routing: raw → augment with TS-side dbt detection → conjunctive filter.
  //
  // Fix 3 augment: route_repo.py may miss a bare dbt project (fixtures
  // with only `dbt_project.yml` + `models/**/*.sql` and no other
  // markers). Re-check from the TS side and promote dataops when the
  // conjunctive check would pass anyway. This is a no-op when the
  // Python router already returned dataops.
  const rawRoute = routeRepo(repo);
  if (!rawRoute.profiles.includes("dataops")) {
    const dbtCheck = hasConjunctiveEvidenceFor("dataops", tree, fileContents);
    if (dbtCheck.ok) {
      rawRoute.profiles.push("dataops");
      rawRoute.evidence["dataops"] = [
        ...(rawRoute.evidence["dataops"] ?? []),
        `ts-dbt-detect: ${dbtCheck.reason}`,
      ];
    }
  }

  const route = applyConjunctiveFilter(rawRoute, tree, fileContents);

  // Fix 2: compute the active set AFTER routing and BEFORE logging.
  //
  // - With --profile: strict mode. The requested domain plus the
  //   baseline packs run. Anything else the router found is ignored.
  // - Without --profile: routed profiles plus baselines.
  const KNOWN_PROFILES = new Set(["webapp", "dataops", "iiot", "general", "cross"]);
  let activeProfiles: Set<string>;

  if (profile) {
    if (!KNOWN_PROFILES.has(profile)) {
      log(`[WARN] Unknown profile: ${profile}`);
    }
    activeProfiles = new Set<string>([profile, "general", "cross"]);
  } else {
    activeProfiles = new Set<string>(route.profiles);
    if (activeProfiles.size > 0) {
      activeProfiles.add("general");
      activeProfiles.add("cross");
    }
  }

  log(`[ROUTE] raw profiles:    ${rawRoute.profiles.join(", ")}`);
  log(`[ROUTE] active profiles: ${[...activeProfiles].join(", ") || "(none)"}`);
  for (const d of route.dropped) {
    log(`[ROUTE] DROPPED ${d.profile}: ${d.reason}`);
  }
  for (const [profileName, evidence] of Object.entries(route.evidence)) {
    if (!activeProfiles.has(profileName)) continue;
    if (evidence.length > 0) {
      log(`[ROUTE] ${profileName} evidence: ${evidence.join(", ")}`);
    }
  }

  const iml = runIndustrialMlFilter(repo);
  if (Object.keys(iml).length > 0) {
    log(`[IML] industrial-ML context active: ${Object.keys(iml).join(", ")}`);
    for (const [cat, data] of Object.entries(iml)) {
      log(`[IML] ${cat}: signals=${data.signals.join(",")} | notes=${data.notes.length}`);
    }
  }

  // ── findings aggregation ────────────────────────────────────────────
  // Deterministic auditors (dataops, iiot) still run per profile because
  // they are not rule-driven. Everything else is fed through a SINGLE
  // orchestrator pass over the union of active-profile rules — that is
  // the root-cause fix for cross-profile duplicate findings.
  const deterministicFindings = collectDeterministicFindings(
    tree,
    fileContents,
    activeProfiles,
  );

  // Union of active-profile rules. generateAllFindings is called exactly
  // once so its internal dedupe operates over the full active set rather
  // than per-profile slices.
  const activeRules: any[] = [...activeProfiles].flatMap((p) => loadRules(p));

  const semanticFindings: Finding[] =
    activeRules.length > 0
      ? await generateAllFindings(
          {},
          tree,
          [],
          [],
          [],
          "main",
          activeRules,
          fileContents,
          { repoRoot },
        )
      : [];

  // ── CLI DEDUPE: defensive, never fatal ──────────────────────────────
  // The orchestrator (single pass) handles rule-based dedupe; this layer
  // converges deterministic + semantic findings and cleans up any residual
  // cross-profile duplicates. It MUST NOT throw — throwing here aborts
  // the process before the JSON payload reaches stdout, breaking
  // `reposcope --json | jq`.
  let findings: Finding[] = dedupeFindings([
    ...deterministicFindings,
    ...semanticFindings,
  ]);

  const globallyDeduped = dedupeFindingsGlobally(findings);
  const removed = findings.length - globallyDeduped.length;

  if (removed > 0) {
    process.stderr.write(
      `[DEDUPE] removed ${removed} duplicate finding(s) across profile runs. ` +
        `Investigate per-profile orchestrator fan-out.\n`,
    );
  }

  findings = globallyDeduped;

  log(`[DEDUPE] removed ${removed} duplicate finding(s)`);

  // Preserve strict-mode semantics: when --profile is passed, the
  // output is narrowed to that domain's findings only, even though
  // general/cross also ran.
  const finalFindings = profile
    ? findings.filter(
        (f) => f.profile === profile || f.ruleId.startsWith(`${profile}-`),
      )
    : findings;

  const score = scoreAndExplain(finalFindings);

  if (json) {
    const payload = {
      info: {
        target: repo,
        scannedFiles: tree.filter((t) => t.type === "blob").length,
      },
      route: {
        raw: rawRoute.profiles,
        active: [...activeProfiles],
        dropped: route.dropped,
        evidence: route.evidence,
      },
      findings: finalFindings,
      score: {
        score: score.score,
        critical: score.critical,
        errors: score.errors,
        warnings: score.warnings,
        infos: score.infos,
      },
    };
    // process.stdout.write bypasses the console.log override above. This
    // is the one call that must reach stdout.
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    process.exit(strict && finalFindings.length > 0 ? 1 : 0);
  }

  if (finalFindings.length === 0) {
    log("[PASS] No violations found.\n");
    process.exit(0);
  }

  for (const f of finalFindings) {
    const detailSuffix =
      f.detail && f.detail !== f.title && f.detail !== f.fix
        ? "\n        Detail: " + f.detail
        : "";
    log(formatFinding(f) + detailSuffix + "\n");

    // Single canonical grounding renderer. Skips when `detail` already
    // carries a "Grounded in:" OR "Grounding:" block (legacy paths),
    // otherwise prints from metadata.grounding or the Python fallback.
    // See renderGrounding().
    const groundingBlock = renderGrounding(f);
    if (groundingBlock) {
      log(groundingBlock + "\n");
    }
  }

  log(`[SUMMARY] ${finalFindings.length} finding(s) | score ${score.score}/100`);
  log(
    `          critical=${score.critical} error=${score.errors} ` +
      `warning=${score.warnings} info=${score.infos}`,
  );

  process.exit(strict && finalFindings.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});