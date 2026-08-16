'use client';

export default function ScoreBoard({ score, explanation }: { score: number; explanation: any }) {
  const C = 2 * Math.PI * 36;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#fb7185';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Needs attention' : 'Critical';

  const offset = C - (score / 100) * C;

  return (
    <div className="card-static rounded-2xl p-6 anim">
      {/* Score Circle Section */}
      <div className="flex items-center gap-8 mb-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="#22314e"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black" style={{ color }}>
              {score}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2">
            <span className="text-lg font-black text-white block">Health Score</span>
            <span className="text-xs font-extrabold" style={{ color }}>{label}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            {explanation.critical > 0 && <span>{explanation.critical} critical </span>}
            {explanation.errors > 0 && <span>{explanation.errors} errors </span>}
            {explanation.warnings > 0 && <span>{explanation.warnings} warnings </span>}
            {explanation.infos > 0 && <span>{explanation.infos} info</span>}
          </div>
        </div>
      </div>

      {/* Why this score section */}
      <div className="border-t border-edge pt-4">
        <h3 className="text-sm font-black text-white mb-3">Why this score?</h3>
        <div className="space-y-2">
          {explanation.items && explanation.items.map((item: any, idx: number) => {
            const icoClass = item.severity === 'critical' || item.severity === 'error'
              ? 'sev-error'
              : item.severity === 'warning'
              ? 'sev-warning'
              : 'sev-info';
            
            const ico = item.severity === 'critical' ? '!!!'
                      : item.severity === 'error' ? '!!'
                      : item.severity === 'warning' ? '!'
                      : 'i';

            return (
              <div key={idx} className="find-row">
                <div className={`sev-ico ${icoClass}`}>{ico}</div>
                
                <div className="flex-1 min-w-0">
                  {/* Row 1: Title + Points (separate line) */}
                  <div className="mb-1">
                    <span className="font-bold text-white text-sm">
                      {item.title}
                    </span>
                    {item.points > 0 && (
                      <span className="ml-3 text-xs font-mono text-rosex font-bold">
                        (-{item.points} pts)
                      </span>
                    )}
                  </div>
                  
                  {/* Row 2: Detail */}
                  <p className="text-slate-400 text-xs mb-1">
                    {item.detail}
                  </p>
                  
                  {/* Row 3: Fix suggestion */}
                  <p className="text-mint text-xs">
                    <span className="font-bold">Fix:</span> {item.fix}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
