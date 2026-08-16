import { FormattedRun } from '@/hooks/useGitHubActions';
import StatusBadge from './StatusBadge';
import SmartDiagnosis from './SmartDiagnosis';

interface ErrorCardProps {
  run: FormattedRun;
  expanded: boolean;
  onToggle: () => void;
  owner: string;
  repo: string;
}

export default function ErrorCard({ run, expanded, onToggle, owner, repo }: ErrorCardProps) {
  return (
    <div
      className={`border rounded-lg transition-all ${
        run.status === 'failure'
          ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
          : run.status === 'success'
          ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
          : 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <StatusBadge status={run.status} />
            <span className="text-xs text-gray-500 font-mono">#{run.id}</span>
            {run.diagnostic && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs">
                Ì¥ñ Smart Diagnosis
              </span>
            )}
          </div>

          <h3 className="text-base font-medium text-gray-100 truncate">
            {run.title}
          </h3>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              Ìºø <span className="font-mono">{run.branch}</span>
            </span>
            <span className="flex items-center gap-1">Ìµê {run.age}</span>
          </div>
        </div>

        <div className="text-gray-400 text-xl">
          {expanded ? '‚àí' : '+'}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-4">
          {run.status === 'failure' && run.diagnostic ? (
            <SmartDiagnosis
              diagnostic={run.diagnostic}
              runId={run.id}
              owner={owner}
              repo={repo}
            />
          ) : run.status === 'failure' ? (
            <div className="p-4 bg-gray-900/50 rounded-lg text-gray-400 text-sm">
              <p className="mb-3">
                ‚ÑπÔ∏è No automatic diagnosis available. Use these commands to inspect:
              </p>
              <pre className="bg-black/40 p-3 rounded text-xs font-mono text-green-400 overflow-x-auto">
{`gh run view ${run.id} --log-failed
gh run view ${run.id} --web
gh run delete ${run.id}`}
              </pre>
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 rounded-lg text-green-300 text-sm flex items-center gap-2">
              ‚úÖ <span>This run completed successfully!</span>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <a
              href={`https://github.com/${owner}/${repo}/actions/runs/${run.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              Ì¥ó View on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
