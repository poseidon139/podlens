import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Radio, 
  FileText, 
  Volume2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
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
  onOpenVerify,
  sessionContext = null,
  sessionId = null
}) {
  const [activeTab, setActiveTab] = useState('SPEECH_LOG'); // 'SPEECH_LOG' | 'CLAIMS_DOSSIER'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFullArchive, setShowFullArchive] = useState(false);

  // Filter claims for Claims Dossier tab
  const filteredClaims = claims.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter || c.status?.value === statusFilter;
  });

  const verifiedCount = claims.filter(c => c.status === 'VERIFIED' || c.status?.value === 'VERIFIED').length;
  const contestedCount = claims.filter(c => c.status === 'CONTESTED' || c.status?.value === 'CONTESTED').length;
  const unsupportedCount = claims.filter(c => c.status === 'UNSUPPORTED' || c.status?.value === 'UNSUPPORTED').length;
  const unverifiedCount = claims.filter(c => c.status === 'UNVERIFIED' || c.status?.value === 'UNVERIFIED').length;

  // Sort claims so active claim is on top, followed by most recently spoken claims
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (a.id === activeClaimId) return -1;
    if (b.id === activeClaimId) return 1;
    return (b.timestamp_start || 0) - (a.timestamp_start || 0);
  });

  // Filter and reverse spoken lines so the MOST RECENT line is always on TOP
  const spokenLines = transcriptLines.filter((l) => l.start <= currentTime + 1.2);
  const reversedSpoken = [...spokenLines].reverse();
  
  // Show only recent lines (top 5) to keep it neat and disappear older lines
  const visibleSpeechLines = showFullArchive ? reversedSpoken : reversedSpoken.slice(0, 5);

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
            <span>Live Speech Log</span>
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

      {/* Active Knowledge Profile & Domain Context Strip */}
      {sessionContext?.domain && (
        <div className="px-3.5 py-2 bg-indigo-950/40 border-b border-indigo-900/40 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="text-xs">🧠</span>
              <span className="font-semibold text-indigo-200 truncate">{sessionContext.domain}</span>
            </div>
            {sessionContext.speaker && (
              <span className="text-slate-400 text-[10px] truncate max-w-[120px]">
                {sessionContext.speaker}
              </span>
            )}
          </div>
          {sessionContext.key_entities && sessionContext.key_entities.length > 0 && (
            <div className="flex items-center space-x-1 overflow-x-auto py-0.5 text-[9px] font-mono text-indigo-300">
              {sessionContext.key_entities.slice(0, 4).map((entity, i) => (
                <span
                  key={i}
                  className="shrink-0 px-1.5 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/40"
                >
                  {entity}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Header: Filters or Live Feed Indicator */}
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

          <button
            onClick={() => setStatusFilter('UNVERIFIED')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              statusFilter === 'UNVERIFIED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Unverified ({unverifiedCount})</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">Latest speech at top • Older speech pruned</span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
            {spokenLines.length} spoken
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
        {activeTab === 'SPEECH_LOG' ? (
          /* TAB 1: Recent Speech on Top, Cleanly Pruned */
          spokenLines.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-300">Play video to start continuous speech stream</p>
              <p className="text-[11px] text-slate-500">Statements will appear at the top in real time</p>
            </div>
          ) : (
            <>
              {visibleSpeechLines.map((line, index) => {
                const isCurrent = index === 0 && currentSpeechLine?.id === line.id;

                return (
                  <div
                    key={line.id}
                    onClick={() => onJumpToTime && onJumpToTime(line.start)}
                    className={`relative p-3 rounded-xl border text-xs cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${
                      isCurrent
                        ? line.badge_color === 'green'
                          ? 'bg-emerald-950/80 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40 text-emerald-100'
                          : line.badge_color === 'amber'
                          ? 'bg-amber-950/80 border-amber-500/80 shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/40 text-amber-100'
                          : line.badge_color === 'red'
                          ? 'bg-rose-950/80 border-rose-500/80 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/40 text-rose-100'
                          : 'bg-slate-900/90 border-slate-600/80 shadow-lg shadow-black/50 ring-2 ring-white/30 text-white'
                        : line.badge_color === 'green'
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                        : index === 1
                        ? 'bg-slate-900/80 border-slate-800 text-white'
                        : index === 2
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-200 opacity-90'
                        : index === 3
                        ? 'bg-slate-900/40 border-slate-800/60 text-slate-300 opacity-75'
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      {/* Timestamp & Speaker */}
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition ${
                          isCurrent
                            ? 'bg-white text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {formatTime(line.start)}
                        </span>
                        <span className="font-semibold text-slate-200 text-[11px] truncate max-w-[130px]">
                          {line.speaker || 'Speaker'}
                        </span>
                      </div>

                      {/* Small Status Icon that changes color in real-time */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors duration-300 ${
                          line.badge_color === 'green'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : line.badge_color === 'amber'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : line.badge_color === 'red'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {line.badge_color === 'green' ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> :
                           line.badge_color === 'amber' ? <AlertTriangle className="w-3 h-3 text-amber-400" /> :
                           line.badge_color === 'red' ? <XCircle className="w-3 h-3 text-rose-400" /> :
                           <Sparkles className="w-3 h-3 text-white" />}
                          <span>{line.status}</span>
                        </span>

                        {isCurrent && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Speech Text */}
                    <p className={`leading-relaxed text-[12px] font-medium ${
                      isCurrent ? 'text-white font-semibold' : 'text-slate-100'
                    }`}>
                      "{line.text}"
                    </p>

                    {/* Supporting Resource Label if Verified Fact */}
                    {line.resource && (
                      <div className="mt-1.5 flex items-center space-x-1 text-[11px] text-emerald-300 font-medium">
                        <span className="font-semibold text-emerald-400">Supporting Resource:</span>
                        <span className="truncate">{line.resource}</span>
                      </div>
                    )}

                    {/* Fact-check consensus explanation on active sentence */}
                    {line.verdict_summary && isCurrent && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-[11px] opacity-90 leading-tight">
                        <span className="font-semibold text-slate-300">Grounding consensus: </span>
                        {line.verdict_summary}
                      </div>
                    )}

                    {line.claim_id && (
                      <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
                        <span>Empirical Claim Dossier</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-80" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Toggle to expand/collapse older archive if desired */}
              {spokenLines.length > 5 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setShowFullArchive(!showFullArchive)}
                    className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition py-1 px-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800"
                  >
                    {showFullArchive ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        <span>Show Recent 5 Lines Only</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>Show Full Spoken History ({spokenLines.length - 5} older)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
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
            sortedClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                isActive={claim.id === activeClaimId}
                onJumpToTime={onJumpToTime}
                sessionId={sessionId || claim.session_id}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}
