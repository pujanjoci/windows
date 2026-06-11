"use client";

import React, { useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { useWindows } from "@/context/WindowContext";
import { cn } from "@/lib/utils";
import { Minus, X, Maximize2, Copy } from "lucide-react";
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
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    snapWindow
  } = useWindows();
  
  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);
  
  const isActive = activeWindowId === id;

  // Keyboard Escape key to close active window
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWindow(id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, id, closeWindow]);

  const windowData = windows.find(w => w.id === id);
  if (!windowData || windowData.isMinimized) return null;

  const taskbarHeight = 40;
  const screenW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const screenH = typeof window !== "undefined" ? window.innerHeight : 768;
  const availableHeight = screenH - taskbarHeight;

  // Compute final animated attributes
  let targetX = windowData.x;
  let targetY = windowData.y;
  let targetW: string | number = windowData.width;
  let targetH: string | number = windowData.height;

  if (windowData.isMaximized || isMobile) {
    targetX = 0;
    targetY = 0;
    targetW = "100%";
    targetH = `${availableHeight}px`;
  } else if (windowData.snapped === "left") {
    targetX = 0;
    targetY = 0;
    targetW = "50%";
    targetH = `${availableHeight}px`;
  } else if (windowData.snapped === "right") {
    targetX = screenW / 2;
    targetY = 0;
    targetW = "50%";
    targetH = `${availableHeight}px`;
  }

  // Pointer event resize handler
  const startResize = (direction: "r" | "b" | "br", e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(id);
    
    const startWidth = windowData.width;
    const startHeight = windowData.height;
    const startPointerX = e.clientX;
    const startPointerY = e.clientY;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPointerX;
      const deltaY = moveEvent.clientY - startPointerY;

      let newW = startWidth;
      let newH = startHeight;

      if (direction === "r" || direction === "br") {
        newW = Math.max(300, startWidth + deltaX);
      }
      if (direction === "b" || direction === "br") {
        newH = Math.max(200, startHeight + deltaY);
      }

      updateWindowSize(id, newW, newH);
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <motion.div
      ref={windowRef}
      initial={{ 
        x: windowData.props?.x !== undefined ? windowData.props.x : targetX, 
        y: windowData.props?.y !== undefined ? windowData.props.y : targetY, 
        scale: 0.15, 
        opacity: 0 
      }}
      animate={{ 
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        opacity: 1,
        scale: 1
      }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 240, mass: 0.8 }}
      drag={!windowData.isMaximized && !windowData.snapped && !isMobile}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        const newX = windowData.x + info.offset.x;
        const newY = windowData.y + info.offset.y;
        
        // Snap boundary check: 35px from sides
        const boundaryThreshold = 35;
        if (info.point.x < boundaryThreshold) {
          snapWindow(id, "left");
        } else if (info.point.x > screenW - boundaryThreshold) {
          snapWindow(id, "right");
        } else {
          // Normal drag
          updateWindowPosition(id, newX, newY);
          if (windowData.snapped) {
            snapWindow(id, null);
          }
        }
      }}
      onPointerDown={() => focusWindow(id)}
      style={{ zIndex: windowData.zIndex }}
      className={cn(
        "absolute flex flex-col overflow-hidden pointer-events-auto select-none",
        "bg-[#fbfbfb]/80 dark:bg-[#1c222b]/80 border shadow-xl backdrop-blur-md rounded-xl font-sans text-xs transition-colors duration-300",
        isActive 
          ? "border-black/15 dark:border-white/15 shadow-black/20 dark:shadow-black/40" 
          : "border-black/5 dark:border-white/5 shadow-black/10 dark:shadow-black/20"
      )}
    >
      {/* Title Bar */}
      <div 
        onPointerDown={(e) => {
          if (!windowData.isMaximized && !windowData.snapped && !isMobile) {
            dragControls.start(e);
          }
        }}
        onDoubleClick={() => toggleMaximize(id)}
        className={cn(
          "h-9 flex items-center px-3 gap-3 cursor-default select-none shrink-0 border-b border-black/5 dark:border-white/5",
          isActive ? "bg-black/[0.03] dark:bg-white/[0.03]" : "bg-transparent opacity-60"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">
            {title}
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
              className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            {!isMobile && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMaximize(id); }}
                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded transition-colors"
              >
                {windowData.isMaximized || windowData.snapped ? <Copy className="w-3 h-3" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
              className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white text-zinc-500 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* Resize Handles (Only when NOT maximized/snapped and on Desktop) */}
      {!windowData.isMaximized && !windowData.snapped && !isMobile && (
        <>
          {/* Right Border Resize Handle */}
          <div 
            onPointerDown={(e) => startResize("r", e)}
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-blue-500/20 active:bg-blue-500/40 z-50 transition-colors"
          />
          {/* Bottom Border Resize Handle */}
          <div 
            onPointerDown={(e) => startResize("b", e)}
            className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-blue-500/20 active:bg-blue-500/40 z-50 transition-colors"
          />
          {/* Bottom-Right Corner Resize Handle */}
          <div 
            onPointerDown={(e) => startResize("br", e)}
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize hover:bg-blue-500/30 active:bg-blue-500/60 z-50 transition-colors"
          />
        </>
      )}
    </motion.div>
  );
};
