'use client';
import { useState, useEffect } from 'react';

export default function AuditTabs({ data }: { data: any }) {
  const [tab, setTab] = useState('findings');
  
  const findings = data.findings || [];
  const tree = (data.tree || []).filter((t: any) => t.type !== 'tree');
  const claims = data.claims || [];
  const broken = claims.filter((c: any) => c.status === 'broken');
  const verified = claims.filter((c: any) => c.status === 'verified');

  // Profile and specialized audit reports
  const activeProfile = data.profile || 'web';
  const dataOpsReport = data.dataOpsReport || null;
  const iiotReport = data.iiotReport || null;
  const dataOpsChecks = dataOpsReport?.checks || [];
  const iiotChecks = iiotReport?.checks || [];

  // Determine which specialized tabs should be visible
  const showDataOps = activeProfile === 'dataops' && !!dataOpsReport;
  const showIIoT = activeProfile === 'iiot' && !!iiotReport;

  // Reset tab if the currently selected tab is no longer available
  useEffect(() => {
    if (tab === 'dataops' && !showDataOps) setTab('findings');
    if (tab === 'iiot' && !showIIoT) setTab('findings');
  }, [showDataOps, showIIoT, tab]);

  const btn = (id: string, label: string, icon?: string) => (
    <button
      onClick={() => setTab(id)}
      className={'tab-btn whitespace-nowrap ' + (tab === id ? 'active' : '')}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </button>
  );

  return (
    <div className="mt-8">
      <div className="flex gap-2 bg-panel border border-edge rounded-2xl p-1.5 overflow-x-auto">
        {btn('findings', 'Findings (' + findings.length + ')')}
        {showDataOps && btn('dataops', 'Data Pipeline', '🗄️')}
        {showIIoT && btn('iiot', 'IIoT / PLC', '⚙️')}
        {data.sbom && btn('sbom', `SBOM (${data.sbom.componentCount})`, '📦')}
        {data.anomalyReport && btn('security', `Security (${data.anomalyReport.totalAnomalies})`, '🛡️')}
        {btn('tree', 'Tree (' + tree.length + ')')}
        {btn('readme', 'README (' + claims.length + ')')}
      </div>

      <div className="card-static rounded-2xl mt-4 p-6 min-h-[280px]">
        {/* ─── FINDINGS TAB ─── */}
        {tab === 'findings' && (
          <div className="space-y-2.5">
            {findings.length === 0 && (
              <p className="text-slate-500 text-center">No findings - clean audit.</p>
            )}
            {findings.map((f: any, i: number) => (
              <div key={i} className="find-row">
                <div className={'sev-ico sev-' + f.severity}>
                  {f.severity === 'error' ? 'X' : f.severity === 'warning' ? '!' : 'i'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">{f.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{f.description}</div>
                  {f.fix && <div className="text-[11px] text-mint mt-1">Fix: {f.fix}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── DATA PIPELINE TAB (DataOps Profile) ─── */}
        {tab === 'dataops' && showDataOps && (
          <div className="space-y-3">
            {/* Score and Summary */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="pill pill-pass">Score: {dataOpsReport.score}/100</span>
              <span className="pill pill-pass">{dataOpsReport.summary.passed} Passed</span>
              <span className="pill pill-warn">{dataOpsReport.summary.warnings} Warnings</span>
              <span className="pill pill-fail">{dataOpsReport.summary.failures} Failures</span>
            </div>

            {dataOpsChecks.length === 0 && (
              <p className="text-slate-500 text-center">No DataOps checks performed.</p>
            )}

            {dataOpsChecks.map((check: any, i: number) => {
              const statusColor =
                check.status === 'pass' ? 'pill-pass' :
                check.status === 'warn' ? 'pill-warn' : 'pill-fail';
              const statusIcon =
                check.status === 'pass' ? '✓' :
                check.status === 'warn' ? '!' : 'X';

              return (
                <div key={i} className="find-row">
                  <div
                    className={
                      'sev-ico sev-' +
                      (check.status === 'pass' ? 'info' : check.status === 'warn' ? 'warning' : 'error')
                    }
                  >
                    {statusIcon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">{check.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{check.message}</div>
                    {check.affectedFiles && check.affectedFiles.length > 0 && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Files: {check.affectedFiles.slice(0, 3).join(', ')}
                        {check.affectedFiles.length > 3 && ` (+${check.affectedFiles.length - 3} more)`}
                      </div>
                    )}
                    {check.recommendation && (
                      <div className="text-[11px] text-mint mt-1">
                        Recommendation: {check.recommendation}
                      </div>
                    )}
                  </div>
                  <span className={`pill ${statusColor} ml-2`}>{check.category}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── IIoT / PLC TAB (Industrial Profile) ─── */}
        {tab === 'iiot' && showIIoT && (
          <div className="space-y-3">
            {/* Score and Summary */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="pill pill-pass">IIoT Score: {iiotReport.score}/100</span>
              <span className="pill pill-pass">{iiotReport.summary.passed} Passed</span>
              <span className="pill pill-warn">{iiotReport.summary.warnings} Warnings</span>
              <span className="pill pill-fail">{iiotReport.summary.failures} Failures</span>
            </div>

            {iiotChecks.length === 0 && (
              <p className="text-slate-500 text-center">No IIoT checks performed.</p>
            )}

            {iiotChecks.map((check: any, i: number) => {
              const statusColor =
                check.status === 'pass' ? 'pill-pass' :
                check.status === 'warn' ? 'pill-warn' : 'pill-fail';
              const statusIcon =
                check.status === 'pass' ? '✓' :
                check.status === 'warn' ? '!' : 'X';

              // Category badge colors
              const categoryColor =
                check.category === 'hardware_abstraction' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                check.category === 'deterministic_testing' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                check.category === 'fail_safe_networking' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                'bg-slate-500/20 text-slate-300 border-slate-500/40';

              return (
                <div key={i} className="find-row">
                  <div
                    className={
                      'sev-ico sev-' +
                      (check.status === 'pass' ? 'info' : check.status === 'warn' ? 'warning' : 'error')
                    }
                  >
                    {statusIcon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">{check.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{check.message}</div>
                    {check.affectedFiles && check.affectedFiles.length > 0 && (
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        📁 {check.affectedFiles.slice(0, 3).join(', ')}
                        {check.affectedFiles.length > 3 && ` (+${check.affectedFiles.length - 3} more)`}
                      </div>
                    )}
                    {check.recommendation && (
                      <div className="text-[11px] text-mint mt-1">
                        💡 {check.recommendation}
                      </div>
                    )}
                  </div>
                  <span
                    className={`pill ml-2 border ${categoryColor}`}
                    style={{ fontSize: '10px' }}
                  >
                    {check.category.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── SBOM TAB ─── */}
        {tab === 'sbom' && data.sbom && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">CycloneDX SBOM</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ecosystem: <span className="text-mint font-mono">{data.sbom.ecosystem}</span> • 
                  {data.sbom.componentCount} components detected
                </p>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(data.sbom.bom, null, 2)], { 
                    type: 'application/json' 
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sbom-cyclonedx.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold"
              >
                ⬇ Download SBOM
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-slate-300 font-mono">
                {JSON.stringify(data.sbom.bom, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* ─── SECURITY TAB ─── */}
        {tab === 'security' && data.anomalyReport && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`pill ${data.anomalyReport.riskScore < 20 ? 'pill-pass' : data.anomalyReport.riskScore < 50 ? 'pill-warn' : 'pill-fail'}`}>
                Risk Score: {data.anomalyReport.riskScore}/100
              </span>
              <span className="pill pill-fail">{data.anomalyReport.criticalCount} Critical</span>
              <span className="pill pill-warn">{data.anomalyReport.totalAnomalies} Total Anomalies</span>
            </div>

            {data.anomalyReport.anomalies.length === 0 && (
              <p className="text-mint text-center py-8">🛡️ No security anomalies detected. Repository looks clean.</p>
            )}

            {data.anomalyReport.anomalies.map((anomaly: any, i: number) => {
              const sevClass = 
                anomaly.severity === 'critical' ? 'sev-error' :
                anomaly.severity === 'high' ? 'sev-warning' : 'sev-info';
              
              return (
                <div key={i} className="find-row">
                  <div className={`sev-ico ${sevClass}`}>
                    {anomaly.severity === 'critical' ? '!' : anomaly.severity === 'high' ? '!' : 'i'}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">{anomaly.reason}</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">{anomaly.file}</div>
                    <div className="text-[11px] text-mint mt-1">💡 {anomaly.recommendation}</div>
                  </div>
                  <span className={`pill ml-2 ${
                    anomaly.severity === 'critical' ? 'pill-fail' :
                    anomaly.severity === 'high' ? 'pill-warn' : 'pill-pass'
                  }`}>
                    {anomaly.severity.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── TREE TAB ─── */}
        {tab === 'tree' && (
          <div className="font-mono text-xs text-slate-300 max-h-96 overflow-auto">
            {tree.slice(0, 200).map((t: any, i: number) => (
              <div key={i} className="py-1 px-2 hover:bg-mint/5 rounded">
                {t.path}
              </div>
            ))}
            {tree.length > 200 && (
              <div className="text-slate-500 p-2">...and {tree.length - 200} more</div>
            )}
          </div>
        )}

        {/* ─── README TAB ─── */}
        {tab === 'readme' && (
          <div className="space-y-2">
            <div className="flex gap-3">
              <span className="pill pill-pass">{verified.length} Verified</span>
              <span className="pill pill-fail">{broken.length} Broken</span>
            </div>
            {broken.map((c: any, i: number) => (
              <div
                key={i}
                className="text-xs text-rosex p-2 bg-rosex/5 rounded border border-rosex/20"
              >
                Line {c.line}: {c.target} - {c.detail}
              </div>
            ))}
            {broken.length === 0 && (
              <div className="text-mint text-sm">No README contradictions detected.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}