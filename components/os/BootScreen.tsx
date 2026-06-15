"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { User, Loader2, ArrowRight, Lock, Key, Fingerprint, ChevronUp } from "lucide-react";

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const { wallpaper } = useTheme();
  const [phase, setPhase] = useState<"bios" | "loading" | "lockscreen" | "login" | "complete">("bios");
  const [biosLines, setBiosLines] = useState<string[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Update clock every second
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if user already booted in this session
    const hasBooted = sessionStorage.getItem("web_os_booted") === "true";
    if (hasBooted) {
      setPhase("complete");
      onComplete();
      return;
    }

    // BIOS Lines sequencing
    const lines = [
      "Beand New (C) 2026 Pujan Joshi.",
      "BIOS Date: 06/11/26 15:53:45 Ver: 08.00.16",
      "CPU: It is very fast @ 420GHz",
      "Speed: 4200MHz  Count: 69 Cores",
      "Memory Test: 69420GB OK",
      "Initializing USB Controllers ... Done.",
      "Detecting Primary Master ... -SDD 512GB",
      "Detecting Primary Slave  ... None",
      "Booting from Primary Master..."
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setBiosLines(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPhase("loading");
        }, 3000);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (phase === "loading") {
      // Hold loading screen for 2.8 seconds, then show lock screen
      const timer = setTimeout(() => {
        setPhase("lockscreen");
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Click / Key listener to unlock the lockscreen
  useEffect(() => {
    if (phase === "lockscreen") {
      const handleUnlock = () => {
        setPhase("login");
      };
      window.addEventListener("click", handleUnlock);
      window.addEventListener("keydown", handleUnlock);
      return () => {
        window.removeEventListener("click", handleUnlock);
        window.removeEventListener("keydown", handleUnlock);
      };
    }
  }, [phase]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    // Simulate login validation delay
    setTimeout(() => {
      sessionStorage.setItem("web_os_booted", "true");
      onComplete();
    }, 1200);
  };

  if (phase === "complete") return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-[99999] bg-black select-none overflow-hidden font-sans"
    >
      <AnimatePresence mode="wait">
        
        {/* Phase 1: BIOS */}
        {phase === "bios" && (
          <motion.div 
            key="bios"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black text-[#00ff66] font-mono text-[10px] sm:text-xs p-8 flex flex-col justify-start gap-1.5 leading-relaxed"
            style={{ textShadow: "0 0 5px rgba(0, 255, 102, 0.4)" }}
          >
            {biosLines.map((line, idx) => (
              <div key={idx} className={idx === biosLines.length - 1 ? "text-white" : ""}>
                {line}
              </div>
            ))}
            {biosLines.length === 9 && (
              <motion.div 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-4 bg-[#00ff66] inline-block mt-1"
              />
            )}
          </motion.div>
        )}

        {/* Phase 2: Loading Screen */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black"
          >
            <div className="flex flex-col items-center gap-12">
              {/* 3D Perspective Glowing Logo with bobbing squares */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
                className="grid grid-cols-2 gap-2.5 w-20 h-20 text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]"
                style={{ 
                  transform: "perspective(800px) rotateY(-15deg) rotateX(10deg) rotateZ(-2deg)",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* Left Side (Top-Left) */}
                <div 
                  className="bg-current opacity-90 rounded-sm"
                  style={{ animation: "square-bob 2.0s infinite ease-in-out" }}
                ></div>
                {/* Right Side (Top-Right) */}
                <div 
                  className="bg-current opacity-90 rounded-sm"
                  style={{ animation: "square-bob 2.0s infinite ease-in-out", animationDelay: "1.0s" }}
                ></div>
                {/* Left Side (Bottom-Left) */}
                <div 
                  className="bg-current opacity-90 rounded-sm"
                  style={{ animation: "square-bob 2.0s infinite ease-in-out" }}
                ></div>
                {/* Right Side (Bottom-Right) */}
                <div 
                  className="bg-current opacity-90 rounded-sm"
                  style={{ animation: "square-bob 2.0s infinite ease-in-out", animationDelay: "1.0s" }}
                ></div>
              </motion.div>
            </div>

            {/* Custom keyframe styles for bobbing effect */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes square-bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
            `}} />
          </motion.div>
        )}

        {/* Phase 3: Lock Screen */}
        {phase === "lockscreen" && (
          <motion.div
            key="lockscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ y: -150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute inset-0 bg-cover bg-center flex flex-col justify-between p-12 text-white"
            style={{ backgroundImage: "url('/images/lock.webp'), url('/images/wallpaper.webp')" }}
          >
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/25" />

            {/* Time & Date */}
            <div className="relative z-10 flex flex-col items-center mt-12 text-center select-none">
              <span 
                suppressHydrationWarning
                className="text-7xl sm:text-8xl font-light tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              >
                {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "--:--"}
              </span>
              <span 
                suppressHydrationWarning
                className="text-lg sm:text-xl font-medium tracking-wide mt-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
              >
                {mounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : "Loading..."}
              </span>
            </div>

            {/* Hint to Unlock */}
            <div className="relative z-10 flex flex-col items-center gap-2 mb-8 text-center animate-pulse">
              <ChevronUp className="w-6 h-6 text-white/80" />
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-white/90 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]">
                Click or press any key to unlock
              </span>
            </div>
          </motion.div>
        )}

        {/* Phase 4: Login Screen */}
        {phase === "login" && (
          <motion.div
            key="login"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute inset-0 bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: "url('/images/lock.webp'), url('/images/wallpaper.webp')" }}
          >
            {/* Glass blur cover */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-2xl" />

            <div className="relative z-10 flex flex-col items-center gap-7 p-8 rounded-3xl max-w-sm w-full bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
              
              {/* Profile Avatar */}
              <div className="w-24 h-24 rounded-full border border-white/20 bg-zinc-700/50 flex items-center justify-center text-white backdrop-blur shadow-2xl overflow-hidden relative">
                <User className="w-12 h-12 opacity-80" />
              </div>

              {/* Username & Title */}
              <div className="text-center select-none">
                <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                  Guest
                </h1>
                <p className="text-xs text-blue-300 font-semibold tracking-wide mt-1 uppercase opacity-80">
                  Guest Account
                </p>
              </div>

              {/* Windows PIN/Password Form */}
              <form onSubmit={handleLogin} className="w-full flex flex-col items-center gap-3.5 mt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full max-w-[200px] h-10 bg-white/20 hover:bg-white/30 active:bg-white/15 text-white rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-all font-semibold text-sm shadow-md cursor-default disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                
                {isLoggingIn && (
                  <span className="text-[10px] text-white/55 font-mono select-none tracking-wide animate-pulse">
                    Signing in...
                  </span>
                )}
              </form>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};
