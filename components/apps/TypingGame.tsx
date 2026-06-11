"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Keyboard, Trophy, Timer, RefreshCw, Award, Sparkles, CheckCircle2, Shield, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindows } from "@/context/WindowContext";

const PARAGRAPHS = {
  easy: [
    "the simple typing game lets you practice your speed and accuracy on the web",
    "many software developers write clean code every day to build beautiful projects",
    "practicing typing is a great way to improve your programming skills over time",
    "learning to code is a fun journey that opens up many opportunities for your future",
    "the quick brown fox jumps over the lazy dog in a warm sunny day",
    "focus on keyboard shortcuts and key placement to gain speed and precision",
    "typing simple english words builds muscle memory for computer developers"
  ],
  medium: [
    "Artificial intelligence and neural networks are transforming software development, automating redundant tasks and generating production-ready code blocks.",
    "Responsive web design utilizes CSS media queries and flexible grid layouts to ensure interfaces render elegantly on high-resolution screens and smartphones.",
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    "Simplicity is the soul of efficiency. Simple code is readable, maintainable, and less prone to regression errors.",
    "Great software engineering is not about typing fast, but about planning carefully and designing robust solutions.",
    "Cloud platforms host containers dynamically, scaling CPU and memory allocations based on real-time traffic spikes.",
    "Web browsers construct a CSS Object Model tree alongside the DOM before rendering the visual viewport details."
  ],
  hard: [
    "const calculateWpm = (chars, time) => { const words = chars / 5; return Math.round(words / (time / 60)); };",
    "async function fetchProfile(username) { const res = await fetch(`/api/user/${username}`); return res.json(); }",
    "import React, { useState, useEffect } from 'react'; export const App = () => { return <div>Hello World</div>; };",
    "git add . && git commit -m \"Refine OS: dark mode, layout optimizations\" && git push origin main",
    "const filtered = items.sort((a, b) => b.score - a.score).map(x => ({ id: x.id, name: x.name }));",
    "const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });",
    "export type WindowType = 'folder' | 'terminal' | 'browser' | 'notepad' | 'calculator' | 'typing-game';"
  ]
};

type Difficulty = "easy" | "medium" | "hard";

