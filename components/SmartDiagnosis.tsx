'use client';
import { useState } from 'react';
import { DiagnosticResult } from '@/lib/github-diagnostics';
import { generateRunSpecificCommands } from '@/lib/github-diagnostics';
import { generateFixProposals, generateFixCommands, FixProposal } from '@/lib/github-auto-fix';

interface SmartDiagnosisProps {
  diagnostic: DiagnosticResult;
  runId: number;
  owner: string;
  repo: string;
}

export default function SmartDiagnosis({
  diagnostic,
  runId,
  owner,
  repo,
}: SmartDiagnosisProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'fixes' | 'logs'>('diagnosis');
  const [copied, setCopied] = useState<string | null>(null);

  const fixProposals = generateFixProposals(diagnostic.patterns);
  const commands = generateRunSpecificCommands(runId, diagnostic.patterns);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const severityConfig = {
    critical: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-200', icon: '🚨' },
    error: { bg: 'bg-orange-500/15', border: 'border-orange-500/50', text: 'text-orange-200', icon: '❌' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-200', icon: '⚠️' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-200', icon: 'ℹ️' },
  };

  const highestSeverity = diagnostic.patterns.reduce((max, p) => {
    const order = { critical: 4, error: 3, warning: 2, info: 1 };
    return order[p.severity] > order[max] ? p.severity : max;
  }, 'info' as const);

  const config = severityConfig[highestSeverity];

  return (
    <div className={`rounded-xl p-5 ${config.bg} border-2 ${config.border} shadow-2xl`}>
      {/* Header with AI badge */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className={`font-bold text-lg ${config.text}`}>
              {diagnostic.summary}
            </h4>
            <span className="px-2 py-0.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-full text-xs font-semibold">
              🤖 AI Diagnosis • {diagnostic.confidence}% confidence
            </span>
            {diagnostic.isRecurring && (
              <span className="px-2 py-0.5 bg-red-600/30 text-red-200 border border-red-500/50 rounded-full text-xs">
                🔁 Recurring Issue
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300">
            Priority: <span className="font-semibold">{diagnostic.suggestedPriority.toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        {[
          { id: 'diagnosis', label: '🔍 Diagnosis', count: diagnostic.patterns.length },
          { id: 'fixes', label: '⚡ Auto-Fixes', count: fixProposals.length },
          { id: 'logs', label: '📄 Logs', count: diagnostic.parsedLogs.errors.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Diagnosis Tab */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-4">
          {diagnostic.patterns.map((pattern, idx) => (
            <div key={idx} className="p-4 bg-black/30 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-white">{pattern.title}</h5>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  pattern.severity === 'critical' ? 'bg-red-600' :
                  pattern.severity === 'error' ? 'bg-orange-600' :
                  pattern.severity === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
                } text-white`}>
                  {pattern.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-3">{pattern.solution.explanation}</p>
              
              <div className="mb-3">
                <h6 className="text-xs font-semibold text-gray-400 mb-1">📋 Solution Steps:</h6>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  {pattern.solution.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-200">
                💡 <strong>Prevent in future:</strong> {pattern.solution.preventInFuture}
              </div>

              {pattern.solution.docsUrl && (
                <a
                  href={pattern.solution.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  📚 Official Docs →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Auto-Fixes Tab */}
      {activeTab === 'fixes' && (
        <div className="space-y-4">
          {fixProposals.length === 0 ? (
            <div className="p-6 bg-gray-900/50 rounded-lg text-center text-gray-400">
              <p className="text-4xl mb-2">🔧</p>
              <p>No automatic fixes available for these issues.</p>
              <p className="text-sm mt-2">Manual intervention required.</p>
            </div>
          ) : (
            fixProposals.map((fix, idx) => (
              <FixProposalCard
                key={idx}
                fix={fix}
                owner={owner}
                repo={repo}
                copied={copied}
                onCopy={copyText}
              />
            ))
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="p-4 bg-black/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-semibold text-white">📊 Log Summary</h5>
              <span className="text-xs text-gray-400">{diagnostic.parsedLogs.summary}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-red-500/10 rounded">
                <div className="text-xs text-gray-400">Errors</div>
                <div className="text-lg font-bold text-red-300">
                  {diagnostic.parsedLogs.errors.length}
                </div>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded">
                <div className="text-xs text-gray-400">Warnings</div>
                <div className="text-lg font-bold text-yellow-300">
                  {diagnostic.parsedLogs.warnings.length}
                </div>
              </div>
            </div>
          </div>

          {diagnostic.parsedLogs.errors.length > 0 && (
            <div className="bg-black/40 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
                <span className="text-xs font-mono text-gray-400">❌ Error Logs</span>
                <button
                  onClick={() => copyText(
                    diagnostic.parsedLogs.errors.map(e => e.content).join('\n'),
                    'error-logs'
                  )}
                  className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  {copied === 'error-logs' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {diagnostic.parsedLogs.errors.slice(0, 20).map((error, idx) => (
                  <div key={idx} className="p-3 border-b border-gray-800 last:border-0">
                    {error.file && (
                      <div className="text-xs text-gray-500 font-mono mb-1">
                        📍 {error.file}:{error.lineNumber}
                      </div>
                    )}
                    <div className="text-xs font-mono text-red-300 break-all">
                      {error.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Master Commands Section */}
      <div className="mt-4 bg-black/40 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
          <span className="text-xs font-mono text-gray-400">
            💻 Master Terminal Commands
          </span>
          <button
            onClick={() => copyText(commands.join('\n'), 'all-commands')}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            {copied === 'all-commands' ? '✓ Copied!' : '📋 Copy All'}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-green-400 overflow-x-auto max-h-64">
          {commands.join('\n')}
        </pre>
      </div>
    </div>
  );
}

// Sub-component for fix proposals
function FixProposalCard({
  fix,
  owner,
  repo,
  copied,
  onCopy,
}: {
  fix: FixProposal;
  owner: string;
  repo: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const riskColors = {
    low: 'bg-green-600',
    medium: 'bg-yellow-600',
    high: 'bg-red-600',
  };

  const fixCommands = generateFixCommands(fix, owner, repo);

  return (
    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/30">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-semibold text-white mb-1">⚡ {fix.pattern.title}</h5>
          <p className="text-xs text-gray-400">{fix.patch.description}</p>
        </div>
        <div className="flex gap-1">
          <span className={`text-xs px-2 py-0.5 rounded text-white ${riskColors[fix.risk]}`}>
            {fix.risk.toUpperCase()} RISK
          </span>
          <span className="text-xs px-2 py-0.5 bg-blue-600 rounded text-white">
            {fix.confidence}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <div className="text-gray-400 mb-1">❌ Before:</div>
          <pre className="p-2 bg-red-500/10 rounded border border-red-500/20 overflow-x-auto">
            {fix.preview.before.slice(0, 200)}...
          </pre>
        </div>
        <div>
          <div className="text-gray-400 mb-1">✅ After:</div>
          <pre className="p-2 bg-green-500/10 rounded border border-green-500/20 overflow-x-auto">
            {fix.preview.after.slice(0, 200)}...
          </pre>
        </div>
      </div>

      <button
        onClick={() => onCopy(fixCommands.join('\n'), `fix-${fix.pattern.id}`)}
        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded font-medium text-white text-sm transition"
      >
        {copied === `fix-${fix.pattern.id}` 
          ? '✓ Commands Copied! Paste in Terminal' 
          : '📋 Copy Auto-Fix Commands'}
      </button>
    </div>
  );
}