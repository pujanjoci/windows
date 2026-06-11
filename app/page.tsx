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

export default function Home() {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  return (
    <FileSystemProvider>
      <ThemeProvider>
        <WindowProvider>
          <div className="relative flex flex-col w-screen h-screen overflow-hidden bg-black select-none">
            {/* Boot Screen */}
            {!isBooted && <BootScreen onComplete={() => setIsBooted(true)} />}

            {/* Desktop UI */}
            {isBooted && (
              <>
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

                {/* Start Menu Overlay */}
                <AnimatePresence>
                  {isStartOpen && (
                    <StartMenu 
                      isOpen={isStartOpen} 
                      onClose={() => setIsStartOpen(false)} 
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </WindowProvider>
      </ThemeProvider>
    </FileSystemProvider>
  );
}


