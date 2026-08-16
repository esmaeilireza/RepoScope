import { FormattedError } from '@/lib/github';
import StatusBadge from './StatusBadge';
import CommandBlock from './CommandBlock';

interface ErrorCardProps {
  run: FormattedError;
  expanded: boolean;
  onToggle: () => void;
}

export default function ErrorCard({ run, expanded, onToggle }: ErrorCardProps) {
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
            <span className="text-xs text-gray-500 font-mono">
              #{run.id}
            </span>
          </div>
          
          <h3 className="text-base font-medium text-gray-100 truncate">
            {run.title}
          </h3>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              🌿 <span className="font-mono">{run.branch}</span>
            </span>
            <span className="flex items-center gap-1">
              🕐 {run.age}
            </span>
          </div>
        </div>
        
        <div className="text-gray-400 text-xl">
          {expanded ? '−' : '+'}
        </div>
      </button>
      
      {expanded && run.status === 'failure' && (
        <div className="px-4 pb-4 border-t border-gray-800">
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="text-sm text-yellow-200">
              💡 <strong>Suggestion:</strong> {run.suggestedFix}
            </p>
          </div>
          
          <CommandBlock commands={run.commands} />
          
          <div className="mt-4 flex gap-2">
            <a
              href={`https://github.com/esmaeilireza/RepoScope/actions/runs/${run.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              🔗 View on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}