import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Maximize, 
  Minimize 
} from 'lucide-react';
import TimelineTicks from './TimelineTicks';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({
  video,
  claims = [],
  currentTime = 0,
  activeClaim = null,
  currentSpeechLine = null,
  onTimeUpdate,
  onSeek,
  onAnalyzeSegment,
  isAnalyzing = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(video?.duration_seconds || 300);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerIntervalRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const playerContainerRef = useRef(null);

  const videoId = video?.youtube_video_id || "9tRohh0gErM";

  // Load YouTube IFrame API script tag once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.warn("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn("Exit fullscreen error:", err);
      });
    }
  };

  // Handle video switching and player lifecycle safely
  useEffect(() => {
    if (!videoId) return;

    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.loadVideoById === 'function') {
      try {
        youtubePlayerRef.current.loadVideoById(videoId);
        return;
      } catch (e) {
        console.warn("Could not reuse existing player, re-initializing:", e);
      }
    }

    const wrapper = document.getElementById('podlens-player-wrapper');
    if (wrapper) {
      wrapper.innerHTML = '<div id="podlens-yt-player" class="w-full h-full absolute inset-0"></div>';
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        youtubePlayerRef.current = new window.YT.Player('podlens-yt-player', {
          videoId: videoId,
          playerVars: {
            enablejsapi: 1,
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 0, // Disable YouTube internal fullscreen so PodLens custom fullscreen with overlays works
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
            },
            onStateChange: (event) => {
              if (event.data === 1) {
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId]);

  // Synchronize playback timestamp with parent every 350ms
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        try {
          const t = youtubePlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            onTimeUpdate(t);
            const dur = youtubePlayerRef.current.getDuration();
            if (dur && dur > 0) setDuration(dur);
          }
        } catch (e) {}
      }
    }, 350);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [onTimeUpdate]);

  const handleManualSeek = (timeSec) => {
    onSeek(timeSec);
    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
      youtubePlayerRef.current.seekTo(timeSec, true);
    }
    if (onAnalyzeSegment) {
      onAnalyzeSegment(timeSec);
    }
  };

  const handleTogglePlay = () => {
    if (youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        youtubePlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100));

  return (
    <div 
      ref={playerContainerRef}
      className={`flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen bg-black' : 'h-full'
      }`}
    >
      {/* Video Container */}
      <div className={`relative w-full ${isFullscreen ? 'flex-1 h-[calc(100vh-90px)]' : 'aspect-video'} bg-black flex items-center justify-center overflow-hidden`}>
        <div id="podlens-player-wrapper" className="w-full h-full absolute inset-0">
          <div id="podlens-yt-player" className="w-full h-full absolute inset-0" />
        </div>

        {/* SINGLE CONSOLIDATED COMPACT IN-STREAM HUD (Bottom of Video, Zero Top Clutter) */}
        {isAnalyzing ? (
          <div className="absolute bottom-3 left-4 right-4 z-30 pointer-events-none flex justify-center animate-in fade-in duration-200">
            <div className="pointer-events-auto flex items-center space-x-2 bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span className="font-medium">Grounding speech at {formatTime(currentTime)}...</span>
            </div>
          </div>
        ) : activeClaim ? (
          /* Active Major Claim (Compact In-Stream Badge) */
          <div className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-30 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className={`pointer-events-auto max-w-xl w-full px-3.5 py-2 rounded-xl backdrop-blur-xl border shadow-2xl flex items-center space-x-3 ${
              activeClaim.status === 'VERIFIED'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100 shadow-emerald-950/60'
                : activeClaim.status === 'CONTESTED'
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-100 shadow-amber-950/60'
                : 'bg-rose-950/90 border-rose-500/60 text-rose-100 shadow-rose-950/60'
            }`}>
              {/* Color-Shifting Status Icon */}
              <div className={`p-1.5 rounded-lg border shrink-0 ${
                activeClaim.status === 'VERIFIED'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                  : activeClaim.status === 'CONTESTED'
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                  : 'bg-rose-500/20 border-rose-400/50 text-rose-400'
              }`}>
                {activeClaim.status === 'VERIFIED' && <ShieldCheck className="w-4 h-4" />}
                {activeClaim.status === 'CONTESTED' && <AlertTriangle className="w-4 h-4" />}
                {activeClaim.status === 'UNSUPPORTED' && <XCircle className="w-4 h-4" />}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="font-bold uppercase tracking-wider">{activeClaim.status} CLAIM</span>
                  <span className="text-slate-300 font-sans font-semibold truncate">{activeClaim.speaker}</span>
                  <span className="ml-auto opacity-75">{formatTime(activeClaim.timestamp_start)}</span>
                </div>
                <p className="text-xs font-medium truncate text-white leading-tight">
                  "{activeClaim.claim_text}"
                </p>
              </div>
            </div>
          </div>
        ) : currentSpeechLine ? (
          /* Live Spoken Line Subtitle HUD with Color-Shifting Icon */
          <div className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-30 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className={`pointer-events-auto max-w-xl w-full px-3.5 py-2 rounded-xl backdrop-blur-xl border shadow-2xl flex items-center space-x-3 transition-all duration-300 ${
              currentSpeechLine.badge_color === 'green'
                ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-100'
                : currentSpeechLine.badge_color === 'amber'
                ? 'bg-amber-950/85 border-amber-500/50 text-amber-100'
                : currentSpeechLine.badge_color === 'red'
                ? 'bg-rose-950/85 border-rose-500/50 text-rose-100'
                : 'bg-slate-900/85 border-slate-700/60 text-slate-100'
            }`}>
              {/* Real-time Status Icon */}
              <div className={`p-1.5 rounded-lg border shrink-0 ${
                currentSpeechLine.badge_color === 'green'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                  : currentSpeechLine.badge_color === 'amber'
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                  : currentSpeechLine.badge_color === 'red'
                  ? 'bg-rose-500/20 border-rose-400/50 text-rose-400'
                  : 'bg-indigo-500/20 border-indigo-400/50 text-indigo-400'
              }`}>
                {currentSpeechLine.badge_color === 'green' && <ShieldCheck className="w-4 h-4 animate-pulse" />}
                {currentSpeechLine.badge_color === 'amber' && <AlertTriangle className="w-4 h-4 animate-pulse" />}
                {currentSpeechLine.badge_color === 'red' && <XCircle className="w-4 h-4 animate-pulse" />}
                {currentSpeechLine.badge_color === 'blue' && <Sparkles className="w-4 h-4 animate-pulse" />}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="font-bold uppercase tracking-wider">{currentSpeechLine.status || 'VERIFIED'}</span>
                  <span className="text-slate-300 font-sans font-semibold truncate">{currentSpeechLine.speaker || 'Speaker'}</span>
                  <span className="ml-auto opacity-75">{formatTime(currentSpeechLine.start)}</span>
                </div>
                <p className="text-xs font-medium truncate text-white leading-tight">
                  "{currentSpeechLine.text}"
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Synchronized Custom Controls & Grounding Scrubber */}
      <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800/80 flex flex-col space-y-2.5">
        {/* Interactive Timeline with Grounded Claims Markers */}
        <div className="flex flex-col space-y-1">
          <div className="relative w-full group py-1 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            handleManualSeek(clickPos * duration);
          }}>
            {/* Background Track */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Grounding Tick Markers */}
            <div className="absolute inset-0 pointer-events-auto">
              <TimelineTicks
                claims={claims}
                duration={duration}
                currentTime={currentTime}
                onSeek={handleManualSeek}
              />
            </div>
          </div>

          {/* Timecode Indicators */}
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-0.5">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>Verified</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span>Contested</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                <span>Unsupported</span>
              </span>
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Video Info, Seek Grounding Button, and Custom FullScreen Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleManualSeek(0)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onAnalyzeSegment && (
              <button
                onClick={() => onAnalyzeSegment(currentTime)}
                className="hidden sm:flex items-center space-x-1.5 bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition"
                title="Ground speech at this exact moment"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Ground @ {formatTime(currentTime)}</span>
              </button>
            )}

            <div className="text-xs">
              <p className="font-semibold text-slate-200 truncate max-w-xs sm:max-w-sm">
                {video?.title || "Podcast Stream"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50"
            >
              <span>YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Custom FullScreen Toggle Button (Preserves Overlays & Subtitles) */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/50"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen with Live Fact-Checking"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
