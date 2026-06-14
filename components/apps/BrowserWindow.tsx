"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Globe,
  Lock,
  Star,
  Search,
  X,
  Plus,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CyberBirdGame } from "./CyberBirdGame";

const DEFAULT_HOME = "https://pujan-joshi.com.np";

type Tab = {
  id: string;
  title: string;
  url: string;
};

export const BrowserWindow: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "New Tab", url: DEFAULT_HOME },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [addressInput, setAddressInput] = useState(DEFAULT_HOME);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([DEFAULT_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();
  const [isOnline, setIsOnline] = useState(true);
  const [simulateOffline, setSimulateOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const navigateTo = useCallback(
    (url: string) => {
      let finalUrl = url.trim();
      if (!finalUrl) return;

      const isCustomProtocol = 
        finalUrl.startsWith("browser://") || 
        finalUrl.startsWith("chrome://") || 
        finalUrl.startsWith("about:");

      // Add protocol if missing
      if (
        !finalUrl.startsWith("http://") &&
        !finalUrl.startsWith("https://") &&
        !isCustomProtocol
      ) {
        // Check if it looks like a URL
        if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
          finalUrl = "https://" + finalUrl;
        } else {
          // Treat as a search query
          finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
        }
      }

      setAddressInput(finalUrl);
      setIsLoading(true);

      // Update tab
      let title = "New Tab";
      if (
        finalUrl === "browser://offline" || 
        finalUrl === "chrome://dino" || 
        finalUrl === "about:offline"
      ) {
        title = "Cyber Bird";
      } else {
        try {
          title = new URL(finalUrl).hostname;
        } catch {
          title = finalUrl;
        }
      }

      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url: finalUrl, title } : t))
      );

      // Update history
      const newHistory = [...history.slice(0, historyIndex + 1), finalUrl];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [activeTabId, history, historyIndex]
  );

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setAddressInput(url);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
      );
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setAddressInput(url);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url } : t))
      );
    }
  };

  const refresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = activeTab.url;
    }
  };

  const goHome = () => {
    navigateTo(DEFAULT_HOME);
  };

  const addTab = () => {
    const id = Math.random().toString(36).substring(2, 9);
    const newTab: Tab = { id, title: "New Tab", url: DEFAULT_HOME };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
    setAddressInput(DEFAULT_HOME);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id);
      setAddressInput(remaining[remaining.length - 1].url);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(addressInput);
  };

  const isSecure = activeTab.url.startsWith("https://") || activeTab.url.startsWith("browser://");
  const displayDomain = (() => {
    if (
      activeTab.url === "browser://offline" || 
      activeTab.url === "chrome://dino" || 
      activeTab.url === "about:offline"
    ) {
      return "browser://offline";
    }
    try {
      return new URL(activeTab.url).hostname;
    } catch {
      return activeTab.url;
    }
  })();
  const isTabOffline = !isOnline || simulateOffline || activeTab.url === "browser://offline" || activeTab.url === "chrome://dino" || activeTab.url === "about:offline";

  return (
    <div className="flex flex-col h-full bg-[#f3f3f3] dark:bg-[#1a1a2e] text-[#1a1a1a] dark:text-white transition-colors duration-300">
      {/* Tab Bar */}
      <div className="flex items-center bg-[#eeeeee] dark:bg-[#12121f] px-1 pt-1 gap-[2px]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTabId(tab.id);
              setAddressInput(tab.url);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer group text-xs transition-colors",
              isMobile ? "min-w-[60px] max-w-[100px]" : "min-w-[120px] max-w-[200px]",
              tab.id === activeTabId
                ? "bg-[#f3f3f3] dark:bg-[#1a1a2e] text-black dark:text-white/90"
                : "bg-[#eeeeee] dark:bg-[#12121f] text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Globe className="w-3 h-3 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate flex-1">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="w-4 h-4 rounded hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-black/50 dark:text-white/70" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="w-6 h-6 rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors ml-1"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#f3f3f3] dark:bg-[#1a1a2e] border-b border-black/5 dark:border-white/5">
        {/* Nav Buttons */}
        <button
          onClick={goBack}
          disabled={historyIndex <= 0}
          className="w-7 h-7 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-black dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="w-7 h-7 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-black dark:text-white"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={refresh}
          className="w-7 h-7 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-black dark:text-white"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
        {!isMobile && (
          <button
            onClick={goHome}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <Home className="w-4 h-4 text-black dark:text-white" />
          </button>
        )}

        {/* Address Bar */}
        <form onSubmit={handleAddressSubmit} className="flex-1 mx-1">
          <div className="flex items-center bg-[#12121f] rounded-full px-3 py-1.5 gap-2 border border-white/5 focus-within:border-blue-500/50 transition-colors">
            {isSecure ? (
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/30"
              placeholder="Search or enter URL"
            />
            <button
              type="submit"
              className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        </form>

        <button
          onClick={() => {
            setSimulateOffline((prev) => !prev);
          }}
          className={cn(
            "px-2 h-7 rounded border flex items-center gap-1.5 transition-colors text-[10px] font-mono font-bold shrink-0",
            simulateOffline 
              ? "bg-rose-500/20 text-rose-500 border-rose-500/30" 
              : "hover:bg-black/5 dark:hover:bg-white/10 text-black/50 dark:text-white/50 border-black/10 dark:border-white/10 hover:text-black dark:hover:text-white"
          )}
          title={simulateOffline ? "Go Online" : "Go Offline"}
        >
          {simulateOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-black dark:text-white" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {!isMobile && (
          <button className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/40">
            <Star className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white dark:bg-[#070714]">
        {/* Loading Bar */}
        {isLoading && !isTabOffline && (
          <div className="absolute top-0 left-0 right-0 h-[2px] z-10">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: "60%" }} />
          </div>
        )}

        {isTabOffline ? (
          <div className="w-full h-full flex flex-col md:flex-row bg-[#0a0a16] text-white">
            {/* Left side: Error warning & options */}
            <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a16]">
              <div className="flex items-center gap-3 mb-4 text-rose-500">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <WifiOff className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider">No Connection</h3>
                  <p className="text-[9px] text-white/40">ERR_INTERNET_DISCONNECTED</p>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold mb-4 tracking-tight leading-tight">
                You are currently offline
              </h2>
              <p className="text-xs text-white/60 mb-6 leading-relaxed">
                The browser could not load the page because your computer has been disconnected from the internet. 
                Check your network connections, or run the built-in offline game.
              </p>

              {/* Suggestions */}
              <div className="space-y-2.5 font-sans text-[11px] text-white/50 mb-6">
                <p className="font-bold text-white/70 uppercase font-mono tracking-wider text-[10px]">Suggestions:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Check network cables, modem, and router</li>
                  <li>Reconnect to your local Wi-Fi or cellular network</li>
                  <li>Click "Go Online" to reconnect to the network</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      refresh();
                    }, 800);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-[11px] font-bold border border-white/10 hover:border-white/20 active:translate-y-[1px] transition-all cursor-default"
                >
                  Try Again
                </button>
                {simulateOffline && (
                  <button
                    onClick={() => setSimulateOffline(false)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-[11px] font-bold shadow-lg shadow-emerald-500/20 active:translate-y-[1px] transition-all cursor-default"
                  >
                    Go Online
                  </button>
                )}
              </div>
            </div>

            {/* Right side: Embedded Cyber Bird Game */}
            <div className="flex-1 min-h-[350px] md:min-h-0 relative bg-black">
              <CyberBirdGame />
            </div>
          </div>
        ) : (
          <>
            {/* iframe Blocked Warning - shown as a fallback above the iframe */}
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              title="Browser"
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              onLoad={() => {
                setIsLoading(false);
                // Try to get the page title
                try {
                  const title = iframeRef.current?.contentDocument?.title;
                  if (title) {
                    setTabs((prev) =>
                      prev.map((t) =>
                        t.id === activeTabId ? { ...t, title } : t
                      )
                    );
                  }
                } catch {
                  // Cross-origin - use domain as title
                  setTabs((prev) =>
                    prev.map((t) =>
                      t.id === activeTabId ? { ...t, title: displayDomain } : t
                    )
                  );
                }
              }}
              onError={() => setIsLoading(false)}
            />

            {/* Fallback overlay for blocked iframes */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] pointer-events-none opacity-0 peer-errored:opacity-100">
              <div className="text-center text-white/50">
                <Globe className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">This page can&apos;t be displayed</p>
                <p className="text-sm">Some websites block embedding for security reasons.</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center h-6 px-3 bg-[#12121f] border-t border-white/5 text-[10px] text-white/30">
        <span>{isLoading ? "Loading..." : displayDomain}</span>
        <span className="ml-auto flex items-center gap-1">
          {isSecure && <Lock className="w-3 h-3 text-emerald-400" />}
          <span>{isSecure ? "Secure Connection" : "Not Secure"}</span>
        </span>
      </div>
    </div>
  );
};
