// lib/github-diagnostics.ts

import { matchErrorPattern, ErrorPattern } from './github-error-patterns';
import { fetchJobLogs, ParsedLog } from './github-log-parser';

export interface Annotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title?: string;
  raw_details?: string;
}

export interface DiagnosticResult {
  patterns: ErrorPattern[];
  parsedLogs: ParsedLog;
  summary: string;
  runId: number;
  confidence: number;
  isRecurring: boolean;
  suggestedPriority: 'immediate' | 'soon' | 'later';
}

export async function fetchCheckRunAnnotations(
  owner: string,
  repo: string,
  runId: number,
  token: string
): Promise<Annotation[]> {
  const runPath = `/repos/${owner}/${repo}/actions/runs/${runId}`;
  const runRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(runPath)}`,
    { headers: { 'x-github-token': token } }
  );
  if (!runRes.ok) return [];

  const runData = await runRes.json();
  const checkSuiteUrl = runData.check_suite_url;
  if (!checkSuiteUrl) return [];

  const checkRunsPath = checkSuiteUrl.replace('https://api.github.com', '') + '/check-runs';
  const checkRunsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(checkRunsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  if (!checkRunsRes.ok) return [];

  const checkRunsData = await checkRunsRes.json();
  const checkRuns = checkRunsData.check_runs || [];

  const allAnnotations: Annotation[] = [];
  for (const checkRun of checkRuns.slice(0, 3)) {
    const annotationsPath = checkRun.annotations_url.replace('https://api.github.com', '');
    const annotationsRes = await fetch(
      `/api/github?endpoint=${encodeURIComponent(annotationsPath)}`,
      { headers: { 'x-github-token': token } }
    );
    if (annotationsRes.ok) {
      const annotations = await annotationsRes.json();
      allAnnotations.push(...annotations);
    }
  }
  return allAnnotations;
}

export async function diagnoseRun(
  owner: string,
  repo: string,
  runId: number,
  token: string,
  recentRunIds: number[] = []
): Promise<DiagnosticResult | null> {
  const [annotations, parsedLogs] = await Promise.all([
    fetchCheckRunAnnotations(owner, repo, runId, token),
    fetchJobLogs(owner, repo, runId, token),
  ]);

  const allMessages: string[] = [
    ...annotations.map((a) => `${a.title || ''} ${a.message}`),
    ...parsedLogs.errors.map((e) => e.content),
    ...parsedLogs.warnings.map((w) => w.content),
  ];
  if (allMessages.length === 0) return null;

  const matchedPatterns = new Map<string, ErrorPattern>();
  allMessages.forEach((message) => {
    const pattern = matchErrorPattern(message);
    if (pattern && !matchedPatterns.has(pattern.id)) {
      matchedPatterns.set(pattern.id, pattern);
    }
  });
  if (matchedPatterns.size === 0) return null;

  const isRecurring = recentRunIds.length > 0;
  const confidence = Math.min(100, annotations.length * 20 + parsedLogs.errors.length * 10);
  const hasCritical = Array.from(matchedPatterns.values()).some(
    (p) => p.severity === 'critical'
  );
  const suggestedPriority: DiagnosticResult['suggestedPriority'] = hasCritical
    ? 'immediate'
    : isRecurring
      ? 'soon'
      : 'later';

  const patternList = Array.from(matchedPatterns.values());
  const summary =
    patternList.length === 1
      ? patternList[0].title
      : `${patternList.length} issues detected: ${patternList.map((p) => p.title).join(', ')}`;

  return {
    patterns: patternList,
    parsedLogs,
    summary,
    runId,
    confidence,
    isRecurring,
    suggestedPriority,
  };
}

export function generateRunSpecificCommands(
  runId: number,
  patterns: ErrorPattern[]
): string[] {
  const baseCommands = [
    `# ═══ Inspect This Failure ═══`,
    `gh run view ${runId} --log-failed`,
    '',
    `# ═══ View in Browser ═══`,
    `gh run view ${runId} --web`,
    '',
    `# ═══ Re-run if Transient ═══`,
    `gh run rerun ${runId}`,
    '',
    `# ═══ Delete if Outdated ═══`,
    `gh run delete ${runId}`,
  ];
  if (patterns.length === 0) return baseCommands;

  const allSolutionCommands = patterns.flatMap((p) => p.solution.commands);
  const uniqueCommands = Array.from(new Set(allSolutionCommands));

  return [
    ...baseCommands,
    '',
    `# ═══ ${patterns.length} Solution${patterns.length > 1 ? 's' : ''} ═══`,
    ...uniqueCommands,
  ];
}

// ═══════════════════════════════════════════════════════════════
// Day 22 — bridge to the AI diagnosis endpoint (/api/insight).
// The route expects { patterns: string[], logExcerpt: string, domain }.
// This helper does the one-line conversion so every consumer does not
// have to hand-roll it.
// ═══════════════════════════════════════════════════════════════

export interface AIDiagnosisInput {
  patterns: string[];
  logExcerpt: string;
  domain: 'data' | 'ot' | 'web' | 'general';
}

export function toAIDiagnosisInput(
  result: DiagnosticResult,
  domain: AIDiagnosisInput['domain'] = 'general'
): AIDiagnosisInput {
  return {
    patterns: result.patterns.map((p) => p.title),
    logExcerpt: result.parsedLogs.rawLogs,
    domain,
  };
}