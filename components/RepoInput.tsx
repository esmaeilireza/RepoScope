// components/RepoInput.tsx
import { useState } from 'react';

interface RepoInputProps {
  onAnalyze: (url: string, token: string) => void;
  loading?: boolean;
}

export default function RepoInput({ onAnalyze, loading }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Basic URL validation
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubPattern.test(url.trim())) {
      setError('Invalid GitHub URL. Format: https://github.com/owner/repo');
      return;
    }

    onAnalyze(url.trim(), token.trim());
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

      {/* Advanced settings toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-gray-400 hover:text-gray-200 mb-3 flex items-center gap-1"
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
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {loading ? '⏳ Analyzing...' : '🔍 Analyze repository'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        💡 No token needed for public repositories!
      </p>
    </form>
  );
}