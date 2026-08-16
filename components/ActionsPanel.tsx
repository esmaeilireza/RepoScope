'use client';
import { useEffect, useState } from 'react';

interface Run {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  created_at: string;
  head_branch: string;
}

export default function ActionsPanel({ owner, repo }: { owner: string; repo: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/github?owner=${owner}&repo=${repo}&endpoint=actions`)
      .then(res => res.json())
      .then(data => {
        setRuns(data.workflow_runs || []);
        setLoading(false);
      });
  }, [owner, repo]);

  const getStatusIcon = (run: Run) => {
    if (run.status === 'completed' && run.conclusion === 'success') return '✅';
    if (run.status === 'in_progress') return '🔄';
    if (run.conclusion === 'failure') return '❌';
    return '⚪';
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

  if (loading) return <div className="animate-pulse">Loading actions...</div>;

  return (
    <div className="space-y-3 p-4 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold flex items-center gap-2">
        🚀 GitHub Actions
      </h3>
      
      {runs.slice(0, 5).map(run => (
        <div 
          key={run.id}
          className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-blue-500 transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span>{getStatusIcon(run)}</span>
                <span className="font-mono text-sm">{run.name}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {run.head_branch} • {new Date(run.created_at).toLocaleString()}
              </div>
            </div>
            
            {run.conclusion === 'failure' && (
              <button
                onClick={() => copyCommand(run.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                🔧 Fix Commands
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}