// lib/knowledge/grounding-renderer.ts
import type { Finding } from "../types";

interface GroundingRecord {
  readonly book?: string;
  readonly source?: string;
  readonly concept?: string;
}

interface FindingWithMetadata extends Finding {
  readonly metadata?: {
    readonly grounding?: readonly GroundingRecord[];
  };
}

export function renderGrounding(finding: Finding): string | null {
  const records = (finding as FindingWithMetadata).metadata?.grounding;
  if (!records || records.length === 0) {
    return null;
  }

  const lines: string[] = [];

  for (const record of records) {
    const book = record.book ?? record.source;
    if (!book) {
      continue;
    }

    const concept = record.concept;
    lines.push(concept ? `  - ${book} → ${concept}` : `  - ${book}`);
  }

  if (lines.length === 0) {
    return null;
  }

  return `Grounding:\n${lines.join("\n")}`;
}