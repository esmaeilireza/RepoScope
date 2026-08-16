'use client';
import { useState } from 'react';
import { validateToken } from '@/lib/github';

interface TokenInputProps {
  onSubmit: (token: string) => void;
}

export default function TokenInput({ onSubmit }: TokenInputProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }
    
    if (!validateToken(token)) {
      setError('Invalid token format. Should start with ghp_ or github_pat_');
      return;
    }
    
    setError('');
    onSubmit(token);
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">🔑</div>
        <div>
          <h2 className="text-lg font-semibold text-white">Connect to GitHub</h2>
          <p className="text-sm text-gray-400 mt-1">
            Enter a personal access token to view your Actions
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 pr-20 bg-gray-950 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
          >
            {showToken ? '🙈' : '👁️'}
          </button>
        </div>
        
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3">
            ⚠️ {error}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium text-white transition shadow-lg"
        >
          🚀 Connect & Analyze
        </button>
        
        <div className="text-xs text-gray-500 text-center">
          <a 
            href="https://github.com/settings/tokens/new?description=RepoScope&scopes=repo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Generate a token on GitHub →
          </a>
          <p className="mt-2">
            🔒 Your token stays in your browser. We never store it.
          </p>
        </div>
      </form>
    </div>
  );
}