"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFileSystem, FileSystemItem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { useTheme, ThemeName } from "@/context/ThemeContext";
import { Folder, FileText, FolderPlus, FilePlus, RefreshCcw, Palette, Trash2, Pencil, Terminal, Globe, Mail, Monitor, Image as ImageIcon, Keyboard, Music, Video, Bomb, PenTool } from "lucide-react";
import { ContextMenu, ContextMenuItem } from "@/components/ui/ContextMenu";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const isImageFile = (name: string): boolean => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

export const Desktop: React.FC = () => {
  const { state: fsState, dispatch, getChildren } = useFileSystem();
  const { openWindow } = useWindows();
  const { wallpaper, setWallpaper, isDark, isNightLight } = useTheme();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);
  const [showShortcutNotification, setShowShortcutNotification] = useState(false);

  // Selection states
  const [selectedIconIds, setSelectedIconIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });

  // Show notification after 3 seconds
  useEffect(() => {
    const isDismissed = sessionStorage.getItem("dismiss-shortcut-tip");
    if (isDismissed) return;

    const timer = setTimeout(() => {
      if (!document.fullscreenElement) {
        setShowShortcutNotification(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Listen to fullscreen changes to auto-hide notification
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setShowShortcutNotification(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const desktopItems = useMemo(() => {
    const sortOrder = [
      "My Computer",
      "Projects",
      "Resume.pdf",
      "Contact.txt",
      "shortcut.txt",
      "Browser",
      "Typing Game",
      "Word Editor",
      "Minesweeper"
    ];
    return getChildren("desktop").sort((a, b) => {
      const idxA = sortOrder.indexOf(a.name);
      const idxB = sortOrder.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [getChildren]);

  // Window-level mouse listeners for dragging selection
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const desktopElement = document.getElementById("desktop-container");
      if (!desktopElement) return;
      const rect = desktopElement.getBoundingClientRect();
      // Clamp coordinates inside the desktop boundaries
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setSelectionCurrent({ x, y });
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSelecting]);

  // Calculate icon overlap during selection
  useEffect(() => {
    if (!isSelecting) return;

    const left = Math.min(selectionStart.x, selectionCurrent.x);
    const top = Math.min(selectionStart.y, selectionCurrent.y);
    const right = Math.max(selectionStart.x, selectionCurrent.x);
    const bottom = Math.max(selectionStart.y, selectionCurrent.y);

    const winWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 768;
    const isMobileVal = typeof window !== "undefined" ? window.innerWidth < 640 : false;

    const ICON_WIDTH = 75;
    const ICON_HEIGHT = 85;
    const GAP = 10;
    const PADDING = 15;
    const rows = Math.max(1, Math.floor((winHeight - 80) / (ICON_HEIGHT + GAP)));

    const overlappingIds: string[] = [];

    desktopItems.forEach((item, index) => {
      const col = Math.floor(index / rows);
      const row = index % rows;

      const defaultX = isMobileVal
        ? col * (ICON_WIDTH + GAP) + PADDING
        : winWidth - (col + 1) * (ICON_WIDTH + GAP) - PADDING + GAP;
        
      const defaultY = row * (ICON_HEIGHT + GAP) + PADDING;

      const x = item.position?.x ?? defaultX;
      const y = item.position?.y ?? defaultY;

      const iconRight = x + ICON_WIDTH;
      const iconBottom = y + ICON_HEIGHT;

      const overlaps = !(
        right < x ||
        left > iconRight ||
        bottom < y ||
        top > iconBottom
      );

      if (overlaps) {
        overlappingIds.push(item.id);
      }
    });

    setSelectedIconIds((prev) => {
      const isSame = prev.length === overlappingIds.length && prev.every((id, idx) => id === overlappingIds[idx]);
      return isSame ? prev : overlappingIds;
    });
  }, [isSelecting, selectionStart, selectionCurrent, desktopItems]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const isMobileVal = typeof window !== "undefined" ? window.innerWidth < 640 : false;
    if (isMobileVal) return; // Disable selection box on mobile touch drag

    // Only trigger selection box on left mouse click directly on the desktop background
    if (e.button !== 0 || e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionCurrent({ x, y });
    setSelectedIconIds([]);
  };

  const enableImmersiveMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          const nav = navigator as any;
          if (nav.keyboard && nav.keyboard.lock) {
            nav.keyboard.lock(["Tab", "KeyE", "KeyN", "KeyD", "KeyK", "Escape"])
              .then(() => console.log("Keyboard lock acquired"))
              .catch((err: any) => console.warn("Failed to acquire keyboard lock:", err));
          }
          setShowShortcutNotification(false);
        })
        .catch((err) => console.error("Error entering fullscreen", err));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedIconIds([]); // Clear selection when right-clicking empty background
    setItemContextMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIconIds([item.id]); // Automatically select item on right-click!
    setContextMenu(null);
    setItemContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleOpenItem = (item: FileSystemItem, index?: number) => {
    const isMobileVal = typeof window !== "undefined" ? window.innerWidth < 640 : false;
    const winWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 768;

    const ICON_WIDTH = 75;
    const ICON_HEIGHT = 85;
    const GAP = 10;
    const PADDING = 15;

    const idx = index !== undefined ? index : 0;
    const rows = Math.max(1, Math.floor((winHeight - 80) / (ICON_HEIGHT + GAP)));
    const col = Math.floor(idx / rows);
    const row = idx % rows;

    const defaultX = isMobileVal
      ? col * (ICON_WIDTH + GAP) + PADDING
      : winWidth - (col + 1) * (ICON_WIDTH + GAP) - PADDING + GAP;
      
    const defaultY = row * (ICON_HEIGHT + GAP) + PADDING;

    const currentX = item.position?.x ?? defaultX;
    const currentY = item.position?.y ?? defaultY;

    const openProps = { 
      path: item.id,
      fileId: item.id,
      content: item.content,
      x: currentX,
      y: currentY
    };

    if (item.type === "folder") {
      if (item.id === "projects") {
        openWindow("projects", "Projects", { x: currentX, y: currentY });
      } else {
        openWindow("folder", item.name, openProps);
      }
    } else if (item.name.endsWith(".lnk") || (item.content && item.content.startsWith("app:"))) {
      if (item.content === "app:terminal") {
        openWindow("terminal", "Command Prompt", { x: currentX, y: currentY });
      } else if (item.content === "app:browser") {
        openWindow("browser", "The Internet", { x: currentX, y: currentY });
      } else if (item.content === "app:contact") {
        openWindow("contact", "Contact Me", { x: currentX, y: currentY });
      } else if (item.content === "app:typing-game") {
        openWindow("typing-game", "Typing Master", { x: currentX, y: currentY });
      } else if (item.content === "app:word-processor") {
        openWindow("word-processor", "Document Editor", { x: currentX, y: currentY });
      } else if (item.content === "app:minesweeper") {
        openWindow("minesweeper", "Minesweeper", { x: currentX, y: currentY });
      }
    } else if (isImageFile(item.name)) {
      openWindow("image-viewer", item.name, openProps);
    } else if (item.name.endsWith(".pdf")) {
      openWindow("generic", item.name, openProps);
    } else if (item.name.endsWith(".docx")) {
      openWindow("word-processor", item.name, openProps);
    } else if (item.name.endsWith(".mp3") || item.name.endsWith(".wav")) {
      openWindow("music-player", item.name, openProps);
    } else if (item.name.endsWith(".mp4") || item.name.endsWith(".webm")) {
      openWindow("video-player", item.name, openProps);
    } else {
      // Open in Notepad
      openWindow("notepad", item.name, openProps);
    }
  };

  const handleCreateFolder = () => {
    dispatch({
      type: "CREATE_ITEM",
      payload: {
        name: "New Folder",
        type: "folder",
        parentId: "desktop",
      },
    });
  };

  const handleCreateTextFile = () => {
    dispatch({
      type: "CREATE_ITEM",
      payload: {
        name: "New Document.txt",
        type: "file",
        parentId: "desktop",
        content: "",
      },
    });
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          dispatch({
            type: "CREATE_ITEM",
            payload: {
              name: file.name,
              type: "file",
              parentId: "desktop",
              content,
            },
          });
        };
        if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      }
    };
    input.click();
  };

  const handleChangeWallpaper = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setWallpaper(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const menuItems: ContextMenuItem[] = [
    { label: "New Folder", icon: <FolderPlus className="w-4 h-4" />, onClick: handleCreateFolder },
    { label: "New Text Document", icon: <FilePlus className="w-4 h-4" />, onClick: handleCreateTextFile },
    { label: "Upload File", icon: <FilePlus className="w-4 h-4" />, onClick: handleUpload, divider: true },
    { label: "Change Wallpaper", icon: <Palette className="w-4 h-4" />, onClick: handleChangeWallpaper },
    { label: "Refresh", icon: <RefreshCcw className="w-4 h-4" />, onClick: () => window.location.reload() },
    { label: "Reset Icons", icon: <RefreshCcw className="w-4 h-4" />, onClick: () => dispatch({ type: "RESET_ALL_POSITIONS", payload: { parentId: "desktop" } }) },
  ];

  const getItemMenuItems = (item: FileSystemItem): ContextMenuItem[] => [
    { 
      label: "Open", 
      icon: <Folder className="w-4 h-4" />, 
      onClick: () => handleOpenItem(item),
    },
    { 
      label: "Rename", 
      icon: <Pencil className="w-4 h-4" />, 
      onClick: () => {
        const newName = prompt("Enter new name:", item.name);
        if (newName && newName.trim()) {
          dispatch({ type: "RENAME_ITEM", payload: { id: item.id, newName: newName.trim() } });
        }
      },
    },
    { 
      label: "Delete", 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => {
        if (confirm(`Delete "${item.name}"?`)) {
          dispatch({ type: "DELETE_ITEM", payload: { id: item.id } });
        }
      },
      divider: true,
    },
  ];

  return (
    <div
      id="desktop-container"
      className={cn(
        "relative flex-1 w-full h-full bg-cover bg-center overflow-hidden transition-[filter] duration-300",
        isDark && "brightness-75 contrast-[1.05]"
      )}
      style={{ backgroundImage: `url('${wallpaper}')` }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onClick={(e) => { 
        setContextMenu(null); 
        setItemContextMenu(null);
        // Clear icon selection if clicking empty space
        if (e.target === e.currentTarget) {
          setSelectedIconIds([]);
        }
      }}
    >
      {/* Desktop Icons Area */}
      <div className="absolute inset-0 p-4 pointer-events-none grid grid-flow-col auto-cols-max grid-rows-[repeat(auto-fill,90px)] gap-x-4 gap-y-2.5">
        {desktopItems.map((item, index) => (
          <DesktopIcon
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedIconIds.includes(item.id)}
            onSelect={(e) => {
              e.stopPropagation();
              if (e.ctrlKey) {
                if (selectedIconIds.includes(item.id)) {
                  setSelectedIconIds(prev => prev.filter(id => id !== item.id));
                } else {
                  setSelectedIconIds(prev => [...prev, item.id]);
                }
              } else {
                setSelectedIconIds([item.id]);
              }
            }}
            onDoubleClick={() => handleOpenItem(item, index)}
            onContextMenu={(e) => handleItemContextMenu(e, item)}
          />
        ))}
      </div>

      {/* Rubber-band drag selection box */}
      {isSelecting && (
        <div 
          className="absolute border border-purple-500/50 bg-purple-500/15 pointer-events-none rounded-[1px] z-[9000]"
          style={{
            left: Math.min(selectionStart.x, selectionCurrent.x),
            top: Math.min(selectionStart.y, selectionCurrent.y),
            width: Math.abs(selectionStart.x - selectionCurrent.x),
            height: Math.abs(selectionStart.y - selectionCurrent.y)
          }}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
      {itemContextMenu && (
        <ContextMenu
          x={itemContextMenu.x}
          y={itemContextMenu.y}
          items={getItemMenuItems(itemContextMenu.item)}
          onClose={() => setItemContextMenu(null)}
        />
      )}

      {/* Shortcut Notification Toast */}
      {showShortcutNotification && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-14 right-4 z-[9999] max-w-sm bg-white/95 dark:bg-[#1a1f26]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-4.5 select-none pointer-events-auto backdrop-blur-md text-zinc-800 dark:text-zinc-200"
        >
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 mt-0.5 animate-pulse">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] tracking-tight uppercase opacity-55">System Assistant</span>
                <button 
                  onClick={() => {
                    setShowShortcutNotification(false);
                    sessionStorage.setItem("dismiss-shortcut-tip", "true");
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 text-xs font-semibold p-0.5"
                >
                  ✕
                </button>
              </div>
              <span className="font-bold text-sm leading-tight text-zinc-900 dark:text-white">
                Shortcut Conflict Detected?
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Standard keys like <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono">Win+E</code> and <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono">Alt+Tab</code> are captured by your computer. Enable **Immersive Mode** to lock keys inside this website.
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={enableImmersiveMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-default outline-none shadow-sm"
                >
                  Enable Immersive Mode
                </button>
                <button
                  onClick={() => {
                    setShowShortcutNotification(false);
                    sessionStorage.setItem("dismiss-shortcut-tip", "true");
                  }}
                  className="bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-default outline-none"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Night Light Warm Tint Filter */}
      {isNightLight && (
        <div 
          className="pointer-events-none fixed inset-0 bg-[#ff9600]/8 dark:bg-[#ff9600]/6 mix-blend-multiply z-[999999] transition-opacity duration-1000"
          style={{ backdropFilter: "sepia(0.08)" }}
        />
      )}
    </div>
  );
};

const DesktopIcon: React.FC<{ 
  item: FileSystemItem; 
  index: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ item, index, isSelected, onSelect, onDoubleClick, onContextMenu }) => {
  const { dispatch } = useFileSystem();
  const isMobile = useIsMobile();
  const [winSize, setWinSize] = useState({ 
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => setWinSize({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const iconForItem = () => {
    if (item.type === "folder") {
      if (item.id === "my_computer") {
        return <Monitor className="w-11 h-11 text-blue-500 dark:text-blue-400 fill-blue-500/10" />;
      }
      if (item.id === "projects") {
        return <Folder className="w-11 h-11 text-purple-600 dark:text-purple-400 fill-purple-600/10" />;
      }
      return <Folder className="w-11 h-11 text-blue-500 dark:text-blue-400 fill-blue-500/10" />;
    }
    if (item.name === "The Internet.lnk" || item.content === "app:browser") {
      return <Globe className="w-11 h-11 text-blue-500" />;
    }
    if (item.name === "Contact.lnk" || item.content === "app:contact") {
      return <Mail className="w-11 h-11 text-emerald-500" />;
    }
    if (item.name === "Typing Game" || item.content === "app:typing-game") {
      return <Keyboard className="w-11 h-11 text-cyan-500" />;
    }
    if (item.content === "app:word-processor" || item.name.endsWith(".docx")) {
      return <PenTool className="w-11 h-11 text-blue-500" />;
    }
    if (item.content === "app:minesweeper") {
      return <Bomb className="w-11 h-11 text-amber-500" />;
    }
    if (isImageFile(item.name)) {
      return <ImageIcon className="w-11 h-11 text-indigo-500" />;
    }
    if (item.name.endsWith(".pdf")) {
      return <FileText className="w-11 h-11 text-red-500" />;
    }
    if (item.name.endsWith(".mp3") || item.name.endsWith(".wav")) {
      return <Music className="w-11 h-11 text-pink-500" />;
    }
    if (item.name.endsWith(".mp4") || item.name.endsWith(".webm")) {
      return <Video className="w-11 h-11 text-red-500" />;
    }
    return <FileText className="w-11 h-11 text-zinc-400 dark:text-zinc-300" />;
  };

  const ICON_WIDTH = 75;
  const ICON_HEIGHT = 85;
  const GAP = 10;
  const PADDING = 15;

  // Align in vertical columns, starting from top-right and moving left
  const rows = Math.max(1, Math.floor((winSize.height - 80) / (ICON_HEIGHT + GAP)));
  const col = Math.floor(index / rows);
  const row = index % rows;

  const defaultX = isMobile
    ? col * (ICON_WIDTH + GAP) + PADDING
    : winSize.width - (col + 1) * (ICON_WIDTH + GAP) - PADDING + GAP;
    
  const defaultY = row * (ICON_HEIGHT + GAP) + PADDING;

  const currentX = item.position?.x ?? defaultX;
  const currentY = item.position?.y ?? defaultY;

  return (
    <motion.div
      drag={!isMobile}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        dispatch({
          type: "UPDATE_ITEM_POSITION",
          payload: {
            id: item.id,
            x: currentX + info.offset.x,
            y: currentY + info.offset.y,
          },
        });
      }}
      animate={{ x: currentX, y: currentY }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className="absolute pointer-events-auto select-none"
      style={{ top: 0, left: 0, width: ICON_WIDTH }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div 
        onClick={onSelect}
        className={cn(
          "flex flex-col items-center gap-1 group cursor-default p-1.5 rounded-lg border select-none transition-colors outline-none",
          isSelected
            ? "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/25"
            : "border-transparent hover:bg-white/10 hover:border-white/10 active:bg-white/15"
        )}
      >
        <div className="shrink-0 group-hover:scale-105 transition-transform duration-100">
          {iconForItem()}
        </div>
        <span className={cn(
          "text-[10px] sm:text-[10.5px] font-semibold text-center leading-tight tracking-tight line-clamp-2 w-full px-0.5 select-none text-white drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)] shadow-black/80 font-sans"
        )}>
          {item.name}
        </span>
      </div>
    </motion.div>
  );
};
