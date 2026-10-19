// __tests__/graph-grounding.test.ts — Day 20 acceptance tests (offline).
import { detectCrossDomain } from "@/lib/knowledge/graph";
import { validateCitations } from "@/lib/knowledge/citation-gate";
import { KNOWN_SOURCES } from "@/lib/knowledge/books";

describe("cross-domain detection (Day 19)", () => {
  it("flags multi-domain findings", () => {
    const r = detectCrossDomain([{ profile: "iiot" }, { profile: "dataops" }]);
    expect(r.crossDomain).toBe(true);
    expect(r.domains.sort()).toEqual(["dataops", "iiot"]);
  });

  it("single-domain findings are not cross-domain", () => {
    const r = detectCrossDomain([{ profile: "webapp" }, { profile: "webapp" }]);
    expect(r.crossDomain).toBe(false);
  });
});

describe("gate end-to-end (Day 20)", () => {
  const opts = { validRuleIds: new Set(["cross-001", "iiot-002"]), knownSources: KNOWN_SOURCES };

  it("a fully grounded answer passes untouched", () => {
    const text =
      "The primary risk is cross-001: shared dependency spaces. " +
      "Practical DataOps recommends environment parity here.";
    const r = validateCitations(text, opts);
    expect(r.grounded).toBe(true);
    expect(r.text).toBe(text);
    expect(r.stripped).toBe(0);
  });

  it("a fabricated 'Book X page 40' reference is stripped", () => {
    const r = validateCitations(
      "Use pattern Y, described in Book X page 40, immediately.",
      opts
    );
    expect(r.text).toContain("[source unverified]");
    expect(r.text).not.toContain("page 40");
  });
});