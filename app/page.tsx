"use client";

import React, { useState } from "react";
import { FileSystemProvider } from "@/context/FileSystemContext";
import { WindowProvider } from "@/context/WindowContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Desktop } from "@/components/os/Desktop";
import { Taskbar } from "@/components/os/Taskbar";
import { WindowManager } from "@/components/os/WindowManager";
import { StartMenu } from "@/components/os/StartMenu";
import { BootScreen } from "@/components/os/BootScreen";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  return (
    <FileSystemProvider>
      <ThemeProvider>
        <WindowProvider>
          <div className="relative flex flex-col w-screen h-screen overflow-hidden bg-black select-none">
            {/* Desktop UI (Always rendered, hidden from view/interaction during booting to allow animations to run in background) */}
            <div className={cn(
              "relative flex-1 flex flex-col w-full h-full overflow-hidden transition-opacity duration-700",
              !isBooted ? "opacity-0 pointer-events-none select-none" : "opacity-100"
            )}>
              {/* Main Desktop Area */}
              <main 
                className="relative flex-1 w-full overflow-hidden"
                onClick={() => { if (isStartOpen) setIsStartOpen(false); }}
              >
                <Desktop />
                <WindowManager />
              </main>

              {/* Taskbar */}
              <Taskbar onStartClick={() => setIsStartOpen(!isStartOpen)} />
            </div>

            {/* Start Menu Overlay */}
            <AnimatePresence>
              {isStartOpen && (
                <StartMenu 
                  isOpen={isStartOpen} 
                  onClose={() => setIsStartOpen(false)} 
                />
              )}
            </AnimatePresence>

            {/* Boot Screen Overlay */}
            <AnimatePresence>
              {!isBooted && (
                <BootScreen onComplete={() => setIsBooted(true)} />
              )}
            </AnimatePresence>
          </div>
        </WindowProvider>
      </ThemeProvider>
    </FileSystemProvider>
  );
}


