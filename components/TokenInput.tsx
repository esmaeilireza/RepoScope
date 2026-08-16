// components/TokenInput.tsx
import { useState } from 'react';

interface TokenInputProps {
  onSubmit: (token: string) => void;
}

export default function TokenInput({ onSubmit }: TokenInputProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Please enter a GitHub token or click "Skip for now"');
      return;
    }

    // Basic validation
    if (!token.startsWith('ghp') && !token.startsWith('githubpat_')) {
      setError('Invalid token format. Should start with ghp or githubpat_');
      return;
    }

    onSubmit(token.trim());
  };

  const handleSkip = () => {
    onSubmit(''); // signals that the user wants to skip
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔑</span>
        <div>
          <h3 className="font-medium">Connect to GitHub Actions</h3>
          <p className="text-sm text-gray-400">
            Enter a token to view detailed CI diagnostics.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
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
          <div className="bg-red-900/20 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            🔗 Connect
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition"
          >
            Skip
          </button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Generate a token on GitHub →
          </a>
          <p>🔒 Your token stays in your browser. We never store it.</p>
        </div>
      </form>
    </div>
  );
}