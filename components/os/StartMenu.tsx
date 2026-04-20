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
  LayoutGrid,
  Globe,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const StartMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { openWindow } = useWindows();
  const { getChildren } = useFileSystem();
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const desktopItems = getChildren("desktop");
  
  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    return desktopItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, desktopItems]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className={cn(
        "fixed bottom-12 left-2 glass dark:glass-dark rounded-xl border border-black/10 dark:border-white/10 shadow-2xl z-[10001] flex flex-col overflow-hidden transition-all duration-300",
        isMobile ? "w-[calc(100vw-1rem)] left-2 right-2" : "w-96"
      )}
    >
      <div className="flex-1 flex flex-col p-4">
        {/* Search */}
        <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg px-3 py-2 gap-3 mb-4 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <Search className="w-4 h-4 text-black/50 dark:text-white/50" />
          <input
            autoFocus
            type="text"
            placeholder="Search programs and files"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-black dark:text-white w-full"
          />
        </div>

        {/* Pinned Apps or Search Results */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {searchQuery ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 px-3 mb-2 tracking-wider">Search Results</h3>
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === "folder") openWindow("folder", item.name, { path: item.id });
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/80 dark:text-white/80 transition-colors text-left"
                >
                  {item.type === "folder" ? <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Monitor className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />}
                  <span className="text-sm">{item.name}</span>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-sm text-black/30 dark:text-white/30 text-center py-8">No results found</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <h3 className="col-span-2 text-[10px] uppercase font-bold text-black/30 dark:text-white/30 px-3 mt-2 mb-1 tracking-wider">Pinned</h3>
              <StartMenuItem 
                icon={<Monitor className="text-blue-600 dark:text-blue-400" />} 
                label="Computer" 
                onClick={() => { openWindow("folder", "Computer", { path: "root" }); onClose(); }}
                isMobile={isMobile}
              />
              <StartMenuItem 
                icon={<Folder className="text-yellow-600 dark:text-yellow-400" />} 
                label="Documents" 
                onClick={() => { openWindow("folder", "Documents", { path: "documents" }); onClose(); }}
                isMobile={isMobile}
              />
              <StartMenuItem 
                icon={<Terminal className="text-emerald-600 dark:text-emerald-400" />} 
                label="Terminal" 
                onClick={() => { openWindow("terminal", "Command Prompt"); onClose(); }}
                isMobile={isMobile}
              />
              <StartMenuItem 
                icon={<Globe className="text-blue-600 dark:text-blue-400" />} 
                label="The Internet" 
                onClick={() => { openWindow("browser", "The Internet"); onClose(); }}
                isMobile={isMobile}
              />
              <StartMenuItem 
                icon={<Mail className="text-emerald-600 dark:text-emerald-400" />} 
                label="Contact" 
                onClick={() => { openWindow("contact", "Contact Me"); onClose(); }}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-14 bg-black/5 dark:bg-white/5 flex items-center px-6 justify-between border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-black/80 dark:text-white/80">Guest User</span>
        </div>
        <button
          onClick={() => {
            if (confirm("Reset current session? This will clear local storage.")) {
              localStorage.removeItem("web_os_fs");
              window.location.reload();
            }
          }}
          className="p-2 rounded-full hover:bg-red-500/10 dark:hover:bg-red-500/20 text-black/60 dark:text-white/60 hover:text-red-600 dark:hover:text-red-400 transition-all"
          title="Reset Session"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const StartMenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isMobile?: boolean }> = ({ icon, label, onClick, isMobile }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/80 dark:text-white/80 transition-colors text-left w-full",
        isMobile ? "py-3" : "py-2.5"
      )}
    >
      <span className={cn("flex items-center justify-center shrink-0", isMobile ? "w-6 h-6" : "w-5 h-5")}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};
