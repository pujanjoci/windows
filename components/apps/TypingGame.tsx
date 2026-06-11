"use client";

import React, { useState, useEffect, useRef } from "react";
import { Keyboard, Trophy, Timer, RefreshCw, Award, Code, Quote, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PARAGRAPHS = {
  javascript: [
    "const calculateWpm = (chars, time) => { const words = chars / 5; return Math.round(words / (time / 60)); };",
    "async function fetchProfile(username) { const res = await fetch(`/api/user/${username}`); return res.json(); }",
    "import React, { useState, useEffect } from 'react'; export const App = () => { return <div>Hello World</div>; };",
    "const sorted = items.sort((a, b) => a.priority - b.priority).filter(item => !item.completed);"
  ],
  tech: [
    "Artificial intelligence and neural networks are transforming software development, automating redundant tasks and generating production-ready code blocks.",
    "Responsive web design utilizes CSS media queries and flexible grid layouts to ensure interfaces render elegantly on high-resolution screens and smartphones.",
    "Git version control allows engineers to branch, commit, and merge codebase changes asynchronously, accelerating continuous integration pipelines.",
    "Web browsers parse HTML markup into a Document Object Model tree before rendering styled styles, transitions, and interactive scripts."
  ],
  quotes: [
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Code is like humor. When you have to explain it, it's bad.",
    "Simplicity is the soul of efficiency. Simple code is readable, maintainable, and less prone to regression errors."
  ]
};

type Category = keyof typeof PARAGRAPHS;

export const TypingGame: React.FC = () => {
  const [category, setCategory] = useState<Category>("tech");
  const [duration, setDuration] = useState<number>(30); // in seconds
  const [targetText, setTargetText] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set new target text
  const loadText = (cat: Category) => {
    const list = PARAGRAPHS[cat];
    const rand = list[Math.floor(Math.random() * list.length)];
    setTargetText(rand);
    setInputVal("");
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setGameState("idle");
  };

  useEffect(() => {
    loadText(category);
  }, [category]);

  useEffect(() => {
    setTimeLeft(duration);
    setGameState("idle");
    setInputVal("");
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
  }, [duration]);

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

    // Limit input length to target text
    if (value.length <= targetText.length) {
      setInputVal(value);
      
      // Calculate errors
      let errCount = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== targetText[i]) errCount++;
      }
      setErrors(errCount);

      // Accuracy
      if (value.length > 0) {
        const correctCount = value.length - errCount;
        setAccuracy(Math.round((correctCount / value.length) * 100));
      } else {
        setAccuracy(100);
      }

      // Finish automatically if completed text
      if (value.length === targetText.length) {
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
      const elapsed = duration - timeLeft || 1; // prevent divide by zero
      const words = (inputVal.length - errors) / 5;
      const finalWpm = Math.max(0, Math.round(words / (elapsed / 60)));
      setWpm(finalWpm);
    }
  }, [inputVal, timeLeft, gameState, errors, duration]);

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(duration);
    loadText(category);
  };

  const getWpmFeedback = (w: number) => {
    if (w >= 70) return { rank: "Ninja Typer", desc: "Absolute legends typist speed! Outstanding work." };
    if (w >= 50) return { rank: "Pro Typer", desc: "Solid, fluent speed. You are typing with style!" };
    if (w >= 35) return { rank: "Average Typer", desc: "Good speed. Keep practicing to cross the 50 WPM mark." };
    return { rank: "Novice Typer", desc: "Focus on accuracy first, speed will follow naturally." };
  };

  const feedback = getWpmFeedback(wpm);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6] dark:from-[#1a1b26] dark:to-[#12131a] text-zinc-800 dark:text-zinc-200 select-none font-sans p-4 justify-between">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Typing Master</h2>
            <p className="text-[10px] opacity-50">Boost your words per minute</p>
          </div>
        </div>

        {/* Options */}
        {gameState === "idle" && (
          <div className="flex items-center gap-3">
            {/* Category Select */}
            <div className="flex rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 border border-black/5 dark:border-white/5">
              {(["tech", "quotes", "javascript"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all uppercase cursor-default",
                    category === cat
                      ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {cat === "javascript" ? "JS Code" : cat}
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
      <div className="grid grid-cols-4 gap-3 my-3">
        <StatCard 
          icon={<Timer className="w-4 h-4 text-orange-500" />} 
          label="Time Left" 
          value={`${timeLeft}s`} 
          progress={(timeLeft / duration) * 100}
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

      {/* PLAY AREA */}
      <div 
        onClick={() => inputRef.current?.focus()} 
        className={cn(
          "flex-1 flex flex-col justify-center border rounded-2xl p-5 relative cursor-text min-h-[140px] transition-all bg-white/70 dark:bg-black/30 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]",
          gameState === "playing" 
            ? "border-blue-500/30 dark:border-cyan-500/30" 
            : "border-black/5 dark:border-white/5"
        )}
      >
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
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Final Result
              </h3>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400 tracking-tight">
                  {wpm}
                </span>
                <span className="text-xs font-semibold opacity-70">WPM</span>
              </div>
              <p className="text-xs font-semibold mt-2 text-zinc-700 dark:text-zinc-300">
                Rank: <span className="text-purple-600 dark:text-purple-400">{feedback.rank}</span> ({accuracy}% Acc)
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
        </button>

        <span className="text-[10px] opacity-40 font-semibold tracking-wide uppercase">
          Typing Master OS v1.0
        </span>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress?: number;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, progress, alert }) => {
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
      <span className="text-base font-extrabold tracking-tight">
        {value}
      </span>
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
          <div 
            className="h-full bg-blue-500 dark:bg-cyan-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
