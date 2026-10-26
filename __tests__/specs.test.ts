/// <reference types="jest" />
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";

const ROOT = process.cwd();
const SPECS_DIR = path.join(ROOT, "docs", "specs");

const VALID_PROFILES = new Set(["iiot", "dataops", "webapp", "cross"]);
const VALID_SEVERITIES = new Set(["critical", "error", "warning", "info"]);
const VALID_CHECK_TYPES = new Set(["pattern_match", "file_exists", "file_absent", "semantic_eval", "structural_ast"]);

const REQUIRED_FIELDS = [
  "id",
  "profile",
  "severity",
  "title",
  "rationale",
  "checks",
  "fix",
  "references",
] as const;

const RULE_ID_RE =
  /^(iiot|dataops|webapp|cross|general)(-[a-z0-9]+)*-\d{3}[a-z]?$/;

interface RawSpecFile {
  profile?: unknown;
  rules?: unknown;
  version?: unknown;
}

type LoadedRule = Record<string, any> & {
  __file: string;
};

interface LoadedSpec {
  file: string;
  profile: string;
  rules: LoadedRule[];
}

function hasGlobKey(check: any): boolean {
  return [
    "path_glob",
    "file_glob",
    "paths",
    "target",
    "glob",
    "files",
  ].some((key) => check?.[key] !== undefined);
}

function loadActiveSpecs(): { specs: LoadedSpec[]; parseErrors: string[] } {
  const specs: LoadedSpec[] = [];
  const parseErrors: string[] = [];

  if (!fs.existsSync(SPECS_DIR)) {
    parseErrors.push(`docs/specs directory not found: ${SPECS_DIR}`);
    return { specs, parseErrors };
  }

  const entries = fs.readdirSync(SPECS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith(".yaml")) {
      continue;
    }

    // Mirror scripts/build_knowledge.py: skip underscore-prefixed files.
    if (entry.name.startsWith("_")) {
      continue;
    }

    const filePath = path.join(SPECS_DIR, entry.name);

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = yaml.load(raw) as RawSpecFile | null;

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        continue;
      }

      const profile =
        typeof parsed.profile === "string" ? parsed.profile.trim() : "";

      // Mirror the builder: invalid profiles are skipped, not emitted.
      if (!VALID_PROFILES.has(profile)) {
        continue;
      }

      const rawRules = Array.isArray(parsed.rules) ? parsed.rules : [];

      const rules: LoadedRule[] = rawRules
        .filter((rule): rule is Record<string, any> => {
          return typeof rule === "object" && rule !== null;
        })
        .map((rule) => ({
          ...rule,
          __file: entry.name,
        }));

      specs.push({
        file: entry.name,
        profile,
        rules,
      });
    } catch (error) {
      parseErrors.push(
        `${entry.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { specs, parseErrors };
}

let specs: LoadedSpec[] = [];
let parseErrors: string[] = [];

beforeAll(() => {
  const loaded = loadActiveSpecs();
  specs = loaded.specs;
  parseErrors = loaded.parseErrors;
});

describe("spec manifests", () => {
  it("active spec YAML files parse cleanly", () => {
    expect(parseErrors).toEqual([]);
  });

  it("loads at least the three domain profiles + cross", () => {
    const profiles = Array.from(new Set(specs.map((spec) => spec.profile))).sort();

    expect(profiles).toEqual(["cross", "dataops", "iiot", "webapp"]);
  });

  it("does not activate the graph profile until the builder gate opens", () => {
    const profiles = Array.from(new Set(specs.map((spec) => spec.profile)));

    expect(profiles).not.toContain("graph");
  });

  it("every rule has all required fields", () => {
    for (const spec of specs) {
      for (const rule of spec.rules) {
        for (const field of REQUIRED_FIELDS) {
          expect(rule).toHaveProperty(field);

          const value = rule[field];

          expect(value).not.toBeNull();
          expect(value).not.toBeUndefined();

          if (typeof value === "string") {
            expect(value.trim().length).toBeGreaterThan(0);
          }

          if (Array.isArray(value)) {
            expect(value.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("rule ids are unique, convention-shaped, and profile-aligned", () => {
    const seen = new Set<string>();

    for (const spec of specs) {
      for (const rule of spec.rules) {
        const id = rule.id;
        const profile = rule.profile;

        expect(typeof id).toBe("string");
        expect(id).toMatch(RULE_ID_RE);

        expect(seen.has(id as string)).toBe(false);
        seen.add(id as string);

        expect(profile).toBe(spec.profile);
      }
    }
  });

  it("severities are from the valid set", () => {
    for (const spec of specs) {
      for (const rule of spec.rules) {
        expect(VALID_SEVERITIES.has(rule.severity)).toBe(true);
      }
    }
  });

  it("checks use the canonical list shape and valid check types", () => {
    for (const spec of specs) {
      for (const rule of spec.rules) {
        const checks = rule.checks;

        expect(Array.isArray(checks)).toBe(true);
        expect(checks.length).toBeGreaterThan(0);

        for (const check of checks) {
          expect(typeof check).toBe("object");
          expect(check).not.toBeNull();

          expect(VALID_CHECK_TYPES.has(check.type)).toBe(true);

          expect(typeof check.message).toBe("string");
          expect(check.message.trim().length).toBeGreaterThan(0);

          if (check.type === "pattern_match") {
            expect(typeof check.pattern).toBe("string");
            expect(check.pattern.length).toBeGreaterThan(0);
            expect(hasGlobKey(check)).toBe(true);
          } else {
            expect(hasGlobKey(check)).toBe(true);
          }
        }
      }
    }
  });

  it("every reference cites a book or a standard and includes a concept", () => {
    for (const spec of specs) {
      for (const rule of spec.rules) {
        const references = rule.references;

        expect(Array.isArray(references)).toBe(true);
        expect(references.length).toBeGreaterThan(0);

        for (const ref of references) {
          expect(typeof ref).toBe("object");
          expect(ref).not.toBeNull();

          expect(Boolean(ref.book || ref.standard)).toBe(true);
          expect(typeof ref.concept).toBe("string");
        }
      }
    }
  });
});