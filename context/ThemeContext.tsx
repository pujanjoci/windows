"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [wallpaper, setWallpaperState] = useState("/wallpaper.jpg");
  const [accentColor, setAccentColorState] = useState("#3b82f6"); // Blue-500

  // Load from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("os-theme") as ThemeMode;
    const savedWallpaper = localStorage.getItem("os-wallpaper");
    const savedAccent = localStorage.getItem("os-accent");

    if (savedTheme) setThemeState(savedTheme);
    if (savedWallpaper) setWallpaperState(savedWallpaper);
    if (savedAccent) setAccentColorState(savedAccent);
  }, []);

  // Sync theme to document class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem("os-theme", theme);
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  
  const setWallpaper = (url: string) => {
    setWallpaperState(url);
    localStorage.setItem("os-wallpaper", url);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem("os-accent", color);
    document.documentElement.style.setProperty("--accent-color", color);
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      wallpaper, 
      setWallpaper, 
      accentColor, 
      setAccentColor 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
