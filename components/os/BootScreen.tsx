"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { User, Loader2, ArrowRight } from "lucide-react";

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const { wallpaper } = useTheme();
  const [phase, setPhase] = useState<"bios" | "loading" | "login" | "complete">("bios");
  const [biosLines, setBiosLines] = useState<string[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
      "AMIBIOS (C) 2026 American Megatrends, Inc.",
      "BIOS Date: 06/11/26 15:53:45 Ver: 08.00.16",
      "CPU: Google Gemini 3.5 AI Core @ 4.20GHz",
      "Speed: 4200MHz  Count: 16 Cores",
      "Memory Test: 65536MB OK",
      "Initializing USB Controllers ... Done.",
      "Detecting Primary Master ... VIRTUAL-HDD 512GB",
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
        // Move to loading phase after BIOS
        setTimeout(() => {
          setPhase("loading");
        }, 800);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (phase === "loading") {
      // Hold loading screen for 2.2 seconds, then show login screen
      const timer = setTimeout(() => {
        setPhase("login");
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    // Simulate login validation delay
    setTimeout(() => {
      sessionStorage.setItem("web_os_booted", "true");
      onComplete();
    }, 800);
  };

  if (phase === "complete") return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-[99999] bg-black select-none overflow-hidden font-sans"
    >
      <AnimatePresence mode="wait">
        
        {/* Phase 1: BIOS */}
        {phase === "bios" && (
          <motion.div 
            key="bios"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black text-zinc-300 font-mono text-[10px] sm:text-xs p-6 flex flex-col justify-start gap-1 leading-normal"
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
                className="w-1.5 h-3.5 bg-white inline-block mt-1"
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
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black"
          >
            {/* Windows 11 modern bloom loading screen */}
            <div className="flex flex-col items-center gap-8">
              <div className="w-16 h-16 relative">
                {/* Modern Windows 11 Square Logo */}
                <div className="grid grid-cols-2 gap-1 w-full h-full text-blue-500">
                  <div className="bg-current opacity-90 rounded-sm"></div>
                  <div className="bg-current opacity-90 rounded-sm"></div>
                  <div className="bg-current opacity-90 rounded-sm"></div>
                  <div className="bg-current opacity-90 rounded-sm"></div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 3: Login Screen */}
        {phase === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute inset-0 bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: "url('/lock.jpg'), url('/wallpaper.jpg')" }}
          >
            {/* Dark glass cover */}
            <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />

            <div className="relative flex flex-col items-center gap-6 p-8 rounded-2xl max-w-sm w-full">
              {/* Profile Avatar */}
              <div className="w-22 h-22 rounded-full bg-zinc-700/50 border-2 border-white/20 flex items-center justify-center text-white backdrop-blur shadow-xl overflow-hidden">
                <User className="w-11 h-11 opacity-80" />
              </div>

              {/* Username */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-white drop-shadow-md">
                  Guest
                </h1>
                <p className="text-xs text-white/60 drop-shadow-sm mt-1">
                  Guest Account - Limited Access
                </p>
              </div>

              {/* Login Button/Input */}
              <form onSubmit={handleLogin} className="w-full flex flex-col items-center gap-3 mt-2">
                <div className="relative w-full max-w-[200px] flex items-center">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-10 bg-white/25 hover:bg-white/35 active:bg-white/20 text-white rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-all font-medium text-sm shadow-md cursor-pointer disabled:opacity-50"
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
                </div>
              </form>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};
