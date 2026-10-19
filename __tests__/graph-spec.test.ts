import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const SPECS_DIR = path.join(process.cwd(), "docs", "specs");

interface SpecFile {
  profile: string;
  rules: Array<{ id: string }>;
}

function loadGraphRuleIds(): Set<string> {
  const file = path.join(SPECS_DIR, "graph.yaml");
  if (!fs.existsSync(file)) return new Set();
  const data = yaml.load(fs.readFileSync(file, "utf-8")) as SpecFile;
  return new Set(data.rules.map((r) => r.id));
}

describe("graph spec ids", () => {
  it("graph.yaml ids follow convention", () => {
    const ids = [...loadGraphRuleIds()];
    for (const id of ids) {
      expect(id).toMatch(/^graph(-[a-z0-9]+)*-\d{3}[a-z]?$/);
    }
  });

  it("no duplicate graph ids", () => {
    const file = path.join(SPECS_DIR, "graph.yaml");
    if (!fs.existsSync(file)) return;
    const data = yaml.load(fs.readFileSync(file, "utf-8")) as SpecFile;
    const seen = new Set<string>();
    for (const rule of data.rules) {
      expect(seen.has(rule.id)).toBe(false);
      seen.add(rule.id);
    }
  });
});