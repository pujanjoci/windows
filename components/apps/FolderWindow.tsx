"use client";

import React, { useState, useMemo } from "react";
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
  Trash2,
  Grid,
  List,
  Monitor,
  Download,
  Image as ImageIcon,
  GitBranch,
  ExternalLink,
  ChevronRightSquare,
  Music,
  Video,
  Bomb,
  PenTool
} from "lucide-react";

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const isImageFile = (name: string): boolean => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

import { ContextMenu, ContextMenuItem } from "@/components/ui/ContextMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const FolderWindow: React.FC<{ initialPathId?: string }> = ({ initialPathId = "root" }) => {
  const { state, dispatch, getChildren, getItemPath } = useFileSystem();
  const { openWindow } = useWindows();
  
  const [currentPathId, setCurrentPathId] = useState(initialPathId);
  const [history, setHistory] = useState<string[]>([initialPathId]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);
  const isMobile = useIsMobile();

  // Derive folder contents
  const items = getChildren(currentPathId);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const navigateTo = (id: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(id);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPathId(id);
    setSearchQuery(""); // Clear search on navigate
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPathId(history[historyIndex - 1]);
      setSearchQuery("");
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPathId(history[historyIndex + 1]);
      setSearchQuery("");
    }
  };

  const goUp = () => {
    const currentItem = state.items[currentPathId];
    if (currentItem?.parentId) {
      navigateTo(currentItem.parentId);
    }
  };

  // Click handler
  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === "folder") {
      if (item.id === "projects") {
        openWindow("projects", "Projects");
      } else {
        navigateTo(item.id);
      }
    } else if (item.name.endsWith(".lnk") || (item.content && item.content.startsWith("app:"))) {
      if (item.content === "app:terminal") {
        openWindow("terminal", "Command Prompt");
      } else if (item.content === "app:browser") {
        openWindow("browser", "The Internet");
      } else if (item.content === "app:contact") {
        openWindow("contact", "Contact Me");
      } else if (item.content === "app:word-processor") {
        openWindow("word-processor", "Document Editor");
      } else if (item.content === "app:minesweeper") {
        openWindow("minesweeper", "Minesweeper");
      }
    } else if (item.name.endsWith(".jpg") || item.name.endsWith(".png") || item.name.endsWith(".jpeg")) {
      openWindow("image-viewer", item.name, { fileId: item.id });
    } else if (item.name.endsWith(".pdf")) {
      openWindow("generic", item.name, { fileId: item.id, content: item.content });
    } else if (item.name.endsWith(".docx")) {
      openWindow("word-processor", item.name, { fileId: item.id, content: item.content });
    } else if (item.name.endsWith(".mp3") || item.name.endsWith(".wav")) {
      openWindow("music-player", item.name, { fileId: item.id });
    } else if (item.name.endsWith(".mp4") || item.name.endsWith(".webm")) {
      openWindow("video-player", item.name, { fileId: item.id });
    } else {
      // Text and Markdowns open in Notepad
      openWindow("notepad", item.name, { fileId: item.id, content: item.content });
    }
  };

  // Breadcrumbs generator
  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    let current = state.items[currentPathId];
    while (current) {
      crumbs.unshift(current);
      if (current.parentId) {
        current = state.items[current.parentId];
      } else {
        break;
      }
    }
    return crumbs;
  }, [currentPathId, state.items]);

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
      label: "New Text File", 
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
      onClick: () => handleItemClick(item),
    },
    { 
      label: "Delete", 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => dispatch({ type: "DELETE_ITEM", payload: { id: item.id } }),
      divider: true,
    },
  ];

  // Projects definitions
  const MOCK_PROJECT_DETAILS: Record<string, { desc: string; tags: string[]; git: string; demo: string }> = {
    "windows-os-clone": {
      desc: "Interactive Windows-inspired desktop simulation in the browser.",
      tags: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
      git: "https://github.com/pujanjoci/windows-clone",
      demo: "https://pujan-joshi.com.np"
    },
    "portfolio-v2": {
      desc: "Ultra-fast portfolio constructed using Astro islands architecture and 3D details.",
      tags: ["Astro", "React", "Three.js", "Tailwind CSS"],
      git: "https://github.com/pujanjoci/portfolio-v2",
      demo: "https://pujan-joshi.com.np"
    },
    "ecommerce-app": {
      desc: "Full-stack storefront with catalog search, stripe payments, and admin dashboards.",
      tags: ["Next.js", "Prisma", "PostgreSQL", "Stripe", "Zustand"],
      git: "https://github.com/pujanjoci/ecommerce-store",
      demo: "https://pujan-joshi.com.np"
    }
  };

  const isProjectsFolder = currentPathId === "projects";

  return (
    <div 
      className="flex h-full bg-[#fbfbfb] dark:bg-[#12161c] text-[#222] dark:text-zinc-200 transition-colors duration-300 font-sans"
      onClick={() => { setContextMenu(null); setItemContextMenu(null); }}
    >
      
      {/* Sidebar navigation */}
      {!isMobile && (
        <div className="w-[170px] shrink-0 bg-[#f3f3f3] dark:bg-[#0c0f12]/50 border-r border-black/5 dark:border-white/5 flex flex-col p-2 gap-1.5 select-none">
          <span className="text-[10px] uppercase font-bold opacity-40 px-2.5 mb-1 tracking-wider">Navigation</span>
          
          <SidebarLink icon={<Monitor className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />} label="My Computer" onClick={() => navigateTo("my_computer")} active={currentPathId === "my_computer"} />
          <SidebarLink icon={<Monitor className="w-4 h-4 text-blue-500" />} label="Desktop" onClick={() => navigateTo("desktop")} active={currentPathId === "desktop"} />
          <SidebarLink icon={<Folder className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />} label="Documents" onClick={() => navigateTo("documents")} active={currentPathId === "documents"} />
          <SidebarLink icon={<GitBranch className="w-4 h-4 text-purple-500" />} label="Projects" onClick={() => openWindow("projects", "Projects")} active={false} />
          <SidebarLink icon={<ImageIcon className="w-4 h-4 text-indigo-500" />} label="Photos" onClick={() => navigateTo("photos")} active={currentPathId === "photos"} />
          <SidebarLink icon={<Music className="w-4 h-4 text-pink-500" />} label="Music" onClick={() => navigateTo("music")} active={currentPathId === "music"} />
          <SidebarLink icon={<Video className="w-4 h-4 text-red-500" />} label="Videos" onClick={() => navigateTo("videos")} active={currentPathId === "videos"} />
          <SidebarLink icon={<Download className="w-4 h-4 text-emerald-500" />} label="Downloads" onClick={() => navigateTo("downloads")} active={currentPathId === "downloads"} />
        </div>
      )}

      {/* Main File View Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navigation Bar / Breadcrumbs / Toolbar */}
        <div className="h-10 flex items-center px-3 gap-2 border-b border-black/5 dark:border-white/5 bg-[#eeeeee]/50 dark:bg-[#161a22]/50 select-none">
          
          {/* Back / Forward History buttons */}
          <div className="flex items-center gap-0.5">
            <button 
              disabled={historyIndex === 0}
              onClick={goBack}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 cursor-default"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={historyIndex === history.length - 1}
              onClick={goForward}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 cursor-default"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={goUp}
              disabled={!state.items[currentPathId]?.parentId}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 cursor-default"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          {/* Clickable Breadcrumbs */}
          <div className="flex-1 flex items-center overflow-x-auto no-scrollbar bg-white dark:bg-[#0c0f12] border border-black/10 dark:border-white/5 rounded px-2 py-1 gap-1 text-[11px] font-medium min-w-0">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <span className="opacity-45">/</span>}
                <button
                  onClick={() => navigateTo(crumb.id)}
                  className="hover:text-blue-500 hover:underline truncate max-w-[100px] cursor-default focus:outline-none"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* View toggle / Search bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-default"
              title="Toggle View Mode"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>

            {/* Search Input */}
            <div className="w-32 sm:w-40 flex items-center bg-white dark:bg-[#0c0f12] border border-black/10 dark:border-white/5 rounded px-2 py-1 gap-1.5">
              <Search className="w-3.5 h-3.5 opacity-40 text-current" />
              <input 
                type="text" 
                placeholder="Search folder" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] w-full placeholder:opacity-50 text-current"
              />
            </div>
          </div>
        </div>

        {/* Content Folder Pane */}
        <div 
          className="flex-1 p-4 overflow-y-auto no-scrollbar relative"
          onContextMenu={handleBgContextMenu}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPathId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.12 }}
              className="h-full"
            >
              {isProjectsFolder ? (
                /* CUSTOM PROJECTS CARDS GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                  {filteredItems.map((item) => {
                    const detail = MOCK_PROJECT_DETAILS[item.name] || {
                      desc: "Project files and workspace configurations.",
                      tags: ["JSON", "Markdown"],
                      git: "#",
                      demo: "#"
                    };
                    return (
                      <div 
                        key={item.id}
                        onContextMenu={(e) => handleItemContextMenu(e, item)}
                        className="bg-white dark:bg-[#161a22] border border-black/10 dark:border-white/5 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:shadow-md hover:border-blue-500/35 transition-all select-none"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-purple-600/10" />
                            <span className="font-bold text-sm text-zinc-800 dark:text-white leading-tight">
                              {item.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleItemClick(item)}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-purple-500 cursor-default"
                            title="Open Project Folder"
                          >
                            <ChevronRightSquare className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal flex-1">
                          {detail.desc}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {detail.tags.map(t => (
                            <span key={t} className="text-[9px] bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2.5 mt-1">
                          <a 
                            href={detail.git} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                          >
                            <GithubIcon className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                          </a>
                          <a 
                            href={detail.demo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-500"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === "grid" ? (
                /* STANDARD GRID VIEW */
                <div className="grid grid-cols-[repeat(auto-fill,80px)] auto-rows-[95px] gap-4 content-start h-full">
                  {filteredItems.map((item) => (
                    <FolderItemGrid 
                      key={item.id} 
                      item={item} 
                      onClick={() => handleItemClick(item)}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                    />
                  ))}
                </div>
              ) : (
                /* STANDARD LIST VIEW (TABLE) */
                <div className="flex flex-col h-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black/15 dark:border-white/10 text-zinc-400 font-bold tracking-wide">
                        <th className="pb-2 font-semibold">Name</th>
                        <th className="pb-2 font-semibold w-24">Type</th>
                        <th className="pb-2 font-semibold w-28">Date Modified</th>
                        <th className="pb-2 font-semibold w-20 text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredItems.map((item) => {
                        const isFolder = item.type === "folder";
                        const size = isFolder ? "" : `${Math.round((item.content?.length || 100) / 102.4) / 10} KB`;
                        const type = isFolder ? "File Folder" : item.name.split(".").pop()?.toUpperCase() + " File";
                        
                        return (
                          <tr 
                            key={item.id}
                            onDoubleClick={() => handleItemClick(item)}
                            onContextMenu={(e) => handleItemContextMenu(e, item)}
                            className="hover:bg-black/5 dark:hover:bg-white/5 cursor-default transition-colors group"
                          >
                            <td className="py-2.5 flex items-center gap-2 truncate font-medium">
                              {isFolder ? (
                                item.id === "my_computer" ? (
                                  <Monitor className="w-4 h-4 text-blue-500 shrink-0" />
                                ) : (
                                  <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10 shrink-0" />
                                )
                              ) : item.content === "app:word-processor" || item.name.endsWith(".docx") ? (
                                <PenTool className="w-4 h-4 text-blue-500 shrink-0" />
                              ) : item.content === "app:minesweeper" ? (
                                <Bomb className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : isImageFile(item.name) ? (
                                <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                              ) : item.name.endsWith(".mp3") || item.name.endsWith(".wav") ? (
                                <Music className="w-4 h-4 text-pink-500 shrink-0" />
                              ) : item.name.endsWith(".mp4") || item.name.endsWith(".webm") ? (
                                <Video className="w-4 h-4 text-red-500 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                              )}
                              <span className="truncate group-hover:text-blue-500">{item.name}</span>
                            </td>
                            <td className="py-2.5 text-zinc-500 font-mono text-[10px]">{type}</td>
                            <td className="py-2.5 text-zinc-500 font-mono text-[10px]">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-zinc-500 font-mono text-[10px] text-right pr-2">{size}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredItems.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                  <span className="text-xs italic font-medium">This folder is empty</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Context menus */}
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

// Sidebar link widget
interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, label, onClick, active }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-default text-left transition-all duration-150 border border-transparent outline-none",
        active 
          ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-cyan-400 font-bold" 
          : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

// Grid Item widget
const FolderItemGrid: React.FC<{ 
  item: FileSystemItem; 
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ item, onClick, onContextMenu }) => {
  return (
    <div 
      className="flex flex-col items-center gap-1.5 group cursor-default select-none p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5 active:bg-black/10 dark:active:bg-white/10 transition-all text-center w-[80px]"
      onDoubleClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="relative shrink-0">
        {item.type === "folder" ? (
          item.id === "my_computer" ? (
            <Monitor className="w-11 h-11 text-blue-500 dark:text-blue-400 fill-blue-500/10 group-hover:scale-105 transition-transform" />
          ) : (
            <Folder className="w-11 h-11 text-blue-500 dark:text-blue-400 fill-blue-500/10 group-hover:scale-105 transition-transform" />
          )
        ) : item.content === "app:word-processor" || item.name.endsWith(".docx") ? (
          <PenTool className="w-11 h-11 text-blue-500 group-hover:scale-105 transition-transform" />
        ) : item.content === "app:minesweeper" ? (
          <Bomb className="w-11 h-11 text-amber-500 group-hover:scale-105 transition-transform" />
        ) : isImageFile(item.name) ? (
          <ImageIcon className="w-11 h-11 text-indigo-500 group-hover:scale-105 transition-transform" />
        ) : item.name.endsWith(".pdf") ? (
          <FileText className="w-11 h-11 text-red-500 group-hover:scale-105 transition-transform" />
        ) : item.name.endsWith(".mp3") || item.name.endsWith(".wav") ? (
          <Music className="w-11 h-11 text-pink-500 group-hover:scale-105 transition-transform" />
        ) : item.name.endsWith(".mp4") || item.name.endsWith(".webm") ? (
          <Video className="w-11 h-11 text-red-500 group-hover:scale-105 transition-transform" />
        ) : (
          <FileText className="w-11 h-11 text-zinc-400 dark:text-zinc-300 group-hover:scale-105 transition-transform" />
        )}
      </div>
      <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight truncate w-full px-0.5 select-none">
        {item.name}
      </span>
    </div>
  );
};
