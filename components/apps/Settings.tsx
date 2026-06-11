"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { 
  Volume2, 
  VolumeX, 
  Palette, 
  Monitor, 
  Info, 
  Sliders, 
  Sun, 
  Moon, 
  Laptop, 
  User, 
  Shield, 
  HardDrive,
  Globe,
  Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

type ActiveTab = "system" | "personalization" | "taskbar" | "about";

export const Settings: React.FC = () => {
  const { 
    isDark, 
    setIsDark, 
    wallpaper, 
    setWallpaper, 
    accentColor, 
    setAccentColor,
    volume,
    setVolume,
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
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("system");

  const wallpapers = [
    { name: "Windows 11 Default", path: "/images/wallpaper.jpg", thumbnail: "/images/wallpaper.jpg" },
    { name: "Windows 11 Lockscreen", path: "/images/lock.jpg", thumbnail: "/images/lock.jpg" },
    { name: "Midnight Navy (Solid)", path: "solid:#0f172a", thumbnail: "" },
    { name: "Deep Charcoal (Solid)", path: "solid:#18181b", thumbnail: "" }
  ];

  const accents = [
    { name: "Windows Blue", color: "#0078d4" },
    { name: "Emerald Green", color: "#107c41" },
    { name: "Sunset Orange", color: "#d83b01" },
    { name: "Passion Purple", color: "#5c2d91" },
    { name: "Teal Green", color: "#008272" }
  ];

  const handleWallpaperChange = (path: string) => {
    setWallpaper(path);
  };

  return (
    <div className="flex h-full bg-[#f3f3f3] dark:bg-[#1f1f1f] text-zinc-800 dark:text-zinc-200 font-sans select-none overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-48 bg-[#eaeaea] dark:bg-[#282828] border-r border-black/5 dark:border-white/5 flex flex-col p-2 gap-1.5 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 mb-2">
          <SettingsIcon className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold tracking-tight">Windows Settings</span>
        </div>

        <SidebarTab 
          icon={<Monitor className="w-4 h-4" />} 
          label="System" 
          active={activeTab === "system"} 
          onClick={() => setActiveTab("system")} 
        />
        <SidebarTab 
          icon={<Palette className="w-4 h-4" />} 
          label="Personalization" 
          active={activeTab === "personalization"} 
          onClick={() => setActiveTab("personalization")} 
        />
        <SidebarTab 
          icon={<Sliders className="w-4 h-4" />} 
          label="Taskbar" 
          active={activeTab === "taskbar"} 
          onClick={() => setActiveTab("taskbar")} 
        />
        <SidebarTab 
          icon={<Info className="w-4 h-4" />} 
          label="About Me" 
          active={activeTab === "about"} 
          onClick={() => setActiveTab("about")} 
        />
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        {activeTab === "system" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-1 duration-150">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">System Settings</h2>
              <p className="text-[10px] opacity-50">This was harder to buld as there is no real system to configure</p>
            </div>

            {/* Audio Panel Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                  <Volume2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Sound Settings</h3>
                  <p className="text-[9px] opacity-50">Adjust system master volume levels</p>
                </div>
              </div>

              {/* Master Volume Controller */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => setVolume(volume === 0 ? 50 : 0)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-default outline-none text-blue-500"
                >
                  {volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-1 rounded-lg appearance-none cursor-default bg-zinc-300 dark:bg-zinc-700 accent-blue-500 outline-none"
                />
                <span className="text-xs font-bold font-mono w-8 text-right">
                  {volume}%
                </span>
              </div>
            </div>

            {/* Device Info Panel */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Laptop className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Device Specifications</h3>
                  <p className="text-[9px] opacity-50">System properties (I guess)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-[11px]">
                <SpecItem label="Device Name" value="Windows-Project <Pujan-Me  >" />
                <SpecItem label="Processor" value="Computer Chip <I dont know what to add here>" />
                <SpecItem label="Installed RAM" value="2000 GB <So many GBs in this economy>" />
                <SpecItem label="System Type" value="64-bit" />
                <SpecItem label="Storage" value="SSD (1000 GB) - The storage is lower than the RAM wow" />
                <SpecItem label="Windows Version" value="Simulated OS" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "personalization" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-1 duration-150">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">Personalization Settings</h2>
              <p className="text-[10px] opacity-50">Customize background images, accent colors, and dark mode theme</p>
            </div>

            {/* Dark Mode toggle */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold">System Theme</h3>
                  <p className="text-[9px] opacity-50">Toggle between Light and Dark mode appearances</p>
                </div>
              </div>

              <button 
                onClick={() => setIsDark(!isDark)}
                className={cn(
                  "px-3 py-1.5 text-[10.5px] font-bold rounded-lg cursor-default border border-black/10 dark:border-white/10 shadow-sm transition-all outline-none",
                  isDark 
                    ? "bg-blue-600 text-white hover:bg-blue-500" 
                    : "bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                {isDark ? "Dark Mode" : "Light Mode"}
              </button>
            </div>

            {/* Wallpaper picker */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold">Select Desktop Background</h3>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                {wallpapers.map((wp, idx) => {
                  const isSolid = wp.path.startsWith("solid:");
                  const bgStyle = isSolid 
                    ? { backgroundColor: wp.path.split(":")[1] } 
                    : { backgroundImage: `url('${wp.path}')` };
                    
                  return (
                    <button
                      key={idx}
                      onClick={() => handleWallpaperChange(wp.path)}
                      className={cn(
                        "h-24 rounded-xl border-2 bg-cover bg-center overflow-hidden flex flex-col justify-end p-2 transition-all cursor-default relative group",
                        wallpaper === wp.path
                          ? "border-blue-500 shadow-md scale-[1.02]"
                          : "border-black/10 dark:border-white/10 hover:border-blue-500/40"
                      )}
                      style={bgStyle}
                    >
                      {/* Check indicator */}
                      {wallpaper === wp.path && (
                        <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-blue-600 border border-white/90 flex items-center justify-center text-white text-[9px] font-bold">
                          ✓
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-white bg-black/40 px-2 py-0.5 rounded backdrop-blur-[2px] leading-tight select-none truncate max-w-full">
                        {wp.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color picker */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold">System Accent Color</h3>
              <div className="flex items-center gap-2.5 flex-wrap mt-1">
                {accents.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAccentColor(acc.color)}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-2 border-transparent transition-all cursor-default hover:scale-105 active:scale-95",
                      accentColor === acc.color && "border-white dark:border-zinc-800 outline outline-2 outline-blue-500 ring-2 ring-blue-500/30"
                    )}
                    style={{ backgroundColor: acc.color }}
                    title={acc.name}
                  >
                    {accentColor === acc.color && (
                      <span className="text-[10px] font-bold text-white leading-none">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "taskbar" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-1 duration-150">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">Taskbar Settings</h2>
              <p className="text-[10px] opacity-50">Configure size, alignment, display mode, and auto-hide behaviors for your taskbar</p>
            </div>

            {/* Taskbar Alignment Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold">Taskbar Alignment</h3>
              <p className="text-[9px] opacity-50 mb-1 font-medium">Align your Start button and app icons</p>
              <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg max-w-xs text-xs">
                {(["center", "left"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => setTaskbarAlignment(align)}
                    className={cn(
                      "py-1.5 px-3 rounded-md transition-all font-semibold capitalize cursor-default outline-none",
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

            {/* Program Icon Display Mode Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold">Show Running Programs As</h3>
              <p className="text-[9px] opacity-50 mb-1 font-medium">Choose how running app buttons appear on the taskbar</p>
              <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg max-w-sm text-xs">
                {(["both", "icon", "name"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTaskbarShowMode(mode)}
                    className={cn(
                      "py-1.5 px-3 rounded-md transition-all font-semibold cursor-default outline-none",
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

            {/* Taskbar Size Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold">Taskbar Size</h3>
              <p className="text-[9px] opacity-50 mb-1 font-medium">Resize the taskbar height and icon dimensions</p>
              <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg max-w-sm text-xs">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTaskbarSize(size)}
                    className={cn(
                      "py-1.5 px-3 rounded-md transition-all font-semibold capitalize cursor-default outline-none",
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

            {/* Auto-hide Taskbar Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold">Automatically hide the taskbar</h3>
                <p className="text-[9px] opacity-50">Hides the taskbar when not in use to free up desktop space</p>
              </div>
              <button
                onClick={() => setTaskbarAutohide(!taskbarAutohide)}
                className={cn(
                  "w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none relative cursor-default",
                  taskbarAutohide ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div 
                  className={cn(
                    "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200",
                    taskbarAutohide ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Limit Taskbar Items Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-bold">Limit taskbar items</h3>
                  <p className="text-[9px] opacity-50">Prevent taskbar clutter by showing overflow items in a dropdown</p>
                </div>
                <button
                  onClick={() => setTaskbarLimitEnabled(!taskbarLimitEnabled)}
                  className={cn(
                    "w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none relative cursor-default",
                    taskbarLimitEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <div 
                    className={cn(
                      "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200",
                      taskbarLimitEnabled ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {taskbarLimitEnabled && (
                <div className="flex flex-col gap-3.5 border-t border-black/5 dark:border-white/5 pt-3 text-xs pl-2">
                  <div className="flex items-center justify-between max-w-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Icon & Name Limit</span>
                      <span className="text-[9px] text-zinc-400">Maximum items when showing icon and name (both/name mode)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTaskbarIconNameLimit(Math.max(1, taskbarIconNameLimit - 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-sm cursor-default border border-black/5 dark:border-white/5"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm font-mono">{taskbarIconNameLimit}</span>
                      <button
                        onClick={() => setTaskbarIconNameLimit(Math.min(20, taskbarIconNameLimit + 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-sm cursor-default border border-black/5 dark:border-white/5"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between max-w-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Icon Only Limit</span>
                      <span className="text-[9px] text-zinc-400">Maximum items when showing icons only (icon mode)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTaskbarIconOnlyLimit(Math.max(1, taskbarIconOnlyLimit - 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-sm cursor-default border border-black/5 dark:border-white/5"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-sm font-mono">{taskbarIconOnlyLimit}</span>
                      <button
                        onClick={() => setTaskbarIconOnlyLimit(Math.min(20, taskbarIconOnlyLimit + 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-sm cursor-default border border-black/5 dark:border-white/5"
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

        {activeTab === "about" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-1 duration-150">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">About Me</h2>
              <p className="text-[10px] opacity-50">Information about the developer and workspace credentials</p>
            </div>

            {/* About Card */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-bold select-none">
                  PJ
                </div>
                <div>
                  <h3 className="text-xs font-bold">Pujan Joshi</h3>
                  <p className="text-[9px] opacity-50">React & TypeScript Frontend Engineer</p>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed opacity-75">
                Specialized in building high-fidelity web simulators, modular components, and premium responsive applications. This simulated Web OS serves as an interactive portfolio highlighting React hooks, custom state management VFS systems, dynamic window rendering, and modern animation styles.
              </p>

              {/* Developer Links */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                <a 
                  href="https://github.com/pujanjoci" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://pujan-joshi.com.np" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              </div>
            </div>

            {/* VFS Status */}
            <div className="bg-white/70 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">Virtual Directory Security</span>
                </div>
                <span className="opacity-50 text-[10px]">Active</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px] border-t border-black/5 dark:border-white/5 pt-2 mt-1 opacity-70">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-zinc-500" /> File System Version</span>
                <span className="font-mono font-bold">17.0 (Stable)</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface SidebarTabProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarTab: React.FC<SidebarTabProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-default border border-transparent outline-none",
        active 
          ? "bg-white dark:bg-zinc-700/60 shadow-sm border-black/5 dark:border-white/5 font-bold text-blue-600 dark:text-cyan-400" 
          : "hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

interface SpecItemProps {
  label: string;
  value: string;
}

const SpecItem: React.FC<SpecItemProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col border-b border-black/5 dark:border-white/5 pb-1">
      <span className="text-[9px] opacity-45 uppercase font-bold tracking-wider mb-0.5">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
};
