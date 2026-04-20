"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindows } from "@/context/WindowContext";
import { cn } from "@/lib/utils";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ id, title, children, icon }) => {
  const { 
    windows,
    activeWindowId,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    focusWindow 
  } = useWindows();
  const isMobile = useIsMobile();
  
  const windowData = windows.find(w => w.id === id);
  if (!windowData || windowData.isMinimized) return null;

  const isActive = activeWindowId === id;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: (windowData.isMaximized || isMobile) ? 0 : undefined,
        y: (windowData.isMaximized || isMobile) ? 0 : undefined,
        width: (windowData.isMaximized || isMobile) ? "100%" : "800px",
        height: (windowData.isMaximized || isMobile) ? "calc(100vh - 40px)" : "500px",
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
      drag={!windowData.isMaximized && !isMobile}
      dragMomentum={false}
      onMouseDown={() => focusWindow(id)}
      className={cn(
        "absolute bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-colors duration-300",
        (windowData.isMaximized || isMobile) ? "rounded-none" : "rounded-lg border border-black/10 dark:border-white/10",
        isActive ? "z-[50]" : ""
      )}
      style={{ 
        zIndex: windowData.zIndex,
        top: (windowData.isMaximized || isMobile) ? 0 : "10%",
        left: (windowData.isMaximized || isMobile) ? 0 : "15%",
      }}
    >
      {/* Title Bar */}
      <div 
        className={cn(
          "h-10 flex items-center px-3 gap-3 select-none",
          isActive 
            ? "bg-black/5 dark:bg-white/10" 
            : "bg-transparent opacity-70"
        )}
        onDoubleClick={() => toggleMaximize(id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="text-xs font-medium text-white/90 truncate">{title}</span>
        </div>

        <div className="flex items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          {!isMobile && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}
              className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 transition-colors"
            >
              {windowData.isMaximized ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-red-500 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-white/40 dark:bg-black/20">
        {children}
      </div>
    </motion.div>
  );
};
