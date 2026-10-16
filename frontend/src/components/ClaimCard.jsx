import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, ExternalLink, Clock, Copy, Check, BookOpen } from 'lucide-react';

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ClaimCard({ claim, isActive, onJumpToTime }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCitation = (e) => {
    e.stopPropagation();
    const text = `Claim: "${claim.claim_text}" (${claim.status})\nConsensus: ${claim.verdict_summary}\nSources: ${claim.citations.map(c => `${c.title} (${c.url})`).join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let statusConfig = {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    label: 'VERIFIED',
    border: isActive ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
  };

  if (claim.status === 'CONTESTED') {
    statusConfig = {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      label: 'CONTESTED',
      border: isActive ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
    };
  } else if (claim.status === 'UNSUPPORTED') {
    statusConfig = {
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
      label: 'UNSUPPORTED',
      border: isActive ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-800 hover:border-slate-700'
    };
  }

  return (
    <div
      onClick={() => onJumpToTime(claim.timestamp_start)}
      className={`rounded-xl p-4 bg-slate-900/80 transition-all duration-300 border cursor-pointer relative overflow-hidden ${statusConfig.border} ${
        isActive ? 'ring-2 ring-indigo-500/50 scale-[1.01]' : ''
      }`}
    >
      {/* Top Bar: Status, Category & Timecode */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${statusConfig.badge}`}>
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </span>

          <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
            {claim.category ? claim.category.replace('_', ' ') : 'CLAIM'}
          </span>
        </div>

        {/* Timecode Trigger Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJumpToTime(claim.timestamp_start);
          }}
          className="flex items-center space-x-1 text-[11px] font-mono text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700/40 transition"
          title="Jump to this time in video"
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(claim.timestamp_start)}</span>
        </button>
      </div>

      {/* Speaker and Quote */}
      <div className="mb-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {claim.speaker || 'Speaker'} Stated:
        </p>
        <p className="text-sm font-medium text-slate-100 leading-snug">
          "{claim.claim_text}"
        </p>
      </div>

      {/* Grounded Consensus Summary */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-3 text-xs leading-relaxed text-slate-300">
        <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider mb-1">
          Grounded Consensus:
        </span>
        {claim.verdict_summary}
      </div>

      {/* Citations List */}
      {claim.citations && claim.citations.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center space-x-1">
            <BookOpen className="w-3 h-3 text-indigo-400" />
            <span>Primary Sources & Literature:</span>
          </span>
          <div className="flex flex-col space-y-1">
            {claim.citations.map((cit, idx) => (
              <a
                key={idx}
                href={cit.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="group flex items-start justify-between text-xs p-1.5 rounded-md hover:bg-slate-800/60 transition text-slate-300 hover:text-indigo-300"
              >
                <div className="flex-1 pr-2">
                  <p className="font-medium line-clamp-1 group-hover:underline">
                    {cit.title}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {cit.source} {cit.type ? `• ${cit.type}` : ''}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Footer: Quick Copy Citation */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
        <span>Confidence: {claim.confidence_score ? Math.round(claim.confidence_score * 100) : 95}%</span>
        <button
          onClick={handleCopyCitation}
          className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy Citation'}</span>
        </button>
      </div>
    </div>
  );
}
