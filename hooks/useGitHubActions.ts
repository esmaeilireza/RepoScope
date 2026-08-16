'use client';
import { useState, useEffect, useCallback } from 'react';
import { diagnoseRun, DiagnosticResult } from '@/lib/github-diagnostics'; // 👈 must exist

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

export interface FormattedRun {
  id: number;
  title: string;
  branch: string;
  age: string;
  status: 'success' | 'failure' | 'pending';
  commands: {
    inspect: string;
    delete: string;
  };
  suggestedFix: string;
  diagnostic: DiagnosticResult | null;
  isLoadingDiagnostic: boolean;
}

function getTimeAgo(dateString: string): string {
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

interface UseGitHubActionsReturn {
  runs: FormattedRun[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    failed: number;
    successful: number;
    pending: number;
  };
}

export function useGitHubActions(
  owner: string,
  repo: string,
  token: string
): UseGitHubActionsReturn {
  const [runs, setRuns] = useState<FormattedRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!token || !owner || !repo) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch workflow runs
      const runsPath = `/repos/${owner}/${repo}/actions/runs?per_page=20`;
      const response = await fetch(
        `/api/github?endpoint=${encodeURIComponent(runsPath)}`,
        { headers: { 'x-github-token': token } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const workflowRuns: WorkflowRun[] = data.workflow_runs || [];

      // Build initial formatted runs (without diagnostics)
      const formatted: FormattedRun[] = workflowRuns.map((run) => {
        const status: 'success' | 'failure' | 'pending' =
          run.conclusion === 'success'
            ? 'success'
            : run.conclusion === 'failure'
            ? 'failure'
            : 'pending';

        return {
          id: run.id,
          title: run.name,
          branch: run.head_branch,
          age: getTimeAgo(run.created_at),
          status,
          commands: {
            inspect: `gh run view ${run.id} --log-failed`,
            delete: `gh run delete ${run.id}`,
          },
          suggestedFix:
            run.conclusion === 'failure'
              ? 'Review logs and delete if outdated.'
              : 'This run completed successfully.',
          diagnostic: null,
          isLoadingDiagnostic: false,
        };
      });

      setRuns(formatted);

      // 🧠 Fetch diagnostics for failed runs (background, non‑blocking)
      const failedRuns = formatted.filter((r) => r.status === 'failure');
      const recentIds = formatted.slice(0, 10).map((r) => r.id); // pass context

      for (const failedRun of failedRuns) {
        try {
          // Mark as loading
          setRuns((prev) =>
            prev.map((r) =>
              r.id === failedRun.id
                ? { ...r, isLoadingDiagnostic: true }
                : r
            )
          );

          const diagnostic = await diagnoseRun(
            owner,
            repo,
            failedRun.id,
            token,
            recentIds
          );

          // Update with diagnostic result
          setRuns((prev) =>
            prev.map((r) =>
              r.id === failedRun.id
                ? { ...r, diagnostic, isLoadingDiagnostic: false }
                : r
            )
          );
        } catch (err) {
          console.error(`Failed to diagnose run ${failedRun.id}:`, err);
          // Still clear loading state
          setRuns((prev) =>
            prev.map((r) =>
              r.id === failedRun.id
                ? { ...r, isLoadingDiagnostic: false }
                : r
            )
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [owner, repo, token]);

  // Auto‑fetch on mount and every minute
  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 60000);
    return () => clearInterval(interval);
  }, [fetchRuns]);

  const stats = {
    total: runs.length,
    failed: runs.filter((r) => r.status === 'failure').length,
    successful: runs.filter((r) => r.status === 'success').length,
    pending: runs.filter((r) => r.status === 'pending').length,
  };

  return { runs, loading, error, refetch: fetchRuns, stats };
}