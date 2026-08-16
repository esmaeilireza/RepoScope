'use client';

export default function Board({ sections }: { sections: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'pill-pass';
      case 'warn': return 'pill-warn';
      case 'fail': return 'pill-fail';
      default: return 'pill-info';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'pass': return 'PASS';
      case 'warn': return 'WARN';
      case 'fail': return 'FAIL';
      default: return 'INFO';
    }
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="card-static rounded-2xl p-6">
        <p className="text-slate-400 text-sm">No sections to display</p>
      </div>
    );
  }

  return (
    <div className="card-static rounded-2xl p-6">
      <h3 className="text-lg font-black text-white mb-4">Repository Sections</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map((section, idx) => (
          <div key={idx} className="find-row">
            <div className={`sev-ico sev-${section.status}`}>
              {getIcon(section.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm truncate">
                  {section.title}
                </span>
                <span className={`pill ${getStatusColor(section.status)}`}>
                  {section.status.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-400 text-xs line-clamp-2">
                {section.detail || 'No details available'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
