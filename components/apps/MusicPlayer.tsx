"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFileSystem } from "@/context/FileSystemContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  ListMusic, 
  Music, 
  Disc,
  ListCollapse,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPlayerProps {
  fileId?: string;
  onClose?: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ fileId, onClose }) => {
  const { state: fsState } = useFileSystem();
  const { volume, setVolume } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Scan VFS for audio files
  const playlist = useMemo(() => {
    return Object.values(fsState.items)
      .filter(item => item.type === "file" && (item.name.endsWith(".mp3") || item.name.endsWith(".wav")))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fsState.items]);

  // 2. States
  const [activeTrackId, setActiveTrackId] = useState<string | null>(fileId || null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Derive current track
  const currentTrack = useMemo(() => {
    if (!activeTrackId) return playlist[0] || null;
    return fsState.items[activeTrackId] || playlist[0] || null;
  }, [activeTrackId, playlist, fsState.items]);

  // Track double clicks from VFS
  useEffect(() => {
    if (fileId) {
      setActiveTrackId(fileId);
      setIsPlaying(true);
    }
  }, [fileId]);

  // Default selection
  useEffect(() => {
    if (playlist.length > 0 && !activeTrackId) {
      setActiveTrackId(playlist[0].id);
    }
  }, [playlist, activeTrackId]);

  // Sync master volume
  useEffect(() => {
    if (volume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Handle source changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.content) {
      const absoluteSrc = new URL(currentTrack.content, window.location.origin).href;
      if (audioRef.current.src === absoluteSrc) {
        return;
      }

      const wasPlaying = isPlaying;
      audioRef.current.src = currentTrack.content;
      audioRef.current.load();
      
      if (wasPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            if (err.name !== "AbortError") {
              console.error("Audio playback block:", err);
              setIsPlaying(false);
            }
          });
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentTrack]);

  // Play/Pause toggler
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Audio play error:", err);
        });
    }
  };

  // Mute control
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume || 50);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Track navigation
  const playTrack = (trackId: string) => {
    setActiveTrackId(trackId);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (playlist.length <= 1) return;
    if (isShuffle) {
      const currentIdx = playlist.findIndex(t => t.id === activeTrackId);
      let nextIdx = Math.floor(Math.random() * playlist.length);
      while (nextIdx === currentIdx && playlist.length > 1) {
        nextIdx = Math.floor(Math.random() * playlist.length);
      }
      playTrack(playlist[nextIdx].id);
    } else {
      const currentIdx = playlist.findIndex(t => t.id === activeTrackId);
      const nextIdx = (currentIdx + 1) % playlist.length;
      playTrack(playlist[nextIdx].id);
    }
  };

  const handlePrev = () => {
    if (playlist.length <= 1) return;
    const currentIdx = playlist.findIndex(t => t.id === activeTrackId);
    let prevIdx = currentIdx - 1;
    if (prevIdx < 0) prevIdx = playlist.length - 1;
    playTrack(playlist[prevIdx].id);
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error(e));
      }
    } else {
      handleNext();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Refined visualizer canvas with smooth physics
  useEffect(() => {
    const canvas = visualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const barCount = 40;
    const bars: { x: number; width: number; height: number; targetHeight: number; speed: number }[] = [];

    // Initialize thinner, elegant bars
    for (let i = 0; i < barCount; i++) {
      const width = canvas.width / barCount - 1.5;
      bars.push({
        x: i * (width + 1.5),
        width,
        height: 1.5,
        targetHeight: 1.5,
        speed: 0.08 + Math.random() * 0.08
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bars.forEach((bar, idx) => {
        if (isPlaying) {
          // Dynamic sine-wave wave height simulator
          const normalizedIdx = idx / barCount;
          const multi = Math.sin(normalizedIdx * Math.PI) * 0.7 + 0.3;
          const timeFactor = Date.now() * 0.003;
          const waveHeight = Math.sin(normalizedIdx * 8 - timeFactor) * Math.cos(normalizedIdx * 4 + timeFactor);
          bar.targetHeight = 2 + (Math.abs(waveHeight) * (canvas.height - 8) + Math.random() * 6) * multi;
        } else {
          bar.targetHeight = 1.5;
        }

        // Apply decay interpolation
        bar.height += (bar.targetHeight - bar.height) * bar.speed;

        // Custom pink-violet-cyan smooth gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "#c084fc"); // purple-400
        gradient.addColorStop(0.5, "#ec4899"); // pink-500
        gradient.addColorStop(1, "#38bdf8"); // sky-400

        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.roundRect(bar.x, canvas.height - bar.height, bar.width, bar.height, 1);
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  const trackTitle = useMemo(() => {
    if (!currentTrack) return "No Song Loaded";
    return currentTrack.name.replace(/\.mp3$|\.wav$/gi, "");
  }, [currentTrack]);

  return (
    <div className="flex flex-col h-full bg-[#101014]/95 border border-white/5 text-white select-none overflow-hidden font-sans relative shadow-2xl rounded-2xl">
      
      {/* Premium Glassmorphic Background Blur */}
      <div 
        className={cn(
          "absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-pink-500/5 blur-[120px] transition-all duration-[2000ms] pointer-events-none z-0",
          isPlaying ? "scale-125 opacity-100 bg-pink-500/10" : "scale-100 opacity-30"
        )} 
      />
      <div 
        className={cn(
          "absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#5c2d91]/5 blur-[120px] transition-all duration-[2000ms] pointer-events-none z-0",
          isPlaying ? "scale-125 opacity-100 bg-[#5c2d91]/10" : "scale-100 opacity-30"
        )} 
      />

      {/* Hidden Audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* 1. Header Toolbar */}
      <div className="h-12 flex items-center px-4 justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm z-10 shrink-0 select-none">
        <div className="flex items-center gap-2.5 text-xs font-semibold tracking-wide text-zinc-300">
          <Disc className={cn("w-4 h-4 text-pink-500", isPlaying && "animate-spin")} style={{ animationDuration: "5s" }} />
          <span>Media Player</span>
        </div>
        <button
          onClick={() => setShowPlaylist(p => !p)}
          className={cn(
            "p-1.5 rounded-lg transition-all border outline-none cursor-default active:scale-95",
            showPlaylist 
              ? "bg-white/10 border-white/10 text-pink-400" 
              : "border-transparent hover:bg-white/5 text-zinc-400 hover:text-white"
          )}
          title="Playlist Menu"
        >
          <ListMusic className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 2. Main Client Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 gap-6 relative z-10 select-none">
        {!currentTrack ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center flex-1 py-10">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-center shadow-lg">
              <FolderOpen className="w-8 h-8 text-zinc-500 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 px-4">
              <h4 className="text-sm font-bold text-zinc-200">Library is Empty</h4>
              <p className="text-[10px] text-zinc-500 leading-normal max-w-[200px] mx-auto">
                No audio tracks detected. Add your favorite `.mp3` files in the workspace library.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Elegant Square Album Sleeve Cover */}
            <div className="relative group/sleeve select-none mt-1">
              {/* Outer soft breathing aura glow */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 blur-2xl opacity-0 transition-opacity duration-1000 pointer-events-none scale-105",
                  isPlaying && "opacity-100"
                )}
              />

              {/* Glassmorphic Art Frame */}
              <div 
                className={cn(
                  "w-48 h-48 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/10 p-1.5 shadow-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-700",
                  isPlaying ? "scale-100 hover:scale-[1.02]" : "scale-[0.97]"
                )}
                style={{
                  boxShadow: "0 20px 45px -12px rgba(0,0,0,0.7)"
                }}
              >
                {/* Dynamic Gradient Cover Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#5c2d91]/80 via-pink-600/30 to-[#101014] z-0" />

                {/* Subtle Sweep Highlight Reflection */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/sleeve:animate-[shimmer_1.5s_infinite] z-10 pointer-events-none" />

                {/* Artwork Content */}
                <div className="w-full h-full rounded-xl bg-[#09090b]/80 border border-white/5 flex flex-col justify-between p-3.5 z-10 relative">
                  <div className="flex items-center justify-between">
                    <Music className="w-4 h-4 text-pink-400 opacity-60" />
                    <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase font-bold">HQ Audio</span>
                  </div>
                  
                  {/* Decorative vinyl record sleeve graphic outline */}
                  <div className="flex-1 flex items-center justify-center relative">
                    <Disc className={cn("w-20 h-20 text-zinc-800/80 animate-spin absolute scale-105", isPlaying ? "opacity-100" : "opacity-30")} style={{ animationDuration: "12s" }} />
                    <div className="w-6 h-6 rounded-full bg-[#101014] z-10 shadow-inner flex items-center justify-center border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-[8px] font-mono font-bold tracking-widest text-pink-500/80 uppercase">STEREO</p>
                    <p className="text-[9.5px] font-semibold text-zinc-400 truncate w-full mt-0.5">{trackTitle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Song Metadata */}
            <div className="text-center w-full px-4">
              <h3 className="text-sm font-bold truncate tracking-tight text-white/95 max-w-full drop-shadow-sm select-text selection:bg-pink-500/30">
                {trackTitle}
              </h3>
              <p className="text-[9.5px] opacity-40 uppercase tracking-widest font-semibold mt-1">
                {currentTrack.parentId === "music" ? "Local Music" : "System Files"}
              </p>
            </div>

            {/* Waveform Visualizer Canvas */}
            <div className="w-full h-10 px-2 flex items-end justify-center select-none overflow-hidden opacity-70">
              <canvas 
                ref={visualizerRef} 
                width={300} 
                height={35} 
                className="w-full h-full"
              />
            </div>

            {/* Time Slider Controls */}
            <div className="w-full px-2 flex flex-col gap-1.5 shrink-0">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-[3px] bg-white/10 rounded-lg appearance-none cursor-default hover:bg-white/20 accent-pink-500 outline-none transition-all"
              />
            </div>

            {/* Professional Controls Row */}
            <div className="w-full flex items-center justify-between px-3 mt-1 shrink-0">
              {/* Shuffle button with indicator dot */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={cn(
                    "p-2 rounded-lg transition-colors cursor-default outline-none active:scale-95",
                    isShuffle ? "text-pink-400" : "text-zinc-500 hover:text-white"
                  )}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <div className={cn("w-1 h-1 rounded-full transition-all bg-pink-400", isShuffle ? "opacity-100" : "opacity-0")} />
              </div>

              {/* Central buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  disabled={playlist.length <= 1}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white active:scale-90 disabled:opacity-15 cursor-default transition-all"
                  title="Previous"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-pink-500/20 text-white cursor-default border border-pink-400/20 transition-all"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={playlist.length <= 1}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white active:scale-90 disabled:opacity-15 cursor-default transition-all"
                  title="Next"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Repeat button with indicator dot */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={cn(
                    "p-2 rounded-lg transition-colors cursor-default outline-none active:scale-95",
                    isRepeat ? "text-pink-400" : "text-zinc-500 hover:text-white"
                  )}
                  title="Repeat Track"
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <div className={cn("w-1 h-1 rounded-full transition-all bg-pink-400", isRepeat ? "opacity-100" : "opacity-0")} />
              </div>
            </div>

            {/* Volume sync console */}
            <div className="w-full flex items-center gap-3 px-3.5 py-1.5 bg-white/5 dark:bg-black/25 rounded-xl border border-white/5 mt-1 shrink-0">
              <button
                onClick={toggleMute}
                className="p-1 text-zinc-500 hover:text-pink-400 cursor-default transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (Number(e.target.value) > 0) setIsMuted(false);
                }}
                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-default accent-pink-500 outline-none"
              />
              <span className="text-[9.5px] font-bold font-mono text-zinc-500 w-7 text-right">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. Slide-up Playlist Console */}
      <div 
        className={cn(
          "absolute inset-x-0 bottom-0 bg-[#0a0a0d]/98 border-t border-white/10 backdrop-blur-2xl transition-all duration-300 ease-in-out z-20 flex flex-col overflow-hidden shadow-2xl",
          showPlaylist ? "h-[300px]" : "h-0"
        )}
      >
        <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 shrink-0 bg-black/40 select-none">
          <span className="text-[11px] font-semibold text-zinc-300">Playlist Queue ({playlist.length})</span>
          <button
            onClick={() => setShowPlaylist(false)}
            className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white cursor-default"
          >
            <ListCollapse className="w-4.5 h-4.5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1 custom-scrollbar">
          {playlist.map((track, index) => {
            const isActive = track.id === currentTrack?.id;
            const cleanedTitle = track.name.replace(/\.mp3$|\.wav$/gi, "");
            return (
              <button
                key={track.id}
                onClick={() => playTrack(track.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-default border",
                  isActive
                    ? "bg-pink-500/10 border-pink-500/20 text-pink-400 font-bold"
                    : "bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3 truncate pr-4">
                  <span className="font-mono opacity-30 text-[9.5px] w-4 text-right">
                    {index + 1}
                  </span>
                  <span className="truncate">{cleanedTitle}</span>
                </div>
                {isActive && isPlaying && (
                  <div className="flex gap-0.5 items-end h-3 shrink-0 mr-1">
                    <span className="w-[1.5px] bg-pink-500 rounded-sm animate-bounce" style={{ height: "12px", animationDuration: "0.6s" }} />
                    <span className="w-[1.5px] bg-pink-500 rounded-sm animate-bounce" style={{ height: "7px", animationDuration: "0.4s", animationDelay: "0.15s" }} />
                    <span className="w-[1.5px] bg-pink-500 rounded-sm animate-bounce" style={{ height: "10px", animationDuration: "0.5s", animationDelay: "0.3s" }} />
                  </div>
                )}
              </button>
            );
          })}
          {playlist.length === 0 && (
            <div className="text-center py-20 text-zinc-600 italic text-xs select-none">
              No audio files detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
