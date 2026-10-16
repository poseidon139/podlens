import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sparkles, ExternalLink, ShieldCheck, AlertTriangle, XCircle, Search, Loader2 } from 'lucide-react';
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
  onTimeUpdate,
  onSeek,
  onAnalyzeSegment,
  isAnalyzing = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(video?.duration_seconds || 300);
  const timerIntervalRef = useRef(null);
  const youtubePlayerRef = useRef(null);

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

  // Handle video switching and player lifecycle safely
  useEffect(() => {
    if (!videoId) return;

    // If player already initialized, use loadVideoById (preserves DOM and iframe)
    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.loadVideoById === 'function') {
      try {
        youtubePlayerRef.current.loadVideoById(videoId);
        return;
      } catch (e) {
        console.warn("Could not reuse existing player, re-initializing:", e);
      }
    }

    // Ensure container has the player mount div
    const wrapper = document.getElementById('podlens-player-wrapper');
    if (wrapper) {
      wrapper.innerHTML = '<div id="podlens-yt-player" class="w-full h-full absolute inset-0"></div>';
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        youtubePlayerRef.current = new window.YT.Player('podlens-yt-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
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
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <div id="podlens-player-wrapper" className="w-full h-full absolute inset-0">
          <div id="podlens-yt-player" className="w-full h-full absolute inset-0" />
        </div>

        {/* Floating In-Stream Context Pill (Active Claim) */}
        {activeClaim ? (
          <div className="absolute top-4 right-4 z-30 max-w-sm animate-in fade-in slide-in-from-top-3 duration-300">
            <div className={`p-3 rounded-xl backdrop-blur-xl border shadow-2xl ${
              activeClaim.status === 'VERIFIED'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
                : activeClaim.status === 'CONTESTED'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-100'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-100'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {activeClaim.status === 'VERIFIED' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {activeClaim.status === 'CONTESTED' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {activeClaim.status === 'UNSUPPORTED' && <XCircle className="w-4 h-4 text-rose-400" />}
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {activeClaim.status} Claim
                </span>
                <span className="text-[10px] opacity-75 font-mono ml-auto">
                  {formatTime(activeClaim.timestamp_start)} - {formatTime(activeClaim.timestamp_end)}
                </span>
              </div>
              <p className="text-xs font-medium line-clamp-2 leading-relaxed">
                "{activeClaim.claim_text}"
              </p>
            </div>
          </div>
        ) : (
          /* On-Demand Seek Fact-Checking Pill */
          <div className="absolute top-4 right-4 z-30 animate-in fade-in duration-200">
            {isAnalyzing ? (
              <div className="flex items-center space-x-2 bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs px-3 py-1.5 rounded-xl backdrop-blur-md shadow-xl">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Grounding speech at {formatTime(currentTime)}...</span>
              </div>
            ) : onAnalyzeSegment ? (
              <button
                onClick={() => onAnalyzeSegment(currentTime)}
                className="flex items-center space-x-1.5 bg-slate-900/85 hover:bg-indigo-900/90 border border-slate-700/70 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg transition"
                title="Ground speech at this exact moment in the video"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ground Speech @ {formatTime(currentTime)}</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Synchronized Custom Controls & Grounding Scrubber */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 flex flex-col space-y-3">
        {/* Interactive Timeline with Grounded Claims Markers */}
        <div className="flex flex-col space-y-1">
          <div className="relative w-full group py-1 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            handleManualSeek(clickPos * duration);
          }}>
            {/* Background Track */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
              {/* Played Progress Bar */}
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
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
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

        {/* Video Info & Quick Play Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
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
            <div className="text-xs">
              <p className="font-semibold text-slate-200 truncate max-w-sm">
                {video?.title || "Podcast Stream"}
              </p>
              <p className="text-[11px] text-slate-400">
                Synchronized with Vertex AI & Google Search Grounding
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50"
            >
              <span>YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
