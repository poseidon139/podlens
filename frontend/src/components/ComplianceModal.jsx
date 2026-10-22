import React from 'react';
import { X, ShieldCheck, Lock, Activity, Eye, FileCheck, CheckCircle2 } from 'lucide-react';

export default function ComplianceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Compliance & Guardrails Console
              </h3>
              <p className="text-xs text-slate-400">
                Team Dronger (PodLens) • Google Cloud Architecture & Policy Guardrails
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section 1: Prompt & Application Guardrails */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Eye className="w-4 h-4" />
              <span>1. Application & Prompt Engineering Guardrails</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Safety Thresholds (AUP)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Explicit Vertex AI safety filters (<code className="text-indigo-300">BLOCK_LOW_AND_ABOVE</code>) enforce strict zero-tolerance for Hate Speech, Harassment, Explicit, and Dangerous Content per Google Cloud Acceptable Use Policy.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Grounding Confidence Thresholds</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dual-tier cutoff: <strong className="text-emerald-400">&ge;75%</strong> for Verified status, <strong className="text-amber-400">60%–74%</strong> for Contested. Low confidence scores (<strong className="text-slate-300">&lt;60%</strong>) immediately default to <strong className="text-slate-300">Unverified</strong>.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Responsible AI Fallback</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Adheres to Google Cloud Agentic AI Responsible Use Guidelines. Ambiguous literature or missing citations never hallucinate; fallback defaults to <strong className="text-slate-300">Unverified / Missing Context</strong>.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Input Sanitization & SSRF Defense</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Payload sanitizer intercepts delimiter injections (<code className="text-indigo-300">SYSTEM:</code>, <code className="text-indigo-300">IGNORE PRIOR</code>), enforces 1500 char limits, and verifies URLs against SSRF/private VPC subnets.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Cloud Run Infrastructure & Security */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Lock className="w-4 h-4" />
              <span>2. Cloud Run Infrastructure & Security</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Least-Privilege IAM</span>
                <p className="text-[11px] text-slate-400">
                  Cloud Run SA is tightly bound to scoped roles: <code className="text-[10px] text-indigo-300">roles/aiplatform.user</code>, <code className="text-[10px] text-indigo-300">roles/datastore.user</code>, and <code className="text-[10px] text-indigo-300">roles/logging.logWriter</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Rate Limiting Controls</span>
                <p className="text-[11px] text-slate-400">
                  Sliding-window IP rate limiting: 60 req/min for general reads, 15 req/min for heavy AI grounding operations to mitigate denial-of-wallet and quota exhaustion.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-semibold text-slate-200 block text-xs mb-1">Environment Isolation</span>
                <p className="text-[11px] text-slate-400">
                  Separate runtime parameters and config flags for staging vs. production to validate prompt iterations and safety filters prior to live traffic exposure.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Observability & Audit Telemetry */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Activity className="w-4 h-4" />
              <span>3. Observability & Audit Telemetry</span>
            </div>
            <div className="space-y-2 pt-1 text-[11px] text-slate-400">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong className="text-slate-200">Structured Cloud Logging:</strong> Single-line JSON emitted to stdout with GCP trace context (<code className="text-indigo-300">logging.googleapis.com/trace</code>), capturing every input length, grounding confidence, safety block, and citation list.</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong className="text-slate-200">Human-in-the-Loop Feedback:</strong> Interactive UI buttons on every claim card permit listeners to dispute, agree, or flag verdicts, persisting reviews directly to Firestore for continuous accuracy auditing.</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong className="text-slate-200">Cloud Monitoring Alerts:</strong> Configured alerting policies on Cloud Run 5xx spikes, p95 latency thresholds, and safety block occurrences.</p>
              </div>
            </div>
          </div>

          {/* Section 4: Governance & Policy Alignment */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <FileCheck className="w-4 h-4" />
              <span>4. Governance & GCP Terms Alignment (Sec 14, 15, 19, 20)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              PodLens operational workflows maintain strict adherence to Google Cloud Platform Service Specific Terms:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li><strong className="text-slate-200">Section 14 & 15:</strong> Human oversight and operational responsibility remain with the user; PodLens presents verifiable citations and literature sources alongside every automated claim.</li>
              <li><strong className="text-slate-200">Section 19 (Generative AI):</strong> No user data or uploaded streams are used to train foundation models. Assistive disclaimers are visibly surfaced across all user interfaces.</li>
              <li><strong className="text-slate-200">Section 20 (Vertex AI Search Grounding):</strong> Primary search grounding citations (PubMed, NCBI, Cochrane) are attributed directly to their original publishers with explicit outbound links.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
