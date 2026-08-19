'use client';

import { useState } from 'react';
import { buildAuditJson, buildAuditMarkdown, AuditExportResult } from '@/lib/export';

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ result }: { result: AuditExportResult }) {
  const [format, setFormat] = useState<string | null>(null);
  const baseName = String(result.meta.full_name || 'reposcope-audit').replace(/[^a-z0-9._-]+/gi, '-');

  function exportJson() {
    download(`${baseName}-audit.json`, JSON.stringify(buildAuditJson(result), null, 2), 'application/json');
    setFormat('JSON');
  }

  function exportMarkdown() {
    download(`${baseName}-audit.md`, buildAuditMarkdown(result), 'text/markdown');
    setFormat('Markdown');
  }

  return (
    <section className="card-static rounded-2xl p-5" aria-labelledby="export-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="export-heading" className="text-sm font-black text-white">Export audit results</h2>
          <p className="text-xs text-slate-400 mt-1">Download a shareable report without leaving your browser.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportJson} className="rounded-lg border border-edge px-3 py-2 text-xs font-bold text-slate-200 hover:border-mint hover:text-mint">
            JSON
          </button>
          <button type="button" onClick={exportMarkdown} className="rounded-lg border border-edge px-3 py-2 text-xs font-bold text-slate-200 hover:border-mint hover:text-mint">
            Markdown
          </button>
        </div>
      </div>
      {format && <p className="mt-3 text-xs text-mint" role="status">Downloaded {format} report.</p>}
    </section>
  );
}
