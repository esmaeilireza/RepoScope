'use client';
import { useState } from 'react';

export default function AuditTabs({ data }: { data: any }) {
  const [tab, setTab] = useState('findings');
  const findings = data.findings || [];
  const tree = (data.tree || []).filter((t: any) => t.type !== 'tree');
  const claims = data.claims || [];
  const broken = claims.filter((c: any) => c.status === 'broken');
  const verified = claims.filter((c: any) => c.status === 'verified');
  const btn = (id: string, label: string) => (
    <button onClick={() => setTab(id)} className={'tab-btn whitespace-nowrap ' + (tab === id ? 'active' : '')}>
      {label}
    </button>
  );
  return (
    <div className="mt-8">
      <div className="flex gap-2 bg-panel border border-edge rounded-2xl p-1.5 overflow-x-auto">
        {btn('findings', 'Findings (' + findings.length + ')')}
        {btn('tree', 'Tree (' + tree.length + ')')}
        {btn('readme', 'README (' + claims.length + ')')}
      </div>
      <div className="card-static rounded-2xl mt-4 p-6 min-h-[280px]">
        {tab === 'findings' && (
          <div className="space-y-2.5">
            {findings.length === 0 && <p className="text-slate-500 text-center">No findings - clean audit.</p>}
            {findings.map((f: any, i: number) => (
              <div key={i} className="find-row">
                <div className={'sev-ico sev-' + f.severity}>{f.severity === 'error' ? 'X' : f.severity === 'warning' ? '!' : 'i'}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">{f.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{f.description}</div>
                  {f.fix && <div className="text-[11px] text-mint mt-1">Fix: {f.fix}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'tree' && (
          <div className="font-mono text-xs text-slate-300 max-h-96 overflow-auto">
            {tree.slice(0, 200).map((t: any, i: number) => (
              <div key={i} className="py-1 px-2 hover:bg-mint/5 rounded">{t.path}</div>
            ))}
            {tree.length > 200 && <div className="text-slate-500 p-2">...and {tree.length - 200} more</div>}
          </div>
        )}
        {tab === 'readme' && (
          <div className="space-y-2">
            <div className="flex gap-3">
              <span className="pill pill-pass">{verified.length} Verified</span>
              <span className="pill pill-fail">{broken.length} Broken</span>
            </div>
            {broken.map((c: any, i: number) => (
              <div key={i} className="text-xs text-rosex p-2 bg-rosex/5 rounded border border-rosex/20">
                Line {c.line}: {c.target} - {c.detail}
              </div>
            ))}
            {broken.length === 0 && <div className="text-mint text-sm">No README contradictions detected.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
