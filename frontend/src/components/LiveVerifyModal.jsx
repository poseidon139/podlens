import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, AlertTriangle, XCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { verifyCustomClaim } from '../services/api';

const PRESET_CLAIMS = [
  "A study showed fasting for 72 hours resets the entire immune system.",
  "Drinking 500ml ice water burns over 500 calories via thermogenesis.",
  "Moderate coffee intake lowers all-cause mortality risk by 12 percent.",
  "Frontier AI training clusters now consume over 100 megawatts of grid power."
];

export default function LiveVerifyModal({ sessionId, isOpen, onClose, onClaimVerified }) {
  const [claimText, setClaimText] = useState('');
  const [speaker, setSpeaker] = useState('Guest Speaker');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async (textToVerify = claimText) => {
    if (!textToVerify.trim()) return;
    setIsVerifying(true);
    setResult(null);
    try {
      const res = await verifyCustomClaim(sessionId || 'huberman_fasting', {
        text: textToVerify,
        speaker: speaker || 'Speaker',
        timestamp_start: 10.0,
        timestamp_end: 25.0
      });
      setResult(res);
      if (onClaimVerified) onClaimVerified(res);
    } catch (err) {
      alert('Verification error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Live Grounding Playground</h3>
              <p className="text-xs text-slate-400">Test Gemini 1.5 Flash + Google Search Grounding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Spoken Assertion to Fact-Check
            </label>
            <textarea
              rows={3}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="e.g. A randomized clinical trial found that cold plunge therapy increases dopamine by 250%..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={isVerifying || !claimText.trim()}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Grounding with Google Search...' : 'Fact-Check with Vertex AI'}</span>
          </button>

          {/* Preset Buttons for Quick Testing */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Or Try A Sample Claim:
            </span>
            <div className="space-y-1.5">
              {PRESET_CLAIMS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setClaimText(preset);
                    handleVerify(preset);
                  }}
                  className="w-full p-2 text-left text-xs bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition flex items-center justify-between group"
                >
                  <span className="truncate pr-2">"{preset}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Verification Result Card */}
          {result && (
            <div className={`mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${
              result.status === 'VERIFIED'
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : result.status === 'CONTESTED'
                ? 'bg-amber-950/40 border-amber-500/40'
                : 'bg-rose-950/40 border-rose-500/40'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {result.status === 'VERIFIED' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {result.status === 'CONTESTED' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {result.status === 'UNSUPPORTED' && <XCircle className="w-4 h-4 text-rose-400" />}
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  [{result.status}]
                </span>
                <span className="text-[11px] font-mono opacity-80 text-slate-300 ml-auto">
                  Confidence: {Math.round(result.confidence_score * 100)}%
                </span>
              </div>

              <p className="text-xs text-slate-200 mb-3 leading-relaxed">
                <span className="font-semibold text-white">Grounded Consensus:</span> {result.verdict_summary}
              </p>

              {result.citations && result.citations.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Authoritative Sources:
                  </span>
                  {result.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-300 hover:underline flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{c.title} ({c.source})</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
