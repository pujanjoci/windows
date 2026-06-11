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
  Volume,
  Volume1,
  VolumeX,
  Battery,
  Sliders,
  Sun,
  Moon,
  FileText,
  Calculator as CalcIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Bluetooth,
  Plane,
  Maximize2,
  Minimize2,
  SunDim,
  X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContextMenu } from "@/components/ui/ContextMenu";

export const Taskbar: React.FC<{ onStartClick: () => void }> = ({ onStartClick }) => {
  const { 
    windows, 
    activeWindowId, 
    restoreWindow, 
    focusWindow, 
    minimizeWindow, 
    openWindow, 
    triggerWindowAttention,
    closeWindow 
  } = useWindows();
  const { 
    wallpaper, 
    isDark, 
    setIsDark, 
    volume, 
    setVolume, 
    isNightLight, 
    setIsNightLight,
    taskbarShowMode,
    setTaskbarShowMode,
    taskbarAlignment,
    setTaskbarAlignment,
    taskbarSize,
    setTaskbarSize,
    taskbarAutohide,
    setTaskbarAutohide,
    taskbarLimitEnabled,
    setTaskbarLimitEnabled,
    taskbarIconNameLimit,
    setTaskbarIconNameLimit,
    taskbarIconOnlyLimit,
    setTaskbarIconOnlyLimit
  } = useTheme();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTaskbarSettingsOpen, setIsTaskbarSettingsOpen] = useState(false);
  const [activeAppMenu, setActiveAppMenu] = useState<{ x: number; y: number; windowId: string } | null>(null);
  const [taskbarMenu, setTaskbarMenu] = useState<{ x: number; y: number } | null>(null);
  const [overflowMenu, setOverflowMenu] = useState<{ x: number; y: number } | null>(null);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // Quick settings toggles state
  const [isWifiConnected, setIsWifiConnected] = useState(true);
  const [isBluetoothOn, setIsBluetoothOn] = useState(true);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);

  const trayRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const taskbarSettingsRef = useRef<HTMLDivElement>(null);

  // Synchronize immersive mode with actual fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsImmersive(isFull);
      if (!isFull) {
        // Unlock keyboard when exiting fullscreen
        const nav = navigator as any;
        if (nav.keyboard && nav.keyboard.unlock) {
          try {
            nav.keyboard.unlock();
          } catch (err) {
            console.warn("Failed to unlock keyboard", err);
          }
        }
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleImmersiveMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          const nav = navigator as any;
          if (nav.keyboard && nav.keyboard.lock) {
            nav.keyboard.lock(["Tab", "KeyE", "KeyN", "KeyD", "KeyK", "Escape"])
              .then(() => console.log("Keyboard lock acquired"))
              .catch((err: any) => console.warn("Failed to acquire keyboard lock:", err));
          }
        })
        .catch((err) => console.error("Error entering fullscreen", err));
    } else {
      const nav = navigator as any;
      if (nav.keyboard && nav.keyboard.unlock) {
        try {
          nav.keyboard.unlock();
        } catch (err) {
          console.warn("Failed to unlock keyboard", err);
        }
      }
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen", err));
    }
  };

  useEffect(() => {
    setMounted(true);
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
      if (taskbarSettingsRef.current && !taskbarSettingsRef.current.contains(e.target as Node)) {
        setIsTaskbarSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calendar grid
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleTaskbarContextMenu = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    setTaskbarMenu({ x: e.clientX, y: e.clientY });
  };

  const handleAppContextMenu = (e: React.MouseEvent, windowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveAppMenu({ x: e.clientX, y: e.clientY, windowId });
  };

  // Slice windows based on limit
  const limit = taskbarLimitEnabled
    ? (taskbarShowMode === "icon" ? taskbarIconOnlyLimit : taskbarIconNameLimit)
    : Infinity;

  const visibleWindows = windows.slice(0, limit);
  const overflowWindows = windows.slice(limit);
  const isAnyOverflowFocused = overflowWindows.some(w => w.id === activeWindowId);

  return (
    <div 
      onContextMenu={handleTaskbarContextMenu}
      className={cn(
        "w-full flex items-center z-[10000] border-t select-none transition-all duration-300 relative shrink-0",
        "bg-[#f3f3f3]/85 dark:bg-[#101318]/85 backdrop-blur-md border-t-black/10 dark:border-t-white/10 text-black dark:text-white px-2",
        // Dynamic height
        taskbarSize === "small" ? "h-8" : taskbarSize === "large" ? "h-12" : "h-10",
        // Auto-hide absolute position and translate
        taskbarAutohide && cn(
          "fixed bottom-0 left-0 right-0 transform transition-transform duration-300 ease-in-out shadow-2xl",
          taskbarSize === "small" 
            ? "translate-y-[28px] hover:translate-y-0" 
            : taskbarSize === "large" 
              ? "translate-y-[44px] hover:translate-y-0" 
              : "translate-y-[36px] hover:translate-y-0"
        )
      )}
    >
      {/* Centered items row (Adapts to taskbarAlignment) */}
      <div 
        className={cn(
          "flex-1 h-full flex items-center gap-1",
          taskbarAlignment === "center" ? "justify-center" : "justify-start pl-4"
        )}
      >
        {/* Start Button */}
        <button
          onClick={onStartClick}
          onMouseEnter={() => setHoveredIcon("Start Menu")}
          onMouseLeave={() => setHoveredIcon(null)}
          className={cn(
            "flex items-center justify-center rounded hover:bg-black/5 text-blue-500 transition-all cursor-default outline-none",
            taskbarSize === "small" ? "w-7 h-7" : taskbarSize === "large" ? "w-11 h-11" : "w-9 h-9"
          )}
        >
          <div 
            className={cn(
              "grid grid-cols-2 gap-[2px]",
              taskbarSize === "small" ? "w-3.5 h-3.5" : taskbarSize === "large" ? "w-5 h-5" : "w-4.5 h-4.5"
            )}
          >
            <div className="bg-blue-600 rounded-[1px]"></div>
            <div className="bg-blue-600 rounded-[1px]"></div>
            <div className="bg-blue-600 rounded-[1px]"></div>
            <div className="bg-blue-600 rounded-[1px]"></div>
          </div>
        </button>

        <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Running apps items */}
        {visibleWindows.map((window) => {
          const isFocused = window.id === activeWindowId;
          const showIcon = taskbarShowMode === "both" || taskbarShowMode === "icon";
          const showText = taskbarShowMode === "both" || taskbarShowMode === "name";

          return (
            <button
              key={window.id}
              onClick={() => {
                if (isFocused) {
                  minimizeWindow(window.id);
                } else {
                  restoreWindow(window.id);
                  focusWindow(window.id);
                  triggerWindowAttention(window.id);
                }
              }}
              onContextMenu={(e) => handleAppContextMenu(e, window.id)}
              onMouseEnter={() => setHoveredIcon(window.title)}
              onMouseLeave={() => setHoveredIcon(null)}
              className={cn(
                "flex items-center transition-all group relative cursor-default border border-transparent outline-none",
                // Height, spacing, padding based on size
                taskbarSize === "small" 
                  ? "h-6 text-[10px] px-2 gap-1.5" 
                  : taskbarSize === "large" 
                    ? "h-10 text-sm px-4 gap-2.5" 
                    : "h-8 text-xs px-3 gap-2",
                // Button rounded styles and active status colors
                isFocused 
                  ? "bg-black/5 dark:bg-white/10 rounded-md border-black/10 dark:border-white/10"
                  : "hover:bg-black/5 dark:hover:bg-white/5 rounded-md",
                // Narrow buttons in Icon-only mode
                taskbarShowMode === "icon" && (
                  taskbarSize === "small" ? "w-6 h-6 justify-center px-0" : taskbarSize === "large" ? "w-10 h-10 justify-center px-0" : "w-8 h-8 justify-center px-0"
                )
              )}
              style={{
                maxWidth: taskbarShowMode === "icon" ? undefined : (taskbarSize === "small" ? "120px" : taskbarSize === "large" ? "180px" : "150px"),
                minWidth: taskbarShowMode === "icon" ? undefined : "40px"
              }}
            >
              {showIcon && (
                <WindowIcon 
                  type={window.type} 
                  className={cn(
                    "shrink-0",
                    taskbarSize === "small" ? "w-3.5 h-3.5" : taskbarSize === "large" ? "w-5 h-5" : "w-4 h-4"
                  )} 
                />
              )}
              {showText && !isMobile && (
                <span className="truncate hidden sm:inline select-none text-zinc-700 dark:text-zinc-300">
                  {window.title}
                </span>
              )}

              {/* Close Button on Hover */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(window.id);
                }}
                className={cn(
                  "opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 p-0.5 rounded transition-opacity cursor-default z-10 text-zinc-500 hover:text-red-500 ml-1 shrink-0",
                  taskbarShowMode === "icon" ? "absolute top-[-2px] right-[-2px] bg-[#f3f3f3] dark:bg-[#101318] border border-black/10 dark:border-white/10 rounded-full" : "relative"
                )}
              >
                <X className="w-2.5 h-2.5" />
              </span>
              
              {/* Active Indicator bar */}
              {isFocused && (
                <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-4 h-[3px] bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}

        {/* Overflow Button */}
        {overflowWindows.length > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setOverflowMenu({
                x: rect.left,
                y: rect.top
              });
            }}
            onMouseEnter={() => setHoveredIcon(`+${overflowWindows.length} more windows`)}
            onMouseLeave={() => setHoveredIcon(null)}
            className={cn(
              "flex items-center justify-center transition-all group relative cursor-default border border-transparent outline-none",
              taskbarSize === "small" 
                ? "h-6 text-[10px] px-2 gap-1" 
                : taskbarSize === "large" 
                  ? "h-10 text-sm px-4 gap-2" 
                  : "h-8 text-xs px-3 gap-1.5",
              isAnyOverflowFocused
                ? "bg-black/5 dark:bg-white/10 rounded-md border-black/10 dark:border-white/10"
                : "hover:bg-black/5 dark:hover:bg-white/5 rounded-md",
              "text-zinc-600 dark:text-zinc-400 font-bold",
              taskbarShowMode === "icon" && (
                taskbarSize === "small" ? "w-6 h-6 px-0" : taskbarSize === "large" ? "w-10 h-10 px-0" : "w-8 h-8 px-0"
              )
            )}
            style={{
              minWidth: taskbarShowMode === "icon" ? undefined : "40px"
            }}
          >
            {taskbarShowMode === "icon" ? (
              <span className="tracking-tighter select-none font-extrabold text-sm">...</span>
            ) : (
              <span className="select-none flex items-center gap-1">
                <span>+{overflowWindows.length}</span>
                <span className="opacity-60 font-normal text-[10px] sm:inline hidden">more</span>
              </span>
            )}

            {/* Active Indicator bar */}
            {isAnyOverflowFocused && (
              <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-4 h-[3px] bg-blue-500 rounded-full" />
            )}
          </button>
        )}
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
            {volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : volume < 30 ? (
              <Volume className="w-3.5 h-3.5" />
            ) : volume < 70 ? (
              <Volume1 className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
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
          <span className="text-[11px] font-bold tracking-tight" suppressHydrationWarning>
            {mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          </span>
          {!isMobile && (
            <span className="text-[9px] opacity-70 mt-[-2px] tracking-wide" suppressHydrationWarning>
              {mounted ? time.toLocaleDateString([], { month: 'short', day: 'numeric' }) : "--- --"}
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
            {/* Wi-Fi */}
            <button 
              onClick={() => {
                if (!isAirplaneMode) {
                  setIsWifiConnected(!isWifiConnected);
                }
              }}
              disabled={isAirplaneMode}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isAirplaneMode
                  ? "opacity-40 bg-black/5 text-zinc-400"
                  : isWifiConnected 
                    ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" 
                    : "bg-black/5 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
              )}
            >
              <Wifi className="w-4.5 h-4.5" />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {isAirplaneMode ? "Disabled" : isWifiConnected ? "Connected" : "Disconnected"}
              </span>
            </button>

            {/* Bluetooth */}
            <button 
              onClick={() => {
                if (!isAirplaneMode) {
                  setIsBluetoothOn(!isBluetoothOn);
                }
              }}
              disabled={isAirplaneMode}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isAirplaneMode
                  ? "opacity-40 bg-black/5 text-zinc-400"
                  : isBluetoothOn 
                    ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" 
                    : "bg-black/5 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
              )}
            >
              <Bluetooth className="w-4.5 h-4.5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{isBluetoothOn ? "On" : "Off"}</span>
            </button>

            {/* Dark Mode */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isDark 
                  ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" 
                  : "bg-black/5 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
              )}
            >
              {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              <span className="text-[10px] font-medium truncate w-full text-center">{isDark ? "Dark" : "Light"}</span>
            </button>

            {/* Immersive Mode */}
            <button 
              onClick={toggleImmersiveMode}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isImmersive 
                  ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 animate-pulse" 
                  : "bg-black/5 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
              )}
              title="Locks keyboard shortcuts Win+E, Win+N, Alt+Tab inside the page (requires Fullscreen)"
            >
              {isImmersive ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
              <span className="text-[10px] font-medium truncate w-full text-center">{isImmersive ? "Immersive" : "Standard"}</span>
            </button>

            {/* Night Light */}
            <button 
              onClick={() => setIsNightLight(!isNightLight)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isNightLight 
                  ? "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25" 
                  : "bg-black/5 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
              )}
            >
              <SunDim className="w-4.5 h-4.5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{isNightLight ? "Warm Tint" : "Off"}</span>
            </button>

            {/* Airplane Mode */}
            <button 
              onClick={() => {
                const nextMode = !isAirplaneMode;
                setIsAirplaneMode(nextMode);
                if (nextMode) {
                  setIsWifiConnected(false);
                  setIsBluetoothOn(false);
                } else {
                  setIsWifiConnected(true);
                  setIsBluetoothOn(true);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-default border border-transparent outline-none",
                isAirplaneMode 
                  ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" 
                  : "bg-black/5 hover:bg-black/10 text-zinc-700 dark:text-zinc-300"
              )}
            >
              <Plane className="w-4.5 h-4.5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{isAirplaneMode ? "Flight On" : "Flight Off"}</span>
            </button>
          </div>

          {/* Volume Control Slider */}
          <div className="flex flex-col gap-1.5 border-t border-black/5 dark:border-white/5 pt-3">
            <span className="text-[10px] font-bold opacity-45 uppercase tracking-wider">Volume</span>
            <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl">
              <button
                onClick={() => setVolume(volume === 0 ? 50 : 0)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors cursor-default outline-none text-blue-500"
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                ) : volume < 30 ? (
                  <Volume className="w-4 h-4 text-blue-500" />
                ) : volume < 70 ? (
                  <Volume1 className="w-4 h-4 text-blue-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-blue-500" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 h-1 rounded-lg appearance-none cursor-default bg-zinc-300 dark:bg-zinc-700 accent-blue-500 outline-none"
              />
              <span className="text-[10px] font-bold font-mono w-6 text-right">
                {volume}%
              </span>
            </div>
          </div>

          {/* Footer settings actions */}
          <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2.5 mt-1 select-none">
            <span className="text-[10px] opacity-40 font-semibold uppercase">
              Build v1.2
            </span>
            <button
              onClick={() => {
                openWindow("settings", "Settings");
                setIsTrayOpen(false);
              }}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-default outline-none flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
              title="All Settings"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
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
            <span className="font-bold font-mono text-sm" suppressHydrationWarning>
              {mounted ? time.toLocaleDateString([], { month: "long", year: "numeric" }) : "Loading..."}
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
                  mounted && d === time.getDate()
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

      {/* TASKBAR SETTINGS POPUP */}
      {isTaskbarSettingsOpen && (
        <div 
          ref={taskbarSettingsRef}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[340px] rounded-2xl p-4 shadow-2xl flex flex-col gap-4 z-[99999] border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1a1f26]/95 text-zinc-800 dark:text-zinc-200 select-none animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
            <SettingsIcon className="w-4.5 h-4.5 text-blue-500" />
            <span className="font-bold text-sm">Taskbar Settings</span>
          </div>

          {/* Settings Options */}
          <div className="flex flex-col gap-4 text-xs">
            {/* Show Mode Option */}
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Show Running Programs As</span>
              <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                {(["both", "icon", "name"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTaskbarShowMode(mode)}
                    className={cn(
                      "py-1 px-2 rounded-md transition-all font-medium capitalize",
                      taskbarShowMode === mode 
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold" 
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {mode === "both" ? "Both" : mode === "icon" ? "Icon Only" : "Name Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment Option */}
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Taskbar Alignment</span>
              <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                {(["center", "left"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => setTaskbarAlignment(align)}
                    className={cn(
                      "py-1 px-2 rounded-md transition-all font-medium capitalize",
                      taskbarAlignment === align 
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold" 
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Option */}
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Taskbar Size</span>
              <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTaskbarSize(size)}
                    className={cn(
                      "py-1 px-2 rounded-md transition-all font-medium capitalize",
                      taskbarSize === size 
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold" 
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Behavior Option (Auto-hide) */}
            <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3 mt-1">
              <div className="flex flex-col">
                <span className="font-semibold">Automatically hide the taskbar</span>
                <span className="text-[10px] text-zinc-400">Hides the taskbar when not in use</span>
              </div>
              <button
                onClick={() => setTaskbarAutohide(!taskbarAutohide)}
                className={cn(
                  "w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none relative",
                  taskbarAutohide ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    taskbarAutohide ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Limit Option */}
            <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3 mt-1">
              <div className="flex flex-col">
                <span className="font-semibold">Limit taskbar items</span>
                <span className="text-[10px] text-zinc-400">Avoid clutter by hiding overflow items</span>
              </div>
              <button
                onClick={() => setTaskbarLimitEnabled(!taskbarLimitEnabled)}
                className={cn(
                  "w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none relative",
                  taskbarLimitEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    taskbarLimitEnabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Threshold limits */}
            {taskbarLimitEnabled && (
              <div className="flex flex-col gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-700 mt-1 select-none text-[11px]">
                {/* Icon & Name Limit */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Icon & Name Limit</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTaskbarIconNameLimit(Math.max(1, taskbarIconNameLimit - 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold border border-black/5 dark:border-white/5 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold font-mono">{taskbarIconNameLimit}</span>
                    <button
                      onClick={() => setTaskbarIconNameLimit(Math.min(20, taskbarIconNameLimit + 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold border border-black/5 dark:border-white/5 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Icon Only Limit */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Icon Only Limit</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTaskbarIconOnlyLimit(Math.max(1, taskbarIconOnlyLimit - 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold border border-black/5 dark:border-white/5 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold font-mono">{taskbarIconOnlyLimit}</span>
                    <button
                      onClick={() => setTaskbarIconOnlyLimit(Math.min(20, taskbarIconOnlyLimit + 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold border border-black/5 dark:border-white/5 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Taskbar Background Context Menu */}
      {taskbarMenu && (
        <ContextMenu
          x={taskbarMenu.x}
          y={taskbarMenu.y}
          onClose={() => setTaskbarMenu(null)}
          items={[
            {
              label: "Taskbar Settings",
              icon: <SettingsIcon className="w-4 h-4 text-blue-500" />,
              onClick: () => setIsTaskbarSettingsOpen(true)
            }
          ]}
        />
      )}

      {/* App Taskbar Item Context Menu */}
      {activeAppMenu && (
        <ContextMenu
          x={activeAppMenu.x}
          y={activeAppMenu.y}
          onClose={() => setActiveAppMenu(null)}
          items={[
            {
              label: windows.find(w => w.id === activeAppMenu.windowId)?.isMinimized ? "Restore" : "Minimize",
              icon: windows.find(w => w.id === activeAppMenu.windowId)?.isMinimized ? <Maximize2 className="w-4 h-4 text-zinc-400" /> : <Minimize2 className="w-4 h-4 text-zinc-400" />,
              onClick: () => {
                const targetWin = windows.find(w => w.id === activeAppMenu.windowId);
                if (targetWin) {
                  if (targetWin.isMinimized) {
                    restoreWindow(targetWin.id);
                    focusWindow(targetWin.id);
                  } else {
                    minimizeWindow(targetWin.id);
                  }
                }
              }
            },
            {
              label: "End Task",
              icon: <X className="w-4 h-4 text-red-500" />,
              onClick: () => {
                closeWindow(activeAppMenu.windowId);
              }
            }
          ]}
        />
      )}

      {/* Overflow Windows Dropdown Menu */}
      {overflowMenu && (
        <ContextMenu
          x={overflowMenu.x}
          y={overflowMenu.y}
          onClose={() => setOverflowMenu(null)}
          items={overflowWindows.map((win) => ({
            label: win.title,
            icon: (
              <div className="relative flex items-center justify-center">
                <WindowIcon type={win.type} className="w-4 h-4 shrink-0" />
                {win.id === activeWindowId && (
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#1a1f26]" />
                )}
              </div>
            ),
            onClick: () => {
              restoreWindow(win.id);
              focusWindow(win.id);
              triggerWindowAttention(win.id);
            }
          }))}
        />
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
