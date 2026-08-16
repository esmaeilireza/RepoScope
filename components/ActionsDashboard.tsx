'use client';
import { useState } from 'react';
import { useGitHubActions } from '@/hooks/useGitHubActions';
import ErrorCard from './ErrorCard';

interface ActionsDashboardProps {
  owner: string;
  repo: string;
  token: string;
  onDisconnect: () => void;
}

export default function ActionsDashboard({ 
  owner, 
  repo, 
  token, 
  onDisconnect 
}: ActionsDashboardProps) {
  const { runs, loading, error, refetch, stats } = useGitHubActions(owner, repo, token);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'failed' | 'success'>('all');
  
  const filteredRuns = runs.filter(run => {
    if (filter === 'failed') return run.status === 'failure';
    if (filter === 'success') return run.status === 'success';
    return true;
  });
  
  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🚀 Actions Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-mono">
              {owner}/{repo}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition disabled:opacity-50"
            >
              {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={onDisconnect}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition"
            >
              🔌 Disconnect
            </button>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-950/50 rounded-lg p-4 border border-gray-800">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400 mt-1">Total Runs</div>
          </div>
          <div className="bg-gray-950/50 rounded-lg p-4 border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{stats.successful}</div>
            <div className="text-xs text-gray-400 mt-1">Successful</div>
          </div>
          <div className="bg-gray-950/50 rounded-lg p-4 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-xs text-gray-400 mt-1">Failed</div>
          </div>
          <div className="bg-gray-950/50 rounded-lg p-4 border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-gray-400 mt-1">Pending</div>
          </div>
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {(['all', 'failed', 'success'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              filter === f 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {f === 'all' && '📋 All'}
            {f === 'failed' && '❌ Failed'}
            {f === 'success' && '✅ Successful'}
          </button>
        ))}
      </div>
      
      {/* Error / Loading states */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
          ⚠️ <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && runs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2 animate-pulse">⏳</div>
          <p>Loading workflow runs...</p>
        </div>
      )}
      
      {/* Runs list */}
      {!loading && filteredRuns.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-gray-300">
            {filter === 'failed' 
              ? 'No failed runs! Your CI is healthy.' 
              : 'No workflow runs found.'}
          </p>
        </div>
      )}
      
      {filteredRuns.length > 0 && (
        <div className="space-y-3">
          {filteredRuns.map((run) => (
            <ErrorCard
              key={run.id}
              run={run}
              expanded={expandedId === run.id}
              onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}