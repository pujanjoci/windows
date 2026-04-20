"use client";

import React, { useState } from "react";
import { useFileSystem, FileSystemItem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Folder,
  FolderPlus,
  FileText,
  FilePlus,
  ArrowUp,
  Trash2
} from "lucide-react";
import { ContextMenu, ContextMenuItem } from "@/components/ui/ContextMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const FolderWindow: React.FC<{ initialPathId?: string }> = ({ initialPathId = "root" }) => {
  const { state, dispatch, getChildren, getItemPath } = useFileSystem();
  const { openWindow } = useWindows();
  
  const [currentPathId, setCurrentPathId] = useState(initialPathId);
  const [history, setHistory] = useState<string[]>([initialPathId]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);
  const isMobile = useIsMobile();

  // Derive items directly from state (no useMemo with stale deps)
  const items = getChildren(currentPathId);
  const currentPathStr = getItemPath(currentPathId);

  const navigateTo = (id: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(id);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPathId(id);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPathId(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPathId(history[historyIndex + 1]);
    }
  };

  const goUp = () => {
    const currentItem = state.items[currentPathId];
    if (currentItem?.parentId) {
      navigateTo(currentItem.parentId);
    }
  };

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === "folder") {
      // Projects folder opens the GitHub-integrated view
      if (item.id === "projects") {
        openWindow("projects", "Projects");
      } else {
        navigateTo(item.id);
      }
    } else if (item.name.endsWith(".lnk")) {
      if (item.content === "app:terminal") {
        openWindow("terminal", "Command Prompt");
      } else if (item.content === "app:browser") {
        openWindow("browser", "The Internet");
      }
    } else {
      openWindow("generic", item.name, { fileId: item.id, content: item.content });
    }
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItemContextMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    setItemContextMenu({ x: e.clientX, y: e.clientY, item });
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
              parentId: currentPathId,
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

  const bgMenuItems: ContextMenuItem[] = [
    { 
      label: "New Folder", 
      icon: <FolderPlus className="w-4 h-4" />, 
      onClick: () => {
        dispatch({
          type: "CREATE_ITEM",
          payload: { name: "New Folder", type: "folder", parentId: currentPathId }
        });
      }
    },
    { 
      label: "New File", 
      icon: <FilePlus className="w-4 h-4" />, 
      onClick: () => {
        dispatch({
          type: "CREATE_ITEM",
          payload: { name: "New File.txt", type: "file", parentId: currentPathId, content: "" }
        });
      }
    },
    { 
      label: "Upload File", 
      icon: <FilePlus className="w-4 h-4" />, 
      onClick: handleUpload
    },
  ];

  const getItemMenuItems = (item: FileSystemItem): ContextMenuItem[] => [
    { 
      label: "Open", 
      icon: <Folder className="w-4 h-4" />, 
      onClick: () => handleItemDoubleClick(item),
    },
    { 
      label: "Delete", 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => dispatch({ type: "DELETE_ITEM", payload: { id: item.id } }),
      divider: true,
    },
  ];

  return (
    <div 
      className="flex flex-col h-full bg-[#f3f3f3] dark:bg-[#1a1a2e] text-[#1a1a1a] dark:text-white transition-colors duration-300"
      onClick={() => { setContextMenu(null); setItemContextMenu(null); }}
    >
      {/* Navigation Bar */}
      <div className="h-10 flex items-center px-2 gap-2 border-b border-black/5 dark:border-white/5 bg-[#eeeeee] dark:bg-[#252526]">
        <div className="flex items-center gap-1">
          <button 
            disabled={historyIndex === 0}
            onClick={goBack}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={historyIndex === history.length - 1}
            onClick={goForward}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={goUp}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center bg-white dark:bg-[#1a1a2e] border border-black/10 dark:border-white/10 rounded px-2 py-1 gap-2 text-xs">
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          <span className="flex-1 truncate opacity-80">{currentPathStr}</span>
        </div>

        {!isMobile && (
          <div className="w-40 flex items-center bg-white dark:bg-[#1a1a2e] border border-black/10 dark:border-white/10 rounded px-2 py-1 gap-2 mx-1">
            <Search className="w-3.5 h-3.5 opacity-50 text-black dark:text-white" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none text-xs w-full"
            />
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div 
        className="flex-1 p-4 overflow-y-auto no-scrollbar grid grid-cols-[repeat(auto-fill,80px)] auto-rows-[90px] gap-4 content-start relative"
        onContextMenu={handleBgContextMenu}
      >
        {items.map((item) => (
          <FolderItem 
            key={item.id} 
            item={item} 
            onDoubleClick={() => handleItemDoubleClick(item)}
            onContextMenu={(e) => handleItemContextMenu(e, item)}
          />
        ))}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <span className="text-sm italic">This folder is empty</span>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={bgMenuItems}
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

const FolderItem: React.FC<{ 
  item: FileSystemItem; 
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ item, onDoubleClick, onContextMenu }) => {
  return (
    <div 
      className="flex flex-col items-center gap-1 group cursor-default select-none p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/5 active:bg-black/10 dark:active:bg-white/20 transition-all"
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="relative">
        {item.type === "folder" ? (
          <Folder className="w-10 h-10 text-blue-600 dark:text-blue-400 fill-blue-600/10 dark:fill-blue-400/20 group-hover:scale-105 transition-transform" />
        ) : (
          <FileText className="w-10 h-10 text-zinc-500 dark:text-zinc-300 group-hover:scale-105 transition-transform" />
        )}
      </div>
      <span className="text-[11px] text-black/70 dark:text-zinc-300 text-center leading-tight truncate w-full px-0.5">
        {item.name}
      </span>
    </div>
  );
};
