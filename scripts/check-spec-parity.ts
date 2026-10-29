// scripts/check-spec-parity.ts
//
// Standalone CI gate.
// Fails non-zero if any finding ID emitted by the RepoScope CLI is absent
// from public/knowledge/specs.json, or if a draft/spec-only rule fires.
//
// Usage:
//   npm run check:spec-parity -- --repo __tests__/broken-dbt --profile dataops
//   npm run check:spec-parity -- --repo ../_external/jaffle_shop --profile dataops
//
// This file must live outside __tests__, otherwise Jest will collect it as
// a test and execute it without --repo, causing a false failure.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

interface CliArgs {
  readonly repo: string;
  readonly profiles: readonly string[];
}

interface Finding {
  readonly ruleId: string;
  readonly file?: string;
  readonly severity?: string;
  readonly title?: string;
  readonly detail?: string;
}

interface SpecRule {
  readonly id: string;
  readonly status?: string;
}

interface SpecBundle {
  readonly rules?: readonly SpecRule[];
}

type Specs = Readonly<Record<string, SpecBundle>>;

interface KnownIds {
  readonly all: ReadonlySet<string>;
  readonly active: ReadonlySet<string>;
}

const isWindows = process.platform === "win32";

const repoRoot = path.resolve(__dirname, "..");
const specsPath = path.join(repoRoot, "public", "knowledge", "specs.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);

  let repo = "";
  const profiles: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--repo") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("--repo requires a value");
      }
      repo = next;
      i += 1;
      continue;
    }

    if (arg === "--profile") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("--profile requires a value");
      }
      profiles.push(next.toLowerCase());
      i += 1;
      continue;
    }

    if (arg.startsWith("--profile=")) {
      profiles.push(arg.slice("--profile=".length).toLowerCase());
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!repo) {
    throw new Error("--repo is required");
  }

  if (profiles.length === 0) {
    profiles.push("dataops", "webapp", "iiot");
  }

  return {
    repo,
    profiles: Array.from(new Set(profiles)),
  };
}

function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required JSON file: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON file ${filePath}: ${message}`);
  }
}

function loadSpecs(): Specs {
  return readJsonFile<Specs>(specsPath);
}

function collectKnownIds(specs: Specs): KnownIds {
  const all = new Set<string>();
  const active = new Set<string>();

  for (const bundle of Object.values(specs)) {
    const rules = bundle.rules ?? [];

    for (const rule of rules) {
      if (!rule.id) continue;

      all.add(rule.id);

      const status = rule.status ?? "active";
      if (status === "active" || status === "implemented") {
        active.add(rule.id);
      }
    }
  }

  return { all, active };
}

function parseCliFindings(stdout: string): Finding[] {
  const trimmed = stdout.trim();

  if (!trimmed) {
    throw new Error("RepoScope CLI produced no JSON stdout.");
  }

  let payload: unknown;

  try {
    // Direct parse. The CLI is strictly required to pipe logs to stderr
    // and only emit the JSON payload to stdout when --json is passed.
    payload = JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `RepoScope CLI stdout was not valid JSON: ${message}\n` +
        `stdout preview:\n${trimmed.slice(0, 1000)}`,
    );
  }

  if (Array.isArray(payload)) {
    return payload as Finding[];
  }

  if (isRecord(payload)) {
    const findings = payload.findings;

    if (Array.isArray(findings)) {
      return findings as Finding[];
    }
  }

  throw new Error(
    "RepoScope CLI JSON did not contain a findings array.\n" +
      `payload preview:\n${JSON.stringify(payload).slice(0, 1000)}`,
  );
}

function runCliJson(repoPath: string, profiles: readonly string[]): Finding[] {
  // Repeated flags, not `--profile a,b,c`. RepoScope's parser (and virtually
  // every Node CLI argument parser) treats `--profile a,b` as a single
  // comma-containing value.
  const profileArgs = profiles.flatMap((profile) => ["--profile", profile]);

  const result = spawnSync(
    "pnpm",
    [
      "run",
      "reposcope",
      "--",
      "--repo",
      repoPath,
      ...profileArgs,
      "--json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      // `.cmd` shims (pnpm.cmd on Windows) require shell execution. Without
      // this, spawnSync throws ENOENT even when the binary exists on PATH.
      shell: isWindows,
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  if (result.error) {
    throw new Error(`Failed to execute RepoScope CLI: ${result.error.message}`);
  }

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  const findings = parseCliFindings(stdout);

  if (result.status !== 0 && findings.length === 0) {
    throw new Error(
      `RepoScope CLI exited with code ${result.status} and produced no findings.\n` +
        `stderr preview:\n${stderr.slice(0, 1000)}`,
    );
  }

  return findings;
}

function formatFinding(finding: Finding): string {
  const file = finding.file ? ` file=${finding.file}` : "";
  const severity = finding.severity ? ` severity=${finding.severity}` : "";
  return `${finding.ruleId}${severity}${file}`;
}

function main(): void {
  const args = parseArgs();
  const specs = loadSpecs();
  const known = collectKnownIds(specs);

  const allFindings = runCliJson(args.repo, args.profiles);

  const unknown = allFindings.filter(
    (finding) => !known.all.has(finding.ruleId),
  );

  const nonActive = allFindings.filter(
    (finding) =>
      known.all.has(finding.ruleId) && !known.active.has(finding.ruleId),
  );

  let failed = false;

  if (unknown.length > 0) {
    failed = true;
    console.error("UNKNOWN RULE IDS:");
    for (const finding of unknown) {
      console.error(`  - ${formatFinding(finding)}`);
    }
    console.error(
      "Fix: add missing rules to docs/specs/*.yaml, rebuild specs.json, " +
        "or disable legacy hardcoded emitters in lib/dataops-audit.ts.",
    );
  }

  if (nonActive.length > 0) {
    failed = true;
    console.error("DRAFT/SPEC-ONLY RULE IDS FIRED:");
    for (const finding of nonActive) {
      console.error(`  - ${formatFinding(finding)}`);
    }
    console.error(
      "Fix: filter non-active rules before emitting findings, or promote " +
        "the rule in docs/specs/*.yaml and rebuild/reseed.",
    );
  }

  if (failed) {
    process.exit(1);
  }

  console.log(
    `OK: ${allFindings.length} finding(s) all mapped to active specs.json rules.`,
  );
}

// Wrap main() so a thrown parse / spawn / IO error produces a clean one-line
// message in CI logs instead of an unhandled-rejection stack trace. Exit code
// stays 1 either way; only the readability of the failure changes.
try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`check-spec-parity failed: ${message}`);
  process.exit(1);
}