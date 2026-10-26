/// <reference types="jest" />
import * as graphModule from "@/lib/knowledge/graph";
import * as citationGateModule from "@/lib/knowledge/citation-gate";

interface Finding {
  profile: string;
}

interface CrossDomainResult {
  crossDomain: boolean;
  domains: string[];
}

interface GateResult {
  grounded: boolean;
  text: string;
  stripped: number;
  validCitations: string[];
  strippedCitations: string[];
}

const detectCrossDomain = (graphModule as any).detectCrossDomain;

const gateFn =
  (citationGateModule as any).applyCitationGate ??
  (citationGateModule as any).enforceCitationGate ??
  (citationGateModule as any).runCitationGate ??
  (citationGateModule as any).checkCitations ??
  (citationGateModule as any).validateCitations ??
  (citationGateModule as any).default;

function callDetectCrossDomain(findings: Finding[]): CrossDomainResult {
  if (typeof detectCrossDomain !== "function") {
    throw new Error(
      "detectCrossDomain is not exported from @/lib/knowledge/graph. " +
        "Add: export function detectCrossDomain(...)",
    );
  }

  return detectCrossDomain(findings) as CrossDomainResult;
}

function normalizeGateResult(raw: any): GateResult | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const text =
    typeof raw.text === "string"
      ? raw.text
      : typeof raw.sanitized === "string"
        ? raw.sanitized
        : typeof raw.output === "string"
          ? raw.output
          : null;

  if (typeof text !== "string") {
    return null;
  }

  const grounded =
    typeof raw.grounded === "boolean" ? raw.grounded : Boolean(raw.grounded);

  const validCitations = Array.isArray(raw.validCitations)
    ? raw.validCitations
    : Array.isArray(raw.citations)
      ? raw.citations
      : [];

  const strippedCitations = Array.isArray(raw.strippedCitations)
    ? raw.strippedCitations
    : Array.isArray(raw.invalidCitations)
      ? raw.invalidCitations
      : [];

  const stripped =
    typeof raw.stripped === "number"
      ? raw.stripped
      : strippedCitations.length;

  return {
    grounded,
    text,
    stripped,
    validCitations,
    strippedCitations,
  };
}

function callCitationGate(
  text: string,
  allowedRuleIds: string[],
  allowedBooks: string[] = [],
): GateResult {
  if (typeof gateFn !== "function") {
    throw new Error(
      "No citation gate function was found in @/lib/knowledge/citation-gate. " +
        "Expected one of: applyCitationGate, enforceCitationGate, runCitationGate, checkCitations, validateCitations.",
    );
  }

  const options = {
    allowedRuleIds,
    allowedBooks,
    allowedSources: allowedBooks,
    sources: allowedBooks,
  };

  const attempts: Array<() => unknown> = [
    () => (gateFn as any)({ text, ...options }),
    () => (gateFn as any)(text, options),
    () => (gateFn as any)(text, allowedRuleIds, allowedBooks),
  ];

  for (const attempt of attempts) {
    try {
      const normalized = normalizeGateResult(attempt());

      if (normalized) {
        return normalized;
      }
    } catch {
      // Try the next plausible call shape.
    }
  }

  throw new Error(
    "Citation gate was callable, but none of the expected call shapes returned a valid GateResult.",
  );
}

describe("cross-domain detection (Day 19)", () => {
  it("exports detectCrossDomain", () => {
    expect(typeof detectCrossDomain).toBe("function");
  });

  it("flags multi-domain findings", () => {
    const r = callDetectCrossDomain([
      { profile: "iiot" },
      { profile: "dataops" },
    ]);

    expect(r.crossDomain).toBe(true);
    expect([...r.domains].sort()).toEqual(["dataops", "iiot"]);
  });

  it("single-domain findings are not cross-domain", () => {
    const r = callDetectCrossDomain([
      { profile: "webapp" },
      { profile: "webapp" },
    ]);

    expect(r.crossDomain).toBe(false);
    expect([...r.domains].sort()).toEqual(["webapp"]);
  });
});

describe("gate end-to-end (Day 20)", () => {
  it("a fully grounded answer passes untouched", () => {
    const text = "Rule iiot-001 is required.";
    const r = callCitationGate(text, ["iiot-001"], []);

    expect(r.grounded).toBe(true);
    expect(r.text).toBe(text);
    expect(r.stripped).toBe(0);
  });

  it("a fabricated 'Book X page 40' reference is stripped", () => {
    const text = "According to Book X page 40, this is unsafe.";
    const r = callCitationGate(text, [], []);

    expect(r.text).toContain("[source unverified]");
    expect(r.text).not.toContain("page 40");
  });
});