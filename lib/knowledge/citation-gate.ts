// lib/knowledge/citation-gate.ts
// Day 18 - machine-verifiable sources.
// Strips every LLM claim of "page N", "section X.Y", or "according to <Name>"
// UNLESS the sentence also cites a known book/standard from the registry.
// Validates cited rule IDs against the knowledge graph.
// This is the RepoScope implementation of the "never fabricate references" rule.

import { listKnownSources } from "./books";
import { graphIsAvailable, loadValidRuleIds } from "./graph";

export interface CitationResult {
  text: string;
  grounded: boolean;
  validCitations: string[];
  strippedCitations: string[];
  stripped: number;
}

export interface GateOptions {
  validRuleIds?: Set<string>;        // inject in tests; defaults to graph
  knownSources?: readonly string[];  // inject in tests; defaults to registry
}

// Rule-ID convention: iiot-001, dataops-003a, iiot-modbus-001, cross-001 ...
const RULE_ID_RE =
  /\b(?:iiot|dataops|webapp|cross|general)(?:-[a-z0-9]+)*-\d{3}[a-z]?\b/gi;

const SENTENCE_RE = /[^.!?\n]+[.!?]/g;

// Suspicious-source patterns: `test` for detection, `replace` for stripping.
// Trigger phrases are case-insensitive on the first letter only; the name
// after them stays case-sensitive so common English words like "the" or
// "this" after "per" do not trigger a false positive.
const SUSPICIOUS_PATTERNS: Array<{ test: RegExp; replace: RegExp }> = [
  { test: /\b(?:page|pp?\.)\s*\d+/i,
    replace: /\b(?:page|pp?\.)\s*\d+(?:\s*[-\u2013]\s*\d+)?/gi },
  { test: /\b(?:section|clause|chapter)\s+\d+(?:\.\d+)?/i,
    replace: /\b(?:section|clause|chapter)\s+\d+(?:\.\d+)?/gi },
  { test: /\b(?:[Aa]ccording to|[Aa]s stated by|[Pp]er)\s+[A-Z][a-z]{2,}/,
    replace: /\b(?:[Aa]ccording to|[Aa]s stated by|[Pp]er)\s+[A-Z][a-z]{2,}/g },
];

export function validateCitations(rawText: string, options: GateOptions = {}): CitationResult {
  const validRuleIds =
    options.validRuleIds ?? (graphIsAvailable() ? loadValidRuleIds() : new Set<string>());
  const knownSources = options.knownSources ?? listKnownSources();

  // ---- 1. Rule-ID citations ----
  const citedRuleIds = Array.from(
    new Set((rawText.match(RULE_ID_RE) ?? []).map((m) => m.toLowerCase()))
  );
  const validRules = citedRuleIds.filter((id) => validRuleIds.has(id));
  const invalidRules = citedRuleIds.filter((id) => !validRuleIds.has(id));

  // ---- 2. Known book / standard citations ----
  const lower = rawText.toLowerCase();
  const citedSources = knownSources.filter((s) => lower.includes(s));

  // ---- 3. Sentence-level suspicious references ----
  let stripped = 0;
  const strippedCitations: string[] = [...invalidRules];
  let text = rawText;

  const sentences = rawText.match(SENTENCE_RE) ?? [rawText];
  for (const sentence of sentences) {
    const suspicious = SUSPICIOUS_PATTERNS.some((p) => p.test.test(sentence));
    if (!suspicious) continue;

    const sLower = sentence.toLowerCase();
    const hasKnownSource = knownSources.some((s) => sLower.includes(s));
    if (hasKnownSource) continue; // sourced sentence keeps its page/section refs

    let cleaned = sentence;
    for (const p of SUSPICIOUS_PATTERNS) {
      cleaned = cleaned.replace(p.replace, "[source unverified]");
    }
    if (cleaned !== sentence) {
      text = text.replace(sentence, cleaned); // literal first-occurrence replace
      stripped += 1;
      strippedCitations.push(sentence.trim().slice(0, 80));
    }
  }

  const allValid = [...new Set([...validRules, ...citedSources])];

  return {
    text,
    grounded: allValid.length > 0,
    validCitations: allValid,
    strippedCitations,
    stripped,
  };
}