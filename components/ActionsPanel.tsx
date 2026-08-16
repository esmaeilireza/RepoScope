'use client';

import { useEffect, useState } from 'react';

interface Run {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  head_branch: string;
  html_url: string;
}

export default function ActionsPanel({ owner, repo }: { owner: string; repo: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      try {
        // Use FULL API path
        const endpoint = `/repos/${owner}/${repo}/actions/runs?per_page=5`;
        const response = await fetch(
          `/api/github?endpoint=${encodeURIComponent(endpoint)}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setRuns(data.workflow_runs || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    if (owner && repo) {
      fetchRuns();
    }
  }, [owner, repo]);

  const getStatusIcon = (run: Run) => {
    if (run.status === 'completed' && run.conclusion === 'success') return 'PASS';
    if (run.status === 'in_progress') return 'RUN';
    if (run.conclusion === 'failure') return 'FAIL';
    return 'PEND';
  };

  const getStatusColor = (run: Run) => {
    if (run.status === 'completed' && run.conclusion === 'success') return 'pill-pass';
    if (run.status === 'in_progress') return 'pill-info';
    if (run.conclusion === 'failure') return 'pill-fail';
    return 'pill-warn';
  };

  const copyCommand = (runId: number) => {
    const commands = `# Inspect failed run
gh run view ${runId} --log-failed

# Delete if outdated
gh run delete ${runId}

# Check current status
gh run list --status failure --limit 5`;
    
    navigator.clipboard.writeText(commands);
    alert('Commands copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="card-static rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="spinner w-6 h-6 border-2"></div>
          <p className="text-slate-400 text-sm">Loading GitHub Actions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-static rounded-2xl p-6 border border-rosex/30">
        <p className="text-rosex text-sm">Could not load Actions: {error}</p>
      </div>
    );
  }

  return (
    <div className="card-static rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-white">GitHub Actions</h3>
        <a
          href={`https://github.com/${owner}/${repo}/actions`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-mint hover:text-tealx transition"
        >
          View all &rarr;
        </a>
      </div>

      {runs.length === 0 ? (
        <p className="text-slate-400 text-sm">No workflow runs found</p>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="find-row"
            >
              <div className={`sev-ico sev-${run.conclusion === 'failure' ? 'error' : run.conclusion === 'success' ? 'info' : 'warning'}`}>
                {getStatusIcon(run)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">
                    {run.name}
                  </span>
                  <span className={`pill ${getStatusColor(run)}`}>
                    {run.conclusion?.toUpperCase() || run.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono">{run.head_branch}</span>
                  <span>{new Date(run.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {run.conclusion === 'failure' && (
                <button
                  onClick={() => copyCommand(run.id)}
                  className="shrink-0 px-3 py-1 bg-rosex/20 hover:bg-rosex/30 border border-rosex/40 rounded text-xs text-rosex transition"
                >
                  Fix
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
