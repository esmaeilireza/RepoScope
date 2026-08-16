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
  confidence: number; // 0-100
  isRecurring: boolean;
  suggestedPriority: 'immediate' | 'soon' | 'later';
}

// Correct way to fetch annotations via Check Runs API
export async function fetchCheckRunAnnotations(
  owner: string,
  repo: string,
  runId: number,
  token: string
): Promise<Annotation[]> {
  // Step 1: Get the check suite for this run
  const runPath = `/repos/${owner}/${repo}/actions/runs/${runId}`;
  const runRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(runPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (!runRes.ok) return [];
  
  const runData = await runRes.json();
  const checkSuiteUrl = runData.check_suite_url;
  
  if (!checkSuiteUrl) return [];
  
  // Step 2: Get check runs in the suite
  const checkRunsPath = checkSuiteUrl.replace('https://api.github.com', '') + '/check-runs';
  const checkRunsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(checkRunsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (!checkRunsRes.ok) return [];
  
  const checkRunsData = await checkRunsRes.json();
  const checkRuns = checkRunsData.check_runs || [];
  
  // Step 3: Get annotations from each check run
  const allAnnotations: Annotation[] = [];
  
  for (const checkRun of checkRuns.slice(0, 3)) { // Limit to 3 check runs
    const annotationsPath = checkRun
      .annotations_url
      .replace('https://api.github.com', '');
    
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
  // Step 1: Fetch both annotations and logs in parallel
  const [annotations, parsedLogs] = await Promise.all([
    fetchCheckRunAnnotations(owner, repo, runId, token),
    fetchJobLogs(owner, repo, runId, token),
  ]);
  
  // Step 2: Collect all error messages
  const allMessages: string[] = [
    ...annotations.map(a => `${a.title || ''} ${a.message}`),
    ...parsedLogs.errors.map(e => e.content),
    ...parsedLogs.warnings.map(w => w.content),
  ];
  
  if (allMessages.length === 0) return null;
  
  // Step 3: Match against patterns
  const matchedPatterns = new Map<string, ErrorPattern>();
  
  allMessages.forEach(message => {
    const pattern = matchErrorPattern(message);
    if (pattern && !matchedPatterns.has(pattern.id)) {
      matchedPatterns.set(pattern.id, pattern);
    }
  });
  
  if (matchedPatterns.size === 0) return null;
  
  // Step 4: Check if this is a recurring error
  const isRecurring = recentRunIds.length > 0; // Simplified check
  
  // Step 5: Calculate confidence score
  const confidence = Math.min(
    100,
    (annotations.length * 20) + (parsedLogs.errors.length * 10)
  );
  
  // Step 6: Determine priority
  const hasCritical = Array.from(matchedPatterns.values())
    .some(p => p.severity === 'critical');
  const suggestedPriority: DiagnosticResult['suggestedPriority'] = 
    hasCritical ? 'immediate' : isRecurring ? 'soon' : 'later';
  
  // Step 7: Generate summary
  const patternList = Array.from(matchedPatterns.values());
  const summary = patternList.length === 1
    ? patternList[0].title
    : `${patternList.length} issues detected: ${patternList.map(p => p.title).join(', ')}`;
  
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
  
  const allSolutionCommands = patterns.flatMap(p => p.solution.commands);
  const uniqueCommands = [...new Set(allSolutionCommands)];
  
  return [
    ...baseCommands,
    '',
    `# ═══ ${patterns.length} Solution${patterns.length > 1 ? 's' : ''} ═══`,
    ...uniqueCommands,
  ];
}