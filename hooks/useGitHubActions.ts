'use client';
import { useState, useEffect, useCallback } from 'react';
import { diagnoseRun, DiagnosticResult } from '@/lib/github-diagnostics';

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  head_branch: string;
  html_url: string;
  event: string;
}

export interface FormattedRun {
  id: number;
  title: string;
  branch: string;
  age: string;
  status: 'success' | 'failure' | 'pending';
  diagnostic: DiagnosticResult | null;
  isLoadingDiagnostic: boolean;
}

function getTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function useGitHubActions(owner: string, repo: string, token: string) {
  const [runs, setRuns] = useState<FormattedRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!token || !owner || !repo) return;

    setLoading(true);
    setError(null);

    try {
      // Use FULL API path instead of shorthand
      const runsPath = `/repos/${owner}/${repo}/actions/runs?per_page=20`;
      const runsRes = await fetch(
        `/api/github?endpoint=${encodeURIComponent(runsPath)}`,
        { headers: { 'x-github-token': token } }
      );

      if (!runsRes.ok) throw new Error(`Failed: ${runsRes.status}`);

      const runsData = await runsRes.json();
      const workflowRuns: WorkflowRun[] = runsData.workflow_runs || [];

      const formatted: FormattedRun[] = workflowRuns.map(run => ({
        id: run.id,
        title: run.name,
        branch: run.head_branch,
        age: getTimeAgo(run.created_at),
        status: run.conclusion === 'success' ? 'success' 
              : run.conclusion === 'failure' ? 'failure' 
              : 'pending',
        diagnostic: null,
        isLoadingDiagnostic: false,
      }));

      setRuns(formatted);

      // Fetch diagnostics for failed runs in background
      const failedRuns = formatted.filter(r => r.status === 'failure');
      const recentIds = formatted.slice(0, 5).map(r => r.id);

      for (const failedRun of failedRuns) {
        try {
          const diagnostic = await diagnoseRun(
            owner, repo, failedRun.id, token, recentIds
          );
          
          setRuns(prev => prev.map(r => 
            r.id === failedRun.id 
              ? { ...r, diagnostic, isLoadingDiagnostic: false }
              : r
          ));
        } catch (err) {
          console.error(`Failed to diagnose run ${failedRun.id}:`, err);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [owner, repo, token]);

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 60000);
    return () => clearInterval(interval);
  }, [fetchRuns]);

  return {
    runs,
    loading,
    error,
    refetch: fetchRuns,
    stats: {
      total: runs.length,
      failed: runs.filter(r => r.status === 'failure').length,
      successful: runs.filter(r => r.status === 'success').length,
      pending: runs.filter(r => r.status === 'pending').length,
    },
  };
}
