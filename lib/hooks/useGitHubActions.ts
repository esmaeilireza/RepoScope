'use client';
import { useState, useEffect, useCallback } from 'react';
import { WorkflowRun, FormattedError, formatRuns } from '@/lib/github';

interface UseGitHubActionsReturn {
  runs: FormattedError[];
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
  const [runs, setRuns] = useState<FormattedError[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!token || !owner || !repo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/github?owner=${owner}&repo=${repo}&endpoint=actions`,
        {
          headers: {
            'x-github-token': token,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      const workflowRuns: WorkflowRun[] = data.workflow_runs || [];
      const formatted = formatRuns(workflowRuns);
      setRuns(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [owner, repo, token]);

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchRuns]);

  const stats = {
    total: runs.length,
    failed: runs.filter(r => r.status === 'failure').length,
    successful: runs.filter(r => r.status === 'success').length,
    pending: runs.filter(r => r.status === 'pending').length,
  };

  return { runs, loading, error, refetch: fetchRuns, stats };
}