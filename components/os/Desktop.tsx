"use client";

import React, { useState, useEffect } from "react";
import { useFileSystem, FileSystemItem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { useTheme, ThemeName } from "@/context/ThemeContext";
import { Folder, FileText, FolderPlus, FilePlus, RefreshCcw, Palette, Trash2, Pencil, Terminal, Globe, Mail, Monitor, Image as ImageIcon } from "lucide-react";
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
  const { wallpaper, setWallpaper, isDark } = useTheme();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);

  const sortOrder = [
    "My Computer",
    "Projects",
    "Photos",
    "Resume.pdf",
    "Contact.txt",
    "Browser"
  ];

  const desktopItems = getChildren("desktop").sort((a, b) => {
    const idxA = sortOrder.indexOf(a.name);
    const idxB = sortOrder.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

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
      }
    } else if (isImageFile(item.name)) {
      openWindow("image-viewer", item.name, openProps);
    } else if (item.name.endsWith(".pdf")) {
      openWindow("generic", item.name, openProps);
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
      className={cn(
        "relative flex-1 w-full h-full bg-cover bg-center overflow-hidden transition-all duration-300",
        isDark && "brightness-75 contrast-[1.05]"
      )}
      style={{ backgroundImage: `url('${wallpaper}')` }}
      onContextMenu={handleContextMenu}
      onClick={() => { setContextMenu(null); setItemContextMenu(null); }}
    >
      {/* Desktop Icons Area */}
      <div className="absolute inset-0 p-4 pointer-events-none grid grid-flow-col auto-cols-max grid-rows-[repeat(auto-fill,90px)] gap-x-4 gap-y-2.5">
        {desktopItems.map((item, index) => (
          <DesktopIcon
            key={item.id}
            item={item}
            index={index}
            onDoubleClick={() => handleOpenItem(item, index)}
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
    if (isImageFile(item.name)) {
      return <ImageIcon className="w-11 h-11 text-indigo-500" />;
    }
    if (item.name.endsWith(".pdf")) {
      return <FileText className="w-11 h-11 text-red-500" />;
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
      <div className="flex flex-col items-center gap-1 group cursor-default p-1.5 rounded-lg border border-transparent select-none transition-all outline-none hover:bg-white/10 hover:border-white/10 active:bg-white/15">
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
