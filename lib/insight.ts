// lib/insight.ts — prompt builders. Provider-agnostic.
// IMPORTANT: input is normalized via toInsightFinding() so callers can pass
// either a strict Finding (with `detail`) or a loose InsightFinding (with
// `message`) without silent data loss.
import { expandOneHop, getRule, hasRule } from "./knowledge/graph";
import type { Finding, InsightFinding } from "./types";
import { toInsightFinding } from "./types";

// Re-export the canonical type so existing imports keep working:
//   import type { InsightFinding } from "@/lib/insight";
export type { InsightFinding } from "./types";

const MAX_CONTEXT_CHARS = 6000; // token cap — keep under Vercel Hobby latency

/** Day 21 — freshness anchor. */
export function utcDateAnchor(): string {
  return new Date().toISOString().split("T")[0];
}

function summarizeFindings(findings: InsightFinding[], max = 15): string {
  return findings
    .slice(0, max)
    .map((f) => {
      const sev = (f.severity ?? "info").toUpperCase();
      const file = f.file ? ` (file: ${f.file})` : "";
      const detail = f.detail ?? f.message ?? "";
      const id = f.id ?? f.ruleId ?? "finding";
      return `[${sev}] ${id}: ${f.title ?? "untitled"} — ${detail}${file}`;
    })
    .join("\n");
}

/** Day 7 — basic (non-grounded) prompt; the fallback when no graph exists. */
export function buildInsightPrompt(
  rawFindings: ReadonlyArray<Finding | InsightFinding>,
  profile: string
): { system: string; prompt: string } {
  const findings = rawFindings.map(toInsightFinding);

  const system =
    `You are a senior ${profile} engineer reviewing a repository audit produced by RepoScope. ` +
    `Today's date is ${utcDateAnchor()} UTC. ` +
    "Be direct and technical. Plain prose, no markdown, no bullets.";

  const prompt =
    `AUDIT FINDINGS (${findings.length} total, top items shown):\n` +
    `${summarizeFindings(findings) || "No findings — the repository passed all checks."}\n\n` +
    "In 3-4 concise sentences:\n" +
    "1. What is the most critical risk pattern across these findings?\n" +
    "2. What single action should the developer take first?";

  return { system, prompt };
}

export interface GroundedSources {
  rules: string[];
  concepts: string[];
  books: string[];
}

/**
 * Day 17 — grounded prompt.
 *
 * Input is normalized via toInsightFinding() so both `Finding.detail` and
 * `InsightFinding.message` end up in `f.message` / `f.detail`, and both
 * `Finding.ruleId` and `InsightFinding.id` end up in `f.id` / `f.ruleId`.
 */
export function buildGroundedPrompt(
  rawFindings: ReadonlyArray<Finding | InsightFinding>,
  profileHint?: string
): {
  system: string;
  prompt: string;
  groundedRuleIds: string[];
  sources: GroundedSources;
  crossDomain: boolean;
} {
  const findings = rawFindings.map(toInsightFinding);

  const ruleIds = Array.from(
    new Set(
      findings
        .map((f) => f.id ?? f.ruleId)
        .filter((id): id is string => Boolean(id))
    )
  ).map((id) => id.toLowerCase());

  const groundedRuleIds = ruleIds.filter((id) => hasRule(id));
  const profiles = new Set(
    findings
      .map((f) => f.profile)
      .filter((p): p is string => typeof p === "string" && p.length > 0)
  );
  const crossDomain = profiles.size > 1;

  const blocks: string[] = [];
  const conceptsSeen = new Set<string>();
  const booksSeen = new Set<string>();
  let used = 0;

  for (const id of groundedRuleIds) {
    const rule = getRule(id);
    if (!rule) continue;
    const hop = expandOneHop(id);

    let block =
      `RULE ${id} (${rule.severity ?? "info"}) — ${rule.label}\n` +
      `Rationale: ${rule.rationale ?? ""}\n` +
      `Recommended fix: ${rule.fix ?? ""}`;

    const conceptLines = hop.concepts.slice(0, 4).map((c) => {
      conceptsSeen.add(c.label);
      if (c.book) booksSeen.add(c.book);
      return `  - ${c.label}: ${c.definition}${c.book ? ` [${c.book}]` : ""}`;
    });
    if (conceptLines.length) {
      block += "\nSupporting concepts:\n" + conceptLines.join("\n");
    }

    for (const b of hop.books) booksSeen.add(b);

    if (used + block.length > MAX_CONTEXT_CHARS && blocks.length > 0) {
      blocks.push("[CONTEXT TRUNCATED — remaining rules omitted]");
      break;
    }
    used += block.length;
    blocks.push(block);
  }

  const context = blocks.join("\n\n") || "No matching rules in the knowledge graph.";

  const system =
    `You are a senior ${profileHint ?? "software"} engineer reviewing a RepoScope repository audit. ` +
    `Today's date is ${utcDateAnchor()} UTC. ` +
    (crossDomain
      ? `This repository spans MULTIPLE domains (${Array.from(profiles).join(" + ")}) — apply cross-domain risk reasoning. `
      : "") +
    "Cite ONLY rule IDs and book/standard titles that appear in the CONTEXT below. " +
    'If you are not certain of a source, write "verify the source" instead of citing. ' +
    "Speak cautiously about fast-moving tools; never claim one library is definitively better than another. " +
    "Plain prose, no markdown, max 4 sentences.";

  const prompt =
    `CONTEXT:\n${context}\n\n` +
    `AUDIT FINDINGS (${findings.length} total, top items shown):\n` +
    `${summarizeFindings(findings)}\n\n` +
    "In 3-4 concise sentences:\n" +
    "1. What is the most critical risk pattern across these findings?\n" +
    "2. What single action should the developer take first?\n" +
    "Ground every claim in the CONTEXT above.";

  return {
    system,
    prompt,
    groundedRuleIds,
    sources: {
      rules: groundedRuleIds,
      concepts: [...conceptsSeen],
      books: [...booksSeen],
    },
    crossDomain,
  };
}

/** Day 22 — CI/CD diagnosis prompt (mode: "diagnose"). */
export interface DiagnosisInput {
  patterns: string[];
  logExcerpt: string;
  domain: "data" | "ot" | "web" | "general";
  provider?: string;
}

export function buildDiagnosisPrompt(input: DiagnosisInput): {
  system: string;
  prompt: string;
} {
  const system =
    "You are a senior CI/CD diagnostics engineer for RepoScope. " +
    `Today's date is ${utcDateAnchor()} UTC. ` +
    "Diagnose the failed workflow run from the detected error patterns and log excerpt. " +
    "Do not invent tool versions, documentation links, or standard clauses. " +
    "Plain prose, no markdown, max 4 sentences, then one concrete terminal command.";

  const prompt =
    `DOMAIN: ${input.domain}\n` +
    `DETECTED ERROR PATTERNS:\n${input.patterns.join("\n") || "none"}\n\n` +
    `LOG EXCERPT (truncated):\n${input.logExcerpt.slice(0, 1500)}\n\n` +
    "1. What is the most likely root cause?\n" +
    "2. What is the first fix command the developer should run?";

  return { system, prompt };
}