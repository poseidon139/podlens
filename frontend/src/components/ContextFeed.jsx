import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Sparkles, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Radio, 
  FileText, 
  Play, 
  Volume2, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import ClaimCard from './ClaimCard';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ContextFeed({
  claims = [],
  activeClaimId,
  transcriptLines = [],
  currentSpeechLine = null,
  currentTime = 0,
  onJumpToTime,
  isWsConnected = false,
  onOpenVerify
}) {
  const [activeTab, setActiveTab] = useState('SPEECH_LOG'); // 'SPEECH_LOG' | 'CLAIMS_DOSSIER'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [autoFollow, setAutoFollow] = useState(true);

  const activeLineRef = useRef(null);
  const feedContainerRef = useRef(null);

  // Auto-scroll to follow speaker in real-time
  useEffect(() => {
    if (activeTab === 'SPEECH_LOG' && autoFollow && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentSpeechLine?.id, activeTab, autoFollow]);

  // Filter claims
  const filteredClaims = claims.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const verifiedCount = claims.filter(c => c.status === 'VERIFIED').length;
  const contestedCount = claims.filter(c => c.status === 'CONTESTED').length;
  const unsupportedCount = claims.filter(c => c.status === 'UNSUPPORTED').length;

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Header & Tab Navigation */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-sm tracking-tight text-white">
              Real-Time Verification Feed
            </h2>
          </div>

          {/* WebSocket / Live Sync Indicator */}
          <div className="flex items-center space-x-1.5 text-[11px] font-medium">
            <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-400 font-mono">
              {isWsConnected ? 'Live Grounding' : 'Polling'}
            </span>
          </div>
        </div>

        {/* Primary View Toggle: Live Speech Log vs Grounded Claims */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('SPEECH_LOG')}
            className={`flex items-center justify-center space-x-2 py-1.5 rounded-lg transition ${
              activeTab === 'SPEECH_LOG'
                ? 'bg-indigo-600 text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${activeTab === 'SPEECH_LOG' ? 'text-indigo-200 animate-pulse' : ''}`} />
            <span>Live Speech Log ({transcriptLines.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLAIMS_DOSSIER')}
            className={`flex items-center justify-center space-x-2 py-1.5 rounded-lg transition ${
              activeTab === 'CLAIMS_DOSSIER'
                ? 'bg-indigo-600 text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Claims Dossier ({claims.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Sub-Header: Filters or Auto-Follow Controls */}
      {activeTab === 'CLAIMS_DOSSIER' ? (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All ({claims.length})
          </button>

          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Verified ({verifiedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('CONTESTED')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              statusFilter === 'CONTESTED'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Contested ({contestedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('UNSUPPORTED')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              statusFilter === 'UNSUPPORTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Refuted ({unsupportedCount})</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Continuous line-by-line speech fact-checking</span>
          </div>

          <label className="flex items-center space-x-1.5 cursor-pointer select-none text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={autoFollow}
              onChange={(e) => setAutoFollow(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Auto-Follow</span>
          </label>
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={feedContainerRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-2.5 scroll-smooth"
      >
        {activeTab === 'SPEECH_LOG' ? (
          /* TAB 1: Continuous Live Speech Log with Real-Time Color Shifts */
          transcriptLines.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs font-medium text-slate-300">Loading synchronized speech transcript...</p>
            </div>
          ) : (
            transcriptLines.map((line) => {
              const isActive = currentSpeechLine?.id === line.id;
              const isPast = currentTime > (line.end || line.start + line.duration);

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onJumpToTime && onJumpToTime(line.start)}
                  className={`group relative p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${
                    isActive
                      ? line.badge_color === 'green'
                        ? 'bg-emerald-950/70 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40'
                        : line.badge_color === 'amber'
                        ? 'bg-amber-950/70 border-amber-500/80 shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/40'
                        : line.badge_color === 'red'
                        ? 'bg-rose-950/70 border-rose-500/80 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/40'
                        : 'bg-indigo-950/70 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/40'
                      : isPast
                      ? 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60 hover:opacity-100 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    {/* Timestamp & Speaker */}
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition ${
                        isActive
                          ? 'bg-white text-slate-950 font-bold'
                          : 'bg-slate-800/90 text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {formatTime(line.start)}
                      </span>
                      <span className="font-semibold text-slate-300 text-[11px] truncate max-w-[140px]">
                        {line.speaker || 'Speaker'}
                      </span>
                    </div>

                    {/* Small Status Icon turning color in real-time */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors duration-300 ${
                        line.badge_color === 'green'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : line.badge_color === 'amber'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : line.badge_color === 'red'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {line.badge_color === 'green' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                        {line.badge_color === 'amber' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {line.badge_color === 'red' && <XCircle className="w-3 h-3 text-rose-400" />}
                        {line.badge_color === 'blue' && <Sparkles className="w-3 h-3 text-indigo-400" />}
                        <span>{line.status}</span>
                      </span>

                      {isActive && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verbatim Speech Utterance */}
                  <p className={`leading-relaxed text-[12px] font-medium transition ${
                    isActive ? 'text-white font-semibold' : isPast ? 'text-slate-200' : 'text-slate-400'
                  }`}>
                    "{line.text}"
                  </p>

                  {/* Fact-check verdict explanation if present */}
                  {line.verdict_summary && isActive && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[11px] opacity-90 leading-tight">
                      <span className="font-semibold text-slate-300">Grounding consensus: </span>
                      {line.verdict_summary}
                    </div>
                  )}

                  {line.claim_id && (
                    <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-indigo-400 font-medium">
                      <span>Empirical Claim Link</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-80" />
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* TAB 2: Major Fact-Checked Claims Dossier */
          claims.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Fresh Stream Loaded</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  No empirical claims have been evaluated for this episode yet.
                </p>
              </div>
              {onOpenVerify && (
                <button
                  onClick={onOpenVerify}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition"
                >
                  + Verify a Statement from this Video
                </button>
              )}
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Filter className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">No claims match the selected filter.</p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                isActive={claim.id === activeClaimId}
                onJumpToTime={onJumpToTime}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}
