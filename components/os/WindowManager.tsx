"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useWindows, WindowInstance } from "@/context/WindowContext";
import { Window } from "./Window";
import { 
  Terminal, 
  Folder, 
  Monitor, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  GitBranch, 
  Mail,
  Loader2,
  Calculator as CalcIcon,
  Keyboard,
  Settings as SettingsIcon,
  Music,
  Video,
  Bomb,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy loaded applications
const FolderWindow = React.lazy(() => import("@/components/apps/FolderWindow").then(m => ({ default: m.FolderWindow })));
const TerminalWindow = React.lazy(() => import("@/components/apps/TerminalWindow").then(m => ({ default: m.TerminalWindow })));
const FileViewer = React.lazy(() => import("@/components/apps/FileViewer").then(m => ({ default: m.FileViewer })));
const BrowserWindow = React.lazy(() => import("@/components/apps/BrowserWindow").then(m => ({ default: m.BrowserWindow })));
const ProjectsWindow = React.lazy(() => import("@/components/apps/ProjectsWindow").then(m => ({ default: m.ProjectsWindow })));
const ContactWindow = React.lazy(() => import("@/components/apps/ContactWindow").then(m => ({ default: m.ContactWindow })));
const Notepad = React.lazy(() => import("@/components/apps/Notepad").then(m => ({ default: m.Notepad })));
const Calculator = React.lazy(() => import("@/components/apps/Calculator").then(m => ({ default: m.Calculator })));
const ImageViewer = React.lazy(() => import("@/components/apps/ImageViewer").then(m => ({ default: m.ImageViewer })));
const TypingGame = React.lazy(() => import("@/components/apps/TypingGame").then(m => ({ default: m.TypingGame })));
const Settings = React.lazy(() => import("@/components/apps/Settings").then(m => ({ default: m.Settings })));
const MusicPlayer = React.lazy(() => import("@/components/apps/MusicPlayer").then(m => ({ default: m.MusicPlayer })));
const VideoPlayer = React.lazy(() => import("@/components/apps/VideoPlayer").then(m => ({ default: m.VideoPlayer })));
const WordProcessor = React.lazy(() => import("@/components/apps/WordProcessor").then(m => ({ default: m.WordProcessor })));
const Minesweeper = React.lazy(() => import("@/components/apps/Minesweeper").then(m => ({ default: m.Minesweeper })));

export const WindowManager: React.FC = () => {
  const { windows, activeWindowId, openWindow, closeWindow, focusWindow, restoreWindow, minimizeWindow } = useWindows();
  const [isAltTabOpen, setIsAltTabOpen] = useState(false);
  const [altTabSelectedIndex, setAltTabSelectedIndex] = useState(0);
  const altPressed = useRef(false);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;

      // Alt + Tab Switcher or Alt + Q (web-safe alternative)
      if (e.altKey && (key === "Tab" || key.toLowerCase() === "q")) {
        e.preventDefault();
        if (windows.length === 0) return;

        if (!altPressed.current) {
          altPressed.current = true;
          setIsAltTabOpen(true);
          
          // Set selection to next window in stack (usually index 1 if active exists, else 0)
          const activeIdx = windows.findIndex(w => w.id === activeWindowId);
          const startIdx = activeIdx !== -1 ? (activeIdx + 1) % windows.length : 0;
          setAltTabSelectedIndex(startIdx);
        } else {
          setAltTabSelectedIndex(prev => (prev + 1) % windows.length);
        }
      }

      // Win + E or Ctrl + Alt + E -> File Explorer
      if ((e.metaKey && key.toLowerCase() === "e") || (e.ctrlKey && e.altKey && key.toLowerCase() === "e")) {
        e.preventDefault();
        openWindow("folder", "File Explorer", { path: "desktop" });
      }

      // Win + N or Ctrl + Alt + N -> Notepad
      if ((e.metaKey && key.toLowerCase() === "n") || (e.ctrlKey && e.altKey && key.toLowerCase() === "n")) {
        e.preventDefault();
        openWindow("notepad", "Notepad");
      }

      // Ctrl + Alt + T -> Terminal
      if (e.ctrlKey && e.altKey && key.toLowerCase() === "t") {
        e.preventDefault();
        openWindow("terminal", "Command Prompt");
      }

      // Ctrl + Alt + M -> Music Player
      if (e.ctrlKey && e.altKey && key.toLowerCase() === "m") {
        e.preventDefault();
        openWindow("music-player", "Music Player");
      }

      // Ctrl + Alt + V -> Video Player
      if (e.ctrlKey && e.altKey && key.toLowerCase() === "v") {
        e.preventDefault();
        openWindow("video-player", "Video Player");
      }

      // Win + K or Ctrl + Alt + K -> Typing Game
      if ((e.metaKey && key.toLowerCase() === "k") || (e.ctrlKey && e.altKey && key.toLowerCase() === "k")) {
        e.preventDefault();
        openWindow("typing-game", "Typing Master");
      }

      // Alt + F4 -> Close active window
      if (e.altKey && key === "F4") {
        e.preventDefault();
        if (activeWindowId) {
          closeWindow(activeWindowId);
        }
      }

      // Win + D or Ctrl + Alt + D -> Show Desktop (Minimize all / Restore all)
      if ((e.metaKey && key.toLowerCase() === "d") || (e.ctrlKey && e.altKey && key.toLowerCase() === "d")) {
        e.preventDefault();
        const anyVisible = windows.some(w => !w.isMinimized);
        if (anyVisible) {
          windows.forEach(w => {
            if (!w.isMinimized) minimizeWindow(w.id);
          });
        } else {
          windows.forEach(w => {
            if (w.isMinimized) restoreWindow(w.id);
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        altPressed.current = false;
        if (isAltTabOpen) {
          setIsAltTabOpen(false);
          const targetWin = windows[altTabSelectedIndex];
          if (targetWin) {
            restoreWindow(targetWin.id);
            focusWindow(targetWin.id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [windows, activeWindowId, isAltTabOpen, altTabSelectedIndex]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[5000]">
      <div className="relative w-full h-full">
        {windows.map((w) => (
          <Window 
            key={w.id} 
            id={w.id}
            title={w.title}
            icon={getWindowIcon(w.type, w.title)}
          >
            <Suspense fallback={<WindowLoader />}>
              {renderWindowContent(w, () => closeWindow(w.id))}
            </Suspense>
          </Window>
        ))}
      </div>

      {/* Alt + Tab Overlay Switcher */}
      {isAltTabOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[999999] pointer-events-auto">
          <div className="bg-[#1e1e2e]/95 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-w-lg w-full mx-4">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Switch Window (Alt + Tab)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {windows.map((win, idx) => (
                <div
                  key={win.id}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border text-center select-none cursor-default",
                    idx === altTabSelectedIndex
                      ? "bg-white/15 border-blue-500 scale-105 shadow-lg shadow-blue-500/10 text-white font-medium"
                      : "bg-white/5 border-transparent text-white/70 hover:bg-white/10"
                  )}
                >
                  <div className="p-2 rounded-lg bg-black/20">
                    {getWindowIcon(win.type, win.title)}
                  </div>
                  <span className="text-[10px] sm:text-xs truncate w-full px-1">
                    {win.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WindowLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-black/5 dark:bg-black/25">
    <Loader2 className="w-6 h-6 animate-spin text-blue-500/50" />
  </div>
);

function getWindowIcon(type: string, title: string) {
  const ext = title.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");

  switch (type) {
    case "terminal":
      return <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case "folder":
      return <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-500/10" />;
    case "generic":
      return isImage 
        ? <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" /> 
        : <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
    case "browser":
      return <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case "projects":
      return <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" /> ;
    case "contact":
      return <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case "notepad":
      return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case "calculator":
      return <CalcIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    case "image-viewer":
      return <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    case "typing-game":
      return <Keyboard className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    case "music-player":
      return <Music className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
    case "video-player":
      return <Video className="w-4 h-4 text-red-600 dark:text-red-400" />;
    case "settings":
      return <SettingsIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case "word-processor":
      return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case "minesweeper":
      return <Bomb className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    default:
      return <Monitor className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />;
  }
}

function renderWindowContent(window: WindowInstance, onClose: () => void) {
  switch (window.type) {
    case "folder":
      return <FolderWindow initialPathId={window.props?.path} />;
    case "terminal":
      return <TerminalWindow />;
    case "generic":
      return <FileViewer name={window.title} content={window.props?.content} />;
    case "browser":
      return <BrowserWindow />;
    case "projects":
      return <ProjectsWindow />;
    case "contact":
      return <ContactWindow />;
    case "notepad":
      return (
        <Notepad 
          fileId={window.props?.fileId} 
          initialContent={window.props?.content} 
          onClose={onClose}
        />
      );
    case "calculator":
      return <Calculator />;
    case "image-viewer":
      return <ImageViewer fileId={window.props?.fileId} onClose={onClose} />;
    case "typing-game":
      return <TypingGame />;
    case "music-player":
      return <MusicPlayer fileId={window.props?.fileId} onClose={onClose} />;
    case "video-player":
      return <VideoPlayer fileId={window.props?.fileId} onClose={onClose} />;
    case "settings":
      return <Settings />;
    case "word-processor":
      return (
        <WordProcessor 
          fileId={window.props?.fileId} 
          initialContent={window.props?.content} 
          onClose={onClose} 
        />
      );
    case "minesweeper":
      return <Minesweeper />;
    default:
      return (
        <div className="p-8 text-white/50 text-center flex flex-col items-center justify-center h-full">
          <Monitor className="w-12 h-12 mb-4 opacity-20" />
          <p>Application content not implemented.</p>
        </div>
      );
  }
}
