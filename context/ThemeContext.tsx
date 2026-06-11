"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeName = "win11";

export const DEFAULT_WALLPAPERS: Record<ThemeName, string> = {
  win11: "/wallpaper.jpg",
};

export const DEFAULT_ACCENTS: Record<ThemeName, string> = {
  win11: "#0078d4", // Windows Blue
};

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeName>("win11");
  const [isDark, setIsDarkState] = useState(true);
  const [wallpaper, setWallpaperState] = useState(DEFAULT_WALLPAPERS.win11);
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENTS.win11);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedWallpaper = localStorage.getItem("os-wallpaper-v3");
    const savedAccent = localStorage.getItem("os-accent-v3");
    const savedDark = localStorage.getItem("os-dark-mode-v3");

    if (savedWallpaper) setWallpaperState(savedWallpaper);
    if (savedAccent) setAccentColorState(savedAccent);
    if (savedDark !== null) setIsDarkState(savedDark === "true");
    
    setIsLoaded(true);
  }, []);

  // Sync theme to document class
  useEffect(() => {
    if (!isLoaded) return;

    const root = window.document.documentElement;
    root.classList.remove("theme-win11", "theme-dark", "theme-xp", "dark");
    root.classList.add("theme-win11");
    if (isDark) {
      root.classList.add("dark");
    }

    localStorage.setItem("os-theme", "win11");
    localStorage.setItem("os-dark-mode-v3", String(isDark));
  }, [isDark, isLoaded]);

  const setTheme = (t: ThemeName) => {
    // No-op or lock to win11
  };

  const setIsDark = (dark: boolean) => {
    setIsDarkState(dark);
  };
  
  const setWallpaper = (url: string) => {
    setWallpaperState(url);
    localStorage.setItem("os-wallpaper-v3", url);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem("os-accent-v3", color);
  };

  useEffect(() => {
    if (!isLoaded) return;
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [accentColor, isLoaded]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme,
      isDark,
      setIsDark,
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
