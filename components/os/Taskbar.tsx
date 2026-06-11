"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWindows } from "@/context/WindowContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { 
  Terminal, 
  Folder, 
  Monitor, 
  Globe, 
  GitBranch, 
  Mail,
  Wifi,
  Volume2,
  Battery,
  Sliders,
  Sun,
  Moon,
  FileText,
  Calculator as CalcIcon,
  Image as ImageIcon
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const Taskbar: React.FC<{ onStartClick: () => void }> = ({ onStartClick }) => {
  const { windows, activeWindowId, restoreWindow, focusWindow, minimizeWindow } = useWindows();
  const { wallpaper, isDark, setIsDark } = useTheme();
  const [time, setTime] = useState(new Date());
  const isMobile = useIsMobile();
  
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const trayRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setIsTrayOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calendar grid
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div 
      className={cn(
        "h-10 w-full flex items-center z-[10000] border-t select-none transition-all duration-300 relative shrink-0",
        "bg-[#f3f3f3]/85 dark:bg-[#101318]/85 backdrop-blur-md border-t-black/10 dark:border-t-white/10 text-black dark:text-white px-2"
      )}
    >
      {/* Centered items row (Win11 layout) */}
      <div className="flex-1 h-full flex items-center gap-1 justify-center">
        {/* Start Button */}
        <button
          onClick={onStartClick}
          onMouseEnter={() => setHoveredIcon("Start Menu")}
          onMouseLeave={() => setHoveredIcon(null)}
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-black/5 text-blue-500 transition-all cursor-default outline-none"
        >
          <div className="grid grid-cols-2 gap-[2px] w-4.5 h-4.5">
            <div className="bg-blue-600 rounded-[1px]"></div>
            <div className="bg-blue-600 rounded-[1px]"></div>
            <div className="bg-blue-600 rounded-[1px]"></div>
            <div className="bg-blue-600 rounded-[1px]"></div>
          </div>
        </button>

        <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Running apps items */}
        {windows.map((window) => {
          const isFocused = window.id === activeWindowId;
          return (
            <button
              key={window.id}
              onClick={() => {
                if (isFocused) {
                  minimizeWindow(window.id);
                } else {
                  restoreWindow(window.id);
                  focusWindow(window.id);
                }
              }}
              onMouseEnter={() => setHoveredIcon(window.title)}
              onMouseLeave={() => setHoveredIcon(null)}
              className={cn(
                "h-8 flex items-center gap-2 px-3 transition-all group relative cursor-default border border-transparent outline-none",
                isFocused 
                  ? "bg-black/5 dark:bg-white/10 rounded-md border-black/10 dark:border-white/10"
                  : "hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
              )}
              style={{
                maxWidth: "150px",
                minWidth: "40px"
              }}
            >
              <WindowIcon type={window.type} className="w-4 h-4 shrink-0" />
              {!isMobile && (
                <span className="text-xs truncate hidden sm:inline select-none text-zinc-700 dark:text-zinc-300">
                  {window.title}
                </span>
              )}
              
              {/* Active Indicator bar */}
              {isFocused && (
                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-4 h-[3px] bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* System Tray (Clock, Settings buttons) */}
      <div className="flex items-center gap-2.5 h-full px-4 shrink-0 text-zinc-700 dark:text-zinc-300 absolute right-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTrayOpen(!isTrayOpen)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-default outline-none"
          >
            <Wifi className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsTrayOpen(!isTrayOpen)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-default outline-none"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsTrayOpen(!isTrayOpen)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-default outline-none"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-current opacity-20" />

        {/* Time display */}
        <div 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex flex-col items-end cursor-default hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded transition-all outline-none"
        >
          <span className="text-[11px] font-bold tracking-tight">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isMobile && (
            <span className="text-[9px] opacity-70 mt-[-2px] tracking-wide">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Hover Tooltip display */}
      {hoveredIcon && !isMobile && (
        <div 
          className="fixed bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-zinc-900/90 text-white text-[11px] font-medium border border-white/10 shadow-lg pointer-events-none select-none z-[99999]"
        >
          {hoveredIcon}
        </div>
      )}

      {/* QUICK SETTINGS POPUP */}
      {isTrayOpen && (
        <div 
          ref={trayRef}
          className="fixed bottom-12 right-4 w-72 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 z-[99999] border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1a1f26]/95 text-zinc-800 dark:text-zinc-200 select-none text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <span className="font-bold tracking-tight">Quick Settings</span>
            <span className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-500 font-mono">
              Online
            </span>
          </div>

          {/* Quick Toggles */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/5">
              <Wifi className="w-4.5 h-4.5 text-blue-500" />
              <span className="text-[10px] font-medium">Wi-Fi</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/5">
              <Battery className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-[10px] font-medium">85%</span>
            </div>
            <button 
              onClick={() => setIsDark(!isDark)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isDark 
                  ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" 
                  : "bg-black/5 hover:bg-black/10 text-zinc-700"
              )}
            >
              {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              <span className="text-[10px] font-medium">{isDark ? "Dark" : "Light"}</span>
            </button>
          </div>
        </div>
      )}

      {/* CALENDAR POPUP */}
      {isCalendarOpen && (
        <div 
          ref={calendarRef}
          className="fixed bottom-12 right-4 w-72 rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 z-[99999] border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1a1f26]/95 text-zinc-800 dark:text-zinc-200 select-none animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <span className="font-bold font-mono text-sm">
              {time.toLocaleDateString([], { month: "long", year: "numeric" })}
            </span>
            <span className="text-[11px] opacity-50 dark:opacity-40 font-sans">
              Nepal Standard Time
            </span>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold opacity-50 dark:opacity-40">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Month Days grid */}
          <div className="grid grid-cols-7 text-center gap-y-2 text-xs font-mono">
            <span className="opacity-0"></span>
            <span className="opacity-0"></span>
            <span className="opacity-0"></span>
            <span className="opacity-0"></span>
            
            {daysInMonth.map((d) => (
              <span
                key={d}
                className={cn(
                  "py-1 rounded-md flex items-center justify-center font-semibold",
                  d === time.getDate()
                    ? "bg-blue-600 text-white font-bold shadow"
                    : "hover:bg-black/5 dark:hover:bg-white/5 cursor-default"
                )}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WindowIcon: React.FC<{ type: string; className?: string }> = ({ type, className }) => {
  switch (type) {
    case "terminal":
      return <Terminal className={cn("text-emerald-600", className)} />;
    case "folder":
      return <Folder className={cn("text-blue-600", className)} />;
    case "browser":
      return <Globe className={cn("text-blue-600", className)} />;
    case "projects":
      return <GitBranch className={cn("text-purple-600", className)} />;
    case "contact":
      return <Mail className={cn("text-emerald-600", className)} />;
    case "notepad":
      return <FileText className={cn("text-amber-600", className)} />;
    case "calculator":
      return <CalcIcon className={cn("text-orange-600", className)} />;
    case "image-viewer":
      return <ImageIcon className={cn("text-indigo-600", className)} />;
    default:
      return <Monitor className={cn("text-zinc-600", className)} />;
  }
};
