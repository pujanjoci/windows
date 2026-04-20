"use client";

import React, { useState, useEffect } from "react";
import { useFileSystem, FileSystemItem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { useTheme } from "@/context/ThemeContext";
import { Folder, FileText, FolderPlus, FilePlus, RefreshCcw, Palette, Trash2, Pencil, Terminal, Globe, GitBranch, Mail } from "lucide-react";
import { ContextMenu, ContextMenuItem } from "@/components/ui/ContextMenu";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const DEFAULT_WALLPAPER = "/wallpaper.jpg";

export const Desktop: React.FC = () => {
  const { state, dispatch, getChildren } = useFileSystem();
  const { openWindow } = useWindows();
  const { theme, wallpaper, setWallpaper } = useTheme();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);

  const desktopItems = getChildren("desktop");

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setItemContextMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    setItemContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleOpenItem = (item: FileSystemItem) => {
    if (item.type === "folder") {
      // Projects folder opens the GitHub-integrated view
      if (item.id === "projects") {
        openWindow("projects", "Projects");
      } else {
        openWindow("folder", item.name, { path: item.id });
      }
    } else if (item.name.endsWith(".lnk")) {
      if (item.content === "app:terminal") {
        openWindow("terminal", "Command Prompt");
      } else if (item.content === "app:browser") {
        openWindow("browser", "The Internet");
      } else if (item.content === "app:contact") {
        openWindow("contact", "Contact Me");
      }
    } else {
      openWindow("generic", item.name, { fileId: item.id, content: item.content });
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
          localStorage.setItem("web_os_wallpaper", dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const menuItems: ContextMenuItem[] = [
    { label: "New Folder", icon: <FolderPlus className="w-4 h-4" />, onClick: handleCreateFolder },
    { label: "Upload File", icon: <FilePlus className="w-4 h-4" />, onClick: handleUpload },
    { label: "Refresh", icon: <RefreshCcw className="w-4 h-4" />, onClick: () => window.location.reload(), divider: true },
    { label: "Change Wallpaper", icon: <Palette className="w-4 h-4" />, onClick: handleChangeWallpaper },
    { label: "Reset Icons", icon: <RefreshCcw className="w-4 h-4" />, onClick: () => dispatch({ type: "RESET_ALL_POSITIONS", payload: { parentId: "desktop" } }), divider: true },
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
      className="relative flex-1 w-full h-full bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url('${wallpaper}')` }}
      onContextMenu={handleContextMenu}
      onClick={() => { setContextMenu(null); setItemContextMenu(null); }}
    >
      {/* Desktop Icons Area */}
      <div className="absolute inset-0 p-4 pointer-events-none">
        {desktopItems.map((item, index) => (
          <DesktopIcon
            key={item.id}
            item={item}
            index={index}
            onDoubleClick={() => handleOpenItem(item)}
            onContextMenu={(e) => handleItemContextMenu(e, item)}
          />
        ))}
      </div>

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
    </div>
  );
};

const DesktopIcon: React.FC<{ 
  item: FileSystemItem; 
  index: number;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ item, index, onDoubleClick, onContextMenu }) => {
  const { dispatch } = useFileSystem();
  const isMobile = useIsMobile();
  const [winSize, setWinSize] = useState({ width: typeof window !== "undefined" ? window.innerWidth : 1024 });

  useEffect(() => {
    const handleResize = () => setWinSize({ width: window.innerWidth });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const iconForItem = () => {
    if (item.type === "folder") {
      return <Folder className="w-12 h-12 text-blue-600 dark:text-blue-400 fill-blue-600/10 dark:fill-blue-400/20" />;
    }
    if (item.name === "The Internet.lnk" || item.content === "app:browser") {
      return (
        <div className="relative">
          <Globe className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
      );
    }
    if (item.name === "Contact.lnk" || item.content === "app:contact") {
      return (
        <div className="relative">
          <Mail className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
      );
    }
    if (item.name.endsWith(".lnk")) {
      return (
        <div className="relative">
          <Terminal className="w-12 h-12 text-blue-600 dark:text-emerald-400" />
        </div>
      );
    }
    if (item.name.endsWith(".pdf")) {
      return <FileText className="w-12 h-12 text-red-600 dark:text-red-400" />;
    }
    return <FileText className="w-12 h-12 text-zinc-500 dark:text-zinc-300" />;
  };

  const ICON_WIDTH = isMobile ? 80 : 100;
  const ICON_HEIGHT = isMobile ? 80 : 100;
  const GAP = isMobile ? 8 : 8;
  const PADDING = isMobile ? 12 : 20;

  // Default position:
  // Mobile: Multi-column grid from top-left
  // Desktop: Right side, vertical column
  const cols = isMobile ? Math.floor((winSize.width - PADDING * 2) / (ICON_WIDTH + GAP)) : 1;
  const row = isMobile ? Math.floor(index / cols) : index;
  const col = isMobile ? index % cols : 0;

  const defaultX = isMobile 
    ? col * (ICON_WIDTH + GAP) + PADDING 
    : winSize.width - ICON_WIDTH - PADDING;
    
  const defaultY = row * (ICON_HEIGHT + GAP) + PADDING;

  const currentX = item.position?.x ?? defaultX;
  const currentY = item.position?.y ?? defaultY;

  return (
    <motion.div
      drag={!isMobile}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        // Calculate new position based on the delta from the start of the drag
        dispatch({
          type: "UPDATE_ITEM_POSITION",
          payload: {
            id: item.id,
            x: currentX + info.offset.x,
            y: currentY + info.offset.y,
          },
        });
      }}
      // Use style for x and y transforms to keep them separate from dragging state if possible
      // or use animate with type none to prevent jumping
      animate={{ x: currentX, y: currentY }}
      transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0 }}
      className="absolute pointer-events-auto"
      style={{ top: 0, left: 0, width: ICON_WIDTH }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className={cn(
        "flex flex-col items-center gap-1 group cursor-default select-none transition-all rounded-lg hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/10",
        isMobile ? "p-1" : "p-2"
      )}>
        {React.cloneElement(iconForItem() as React.ReactElement<{ className?: string }>, { 
          className: cn(
            (iconForItem() as React.ReactElement<{ className?: string }>).props.className,
            isMobile ? "w-10 h-10" : "w-12 h-12"
          ) 
        })}
        <span className="text-[10px] sm:text-[11px] font-medium text-black/80 dark:text-white/90 text-center leading-tight shadow-sm drop-shadow-sm group-hover:drop-shadow-md truncate w-full px-1">
          {item.name}
        </span>
      </div>
    </motion.div>
  );
};
