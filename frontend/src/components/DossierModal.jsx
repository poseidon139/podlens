import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, CheckCircle2, AlertTriangle, XCircle, Share2 } from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function DossierModal({ session, metrics: propMetrics, claims = [], isOpen, onClose }) {
  const [copiedBibliography, setCopiedBibliography] = useState(false);

  if (!isOpen || !session) return null;

  const metrics = propMetrics || {
    verified: claims.filter(c => (c.status === 'VERIFIED' || c.status?.value === 'VERIFIED')).length,
    contested: claims.filter(c => (c.status === 'CONTESTED' || c.status?.value === 'CONTESTED')).length,
    unsupported: claims.filter(c => (c.status === 'UNSUPPORTED' || c.status?.value === 'UNSUPPORTED')).length,
    total_claims: claims.length,
    truth_score: claims.length > 0 ? Math.round((claims.filter(c => (c.status === 'VERIFIED' || c.status?.value === 'VERIFIED')).length / claims.length) * 100) : (session.metrics?.truth_score || 100)
  };

  const handleCopyBibliography = () => {
    let text = `# Bibliography & Context Dossier: ${session.title}\n\n`;
    claims.forEach((c, idx) => {
      text += `### ${idx + 1}. [${c.status}] "${c.claim_text}"\n`;
      text += `Consensus: ${c.verdict_summary}\n`;
      if (c.citations && c.citations.length > 0) {
        text += `Primary Sources:\n`;
        c.citations.forEach(cit => {
          text += `- ${cit.title} (${cit.source}): ${cit.url}\n`;
        });
      }
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    setCopiedBibliography(true);
    setTimeout(() => setCopiedBibliography(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Truth & Context Dossier
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {session.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Truth Score Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                Episode Credibility Index
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-4xl font-extrabold text-white font-mono">
                  {metrics.truth_score}%
                </span>
                <span className="text-xs text-slate-400">
                  of factual statements verified by literature
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-200 font-mono">
                {metrics.total_claims}
              </span>
              <p className="text-[11px] text-slate-400">Total Assertions Detected</p>
            </div>
          </div>

          {/* Breakdown Distribution Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
              <span>Status Distribution</span>
              <span className="text-slate-500 font-mono">
                {metrics.verified} Verified • {metrics.contested} Contested • {metrics.unsupported} Refuted
              </span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(metrics.verified / (metrics.total_claims || 1)) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Verified: ${metrics.verified}`}
              />
              <div
                style={{ width: `${(metrics.contested / (metrics.total_claims || 1)) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Contested: ${metrics.contested}`}
              />
              <div
                style={{ width: `${(metrics.unsupported / (metrics.total_claims || 1)) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Unsupported: ${metrics.unsupported}`}
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/20 flex flex-col">
              <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold uppercase mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
              <span className="text-2xl font-bold text-white font-mono">{metrics.verified}</span>
              <span className="text-[10px] text-slate-400 mt-1">Backed by peer-reviewed consensus</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-500/20 flex flex-col">
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-semibold uppercase mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Contested</span>
              </div>
              <span className="text-2xl font-bold text-white font-mono">{metrics.contested}</span>
              <span className="text-[10px] text-slate-400 mt-1">Mixed results or animal-only data</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-rose-500/20 flex flex-col">
              <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold uppercase mb-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Refuted</span>
              </div>
              <span className="text-2xl font-bold text-white font-mono">{metrics.unsupported}</span>
              <span className="text-[10px] text-slate-400 mt-1">Debunked or contradicted by data</span>
            </div>
          </div>

          {/* Export Actions (User Journey Step 4) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Export Dossier & Citations
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={getExportUrl(session.session_id, 'markdown')}
                download
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Markdown (.md)</span>
              </a>

              <button
                onClick={handleCopyBibliography}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                {copiedBibliography ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBibliography ? 'Copied to Clipboard!' : 'Copy Zotero / Notion Format'}</span>
              </button>

              <a
                href={getExportUrl(session.session_id, 'json')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <span>JSON API</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
