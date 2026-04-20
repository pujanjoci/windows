"use client";

import React, { useState, useEffect } from "react";
import { useWindows } from "@/context/WindowContext";
import { cn } from "@/lib/utils";
import { 
  Square, 
  Terminal, 
  Folder, 
  Search, 
  Monitor,
  LayoutGrid,
  Globe,
  GitBranch,
  Mail
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const Taskbar: React.FC<{ onStartClick: () => void }> = ({ onStartClick }) => {
  const { windows, activeWindowId, focusWindow, restoreWindow } = useWindows();
  const [time, setTime] = useState(new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-10 w-full glass dark:glass-dark flex items-center px-1 gap-1 z-[10000] border-t border-black/5 dark:border-white/5 transition-colors duration-300">
      {/* Start Button */}
      <button
        onClick={onStartClick}
        className="w-9 h-8 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10 text-blue-500 dark:text-blue-400 transition-colors"
      >
        <LayoutGrid className="w-5 h-5 fill-current" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />

      {/* Pinned/Open Windows */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {windows.map((window) => (
          <button
            key={window.id}
            onClick={() => {
              if (window.id === activeWindowId) {
                // Focus logic handled by Window component or context
              }
              restoreWindow(window.id);
            }}
            className={cn(
              "h-8 flex items-center gap-2 px-3 rounded min-w-[40px] max-w-[160px] transition-all group relative",
              window.id === activeWindowId 
                ? "bg-black/5 dark:bg-white/15 border border-black/10 dark:border-white/10" 
                : "hover:bg-black/5 dark:hover:bg-white/10 text-black/80 dark:text-white"
            )}
          >
            <WindowIcon type={window.type} className="w-4 h-4 shrink-0" />
            {!isMobile && (
              <span className="text-xs text-black/90 dark:text-white/90 truncate hidden sm:inline">
                {window.title}
              </span>
            )}
            
            {/* Active Indicator */}
            {window.id === activeWindowId && (
              <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-3 px-3">
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-medium text-black dark:text-white/90">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isMobile && (
            <span className="text-[9px] text-black/60 dark:text-white/60">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <button className="w-2 h-full hover:bg-white/10 border-l border-white/10 ml-2" />
      </div>
    </div>
  );
};

const WindowIcon: React.FC<{ type: string; className?: string }> = ({ type, className }) => {
  switch (type) {
    case "terminal":
      return <Terminal className={cn("text-emerald-600 dark:text-emerald-400", className)} />;
    case "folder":
      return <Folder className={cn("text-blue-600 dark:text-blue-400", className)} />;
    case "browser":
      return <Globe className={cn("text-blue-600 dark:text-blue-400", className)} />;
    case "projects":
      return <GitBranch className={cn("text-purple-600 dark:text-purple-400", className)} />;
    case "contact":
      return <Mail className={cn("text-emerald-600 dark:text-emerald-400", className)} />;
    default:
      return <Monitor className={cn("text-zinc-600 dark:text-zinc-400", className)} />;
  }
};
