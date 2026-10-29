import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

interface RuleEntry {
  readonly id: string;
  readonly status?: string;
}

interface BundleEntry {
  readonly rules?: readonly RuleEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRuleEntry(value: unknown): value is RuleEntry {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value["id"] !== "string") {
    return false;
  }

  const status = value["status"];

  return status === undefined || typeof status === "string";
}

function isBundleEntry(value: unknown): value is BundleEntry {
  if (!isRecord(value)) {
    return false;
  }

  const rules = value["rules"];

  if (rules === undefined) {
    return true;
  }

  return Array.isArray(rules) && rules.every(isRuleEntry);
}

function loadSpecsJson(): Record<string, BundleEntry> {
  const specsPath = path.resolve(__dirname, "../../public/knowledge/specs.json");
  const raw = fs.readFileSync(specsPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!isRecord(parsed)) {
    throw new Error(`specs.json at ${specsPath} is not an object.`);
  }

  const out: Record<string, BundleEntry> = {};

  for (const [profile, bundle] of Object.entries(parsed)) {
    if (!isBundleEntry(bundle)) {
      throw new Error(`specs.json bundle "${profile}" is malformed.`);
    }

    out[profile] = bundle;
  }

  return out;
}

function collectYamlRuleIds(file: string): string[] {
  const parsed: unknown = yaml.load(fs.readFileSync(file, "utf-8"));

  if (!isBundleEntry(parsed)) {
    throw new Error(`${file} does not match the expected spec YAML shape.`);
  }

  return (parsed.rules ?? []).map((rule) => rule.id);
}


describe("YAML to specs.json parity", () => {
  const specs = loadSpecsJson();

  const jsonIds = new Set<string>(
    Object.values(specs).flatMap((bundle) =>
      (bundle.rules ?? []).map((rule) => rule.id),
    ),
  );

  const specDir = path.resolve(__dirname, "../../docs/specs");

  const yamlFiles = fs
    .readdirSync(specDir)
    .filter((file) => file.endsWith(".yaml") && !file.startsWith("_"))
    .map((file) => path.join(specDir, file));

  const allYamlIds = yamlFiles.flatMap(collectYamlRuleIds);
  const yamlRuleIds = new Set<string>(yamlFiles.flatMap(collectYamlRuleIds));

  it("has no duplicate rule IDs across docs/specs/*.yaml", () => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const id of allYamlIds) {
      if (seen.has(id)) {
        duplicates.add(id);
      } else {
        seen.add(id);
      }
    }

    expect([...duplicates].sort()).toEqual([]);
  });

  it("all docs/specs/*.yaml rule IDs match public/knowledge/specs.json rule IDs", () => {
    const missingFromJson = [...yamlRuleIds]
      .filter((id) => !jsonIds.has(id))
      .sort();

    const missingFromYaml = [...jsonIds]
      .filter((id) => !yamlRuleIds.has(id))
      .sort();

    expect({ missingFromJson, missingFromYaml }).toEqual({
      missingFromJson: [],
      missingFromYaml: [],
    });
  });
});