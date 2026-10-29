// lib/findings-dedupe.ts
import type { Finding } from "./types";

type FindingWithLocation = Finding & {
  readonly file?: string;
  readonly path?: string;
  readonly line?: number;
};

function findingKey(finding: FindingWithLocation): string {
  const location = finding.file ?? finding.path ?? "";
  const line = finding.line ?? "";
  const detail =
    typeof finding.detail === "string" ? finding.detail.slice(0, 160) : "";

  return `${finding.ruleId}::${location}::${line}::${detail}`;
}

export function dedupeFindings(findings: readonly Finding[]): Finding[] {
  const seen = new Set<string>();
  const output: Finding[] = [];

  for (const finding of findings) {
    const key = findingKey(finding as FindingWithLocation);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(finding);
  }

  return output;
}