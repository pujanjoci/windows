"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeName = "win11";

export const DEFAULT_WALLPAPERS: Record<ThemeName, string> = {
  win11: "/images/wallpaper.jpg",
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
  volume: number;
  setVolume: (volume: number) => void;
  isNightLight: boolean;
  setIsNightLight: (active: boolean) => void;
  // Taskbar settings
  taskbarShowMode: "both" | "icon" | "name";
  setTaskbarShowMode: (mode: "both" | "icon" | "name") => void;
  taskbarAlignment: "center" | "left";
  setTaskbarAlignment: (align: "center" | "left") => void;
  taskbarSize: "small" | "medium" | "large";
  setTaskbarSize: (size: "small" | "medium" | "large") => void;
  taskbarAutohide: boolean;
  setTaskbarAutohide: (active: boolean) => void;
  // Taskbar limits
  taskbarLimitEnabled: boolean;
  setTaskbarLimitEnabled: (active: boolean) => void;
  taskbarIconNameLimit: number;
  setTaskbarIconNameLimit: (limit: number) => void;
  taskbarIconOnlyLimit: number;
  setTaskbarIconOnlyLimit: (limit: number) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeName>("win11");
  const [isDark, setIsDarkState] = useState(true);
  const [wallpaper, setWallpaperState] = useState(DEFAULT_WALLPAPERS.win11);
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENTS.win11);
  const [volume, setVolumeState] = useState<number>(50);
  const [isNightLight, setIsNightLightState] = useState(false);
  const [taskbarShowMode, setTaskbarShowModeState] = useState<"both" | "icon" | "name">("both");
  const [taskbarAlignment, setTaskbarAlignmentState] = useState<"center" | "left">("center");
  const [taskbarSize, setTaskbarSizeState] = useState<"small" | "medium" | "large">("medium");
  const [taskbarAutohide, setTaskbarAutohideState] = useState<boolean>(false);
  const [taskbarLimitEnabled, setTaskbarLimitEnabledState] = useState<boolean>(true);
  const [taskbarIconNameLimit, setTaskbarIconNameLimitState] = useState<number>(5);
  const [taskbarIconOnlyLimit, setTaskbarIconOnlyLimitState] = useState<number>(6);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedWallpaper = localStorage.getItem("os-wallpaper-v3");
    const savedAccent = localStorage.getItem("os-accent-v3");
    const savedDark = localStorage.getItem("os-dark-mode-v3");
    const savedVolume = localStorage.getItem("os-volume-v3");
    const savedNightLight = localStorage.getItem("os-night-light-v3");
    const savedShowMode = localStorage.getItem("os-tb-showmode-v3");
    const savedAlignment = localStorage.getItem("os-tb-alignment-v3");
    const savedSize = localStorage.getItem("os-tb-size-v3");
    const savedAutohide = localStorage.getItem("os-tb-autohide-v3");
    const savedLimitEnabled = localStorage.getItem("os-tb-limit-enabled-v3");
    const savedIconNameLimit = localStorage.getItem("os-tb-icon-name-limit-v3");
    const savedIconOnlyLimit = localStorage.getItem("os-tb-icon-only-limit-v3");

    if (savedWallpaper) setWallpaperState(savedWallpaper);
    if (savedAccent) setAccentColorState(savedAccent);
    if (savedDark !== null) setIsDarkState(savedDark === "true");
    if (savedVolume !== null) setVolumeState(Number(savedVolume));
    if (savedNightLight !== null) setIsNightLightState(savedNightLight === "true");
    if (savedShowMode !== null) setTaskbarShowModeState(savedShowMode as any);
    if (savedAlignment !== null) setTaskbarAlignmentState(savedAlignment as any);
    if (savedSize !== null) setTaskbarSizeState(savedSize as any);
    if (savedAutohide !== null) setTaskbarAutohideState(savedAutohide === "true");
    if (savedLimitEnabled !== null) setTaskbarLimitEnabledState(savedLimitEnabled === "true");
    if (savedIconNameLimit !== null) setTaskbarIconNameLimitState(Number(savedIconNameLimit));
    if (savedIconOnlyLimit !== null) setTaskbarIconOnlyLimitState(Number(savedIconOnlyLimit));
    
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

  const setVolume = (v: number) => {
    setVolumeState(v);
    localStorage.setItem("os-volume-v3", String(v));
  };

  const setIsNightLight = (active: boolean) => {
    setIsNightLightState(active);
    localStorage.setItem("os-night-light-v3", String(active));
  };

  const setTaskbarShowMode = (mode: "both" | "icon" | "name") => {
    setTaskbarShowModeState(mode);
    localStorage.setItem("os-tb-showmode-v3", mode);
  };

  const setTaskbarAlignment = (align: "center" | "left") => {
    setTaskbarAlignmentState(align);
    localStorage.setItem("os-tb-alignment-v3", align);
  };

  const setTaskbarSize = (size: "small" | "medium" | "large") => {
    setTaskbarSizeState(size);
    localStorage.setItem("os-tb-size-v3", size);
  };

  const setTaskbarAutohide = (active: boolean) => {
    setTaskbarAutohideState(active);
    localStorage.setItem("os-tb-autohide-v3", String(active));
  };

  const setTaskbarLimitEnabled = (active: boolean) => {
    setTaskbarLimitEnabledState(active);
    localStorage.setItem("os-tb-limit-enabled-v3", String(active));
  };

  const setTaskbarIconNameLimit = (limit: number) => {
    setTaskbarIconNameLimitState(limit);
    localStorage.setItem("os-tb-icon-name-limit-v3", String(limit));
  };

  const setTaskbarIconOnlyLimit = (limit: number) => {
    setTaskbarIconOnlyLimitState(limit);
    localStorage.setItem("os-tb-icon-only-limit-v3", String(limit));
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
      setAccentColor,
      volume,
      setVolume,
      isNightLight,
      setIsNightLight,
      taskbarShowMode,
      setTaskbarShowMode,
      taskbarAlignment,
      setTaskbarAlignment,
      taskbarSize,
      setTaskbarSize,
      taskbarAutohide,
      setTaskbarAutohide,
      taskbarLimitEnabled,
      setTaskbarLimitEnabled,
      taskbarIconNameLimit,
      setTaskbarIconNameLimit,
      taskbarIconOnlyLimit,
      setTaskbarIconOnlyLimit
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
