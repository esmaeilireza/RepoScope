export default function ScoreBoard({ score, explanation }: { score: number; explanation: any }) {
  const C = 2 * Math.PI * 36;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#fb7185';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Needs attention' : 'Critical';
  return (
    <div className="card-static rounded-2xl p-6 anim">
      <div className="flex gap-6 items-center">
        <div className="relative w-[84px] h-[84px] shrink-0">
          <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
            <circle cx="42" cy="42" r="36" fill="none" stroke="#16233d" strokeWidth="8" />
            <circle cx="42" cy="42" r="36" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (score / 100) * C} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white">{score}</span>
            <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">health</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-extrabold" style={{ color }}>{label}</span>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            100 - ({explanation.counts.error} err x 5 + {explanation.counts.warning} warn x 2 + {explanation.counts.info} info x 0.5)
          </div>
        </div>
      </div>
      {explanation.items.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="font-black text-white text-sm">Why this score?</h3>
          {explanation.items.map((it: any, i: number) => (
            <div key={i} className="find-row">
              <div className={'sev-ico sev-' + it.severity}>{it.severity === 'error' ? 'X' : it.severity === 'warning' ? '!' : 'i'}</div>
              <div className="flex-1">
                <div className="flex justify-between gap-2 flex-wrap">
                  <span className="font-bold text-xs text-white">{it.title}</span>
                  <span className={'pill ' + (it.severity === 'error' ? 'pill-fail' : it.severity === 'warning' ? 'pill-warn' : 'pill-info')}>-{it.penalty}</span>
                </div>
                {it.fix && <div className="text-[11px] text-mint mt-1">Fix: {it.fix}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
