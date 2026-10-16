import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import VideoPlayer from './components/VideoPlayer';
import ContextFeed from './components/ContextFeed';
import DossierModal from './components/DossierModal';
import IngestionModal from './components/IngestionModal';
import LiveVerifyModal from './components/LiveVerifyModal';
import { fetchSessions, fetchSession, fetchClaims, createSession } from './services/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('huberman_fasting');
  const [currentSession, setCurrentSession] = useState(null);
  const [claims, setClaims] = useState([]);
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

  // 2. When Active Session changes, fetch session details and its claims
  useEffect(() => {
    if (!activeSessionId) return;

    fetchSession(activeSessionId)
      .then((sess) => setCurrentSession(sess))
      .catch((err) => console.error('Failed to load session:', err));

    fetchClaims(activeSessionId)
      .then((data) => setClaims(data))
      .catch((err) => console.error('Failed to load claims:', err));

    setCurrentTime(0);
    setActiveClaimId(null);
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

  // 4. Handle Playback Tick & Send to WebSocket
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);

    // Send tick to WebSocket for server-side evaluation
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PLAYBACK_TICK',
        current_time_sec: time
      }));
    }

    // Client-side instant fallback matching for zero-latency UI
    const matchingClaim = claims.find(
      (c) => time >= c.timestamp_start && time <= c.timestamp_end
    );
    if (matchingClaim) {
      setActiveClaimId(matchingClaim.id);
    } else {
      setActiveClaimId(null);
    }
  };

  const handleSeek = (timeSec) => {
    setCurrentTime(timeSec);
  };

  const handleIngestSession = async (payload) => {
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

  const activeClaim = claims.find((c) => c.id === activeClaimId) || null;

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
        truthScore={currentSession?.metrics?.truth_score}
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
            onTimeUpdate={handleTimeUpdate}
            onSeek={handleSeek}
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
              <span>Claims: <strong className="text-white">{claims.length}</strong></span>
              <span>Truth Score: <strong className="text-indigo-400">{currentSession?.metrics?.truth_score || 0}%</strong></span>
            </div>
          </div>
        </section>

        {/* Right Screen (35% width ~ 4 cols) */}
        <section className="lg:col-span-4 h-[750px] lg:h-auto flex flex-col">
          <ContextFeed
            claims={claims}
            activeClaimId={activeClaimId}
            currentTime={currentTime}
            onJumpToTime={handleSeek}
            isWsConnected={isWsConnected}
          />
        </section>
      </main>

      {/* Modals */}
      <DossierModal
        session={currentSession}
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
