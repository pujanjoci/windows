"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type WindowType = 
  | "folder" 
  | "terminal" 
  | "editor" 
  | "generic" 
  | "browser" 
  | "projects" 
  | "contact" 
  | "notepad" 
  | "calculator" 
  | "image-viewer";

export type WindowInstance = {
  id: string;
  type: WindowType;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  snapped: "left" | "right" | null;
  props?: any;
};

type WindowContextType = {
  windows: WindowInstance[];
  activeWindowId: string | null;
  openWindow: (type: WindowType, title: string, props?: any) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  snapWindow: (id: string, side: "left" | "right" | null) => void;
};

const WindowContext = createContext<WindowContextType | null>(null);

const DEFAULT_SIZES: Record<WindowType, { w: number; h: number }> = {
  folder: { w: 750, h: 480 },
  terminal: { w: 640, h: 400 },
  editor: { w: 600, h: 400 },
  generic: { w: 700, h: 480 },
  browser: { w: 900, h: 600 },
  projects: { w: 950, h: 600 },
  contact: { w: 450, h: 500 },
  notepad: { w: 650, h: 450 },
  calculator: { w: 320, h: 460 },
  "image-viewer": { w: 800, h: 550 },
};

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  const isFirstRender = useRef(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedWindows = localStorage.getItem("os-open-windows");
      const savedActive = localStorage.getItem("os-active-window");
      const savedZ = localStorage.getItem("os-max-z");

      if (savedWindows) {
        setWindows(JSON.parse(savedWindows));
      }
      if (savedActive) {
        setActiveWindowId(savedActive);
      }
      if (savedZ) {
        setMaxZIndex(parseInt(savedZ, 10));
      }
    } catch (e) {
      console.error("Failed to restore window state", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (!isLoaded) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem("os-open-windows", JSON.stringify(windows));
    localStorage.setItem("os-active-window", activeWindowId || "");
    localStorage.setItem("os-max-z", maxZIndex.toString());
  }, [windows, activeWindowId, maxZIndex, isLoaded]);

  const openWindow = useCallback((type: WindowType, title: string, props?: any): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newZ = maxZIndex + 1;
    
    // Check if the window is already open with the same parameters
    // Particularly for explorer or contacts, if it's the exact same view, we can just focus it
    if (type === "folder" && props?.path) {
      const existing = windows.find(w => w.type === "folder" && w.props?.path === props.path);
      if (existing) {
        setWindows(prev => prev.map(w => w.id === existing.id 
          ? { 
              ...w, 
              zIndex: newZ, 
              isMinimized: false,
              props: { ...w.props, x: props?.x, y: props?.y }
            } 
          : w));
        setActiveWindowId(existing.id);
        setMaxZIndex(newZ);
        return existing.id;
      }
    } else if (type === "projects" || type === "contact" || type === "calculator" || type === "terminal") {
      const existing = windows.find(w => w.type === type);
      if (existing) {
        setWindows(prev => prev.map(w => w.id === existing.id 
          ? { 
              ...w, 
              zIndex: newZ, 
              isMinimized: false,
              props: { ...w.props, x: props?.x, y: props?.y }
            } 
          : w));
        setActiveWindowId(existing.id);
        setMaxZIndex(newZ);
        return existing.id;
      }
    }

    // Dynamic placement: Stagger new windows
    const count = windows.length;
    const size = DEFAULT_SIZES[type] || DEFAULT_SIZES.generic;
    
    const screenW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 768;

    const defaultX = Math.max(50, Math.min(screenW - size.w - 50, 100 + (count * 30) % 250));
    const defaultY = Math.max(50, Math.min(screenH - size.h - 100, 80 + (count * 30) % 250));

    const newWindow: WindowInstance = {
      id,
      type,
      title,
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
      x: defaultX,
      y: defaultY,
      width: size.w,
      height: size.h,
      snapped: null,
      props,
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);
    setMaxZIndex(newZ);
    return id;
  }, [windows, maxZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const focusWindow = useCallback((id: string) => {
    const newZ = maxZIndex + 1;
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZ, isMinimized: false } : w));
    setActiveWindowId(id);
    setMaxZIndex(newZ);
  }, [maxZIndex]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) {
      // Find the next window with highest zIndex that is not minimized to focus it
      setWindows(prev => {
        const sorted = [...prev]
          .filter(w => w.id !== id && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        if (sorted.length > 0) {
          setActiveWindowId(sorted[0].id);
        } else {
          setActiveWindowId(null);
        }
        return prev;
      });
    }
  }, [activeWindowId]);

  const restoreWindow = useCallback((id: string) => {
    const newZ = maxZIndex + 1;
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: newZ } : w));
    setActiveWindowId(id);
    setMaxZIndex(newZ);
  }, [maxZIndex]);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized, snapped: null } : w));
  }, []);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  const snapWindow = useCallback((id: string, side: "left" | "right" | null) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, snapped: side, isMaximized: false } : w));
  }, []);

  return (
    <WindowContext.Provider value={{ 
      windows, 
      activeWindowId, 
      openWindow, 
      closeWindow, 
      minimizeWindow, 
      toggleMaximize, 
      focusWindow,
      restoreWindow,
      updateWindowPosition,
      updateWindowSize,
      snapWindow
    }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindows = () => {
  const context = useContext(WindowContext);
  if (!context) throw new Error("useWindows must be used within a WindowProvider");
  return context;
};
