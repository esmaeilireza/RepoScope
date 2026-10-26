/// <reference types="jest" />
import * as fs from "node:fs";
import * as path from "node:path";
import * as graphModule from "@/lib/knowledge/graph";
import type { FindingSeverity } from "@/lib/types";

const ROOT = process.cwd();
const SPECS_JSON = path.join(ROOT, "public", "knowledge", "specs.json");

const VALID_PROFILES = new Set(["iiot", "dataops", "webapp", "cross"]);
const VALID_SEVERITIES = new Set(["critical", "error", "warning", "info"]);

const RULE_ID_RE =
  /^(iiot|dataops|webapp|cross|general)(-[a-z0-9]+)*-\d{3}[a-z]?$/;

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

interface EmittedRule {
  [key: string]: any;
}

interface EmittedProfileBundle {
  version?: string;
  rules: EmittedRule[];
}

type EmittedBundle = Record<string, EmittedProfileBundle>;

let bundle: EmittedBundle | null = null;
let loadError: string | null = null;

beforeAll(() => {
  try {
    if (!fs.existsSync(SPECS_JSON)) {
      loadError = `Missing ${SPECS_JSON}. Run: python scripts/build_knowledge.py`;
      return;
    }

    const raw = fs.readFileSync(SPECS_JSON, "utf8");
    bundle = JSON.parse(raw) as EmittedBundle;
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }
});

describe("audit type contract", () => {
  it("exposes the shared FindingSeverity vocabulary", () => {
    const severity: FindingSeverity = "warning";

    expect(VALID_SEVERITIES.has(severity)).toBe(true);
  });
});

describe("emitted knowledge bundle", () => {
  it("public/knowledge/specs.json exists and parses", () => {
    expect(loadError).toBeNull();
    expect(bundle).not.toBeNull();
  });

  it("contains only builder-supported profiles", () => {
    expect(bundle).not.toBeNull();

    const profiles = Object.keys(bundle ?? {});

    for (const profile of profiles) {
      expect(VALID_PROFILES.has(profile)).toBe(true);
    }

    expect(profiles).not.toContain("graph");
  });

  it("emitted rule ids follow convention and are unique", () => {
    expect(bundle).not.toBeNull();

    const seen = new Set<string>();

    for (const [profile, profileBundle] of Object.entries(bundle ?? {})) {
      expect(Array.isArray(profileBundle.rules)).toBe(true);

      for (const rule of profileBundle.rules) {
        expect(typeof rule.id).toBe("string");
        expect(rule.id).toMatch(RULE_ID_RE);

        expect(seen.has(rule.id)).toBe(false);
        seen.add(rule.id);

        expect(rule.profile).toBe(profile);
      }
    }
  });

  it("emitted rules have required fields", () => {
    expect(bundle).not.toBeNull();

    for (const profileBundle of Object.values(bundle ?? {})) {
      for (const rule of profileBundle.rules) {
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

        expect(VALID_SEVERITIES.has(rule.severity)).toBe(true);
      }
    }
  });
});

describe("cross-domain audit helper", () => {
  it("flags mixed profiles", () => {
    const detectCrossDomain = (graphModule as any).detectCrossDomain;

    if (typeof detectCrossDomain !== "function") {
      throw new Error(
        "detectCrossDomain is not exported from @/lib/knowledge/graph. " +
          "Add: export function detectCrossDomain(...)",
      );
    }

    const r = detectCrossDomain([
      { profile: "iiot" },
      { profile: "dataops" },
    ]);

    expect(r.crossDomain).toBe(true);
    expect([...r.domains].sort()).toEqual(["dataops", "iiot"]);
  });

  it("single-domain findings are not cross-domain", () => {
    const detectCrossDomain = (graphModule as any).detectCrossDomain;

    if (typeof detectCrossDomain !== "function") {
      throw new Error(
        "detectCrossDomain is not exported from @/lib/knowledge/graph. " +
          "Add: export function detectCrossDomain(...)",
      );
    }

    const r = detectCrossDomain([
      { profile: "webapp" },
      { profile: "webapp" },
    ]);

    expect(r.crossDomain).toBe(false);
    expect([...r.domains].sort()).toEqual(["webapp"]);
  });
});