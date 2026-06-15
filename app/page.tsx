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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  return (
    <FileSystemProvider>
      <ThemeProvider>
        <WindowProvider>
          <div className="relative flex flex-col w-screen h-screen overflow-hidden bg-black select-none">
            {/* Desktop UI (Rendered only after booting to optimize initial page workload and avoid background task overhead) */}
            <AnimatePresence>
              {isBooted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="relative flex-1 flex flex-col w-full h-full overflow-hidden"
                >
                  {/* Visually hidden heading for screen readers & SEO crawlability */}
                  <h1 className="sr-only">
                    Pujan Joshi | Desktop Simulation Portfolio - React & TypeScript Frontend Engineer
                  </h1>

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
                </motion.div>
              )}
            </AnimatePresence>

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


