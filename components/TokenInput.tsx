// components/TokenInput.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";

interface TokenInputProps {
  onSubmit: (token: string) => void;
}

const TOKEN_STORAGE_KEY = "gh_token";

export default function TokenInput({ onSubmit }: TokenInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState("");

  // Hydration-safe: localStorage is touched only after mount.
  // During SSR / initial render, token is "", matching the server HTML.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (saved) {
        setToken(saved);
        setIsOpen(true);
      }
    } catch {
      // localStorage can throw in private mode or restricted contexts.
      // Fail silently: the audit flow must never depend on persistence.
    }
  }, []);

  const persistToken = (value: string): void => {
    try {
      if (value) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Best-effort persistence only.
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError("");

    const trimmed = token.trim();

    if (!trimmed) {
      setError('Please enter a GitHub token or click "Skip for now"');
      return;
    }

    if (!trimmed.startsWith("ghp") && !trimmed.startsWith("githubpat_")) {
      setError("Invalid token format. Should start with ghp or githubpat_");
      return;
    }

    persistToken(trimmed);
    onSubmit(trimmed);
  };

  const handleSkip = (): void => {
    onSubmit(""); // signals skip; does not erase a previously saved token
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

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="github-token-panel"
        className="flex w-full items-center gap-2 text-left text-sm text-gray-300 hover:text-white transition"
      >
        <span
          aria-hidden="true"
          className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        Advanced settings (GitHub Token – OPTIONAL)
      </button>

      {isOpen && (
        <div id="github-token-panel">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-3 pr-20 bg-gray-950 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowToken((prev) => !prev)}
                aria-label={showToken ? "Hide token" : "Show token"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
              >
                {showToken ? "🙈" : "👁️"}
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
              <p>🔒 Stored only in this browser via localStorage. Never sent to our servers.</p>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={handleSkip}
        className="text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition"
      >
        Skip for now
      </button>
    </div>
  );
}