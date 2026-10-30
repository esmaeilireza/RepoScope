// __tests__/contract/spec-parity.test.ts
//
// Contract test:
// Every finding emitted by the RepoScope CLI must reference a rule ID that
// exists in public/knowledge/specs.json, and active findings must not come
// from draft/spec-only rules.
//
// Fixed-dbt is a NEGATIVE CONTROL: it must not emit specific false-positive
// rule IDs (currently dataops-dim-ast-001), but it is NOT required to produce
// zero findings. Missing-docs, missing-tests, and storage-hygiene rules may
// legitimately fire on it. The parity loop still applies to whatever it emits.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

interface Fixture {
  readonly name: string;
  readonly repoPath: string;
  readonly profile: string;
}

const repoRoot = path.resolve(__dirname, "..", "..");
const specsPath = path.join(repoRoot, "public", "knowledge", "specs.json");

const fixtures: readonly Fixture[] = [
  {
    name: "broken-dbt",
    repoPath: "__tests__/broken-dbt",
    profile: "dataops",
  },
  {
    name: "fixed-dbt",
    repoPath: "__tests__/fixed-dbt",
    profile: "dataops",
  },
];

// Positive contracts: these fixtures MUST emit at least one finding.
// Entries listed here that are not present in `fixtures` above are skipped;
// register the fixture before adding it to this set.
const MUST_EMIT_FINDINGS: ReadonlySet<string> = new Set<string>([
  "broken-dbt",
  "broken-webapp",
  "broken-iiot",
]);

// Negative controls: per-rule prohibitions. These fixtures MAY still emit
// other findings — this is not a "zero findings" gate.
const MUST_NOT_EMIT: ReadonlyMap<string, readonly string[]> = new Map<
  string,
  readonly string[]
>([
  ["fixed-dbt", ["dataops-dim-ast-001"]],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

      // Treat missing status as active for backward compatibility.
      // Draft and spec-only rules must never emit findings.
      const status = rule.status ?? "active";
      if (status === "active" || status === "implemented") {
        active.add(rule.id);
      }
    }
  }

  return { all, active };
}

function parseCliFindings(stdout: string, stderr: string): Finding[] {
  const trimmed = stdout.trim();

  if (!trimmed) {
    throw new Error(
      "RepoScope CLI produced no JSON stdout.\n" +
        `stderr preview:\n${stderr.slice(0, 1000)}`,
    );
  }

  let payload: unknown;

  try {
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

function runCliJson(repoPath: string, profile: string): Finding[] {
  const args = [
    "--no-install",
    "tsx",
    "scripts/reposcope-audit.ts",
    "--repo",
    repoPath,
    "--profile",
    profile,
    "--json",
  ];

  const result = spawnSync("npx", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Failed to execute RepoScope CLI: ${result.error.message}`);
  }

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  const findings = parseCliFindings(stdout, stderr);

  // If the CLI exited non-zero but still produced valid JSON, allow it only
  // when findings were produced. A zero-finding non-zero exit is suspicious.
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

function getFixture(name: string): Fixture {
  const fixture = fixtures.find((f) => f.name === name);
  if (!fixture) {
    throw new Error(
      `Contract references fixture "${name}" but it is not registered in the fixtures array.`,
    );
  }
  return fixture;
}

describe("spec parity contract", () => {
  const specs = loadSpecs();
  const known = collectKnownIds(specs);

  it("specs.json contains at least one known rule", () => {
    expect(known.all.size).toBeGreaterThan(0);
  });

  it("specs.json contains at least one active rule", () => {
    expect(known.active.size).toBeGreaterThan(0);
  });

  // Positive contracts: broken-dbt (and any future registered fixture in the
  // MUST_EMIT set) must produce at least one finding.
  for (const fixtureName of MUST_EMIT_FINDINGS) {
    // Skip contract entries for fixtures that have not been registered yet.
    if (!fixtures.some((f) => f.name === fixtureName)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[spec-parity] MUST_EMIT_FINDINGS lists "${fixtureName}", but no fixture is registered. ` +
          "Register the fixture to activate this contract.",
      );
      continue;
    }

    it(`${fixtureName} MUST emit at least one finding`, () => {
      const fixture = getFixture(fixtureName);
      const findings = runCliJson(fixture.repoPath, fixture.profile);
      expect(findings.length).toBeGreaterThan(0);
    });
  }

  // Negative controls: per-rule prohibitions, NOT a zero-findings gate.
  for (const [fixtureName, forbiddenIds] of MUST_NOT_EMIT) {
    it(`${fixtureName} MUST NOT emit forbidden rule IDs`, () => {
      const fixture = getFixture(fixtureName);
      const findings = runCliJson(fixture.repoPath, fixture.profile);

      for (const forbiddenId of forbiddenIds) {
        const violations = findings.filter((f) => f.ruleId === forbiddenId);

        if (violations.length > 0) {
          const detail = violations
            .map((finding) => `  - ${formatFinding(finding)}`)
            .join("\n");

          throw new Error(
            `Fixture "${fixtureName}" emitted forbidden rule "${forbiddenId}":\n${detail}\n` +
              "Fix: this is a false positive in the AST/semantic layer. " +
              "Clean fixtures must not trigger this rule.",
          );
        }
      }

      // Deliberately no assertion that findings.length === 0.
      // fixed-dbt is a negative control for the AST rule only. Other rules
      // (missing docs, missing tests, storage hygiene, etc.) may legitimately
      // fire on this fixture without representing a regression.
    });
  }

  // Parity / grounding: applied to every registered fixture. Even when
  // fixed-dbt emits "acceptable" findings, they must still be grounded in
  // specs.json and be active.
  for (const fixture of fixtures) {
    it(`${fixture.name} emits only known active rule IDs`, () => {
      const findings = runCliJson(fixture.repoPath, fixture.profile);

      const unknown = findings.filter(
        (finding) => !known.all.has(finding.ruleId),
      );

      if (unknown.length > 0) {
        const detail = unknown
          .map((finding) => `  - ${formatFinding(finding)}`)
          .join("\n");

        throw new Error(
          `Orchestrator/CLI emitted findings with rule IDs absent from specs.json:\n${detail}\n` +
            "Fix: add the missing rules to docs/specs/*.yaml, rebuild specs.json, " +
            "or disable the legacy hardcoded emitters.",
        );
      }

      const nonActive = findings.filter(
        (finding) =>
          known.all.has(finding.ruleId) && !known.active.has(finding.ruleId),
      );

      if (nonActive.length > 0) {
        const detail = nonActive
          .map((finding) => `  - ${formatFinding(finding)}`)
          .join("\n");

        throw new Error(
          `CLI emitted findings for draft/spec-only rules:\n${detail}\n` +
            "Fix: filter status === 'active' before emitting, or promote the rule " +
            "in docs/specs/*.yaml and rebuild/reseed.",
        );
      }
    });
  }
});