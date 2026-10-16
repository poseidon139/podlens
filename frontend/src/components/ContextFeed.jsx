import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, Filter, CheckCircle2, AlertCircle, XOctagon } from 'lucide-react';
import ClaimCard from './ClaimCard';

export default function ContextFeed({
  claims = [],
  activeClaimId,
  currentTime,
  onJumpToTime,
  isWsConnected = false,
  onOpenVerify
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const feedContainerRef = useRef(null);

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
      {/* Header & Live Sync Status */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-indigo-400" />
          <h2 className="font-bold text-sm tracking-tight text-white">
            Context Lens Feed
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {claims.length}
          </span>
        </div>

        {/* WebSocket Real-time Indicator */}
        <div className="flex items-center space-x-1.5 text-[11px] font-medium">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-slate-400">
            {isWsConnected ? 'Live Sync' : 'Polling'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto">
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

      {/* Synchronized Claims Scroll Feed */}
      <div
        ref={feedContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3.5"
      >
        {claims.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Fresh Stream Loaded</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                No claims have been evaluated for this episode yet.
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
        )}
      </div>
    </div>
  );
}
