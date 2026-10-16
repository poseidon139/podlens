import React, { useState } from 'react';
import { X, Youtube, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function IngestionModal({ isOpen, onClose, onIngestSession, sampleSessions = [] }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setIsLoading(true);
    try {
      await onIngestSession({
        source_type: 'YOUTUBE',
        media_url: url,
        title: title || undefined
      });
      setUrl('');
      setTitle('');
      onClose();
    } catch (err) {
      alert('Ingestion error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = async (sample) => {
    setIsLoading(true);
    try {
      await onIngestSession({
        source_type: 'SAMPLE',
        sample_id: sample.session_id
      });
      onClose();
    } catch (err) {
      alert('Selection error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Youtube className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Ingest Podcast Stream</h3>
              <p className="text-xs text-slate-400">Stream chunking & Vertex AI analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Custom YouTube URL Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                YouTube Video or Audio URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Episode Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Debate Ep #104"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isLoading ? 'Ingesting & Chunking...' : 'Start Real-Time Grounding'}</span>
            </button>
          </form>

          {/* Quick Pre-Processed Library (User Journey Step 1) */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              Or Select A Pre-Processed Episode
            </span>
            <div className="space-y-2">
              {sampleSessions.map((sample) => (
                <button
                  key={sample.session_id}
                  onClick={() => handleSelectPreset(sample)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between text-left group"
                >
                  <div className="pr-3">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-1">
                      {sample.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {sample.total_claims} verified claims • {Math.round(sample.duration_seconds / 60)} mins
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
