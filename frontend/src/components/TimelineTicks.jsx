import React from 'react';

export default function TimelineTicks({ claims, duration, currentTime, onSeek }) {
  if (!duration || duration <= 0 || !claims || claims.length === 0) return null;

  return (
    <div className="relative w-full h-3 flex items-center">
      {claims.map((claim) => {
        const leftPercent = Math.min(100, Math.max(0, (claim.timestamp_start / duration) * 100));
        const isActive = currentTime >= claim.timestamp_start && currentTime <= claim.timestamp_end;

        let colorBg = 'bg-emerald-400';
        let colorBorder = 'border-emerald-500';
        let glowClass = 'shadow-emerald-500/50';

        if (claim.status === 'CONTESTED') {
          colorBg = 'bg-amber-400';
          colorBorder = 'border-amber-500';
          glowClass = 'shadow-amber-500/50';
        } else if (claim.status === 'UNSUPPORTED') {
          colorBg = 'bg-rose-500';
          colorBorder = 'border-rose-600';
          glowClass = 'shadow-rose-500/50';
        }

        return (
          <button
            key={claim.id}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(claim.timestamp_start);
            }}
            title={`[${claim.status}] ${claim.claim_text.substring(0, 60)}...`}
            style={{ left: `${leftPercent}%` }}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-20 cursor-pointer focus:outline-none`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${colorBg} border ${colorBorder} transition-transform ${
                isActive ? 'scale-150 ring-2 ring-white shadow-lg ' + glowClass : 'hover:scale-125'
              }`}
            />
            {/* Tooltip on hover */}
            <div className="hidden group-hover:flex absolute bottom-4 -translate-x-1/2 left-1/2 flex-col items-center pointer-events-none z-30">
              <div className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-medium py-1 px-2 rounded shadow-xl whitespace-nowrap max-w-xs truncate">
                <span className="font-bold text-white">[{claim.status}]</span> {claim.claim_text.substring(0, 45)}...
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