export const TypingGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [duration, setDuration] = useState<number>(30); // in seconds
  const [targetText, setTargetText] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [flashRed, setFlashRed] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set target text dynamically scaled to difficulty and duration
  const loadText = useCallback((diff: Difficulty, dur: number) => {
    const list = PARAGRAPHS[diff];
    // Scale text length: 15s = 1 sentence, 30s = 2 sentences, 60s = 3 sentences
    const count = dur === 15 ? 1 : dur === 30 ? 2 : 3;
    
    const selected: string[] = [];
    const temp = [...list];
    for (let i = 0; i < count; i++) {
      if (temp.length === 0) break;
      const randIdx = Math.floor(Math.random() * temp.length);
      selected.push(temp[randIdx]);
      temp.splice(randIdx, 1);
    }
    
    setTargetText(selected.join(" "));
    setInputVal("");
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setGameState("idle");
  }, []);

  useEffect(() => {
    loadText(difficulty, duration);
    setTimeLeft(duration);
    setGameState("idle");
  }, [difficulty, duration, loadText]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle game loop
  const startTimer = () => {
    setGameState("playing");
    setTimeLeft(duration);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Process input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (gameState === "idle" && value.length > 0) {
      startTimer();
    }
    if (gameState === "finished") return;

    // MEDIUM MODE: "Mistake Lock"
    if (difficulty === "medium") {
      const firstErrorIdx = value.split("").findIndex((char, idx) => char !== targetText[idx]);
      if (firstErrorIdx !== -1 && value.length > firstErrorIdx + 1) {
        return;
      }
    }

    // HARD MODE: "Time Penalty"
    if (difficulty === "hard" && value.length > inputVal.length) {
      const typedChar = value[value.length - 1];
      const targetChar = targetText[value.length - 1];
      if (typedChar !== targetChar) {
        setTimeLeft((prev) => Math.max(0, Math.round(prev - 2))); // deduct 2 seconds per error
        setFlashRed(true);
        setTimeout(() => setFlashRed(false), 150);
      }
    }

    if (value.length <= targetText.length) {
      setInputVal(value);
      
      let errCount = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== targetText[i]) errCount++;
      }
      setErrors(errCount);

      if (value.length > 0) {
        const correctCount = value.length - errCount;
        setAccuracy(Math.round((correctCount / value.length) * 100));
      } else {
        setAccuracy(100);
      }

      // Finish automatically if completed text correctly
      if (value.length === targetText.length && errCount === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState("finished");
      }
    }
  };

  // Calculate stats live
  useEffect(() => {
    if (gameState === "playing" && inputVal.length > 0) {
      const elapsed = duration - timeLeft;
      if (elapsed > 0) {
        const words = (inputVal.length - errors) / 5;
        const netWpm = Math.max(0, Math.round(words / (elapsed / 60)));
        setWpm(netWpm);
      }
    } else if (gameState === "finished") {
      const elapsed = duration - timeLeft || 1;
      const words = (inputVal.length - errors) / 5;
      const finalWpm = Math.max(0, Math.round(words / (elapsed / 60)));
      setWpm(finalWpm);
    }
  }, [inputVal, timeLeft, gameState, errors, duration]);

  // Stop game if time hits 0
  useEffect(() => {
    if (timeLeft === 0 && gameState === "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState("finished");
    }
  }, [timeLeft, gameState]);

  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(duration);
    loadText(difficulty, duration);
  }, [difficulty, duration, loadText]);

  const { windows, activeWindowId } = useWindows();
  const gameWindow = windows.find(w => w.type === "typing-game");
  const isWindowActive = gameWindow && gameWindow.id === activeWindowId;

  // Auto-focus input on active window state
  useEffect(() => {
    if (isWindowActive && gameState === "idle") {
      inputRef.current?.focus();
    }
  }, [isWindowActive, gameState]);

  // Handle in-game keyboard shortcuts (Esc, Ctrl+Enter, Enter/Space on Finished)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isWindowActive) return;

      // Esc key to reset
      if (e.key === "Escape") {
        e.preventDefault();
        resetGame();
        setTimeout(() => inputRef.current?.focus(), 50);
      }

      // Ctrl + Enter to reset
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetGame();
        setTimeout(() => inputRef.current?.focus(), 50);
      }

      // If game is finished, Enter or Space restarts
      if (gameState === "finished") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          resetGame();
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWindowActive, gameState, resetGame]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getWpmFeedback = (w: number) => {
    if (w >= 70) return { rank: "Ninja Typer", desc: "Absolute legends typist speed! Outstanding work." };
    if (w >= 50) return { rank: "Pro Typer", desc: "Solid, fluent speed. You are typing with style!" };
    if (w >= 35) return { rank: "Average Typer", desc: "Good speed. Keep practicing to cross the 50 WPM mark." };
    return { rank: "Novice Typer", desc: "Focus on accuracy first, speed will follow naturally." };
  };

  const feedback = getWpmFeedback(wpm);

  const getDifficultyModifierDesc = () => {
    switch (difficulty) {
      case "easy":
        return { icon: <Shield className="w-3.5 h-3.5 text-emerald-500" />, text: "Standard Mode: Simple words, no speed penalties." };
      case "medium":
        return { icon: <Lock className="w-3.5 h-3.5 text-amber-500" />, text: "Mistake Lock: Blocked from typing ahead until errors are corrected." };
      case "hard":
        return { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />, text: "Sudden Penalty: Wrong keystrokes deduct 2.0 seconds!" };
    }
  };

  const modifier = getDifficultyModifierDesc();

  return (
    <div className={cn(
      "flex flex-col h-full bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6] dark:from-[#1a1b26] dark:to-[#12131a] text-zinc-800 dark:text-zinc-200 select-none font-sans p-4 justify-between transition-colors duration-150",
      flashRed && "bg-red-500/10 dark:bg-red-950/20 border-red-500/30"
    )}>
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Typing Master</h2>
            <p className="text-[10px] opacity-50">Boost your words per minute</p>
          </div>
        </div>

        {/* Level & Time Selectors */}
        {gameState === "idle" && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Difficulty Select */}
            <div className="flex rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 border border-black/5 dark:border-white/5">
              {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all uppercase cursor-default",
                    difficulty === diff
                      ? diff === "easy" 
                        ? "bg-emerald-500 text-white shadow-sm"
                        : diff === "medium"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-red-500 text-white shadow-sm"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Time Select */}
            <div className="flex rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 border border-black/5 dark:border-white/5">
              {[15, 30, 60].map((t) => (
                <button
                  key={t}
                  onClick={() => setDuration(t)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-default",
                    duration === t
                      ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STATS PANEL */}
      <div className="grid grid-cols-4 gap-2.5 my-2.5">
        <StatCard 
          icon={<Timer className="w-4 h-4 text-orange-500" />} 
          label="Time Left" 
          value={formatTime(timeLeft)} 
        />
        <StatCard 
          icon={<Trophy className="w-4 h-4 text-yellow-500" />} 
          label="Speed" 
          value={`${wpm} WPM`} 
        />
        <StatCard 
          icon={<Award className="w-4 h-4 text-emerald-500" />} 
          label="Accuracy" 
          value={`${accuracy}%`} 
        />
        <StatCard 
          icon={<Sparkles className="w-4 h-4 text-purple-500" />} 
          label="Errors" 
          value={errors.toString()} 
          alert={errors > 3}
        />
      </div>

      {/* MODIFIER NOTICE */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 text-[10px] font-medium opacity-80 mb-3">
        <div className="flex items-center gap-2">
          {modifier.icon}
          <span>{modifier.text}</span>
        </div>
        {gameState === "playing" && (
          <span className="font-bold opacity-60 tracking-wider">
            {Math.round((inputVal.length / targetText.length) * 100)}% DONE
          </span>
        )}
      </div>

      {/* PLAY AREA */}
      <div 
        onClick={() => inputRef.current?.focus()} 
        className={cn(
          "flex-1 flex flex-col justify-center border rounded-2xl p-5 relative overflow-hidden cursor-text min-h-[140px] transition-all bg-white/70 dark:bg-black/35 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]",
          gameState === "playing" 
            ? "border-blue-500/30 dark:border-cyan-500/30" 
            : "border-black/5 dark:border-white/5",
          flashRed && "border-red-500/40 shadow-red-500/5"
        )}
      >
        {/* Clean Line Timer bar */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800/70 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-linear",
                difficulty === "easy" ? "bg-emerald-500" : difficulty === "medium" ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${(timeLeft / duration) * 100}%` }}
            />
          </div>
        )}

        {gameState !== "finished" ? (
          <div className="relative font-mono leading-relaxed text-sm select-none break-words">
            {targetText.split("").map((char, index) => {
              let charClass = "text-zinc-400/70 dark:text-zinc-500/70"; // Default
              const isTyped = index < inputVal.length;
              const isCurrent = index === inputVal.length;

              if (isTyped) {
                charClass = inputVal[index] === char 
                  ? "text-emerald-500 dark:text-emerald-400 font-semibold" 
                  : "text-red-500 dark:text-red-400 bg-red-500/10 rounded font-semibold underline decoration-wavy";
              }

              return (
                <span key={index} className="relative">
                  {isCurrent && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-cyan-400 animate-pulse" />
                  )}
                  <span className={charClass}>{char}</span>
                </span>
              );
            })}
            
            {/* Hidden TextArea */}
            <textarea
              ref={inputRef}
              autoFocus
              value={inputVal}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none cursor-default resize-none overflow-hidden outline-none"
            />
          </div>
        ) : (
          /* RESULTS CARD */
          <div className="flex flex-col items-center justify-center text-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                Final Result
              </h3>
              
              {/* Speed & Accuracy Display */}
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400 tracking-tight">
                  {wpm}
                </span>
                <span className="text-xs font-semibold opacity-70">WPM</span>
              </div>

              {/* Game Mode Badges */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border shadow-sm",
                  difficulty === "easy" 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                    : difficulty === "medium" 
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                )}>
                  {difficulty} Mode
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm">
                  {duration}s Duration
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm">
                  {accuracy}% Accuracy
                </span>
              </div>

              <p className="text-xs font-semibold mt-3 text-zinc-700 dark:text-zinc-300">
                Rank: <span className="text-purple-600 dark:text-purple-400 font-bold">{feedback.rank}</span>
              </p>
              <p className="text-[10px] opacity-60 max-w-xs mx-auto mt-1 leading-normal">
                {feedback.desc}
              </p>
            </div>
          </div>
        )}

        {/* Start Game Prompter */}
        {gameState === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[1px] rounded-2xl animate-pulse pointer-events-none">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
              Click & start typing to begin
            </span>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3 mt-3">
        <button
          onClick={resetGame}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 shadow-sm active:translate-y-[1px] active:shadow-inner transition-all cursor-default"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Test</span>
          <kbd className="ml-1 px-1.5 py-0.5 text-[9px] bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-mono rounded border border-black/10 dark:border-white/10 font-normal">Esc</kbd>
        </button>

        <span className="text-[10px] opacity-40 font-semibold tracking-wide uppercase">
          Typing Master OS v1.2
        </span>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, alert }) => {
  return (
    <div className={cn(
      "relative flex flex-col p-3 rounded-2xl border bg-white/70 dark:bg-zinc-800/40 border-black/5 dark:border-white/5 shadow-[0_1.5px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_1.5px_2px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden transition-all",
      alert && "border-red-500/20 bg-red-500/5 text-red-500"
    )}>
      <div className="flex items-center gap-1.5 mb-1 text-zinc-500 dark:text-zinc-400">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
          {label}
        </span>
      </div>
      <span className="text-base font-extrabold tracking-tight font-mono">
        {value}
      </span>
    </div>
  );
};
