'use client';
import { useState } from 'react';

interface CommandBlockProps {
  commands: {
    inspect: string;
    delete: string;
    list: string;
  };
}

export default function CommandBlock({ commands }: CommandBlockProps) {
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const copyAll = () => {
    const allCommands = `# ${commands.list}\n${commands.list}\n\n# Inspect failed run\n${commands.inspect}\n\n# Delete if outdated\n${commands.delete}`;
    copyToClipboard(allCommands, 'all');
  };
  
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">
          💻 Terminal Commands
        </span>
        <button
          onClick={copyAll}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition"
        >
          {copied === 'all' ? '✓ Copied!' : '📋 Copy All'}
        </button>
      </div>
      
      {[
        { label: 'Inspect logs', cmd: commands.inspect, key: 'inspect' },
        { label: 'Delete run', cmd: commands.delete, key: 'delete' },
      ].map(({ label, cmd, key }) => (
        <div
          key={key}
          className="group relative bg-black/50 border border-gray-700 rounded p-3 font-mono text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 overflow-x-auto">
              <span className="text-green-400">$ </span>
              <span className="text-gray-200">{cmd}</span>
            </div>
            <button
              onClick={() => copyToClipboard(cmd, key)}
              className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              {copied === key ? '✓' : '📋'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}