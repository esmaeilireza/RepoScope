'use client';

import { useState, useEffect } from 'react';
import { AUDIT_PROFILES, AuditProfile } from '@/lib/types';
import { Database, Cpu, Globe, GitBranch } from 'lucide-react';

// RepoScope Code Review Rule: Explicitly prohibit `any`.
// Strict interface for GitHub API response.
interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

const VISIBLE_PROFILE_IDS: readonly AuditProfile[] = [
  'webapp',
  'dataops',
  'iiot',
] as const;

const VISIBLE_PROFILES = AUDIT_PROFILES.filter((p) =>
  VISIBLE_PROFILE_IDS.includes(p.id),
);

interface RepoInputProps {
  onAnalyze: (url: string, token: string, profile: AuditProfile, branch?: string) => void;
  loading?: boolean;
}

export default function RepoInput({ onAnalyze, loading }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<AuditProfile>('webapp');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // MUST be the first line
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    const githubPattern = /^https?:\/\/(www\.)?github\.com\/([\w-]+)\/([\w.-]+)\/?$/;
    const match = url.trim().match(githubPattern);

    if (!match) {
      setError('Invalid GitHub URL. Format: https://github.com/owner/repo');
      return;
    }

    const branch = selectedBranch || branches[0] || 'main';
    onAnalyze(url.trim(), token.trim(), selectedProfile, branch);
  };

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
      .then((data: GitHubBranch[]) => { // Strict type applied here
        const branchNames = data.map((b) => b.name);
        setBranches(branchNames);
        const defaultBranch = branchNames.find(b => b === 'main' || b === 'master') || branchNames[0];
        setSelectedBranch(defaultBranch || '');
      })
      .catch(() => {
        setBranches([]);
      })
      .finally(() => setLoadingBranches(false));
  }, [url]);

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
      <div>
        <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-300 mb-1">
          GitHub repository
        </label>
        <input
          type="text"
          id="repoUrl"   // Added ID
          name="repoUrl" // Added Name
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
        />
      </div>

      {branches.length > 0 && (
        <div>
          <label htmlFor="branchSelect" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Target Branch
          </label>
          <select
            id="branchSelect"
            name="branchSelect"
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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Audit Profile
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VISIBLE_PROFILES.map((profile) => (
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

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-gray-400 hover:text-gray-200 mb-3 flex items-center gap-1 transition-colors"
      >
        {showAdvanced ? '▼' : '▶'} Advanced settings (GitHub Token – OPTIONAL for public repos)
      </button>

      {showAdvanced && (
        <div className="space-y-2">
          <label htmlFor="githubToken" className="block text-sm font-medium text-gray-300">
            GitHub token (only needed for PRIVATE repos)
          </label>
          <input
            type="password"
            id="githubToken"
            name="githubToken"
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

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

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