// __tests__/specs.test.ts — Week 1 acceptance: schema, uniqueness, references
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const SPECS_DIR = path.join(process.cwd(), "docs", "specs");

interface SpecFile {
  version?: string;
  profile: string;
  rules: Array<Record<string, unknown>>;
}

function loadSpecFiles(): SpecFile[] {
  return fs
    .readdirSync(SPECS_DIR)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => yaml.load(fs.readFileSync(path.join(SPECS_DIR, f), "utf-8")) as SpecFile);
}

const REQUIRED = ["id", "profile", "severity", "title", "rationale", "checks", "fix", "references"];
const SEVERITIES = ["critical", "error", "warning", "info"];

describe("spec manifests", () => {
  it("loads at least the three domain profiles + cross", () => {
    const files = loadSpecFiles();
    const profiles = files.map((f) => f.profile).sort();
    expect(profiles).toEqual(["dataops", "iiot", "webapp"]);
  });

  it("every rule has all required fields", () => {
    for (const file of loadSpecFiles()) {
      for (const rule of file.rules) {
        for (const field of REQUIRED) {
          expect(rule).toHaveProperty(field);
        }
      }
    }
  });

  it("rule ids are unique and convention-shaped", () => {
    const seen = new Set<string>();
    for (const file of loadSpecFiles()) {
      for (const rule of file.rules) {
        const id = String(rule.id);
        expect(seen.has(id)).toBe(false);
        expect(id).toMatch(/^(iiot|dataops|webapp|cross|general)(-[a-z0-9]+)*-\d{3}[a-z]?$/);
        seen.add(id);
      }
    }
  });

  it("every reference cites a book or a standard (never bare prose)", () => {
    for (const file of loadSpecFiles()) {
      for (const rule of file.rules) {
        const refs = rule.references as Array<Record<string, string>>;
        expect(Array.isArray(refs)).toBe(true);
        for (const ref of refs) {
          expect(Boolean(ref.book || ref.standard)).toBe(true);
          expect(typeof ref.concept).toBe("string");
        }
      }
    }
  });

  it("severities are from the valid set", () => {
    for (const file of loadSpecFiles()) {
      for (const rule of file.rules) {
        expect(SEVERITIES).toContain(rule.severity);
      }
    }
  });
});