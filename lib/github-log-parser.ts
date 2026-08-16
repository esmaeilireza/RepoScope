// lib/github-log-parser.ts

export interface LogLine {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  content: string;
  file?: string;
  lineNumber?: number;
}

export interface ParsedLog {
  errors: LogLine[];
  warnings: LogLine[];
  summary: string;
  failedStep?: string;
  rawLogs: string;
}

export async function fetchJobLogs(
  owner: string,
  repo: string,
  runId: number,
  token: string
): Promise<ParsedLog> {
  // Step 1: Get jobs for this run
  const jobsPath = `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
  const jobsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(jobsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (!jobsRes.ok) {
    return { errors: [], warnings: [], summary: 'Failed to fetch jobs', rawLogs: '' };
  }
  
  const jobsData = await jobsRes.json();
  const jobs = jobsData.jobs || [];
  
  // Step 2: Get logs URL from the first failed job
  const failedJob = jobs.find((j: any) => j.conclusion === 'failure');
  const targetJob = failedJob || jobs[0];
  
  if (!targetJob) {
    return { errors: [], warnings: [], summary: 'No jobs found', rawLogs: '' };
  }
  
  // Step 3: Download logs (GitHub returns a zip, but we can get raw logs via API)
  const logsPath = `/repos/${owner}/${repo}/actions/jobs/${targetJob.id}/logs`;
  const logsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(logsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  let rawLogs = '';
  if (logsRes.ok) {
    rawLogs = await logsRes.text();
  } else {
    // Fallback: construct from job steps
    rawLogs = (targetJob.steps || [])
      .map((step: any) => {
        const status = step.conclusion === 'failure' ? '❌' : '✓';
        return `${status} Step: ${step.name}\n${step.number}: ${step.status}`;
      })
      .join('\n\n');
  }
  
  return parseLogs(rawLogs, targetJob.name);
}

export function parseLogs(rawLogs: string, jobName: string): ParsedLog {
  const lines = rawLogs.split('\n');
  const errors: LogLine[] = [];
  const warnings: LogLine[] = [];
  let failedStep: string | undefined;
  
  const errorPatterns = [
    /error[:\s]/i,
    /failed/i,
    /exception/i,
    /cannot find/i,
    /not found/i,
    /TS\d{4}/,
    /ELIFECYCLE/,
    /Command failed/,
  ];
  
  const warningPatterns = [
    /warning[:\s]/i,
    /deprecated/i,
    /DEP\d+/,
  ];
  
  // Extract file:line patterns
  const fileLinePattern = /([a-zA-Z0-9_\-./]+\.[a-zA-Z]+):(\d+)(?::(\d+))?/;
  
  lines.forEach((line) => {
    const timestamp = new Date().toISOString();
    
    // Check for errors
    const isError = errorPatterns.some(p => p.test(line));
    if (isError && line.trim().length > 0) {
      const fileMatch = line.match(fileLinePattern);
      errors.push({
        timestamp,
        level: 'error',
        content: line.trim(),
        file: fileMatch?.[1],
        lineNumber: fileMatch ? parseInt(fileMatch[2]) : undefined,
      });
      
      // Detect failed step
      if (!failedStep && line.includes('##[error]')) {
        failedStep = line;
      }
    }
    
    // Check for warnings
    const isWarning = warningPatterns.some(p => p.test(line));
    if (isWarning && line.trim().length > 0) {
      warnings.push({
        timestamp,
        level: 'warning',
        content: line.trim(),
      });
    }
  });
  
  const summary = `${errors.length} errors, ${warnings.length} warnings in ${jobName}`;
  
  return {
    errors: errors.slice(0, 50), // Limit to prevent huge responses
    warnings: warnings.slice(0, 50),
    summary,
    failedStep,
    rawLogs: rawLogs.slice(0, 50000), // Limit size
  };
}