// __tests__/llm-layer.test.ts — fully offline; runs inside existing CI gates.
import { buildRequest, parseResponse } from "@/lib/llm/adapters";
import { PROVIDERS, getProvider } from "@/lib/llm/providers";
import { buildInsightPrompt, buildGroundedPrompt } from "@/lib/insight";
import { validateCitations } from "@/lib/knowledge/citation-gate";
import { KNOWN_SOURCES } from "@/lib/knowledge/books";

const req = { system: "s", prompt: "p", model: "m" };

describe("adapters (Day 6)", () => {
  it("builds OpenAI-compatible wire format", () => {
    const r = buildRequest(PROVIDERS.groq, req, "key1");
    expect(r.url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(r.headers.Authorization).toBe("Bearer key1");
    expect(r.body.messages).toEqual([
      { role: "system", content: "s" },
      { role: "user", content: "p" },
    ]);
  });

  it("builds Anthropic wire format with version header", () => {
    const r = buildRequest(PROVIDERS.anthropic, req, "key2");
    expect(r.headers["x-api-key"]).toBe("key2");
    expect(r.headers["anthropic-version"]).toBe("2023-06-01");
    expect(r.body.system).toBe("s");
  });

  it("builds Google wire format with model in URL", () => {
    const r = buildRequest(PROVIDERS.google, req, "key3");
    expect(r.url).toContain("/models/m:generateContent");
    expect(r.headers["x-goog-api-key"]).toBe("key3");
  });

  it("omits Authorization for keyless providers (Ollama)", () => {
    const r = buildRequest(PROVIDERS.ollama, req, "");
    expect(r.headers.Authorization).toBeUndefined();
  });

  it("parses all three response shapes", () => {
    expect(parseResponse(PROVIDERS.groq, { choices: [{ message: { content: " hi " } }] }).content).toBe("hi");
    expect(parseResponse(PROVIDERS.anthropic, { content: [{ text: "yo" }] }).content).toBe("yo");
    expect(parseResponse(PROVIDERS.google, { candidates: [{ content: { parts: [{ text: "hey" }] } }] }).content).toBe("hey");
  });
});

describe("registry (Day 6)", () => {
  it("resolves unknown providers to null", () => {
    expect(getProvider("nope")).toBeNull();
  });
});

describe("insight prompts (Days 7/17)", () => {
  it("basic prompt caps findings and labels severity", () => {
    const findings = Array.from({ length: 40 }, (_, i) => ({
      id: `dataops-${String(i).padStart(3, "0")}`,
      severity: "error",
      title: `t${i}`,
    }));
    const { prompt } = buildInsightPrompt(findings, "dataops");
    expect(prompt).toContain("40 total");
    expect(prompt).toContain("[ERROR] dataops-000");
  });

  it("grounded prompt degrades gracefully when no rules match", () => {
    const { groundedRuleIds, sources } = buildGroundedPrompt(
      [{ id: "iiot-999", severity: "critical", title: "x" }],
      "iiot"
    );
    // graph.json may not exist yet — must not throw, must return empty grounding
    expect(Array.isArray(groundedRuleIds)).toBe(true);
    expect(sources).toHaveProperty("concepts");
  });
});

describe("citation gate (Day 18)", () => {
  const opts = {
    validRuleIds: new Set(["iiot-001", "dataops-001"]),
    knownSources: KNOWN_SOURCES,
  };

  it("accepts rule IDs present in the graph", () => {
    const r = validateCitations("This violates rule iiot-001 badly.", opts);
    expect(r.grounded).toBe(true);
    expect(r.validCitations).toContain("iiot-001");
    expect(r.stripped).toBe(0);
  });

  it("flags rule IDs not present in the graph", () => {
    const r = validateCitations("See iiot-999 for details.", opts);
    expect(r.validCitations).not.toContain("iiot-999");
    expect(r.strippedCitations).toContain("iiot-999");
  });

  it("strips page refs in unsourced sentences", () => {
    const r = validateCitations("This is wrong, see page 40 for the proof.", opts);
    expect(r.text).toContain("[source unverified]");
    expect(r.stripped).toBe(1);
  });

  it("keeps page refs when the sentence cites a known book", () => {
    const r = validateCitations(
      "Industrial Network Security, page 40, requires network segmentation.",
      opts
    );
    expect(r.text).toContain("page 40");
    expect(r.stripped).toBe(0);
    expect(r.validCitations).toContain("industrial network security");
  });

  it("strips fabricated author citations", () => {
    const r = validateCitations("According to Smithfield this pattern is safe.", opts);
    expect(r.text).toContain("[source unverified]");
  });
});