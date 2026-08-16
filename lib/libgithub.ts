export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  head_branch: string;
  head_sha: string;
  html_url: string;
  event: string;
}

export interface FormattedError {
  id: number;
  title: string;
  branch: string;
  age: string;
  status: 'success' | 'failure' | 'pending';
  commands: {
    inspect: string;
    delete: string;
    list: string;
  };
  suggestedFix: string;
  rawError?: string;
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

export function formatRuns(runs: WorkflowRun[]): FormattedError[] {
  return runs.map(run => ({
    id: run.id,
    title: run.name,
    branch: run.head_branch,
    age: getTimeAgo(run.created_at),
    status: run.conclusion === 'success' ? 'success' 
          : run.conclusion === 'failure' ? 'failure' 
          : 'pending',
    commands: {
      inspect: `gh run view ${run.id} --log-failed`,
      delete: `gh run delete ${run.id}`,
      list: `gh run list --repo owner/repo --status failure --limit 5`,
    },
    suggestedFix: run.conclusion === 'failure' 
      ? 'This run failed. Review the logs and consider deleting it if it\'s outdated.' 
      : 'This run completed successfully.',
  }));
}

export function validateToken(token: string): boolean {
  return token.startsWith('ghp_') || token.startsWith('github_pat_') || token.length >= 40;
}