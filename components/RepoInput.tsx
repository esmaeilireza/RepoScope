'use client';
import { useState } from 'react';

export default function RepoInput({ onAnalyze, isLoading }: { onAnalyze: (repo: string, token: string) => void; isLoading: boolean }) {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repo.trim()) onAnalyze(repo.trim(), token.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="card-static rounded-2xl p-6 sm:p-7 max-w-3xl mx-auto anim">
      <label className="block text-xs font-extrabold text-slate-300 mb-2 uppercase tracking-wider">
        GitHub repository
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          className="inp font-mono flex-1"
          placeholder="owner/repo or full URL"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 px-6 py-3 rounded-xl bg-mint text-night font-black text-sm hover:bg-tealx transition-colors shadow-glow disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Analyze repository'}
        </button>
      </div>
      <details className="mt-4">
        <summary className="text-[11px] text-slate-500 font-bold hover:text-mint cursor-pointer">
          Advanced settings (GitHub Token)
        </summary>
        <div className="mt-3">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="inp font-mono text-xs"
            placeholder="ghp_xxx (optional)"
            disabled={isLoading}
          />
        </div>
      </details>
    </form>
  );
}