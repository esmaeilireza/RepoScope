'use client';
import { useState } from 'react';
import Image from 'next/image';
import RepoInput from '@/components/RepoInput';
import ScoreBoard from '@/components/ScoreBoard';
import AuditTabs from '@/components/AuditTabs';
import ActionsPanel from '@/components/ActionsPanel';
import { parseRepo, decodeBase64Utf8 } from '@/lib/utils';
import { evaluateTarget, generateFindings, scoreAndExplain } from '@/lib/audit';

const MD_LINK = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const REL_PATH = /(?:\.\.?\/)(?:[a-zA-Z0-9_\-.]+\/?)+(?:\.[a-zA-Z0-9]+)?/g;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  async function analyze(input: string, token: string) {
    const p = parseRepo(input);
    if (!p) { setError('Invalid format. Use owner/repo'); return; }
    setLoading(true); setError(''); setResult(null);
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = 'token ' + token;
    const get = async (ep: string) => {
      const r = await fetch('/api/github?endpoint=' + encodeURIComponent(ep), { headers });
      if (!r.ok) throw new Error('GitHub error ' + r.status + ' for ' + ep);
      return r.json();
    };
    try {
      const meta = await get('/repos/' + p.owner + '/' + p.repo);
      const def = meta.default_branch || 'main';
      const td = await get('/repos/' + p.owner + '/' + p.repo + '/git/trees/' + encodeURIComponent(def) + '?recursive=1');
      const tree = td.tree || [];
      const branches = await get('/repos/' + p.owner + '/' + p.repo + '/branches?per_page=100');

      let pulls: any[] = [];
      try {
        pulls = await get('/repos/' + p.owner + '/' + p.repo + '/pulls?state=all&per_page=100');
      } catch (e) {}

      let readme = '';
      try { readme = decodeBase64Utf8((await get('/repos/' + p.owner + '/' + p.repo + '/readme')).content); } catch (e) {}

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
      setError(e.message || 'Unexpected error');
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
          <span className="font-extrabold text-sm sm:text-base tracking-tight">RepoScope <span className="text-mint">Next.js</span></span>
        </div>
      </nav>
      <header className="pt-12 pb-4 anim text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black leading-[1.15] text-white tracking-tight">
          Audit any GitHub repository, <span className="text-mint">end to end.</span>
        </h1>
        <p className="mt-5 text-slate-400 leading-8 text-sm sm:text-base">
          Paste a repository URL. RepoScope checks Code, README references, license, CI and more.
        </p>
      </header>
      <RepoInput onAnalyze={analyze} isLoading={loading} />
      {loading && <div className="text-center mt-10"><div className="spinner mx-auto"></div></div>}
      {error && (
        <div className="card-static rounded-2xl p-6 mt-10 border border-rosex/40 text-center">
          <div className="text-rosex font-black text-lg">Audit failed</div>
          <p className="text-slate-400 text-xs mt-2">{error}</p>
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
              <h2 className="font-black text-lg text-white font-mono truncate">{result.meta.full_name}</h2>
              <p className="text-slate-400 text-xs mt-1">{result.meta.description || 'No description'}</p>
            </div>
          </div>
          <ScoreBoard score={result.expl.score} explanation={result.expl} />
          <AuditTabs data={result} />
          <ActionsPanel owner={result.meta.owner.login} repo={result.meta.name} />
        </div>
      )}
      <footer className="mt-16 pt-8 border-t border-edge text-center text-[10.5px] text-slate-500">
        RepoScope Next.js - requests proxied via /api/github
      </footer>
    </main>
  );
}