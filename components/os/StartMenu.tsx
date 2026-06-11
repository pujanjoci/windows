"use client";

import React, { useState, useMemo } from "react";
import { useWindows } from "@/context/WindowContext";
import { useFileSystem } from "@/context/FileSystemContext";
import { 
  Terminal, 
  Folder, 
  Monitor, 
  Search, 
  Power,
  User,
  Globe,
  Mail,
  FileText,
  Calculator as CalcIcon,
  Image as ImageIcon,
  Keyboard,
  Settings as SettingsIcon,
  Music,
  Video
} from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const StartMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { openWindow } = useWindows();
  const { getChildren } = useFileSystem();
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  // Listen for Escape key to close the Start Menu
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const desktopItems = getChildren("desktop");
  
  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    return desktopItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, desktopItems]);

  if (!isOpen) return null;

  // Reset session
  const handleReset = () => {
    if (confirm("Reset current session? This will clear all changes and reload the workspace.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 15, opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "fixed z-[10001] flex flex-col overflow-hidden shadow-2xl transition-all duration-300 border border-black/10 dark:border-white/10 bg-[#f3f3f3]/90 dark:bg-[#1a1f26]/95 text-black dark:text-white backdrop-blur-md",
        isMobile 
          ? "bottom-12 left-2 right-2 w-[calc(100vw-1rem)]" 
          : "bottom-12 left-1/2 -translate-x-1/2 w-[480px] rounded-2xl"
      )}
    >
      <div className="flex-1 flex flex-col p-5">
        {/* Search bar */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2 gap-3 mb-4 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all border border-black/5 dark:border-white/5">
          <Search className="w-4 h-4 opacity-50 text-zinc-600 dark:text-zinc-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search apps, files, and settings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-current w-full placeholder-zinc-500 dark:placeholder-zinc-400"
          />
        </div>

        {/* Main List */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-[220px]">
          {searchQuery ? (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold opacity-45 px-2 mb-1 tracking-wider">Search Results</span>
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === "folder") {
                      openWindow("folder", item.name, { path: item.id });
                    } else if (item.name.endsWith(".jpg") || item.name.endsWith(".png") || item.name.endsWith(".jpeg")) {
                      openWindow("image-viewer", item.name, { fileId: item.id });
                    } else if (item.name.endsWith(".mp3") || item.name.endsWith(".wav")) {
                      openWindow("music-player", item.name, { fileId: item.id });
                    } else if (item.name.endsWith(".mp4") || item.name.endsWith(".webm")) {
                      openWindow("video-player", item.name, { fileId: item.id });
                    } else {
                      openWindow("notepad", item.name, { fileId: item.id, content: item.content });
                    }
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-black/5 text-left text-xs transition-colors cursor-default"
                >
                  {item.type === "folder" ? (
                    <Folder className="w-4 h-4 text-blue-600" />
                  ) : item.name.endsWith(".mp3") || item.name.endsWith(".wav") ? (
                    <Music className="w-4 h-4 text-pink-500" />
                  ) : item.name.endsWith(".mp4") || item.name.endsWith(".webm") ? (
                    <Video className="w-4 h-4 text-red-500" />
                  ) : item.name.endsWith(".jpg") || item.name.endsWith(".png") || item.name.endsWith(".jpeg") ? (
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-zinc-500" />
                  )}
                  <span>{item.name}</span>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-xs text-center py-10 opacity-30">No matching files found</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold opacity-45 px-2 tracking-wider">Pinned Apps</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-3">
                <PinnedAppItem
                  icon={<Monitor className="text-blue-500" />}
                  label="My Computer"
                  onClick={() => { openWindow("folder", "My Computer", { path: "my_computer" }); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Folder className="text-yellow-500 fill-yellow-500/10" />}
                  label="Documents"
                  onClick={() => { openWindow("folder", "Documents", { path: "documents" }); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Folder className="text-purple-500 fill-purple-500/10" />}
                  label="Projects"
                  onClick={() => { openWindow("projects", "Projects"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<ImageIcon className="text-indigo-500" />}
                  label="Photos"
                  onClick={() => { openWindow("folder", "Photos", { path: "photos" }); onClose(); }}
                />
                <PinnedAppItem
                  icon={<FileText className="text-amber-500" />}
                  label="Notepad"
                  onClick={() => { openWindow("notepad", "Notepad"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<CalcIcon className="text-red-500" />}
                  label="Calculator"
                  onClick={() => { openWindow("calculator", "Calculator"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Globe className="text-blue-500" />}
                  label="Web Browser"
                  onClick={() => { openWindow("browser", "The Internet"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Terminal className="text-emerald-500" />}
                  label="Terminal"
                  onClick={() => { openWindow("terminal", "Command Prompt"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Keyboard className="text-cyan-500" />}
                  label="Typing Game"
                  onClick={() => { openWindow("typing-game", "Typing Master"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Music className="text-pink-500" />}
                  label="Music Player"
                  onClick={() => { openWindow("music-player", "Music Player"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<Video className="text-red-500" />}
                  label="Video Player"
                  onClick={() => { openWindow("video-player", "Video Player"); onClose(); }}
                />
                <PinnedAppItem
                  icon={<SettingsIcon className="text-zinc-500 dark:text-zinc-400" />}
                  label="Settings"
                  onClick={() => { openWindow("settings", "Settings"); onClose(); }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer User Panel */}
        <div className="h-12 border-t border-black/5 dark:border-white/5 pt-4 mt-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Guest User</span>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 hover:bg-red-500/15 cursor-default transition-all"
            title="Reset System"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Pinned Modern Item
const PinnedAppItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-default transition-colors text-center gap-1.5 border border-transparent hover:border-black/5 dark:hover:border-white/5"
    >
      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg shrink-0 scale-95 group-hover:scale-100 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-medium leading-none truncate w-full px-0.5 select-none text-zinc-700 dark:text-zinc-300">{label}</span>
    </button>
  );
};
