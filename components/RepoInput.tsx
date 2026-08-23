'use client';

import { useState, useEffect } from 'react';
import { AUDIT_PROFILES, AuditProfile } from '@/lib/types';
import { Database, Cpu, Globe, GitBranch } from 'lucide-react';

interface RepoInputProps {
  onAnalyze: (url: string, token: string, profile: AuditProfile, branch?: string) => void;
  loading?: boolean;
}

export default function RepoInput({ onAnalyze, loading }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<AuditProfile>('web');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  
  // ─── NEW: Branch selection state ───
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  // ───────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Basic URL validation
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/([\w-]+)\/([\w.-]+)\/?$/;
    const match = url.trim().match(githubPattern);
    
    if (!match) {
      setError('Invalid GitHub URL. Format: https://github.com/owner/repo');
      return;
    }

    // Pass selected branch (default to first branch or 'main')
    const branch = selectedBranch || branches[0] || 'main';
    onAnalyze(url.trim(), token.trim(), selectedProfile, branch);
  };

  // ─── NEW: Fetch branches when URL changes ───
  useEffect(() => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/([\w-]+)\/([\w.-]+)\/?$/;
    const match = url.trim().match(githubPattern);
    
    if (!match) {
      setBranches([]);
      setSelectedBranch('');
      return;
    }

    const [, , owner, repo] = match;
    setLoadingBranches(true);

    fetch(`/api/github?endpoint=${encodeURIComponent(`/repos/${owner}/${repo}/branches?per_page=20`)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: any[]) => {
        const branchNames = data.map((b: any) => b.name);
        setBranches(branchNames);
        // Auto-select default branch (main/master) or first one
        const defaultBranch = branchNames.find(b => b === 'main' || b === 'master') || branchNames[0];
        setSelectedBranch(defaultBranch || '');
      })
      .catch(() => {
        setBranches([]);
      })
      .finally(() => setLoadingBranches(false));
  }, [url]);
  // ──────────────────────────────────────────

  const getProfileIcon = (id: AuditProfile) => {
    switch (id) {
      case 'dataops':
        return <Database className="w-4 h-4 text-emerald-500" />;
      case 'iiot':
        return <Cpu className="w-4 h-4 text-amber-500" />;
      default:
        return <Globe className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main URL input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          GitHub repository
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
        />
      </div>

      {/* ─── NEW: Branch Selector ─── */}
      {branches.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Target Branch
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={loadingBranches || loading}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 transition"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}
      {loadingBranches && (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <span className="animate-spin">⟳</span> Loading branches...
        </p>
      )}
      {/* ─────────────────────────── */}

      {/* Profile Selection Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Audit Profile
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AUDIT_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfile(profile.id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                selectedProfile === profile.id
                  ? 'bg-slate-800/50 border-emerald-500/50 ring-1 ring-emerald-500/50'
                  : 'bg-gray-950 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getProfileIcon(profile.id)}
                <span
                  className={`text-xs font-bold ${
                    selectedProfile === profile.id ? 'text-emerald-400' : 'text-gray-300'
                  }`}
                >
                  {profile.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {profile.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced settings toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-gray-400 hover:text-gray-200 mb-3 flex items-center gap-1 transition-colors"
      >
        {showAdvanced ? '▼' : '▶'} Advanced settings (GitHub Token – OPTIONAL for public repos)
      </button>

      {/* Token input (only when advanced is open) */}
      {showAdvanced && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            GitHub token (only needed for PRIVATE repos)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx or leave empty for public repos"
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
          />
          <p className="text-xs text-gray-500">
            💡 For public repositories, leave this empty. Tokens are only needed for private repos or to bypass rate limits
            (60/hr anonymous vs 5000/hr with token).{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Generate token →
            </a>
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || loadingBranches}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> Analyzing...
          </>
        ) : (
          <>🔍 Analyze repository</>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        💡 No token needed for public repositories!
      </p>
    </form>
  );
}