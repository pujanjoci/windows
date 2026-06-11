"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFileSystem } from "@/context/FileSystemContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ListVideo,
  Film,
  Loader2,
  Minimize2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  fileId?: string;
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ fileId, onClose }) => {
  const { state: fsState } = useFileSystem();
  const { volume, setVolume } = useTheme();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Scan filesystem for all video files
  const playlist = useMemo(() => {
    return Object.values(fsState.items)
      .filter(item => item.type === "file" && (item.name.endsWith(".mp4") || item.name.endsWith(".webm")))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fsState.items]);

  // 2. States
  const [activeVideoId, setActiveVideoId] = useState<string | null>(fileId || null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Derive active video item
  const currentVideo = useMemo(() => {
    if (!activeVideoId) return playlist[0] || null;
    return fsState.items[activeVideoId] || playlist[0] || null;
  }, [activeVideoId, playlist, fsState.items]);

  // Handle source double clicks
  useEffect(() => {
    if (fileId) {
      setActiveVideoId(fileId);
      setIsPlaying(true);
    }
  }, [fileId]);

  // Default selection
  useEffect(() => {
    if (playlist.length > 0 && !activeVideoId) {
      setActiveVideoId(playlist[0].id);
    }
  }, [playlist, activeVideoId]);

  // Sync volume state
  useEffect(() => {
    if (volume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Handle source change
  useEffect(() => {
    if (videoRef.current && currentVideo?.content) {
      const wasPlaying = isPlaying;
      setIsLoading(true);
      videoRef.current.src = currentVideo.content;
      videoRef.current.load();
      
      if (wasPlaying) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => {
            console.error(e);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentVideo]);

  // Volume control
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

  // Playback state toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Video play error:", err);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Skip video
  const playVideo = (videoId: string) => {
    setActiveVideoId(videoId);
    setIsPlaying(true);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Error entering fullscreen", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  // Detect fullscreen changes (e.g. Escape key pressed)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Controls hide/show timers on mouse movements
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const videoTitle = useMemo(() => {
    if (!currentVideo) return "No Video Loaded";
    return currentVideo.name.replace(/\.mp4$|\.webm$/gi, "");
  }, [currentVideo]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="flex h-full bg-black text-white select-none overflow-hidden relative group/player flex-row font-sans"
    >
      
      {/* 1. Main Theatre Area */}
      <div className="flex-1 h-full flex flex-col justify-center items-center relative overflow-hidden bg-black">
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        )}

        {/* Video Tag */}
        {currentVideo?.content ? (
          <video
            ref={videoRef}
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onLoadedData={() => setIsLoading(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain cursor-default"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 opacity-30 text-center flex-1">
            <Film className="w-16 h-16 animate-pulse" />
            <p className="text-xs">No video files detected.<br />Add mp4 files to public/videos folder.</p>
          </div>
        )}

        {/* 2. Controls HUD overlay */}
        <div 
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 z-20 pointer-events-auto",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Seek slider bar */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] font-mono opacity-60">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-default accent-pink-500 hover:accent-pink-600 outline-none transition-all"
            />
            <span className="text-[10px] font-mono opacity-60">{formatTime(duration)}</span>
          </div>

          {/* Controls Bar Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play / Pause Toggle */}
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-default transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Volume Controller */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-default transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4.5 h-4.5 text-red-400" /> : <Volume2 className="w-4.5 h-4.5" />}
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
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-default accent-pink-500 outline-none"
                />
              </div>
            </div>

            {/* Video Title in HUD */}
            <div className="hidden md:block text-xs font-semibold text-white/80 max-w-sm truncate">
              {videoTitle}
            </div>

            <div className="flex items-center gap-2">
              {/* Playlist Drawer Toggle */}
              <button
                onClick={() => setShowPlaylist(p => !p)}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors cursor-default",
                  showPlaylist 
                    ? "bg-pink-500/20 border-pink-500/30 text-pink-400" 
                    : "border-transparent hover:bg-white/10 text-white/80 hover:text-white"
                )}
                title="Toggle playlist"
              >
                <ListVideo className="w-4.5 h-4.5" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-default transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sliding Playlist Drawer (Right Side overlay) */}
      <div 
        className={cn(
          "bg-[#0e0e11]/95 border-l border-white/10 h-full backdrop-blur-xl transition-all duration-300 ease-in-out z-20 flex flex-col overflow-hidden shadow-2xl relative shrink-0",
          showPlaylist ? (isFullscreen ? "w-64" : "w-60") : "w-0 border-l-0"
        )}
      >
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-black/40 shrink-0">
          <span className="text-xs font-bold text-white/80">Videos Playlist ({playlist.length})</span>
          <button
            onClick={() => setShowPlaylist(false)}
            className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white cursor-default"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
          {playlist.map((video, index) => {
            const isActive = video.id === currentVideo?.id;
            const cleanedTitle = video.name.replace(/\.mp4$|\.webm$/gi, "");
            return (
              <button
                key={video.id}
                onClick={() => playVideo(video.id)}
                className={cn(
                  "w-full flex flex-col p-2.5 rounded-lg text-left text-xs transition-colors cursor-default border gap-1",
                  isActive
                    ? "bg-pink-500/10 border-pink-500/20 text-pink-400 font-bold shadow-md"
                    : "bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono opacity-30 text-[9px]">
                    {index + 1}
                  </span>
                  <span className="truncate">{cleanedTitle}</span>
                </div>
                {isActive && (
                  <span className="text-[9.5px] text-pink-500/70 font-mono font-semibold pl-4">
                    {isPlaying ? "Playing..." : "Paused"}
                  </span>
                )}
              </button>
            );
          })}
          {playlist.length === 0 && (
            <div className="text-center py-20 text-white/30 italic text-xs">
              No video files detected
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
