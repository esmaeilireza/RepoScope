'use client';

import { useState } from 'react';
import Image from 'next/image';
import RepoInput from '@/components/RepoInput';
import ScoreBoard from '@/components/ScoreBoard';
import AuditTabs from '@/components/AuditTabs';
import ActionsPanel from '@/components/ActionsPanel';
import TokenInput from '@/components/TokenInput';
import ActionsDashboard from '@/components/ActionsDashboard';
import { parseRepo, decodeBase64Utf8 } from '@/lib/utils';
import { evaluateTarget, generateFindings, scoreAndExplain } from '@/lib/audit';

const MD_LINK = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const REL_PATH = /(?:\.{0,2}\/)(?:[a-zA-Z0-9_\-\.]+\/?)+(?:\.[a-zA-Z0-9]+)?/g;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  async function analyze(input: string, token: string) {
    const p = parseRepo(input);
    if (!p) {
      setError('Invalid format. Use owner/repo');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = 'token ' + token;

    const get = async (ep: string) => {
      const r = await fetch('/api/github?endpoint=' + encodeURIComponent(ep), { headers });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || ('GitHub error ' + r.status));
      }
      return r.json();
    };

    try {
      // Request 1: Get basic repo info
      const meta = await get('/repos/' + p.owner + '/' + p.repo);
      const def = meta.default_branch || 'main';

      // Request 2: Get file tree
      let tree: any[] = [];
      try {
        const td = await get('/repos/' + p.owner + '/' + p.repo + '/git/trees/' + encodeURIComponent(def) + '?recursive=1');
        tree = td.tree || [];
      } catch (e: any) {
        console.warn('Could not fetch tree:', e.message);
      }

      // Request 3: Get branches
      let branches: any[] = [];
      try {
        branches = await get('/repos/' + p.owner + '/' + p.repo + '/branches?per_page=100');
      } catch (e: any) {
        console.warn('Could not fetch branches:', e.message);
      }

      // Request 4: Get PRs (optional)
      let pulls: any[] = [];
      try {
        pulls = await get('/repos/' + p.owner + '/' + p.repo + '/pulls?state=open&per_page=100');
      } catch (e: any) {
        console.warn('Could not fetch PRs:', e.message);
      }

      // Request 5: Get README (optional)
      let readme = '';
      try {
        readme = decodeBase64Utf8((await get('/repos/' + p.owner + '/' + p.repo + '/readme')).content);
      } catch (e: any) {
        console.warn('Could not fetch README:', e.message);
      }

      const claims: any[] = [];
      if (readme) {
        String(readme || '').split('\n').forEach((line, idx) => {
          let m;
          MD_LINK.lastIndex = 0;
          while ((m = MD_LINK.exec(line))) {
            const v = evaluateTarget(m[3], tree);
            claims.push({ line: idx + 1, target: m[3], status: v.status, detail: v.detail });
          }
          REL_PATH.lastIndex = 0;
          while ((m = REL_PATH.exec(line))) {
            const v = evaluateTarget(m[0], tree);
            claims.push({ line: idx + 1, target: m[0], status: v.status, detail: v.detail });
          }
        });
      }

      const diffs: any[] = [];
      const findings = generateFindings(meta, tree, claims, diffs, pulls, def);
      const expl = scoreAndExplain(findings);

      setResult({ meta, tree, branches, claims, findings, expl });
    } catch (e: any) {
      const msg = e.message || 'Unexpected error';
      
      // Special handling for rate limit
      if (msg.includes('429') || msg.includes('rate limit')) {
        setError(
          'GitHub API rate limit reached. Please wait 1 hour and try again. ' +
          'For higher limits (5000 req/hour), add a GitHub token in Advanced Settings.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const avatarUrl = result?.meta?.owner?.avatar_url || '';

  return (
    <main className="max-w-6xl mx-auto px-4 pb-24">
      <nav className="nav-blur sticky top-0 z-50 border-b border-edge">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-mint shadow-glow blink-dot"></span>
          <span className="font-extrabold text-sm sm:text-base tracking-tight">
            RepoScope <span className="text-mint">Next.js</span>
          </span>
        </div>
      </nav>

      <header className="pt-12 pb-4 anim text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black leading-[1.15] text-white tracking-tight">
          Audit any GitHub repository, <span className="text-mint">end to end.</span>
        </h1>
        <p className="mt-5 text-slate-400 leading-8 text-sm sm:text-base">
          Paste a Repository URL. RepoScope checks Code, README References, License, CI and more.
        </p>
        <p className="mt-2 text-slate-500 text-xs">
          No token needed for public Repos. 60 Requests/hour limit without token.
        </p>
      </header>

      <RepoInput onAnalyze={analyze} loading={loading} />

      {loading && (
        <div className="text-center mt-10">
          <div className="spinner mx-auto"></div>
          <p className="text-slate-400 text-sm mt-4">Analyzing repository...</p>
        </div>
      )}
      
      {error && (
        <div className="card-static rounded-2xl p-6 mt-10 border border-rosex/40 text-center">
          <div className="text-rosex font-black text-lg mb-2">Audit failed</div>
          <p className="text-slate-400 text-sm">{error}</p>
          {error.includes('rate limit') && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <strong>Tip:</strong> GitHub allows 60 requests/hour without a token. 
                Try again in 1 hour, or add a token in Advanced Settings for 5000 requests/hour.
              </p>
            </div>
          )}
        </div>
      )}

      {result && !loading && (
        <div className="mt-12 space-y-6 anim">
          <div className="card-static rounded-2xl p-6 flex gap-5 items-center">
            <Image
              src={avatarUrl}
              alt="Repository owner avatar"
              width={48}
              height={48}
              className="rounded-full border border-edge"
            />
            <div className="min-w-0">
              <h2 className="font-black text-lg text-white font-mono truncate">
                {result.meta.full_name}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {result.meta.description || 'No description'}
              </p>
            </div>
          </div>

          <ScoreBoard score={result.expl.score} explanation={result.expl} />
          <AuditTabs data={result} />
          <ActionsPanel owner={result.meta.owner.login} repo={result.meta.name} />
        </div>
      )}

      <hr className="my-16 border-edge" />

      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          GitHub Actions Console
        </h2>
        {!githubToken ? (
          <div className="max-w-md mx-auto">
            <TokenInput onSubmit={setGithubToken} />
          </div>
        ) : (
          <ActionsDashboard
            owner={result?.meta?.owner?.login || 'esmaeilireza'}
            repo={result?.meta?.name || 'RepoScope'}
            token={githubToken}
            onDisconnect={() => setGithubToken(null)}
          />
        )}
      </section>

      <footer className="mt-16 pt-8 border-t border-edge text-center text-[10.5px] text-slate-500">
        RepoScope Next.js - requests proxied via /api/github
      </footer>
    </main>
  );
}
