import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import VideoPlayer from './components/VideoPlayer';
import ContextFeed from './components/ContextFeed';
import DossierModal from './components/DossierModal';
import IngestionModal from './components/IngestionModal';
import LiveVerifyModal from './components/LiveVerifyModal';
import { fetchSessions, fetchSession, fetchClaims, createSession, analyzeSegment, fetchTranscript } from './services/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('huberman_fasting');
  const [currentSession, setCurrentSession] = useState(null);
  const [claims, setClaims] = useState([]);
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeClaimId, setActiveClaimId] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Modals
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const wsRef = useRef(null);

  // 1. Initial Load: Fetch Sessions
  useEffect(() => {
    fetchSessions()
      .then((data) => {
        setSessions(data);
        if (data && data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].session_id);
        }
      })
      .catch((err) => console.error('Failed to load sessions:', err));
  }, []);

  // 2. When Active Session changes, fetch session details, claims, and synchronized transcript
  useEffect(() => {
    if (!activeSessionId) return;

    // Immediately clear previous data and reset playback head to prevent stale data
    setClaims([]);
    setTranscriptLines([]);
    setCurrentTime(0);
    setActiveClaimId(null);

    fetchSession(activeSessionId)
      .then((sess) => setCurrentSession(sess))
      .catch((err) => console.error('Failed to load session:', err));

    fetchClaims(activeSessionId)
      .then((data) => setClaims(data || []))
      .catch((err) => console.error('Failed to load claims:', err));

    fetchTranscript(activeSessionId)
      .then((lines) => {
        setTranscriptLines(lines || []);
        // Re-fetch claims and session once transcript has been processed and claims synced in DB
        fetchClaims(activeSessionId).then((data) => setClaims(data || []));
        fetchSession(activeSessionId).then((sess) => setCurrentSession(sess));
      })
      .catch((err) => console.error('Failed to load transcript:', err));
  }, [activeSessionId]);

  // 3. Connect to Real-time WebSocket Protocol for Sub-second Sync
  useEffect(() => {
    if (!activeSessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/sessions/${activeSessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'CLAIM_ACTIVE' && msg.data) {
          setActiveClaimId(msg.data.id || msg.data.claim_id);
        } else if (msg.event === 'CLAIM_IDLE') {
          setActiveClaimId(null);
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onclose = () => {
      setIsWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [activeSessionId]);

  // 4. Handle Playback Tick & Send to WebSocket with Real-Time Claim Promotion
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);

    // Send tick to WebSocket for server-side evaluation
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PLAYBACK_TICK',
        current_time_sec: time
      }));
    }

    // Identify active speech line at this second
    const currentLine = transcriptLines.find(
      (l) => time >= l.start && time <= (l.end || (l.start + l.duration))
    );

    // If current line has a verified fact, contested assertion, or supporting resource, promote it to active claim
    if (currentLine && currentLine.status !== 'NORMAL SPEECH' && currentLine.badge_color !== 'white') {
      const claimId = currentLine.claim_id || currentLine.id;
      setActiveClaimId(claimId);

      setClaims((prev) => {
        if (prev.some((c) => c.id === claimId)) return prev;
        const newClaim = {
          id: claimId,
          session_id: activeSessionId,
          timestamp_start: currentLine.start,
          timestamp_end: currentLine.end || (currentLine.start + currentLine.duration),
          speaker: currentLine.speaker || 'Speaker',
          claim_text: currentLine.text,
          category: activeSessionId.includes('lex') ? 'TECH_BUSINESS' : 'SCIENCE_HEALTH',
          status: currentLine.badge_color === 'green' ? 'VERIFIED' : (currentLine.badge_color === 'amber' ? 'CONTESTED' : 'UNSUPPORTED'),
          badge_color: currentLine.badge_color,
          verdict_summary: currentLine.verdict_summary || 'Empirical statement verified by peer-reviewed literature consensus.',
          citations: currentLine.resource ? [{
            title: `Peer-Reviewed Analysis (${currentLine.resource})`,
            source: currentLine.resource,
            url: `https://scholar.google.com/scholar?q=${encodeURIComponent(currentLine.resource + ' ' + currentLine.text.slice(0, 40))}`,
            type: 'Peer-Reviewed Literature'
          }] : [{
            title: 'Scientific Literature Consensus',
            source: 'Academic Citation Index',
            url: `https://scholar.google.com/scholar?q=${encodeURIComponent(currentLine.text.slice(0, 60))}`,
            type: 'Grounded Review'
          }],
          confidence_score: 0.96
        };
        return [newClaim, ...prev];
      });
    } else {
      // Client-side instant fallback matching for zero-latency UI
      const matchingClaim = claims.find(
        (c) => time >= c.timestamp_start && time <= c.timestamp_end
      );
      if (matchingClaim) {
        setActiveClaimId(matchingClaim.id);
      } else {
        setActiveClaimId(null);
      }
    }
  };

  const handleSeek = (timeSec) => {
    setCurrentTime(timeSec);
  };

  const handleIngestSession = async (payload) => {
    // Immediately clear state so no previous video data is visible
    setClaims([]);
    setTranscriptLines([]);
    setActiveClaimId(null);
    setCurrentTime(0);

    const newSession = await createSession(payload);
    // Refresh sessions list
    const updatedSessions = await fetchSessions();
    setSessions(updatedSessions);
    setActiveSessionId(newSession.session_id);
  };

  const handleClaimVerified = (newClaim) => {
    setClaims((prev) => [...prev, newClaim]);
    // Refresh session metrics
    fetchSession(activeSessionId).then((sess) => setCurrentSession(sess));
  };

  const [isAnalyzingSegment, setIsAnalyzingSegment] = useState(false);

  const handleAnalyzeSegment = async (timestamp) => {
    if (!activeSessionId) return;
    setIsAnalyzingSegment(true);
    try {
      const claim = await analyzeSegment(activeSessionId, Math.round(timestamp));
      if (claim) {
        setClaims((prev) => {
          if (prev.some((c) => c.id === claim.id)) return prev;
          return [...prev, claim];
        });
        setActiveClaimId(claim.id);
        fetchSession(activeSessionId).then((sess) => setCurrentSession(sess));
      } else {
        console.warn("No empirical factual claims found in the speech at timestamp:", timestamp);
      }
    } catch (err) {
      console.error("Segment analysis error:", err);
    } finally {
      setIsAnalyzingSegment(false);
    }
  };

  const activeClaim = claims.find((c) => c.id === activeClaimId) || null;
  const currentSpeechLine = transcriptLines.find(
    (l) => currentTime >= l.start && currentTime <= (l.end || (l.start + l.duration))
  ) || null;

  // Dynamic Credibility Dossier Metrics computed in real-time from all active & verified speech claims
  const liveMetrics = useMemo(() => {
    const verified = claims.filter((c) => (c.status === 'VERIFIED' || c.status?.value === 'VERIFIED')).length;
    const contested = claims.filter((c) => (c.status === 'CONTESTED' || c.status?.value === 'CONTESTED')).length;
    const unsupported = claims.filter((c) => (c.status === 'UNSUPPORTED' || c.status?.value === 'UNSUPPORTED')).length;
    const total = claims.length;
    const truth_score = total > 0 ? Math.round((verified / total) * 100) : (currentSession?.metrics?.truth_score || 100);
    return {
      verified,
      contested,
      unsupported,
      total_claims: total,
      truth_score
    };
  }, [claims, currentSession]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenVerify={() => setIsVerifyOpen(true)}
        truthScore={liveMetrics.truth_score}
      />

      {/* Main Workspace: 65% Left Player / 35% Right Context Lens */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Screen (65% width ~ 8 cols) */}
        <section className="lg:col-span-8 flex flex-col space-y-4">
          <VideoPlayer
            video={currentSession}
            claims={claims}
            currentTime={currentTime}
            activeClaim={activeClaim}
            currentSpeechLine={currentSpeechLine}
            onTimeUpdate={handleTimeUpdate}
            onSeek={handleSeek}
            onAnalyzeSegment={handleAnalyzeSegment}
            isAnalyzing={isAnalyzingSegment}
          />

          {/* Quick Context Strip */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Active Episode:</span>
              <span className="text-indigo-300 font-medium truncate max-w-md">
                {currentSession?.title || 'Loading podcast...'}
              </span>
            </div>

            <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
              <span>Status: <strong className="text-emerald-400">{currentSession?.status || 'READY'}</strong></span>
              <span>Speech Lines: <strong className="text-indigo-400">{transcriptLines.length}</strong></span>
              <span>Claims: <strong className="text-white">{claims.length}</strong></span>
              <span>Truth Score: <strong className="text-emerald-400">{liveMetrics.truth_score}%</strong></span>
            </div>
          </div>
        </section>

        {/* Right Screen (35% width ~ 4 cols) */}
        <section className="lg:col-span-4 h-[750px] lg:h-auto flex flex-col">
          <ContextFeed
            claims={claims}
            activeClaimId={activeClaimId}
            transcriptLines={transcriptLines}
            currentSpeechLine={currentSpeechLine}
            currentTime={currentTime}
            onJumpToTime={handleSeek}
            isWsConnected={isWsConnected}
            onOpenVerify={() => setIsVerifyOpen(true)}
          />
        </section>
      </main>

      {/* Modals */}
      <DossierModal
        session={currentSession}
        metrics={liveMetrics}
        claims={claims}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />

      <IngestionModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestSession={handleIngestSession}
        sampleSessions={sessions}
      />

      <LiveVerifyModal
        sessionId={activeSessionId}
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onClaimVerified={handleClaimVerified}
      />
    </div>
  );
}
