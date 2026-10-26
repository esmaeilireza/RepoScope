/// <reference types="jest" />
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";

const ROOT = process.cwd();
const SPECS_DIR = path.join(ROOT, "docs", "specs");
const GRAPH_SPEC_PATH = path.join(SPECS_DIR, "graph.yaml");

const GRAPH_ID_RE = /^graph(-[a-z0-9]+)*-\d{3}[a-z]?$/;

interface SpecRule {
  id?: unknown;
}

interface SpecFile {
  profile?: unknown;
  rules?: unknown;
}

function loadSpec(filePath: string): SpecFile | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = yaml.load(raw) as SpecFile | null;

  return parsed ?? null;
}

function getRules(spec: SpecFile | null): SpecRule[] {
  if (!spec || !Array.isArray(spec.rules)) {
    return [];
  }

  return spec.rules.filter(
    (rule): rule is SpecRule => typeof rule === "object" && rule !== null,
  );
}

describe("graph spec ids", () => {
  it("graph.yaml ids follow convention when the gated spec file exists", () => {
    const rules = getRules(loadSpec(GRAPH_SPEC_PATH));

    for (const rule of rules) {
      expect(typeof rule.id).toBe("string");
      expect(rule.id as string).toMatch(GRAPH_ID_RE);
    }
  });

  it("has no duplicate graph ids", () => {
    const rules = getRules(loadSpec(GRAPH_SPEC_PATH));
    const seen = new Set<string>();

    for (const rule of rules) {
      const id = rule.id as string;

      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });
});