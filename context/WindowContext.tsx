"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type WindowType = "folder" | "terminal" | "editor" | "generic" | "browser" | "projects" | "contact";

export type WindowInstance = {
  id: string;
  type: WindowType;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  props?: any;
};

type WindowContextType = {
  windows: WindowInstance[];
  activeWindowId: string | null;
  openWindow: (type: WindowType, title: string, props?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
};

const WindowContext = createContext<WindowContextType | null>(null);

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);

  const openWindow = useCallback((type: WindowType, title: string, props?: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newZ = maxZIndex + 1;
    const newWindow: WindowInstance = {
      id,
      type,
      title,
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
      props,
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);
    setMaxZIndex(newZ);
  }, [maxZIndex]);

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
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const restoreWindow = useCallback((id: string) => {
    const newZ = maxZIndex + 1;
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: newZ } : w));
    setActiveWindowId(id);
    setMaxZIndex(newZ);
  }, [maxZIndex]);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
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
      restoreWindow
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
