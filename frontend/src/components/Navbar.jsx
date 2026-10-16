import React from 'react';
import { Layers, Sparkles, Youtube, CheckCircle, FileText, Activity } from 'lucide-react';

export default function Navbar({
  sessions,
  activeSessionId,
  onSelectSession,
  onOpenIngest,
  onOpenDossier,
  onOpenVerify,
  truthScore
}) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Track Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                PodLens
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                GCP Vertex AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-Time Search-Grounded Fact-Checker
            </p>
          </div>
        </div>

        {/* Episode Selector Dropdown */}
        <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-800">
          <select
            value={activeSessionId || ''}
            onChange={(e) => onSelectSession(e.target.value)}
            className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer max-w-xs truncate"
          >
            {sessions.map((sess) => (
              <option key={sess.session_id} value={sess.session_id}>
                {sess.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Live Test Assertion */}
        <button
          onClick={onOpenVerify}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Verify Claim</span>
        </button>

        {/* Ingest YouTube */}
        <button
          onClick={onOpenIngest}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition shadow-sm"
        >
          <Youtube className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Ingest Stream</span>
        </button>

        {/* Credibility Scorecard Dossier */}
        <button
          onClick={onOpenDossier}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/30 transition shadow-md shadow-indigo-500/20"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Credibility Dossier</span>
          {truthScore !== undefined && (
            <span className="ml-1 text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/30">
              {truthScore}%
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
