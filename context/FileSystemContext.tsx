"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from "react";

export type FileSystemItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  content?: string;
  createdAt: number;
  position?: { x: number; y: number };
};

type FileSystemState = {
  version: number;
  items: Record<string, FileSystemItem>;
  rootId: string;
};

type FileSystemAction =
  | { type: "CREATE_ITEM"; payload: Omit<FileSystemItem, "id" | "createdAt"> }
  | { type: "RENAME_ITEM"; payload: { id: string; newName: string } }
  | { type: "DELETE_ITEM"; payload: { id: string } }
  | { type: "MOVE_ITEM"; payload: { id: string; newParentId: string | null } }
  | { type: "UPDATE_ITEM_POSITION"; payload: { id: string; x: number; y: number } }
  | { type: "RESET_ITEM_POSITION"; payload: { id: string } }
  | { type: "RESET_ALL_POSITIONS"; payload: { parentId: string } };

// Bump this when initial structure changes to force a reset of stale caches
const CURRENT_VERSION = 9;

const PROJECT_DOC = `# Website Redesign Project

## Overview
A comprehensive redesign of the company website to improve user experience,
modernize the visual identity, and boost conversion rates.

## Timeline
| Phase | Duration | Status |
|-------|----------|--------|
| Discovery & Research | 2 weeks | ✅ Complete |
| Wireframes & UX | 3 weeks | ✅ Complete |
| Visual Design | 2 weeks | 🔄 In Progress |
| Frontend Development | 4 weeks | ⏳ Upcoming |
| Backend Integration | 3 weeks | ⏳ Upcoming |
| QA & Launch | 2 weeks | ⏳ Upcoming |

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Database:** PostgreSQL + Prisma
- **Hosting:** Vercel

## Key Features
1. Dark mode support with system preference detection
2. Responsive design (mobile-first approach)
3. Glassmorphism UI components
4. Real-time collaboration tools
5. SEO-optimized content structure

## Team
- **Lead Designer:** Jane Smith
- **Frontend Dev:** John Doe
- **Backend Dev:** Alice Johnson
- **PM:** Bob Williams

## Notes
- Design system tokens finalized in Figma
- Component library shared across all projects
- Weekly standup every Monday at 10 AM
`;

const APP_IDEAS_DOC = `# App Ideas Backlog

## 🔥 High Priority
1. **AI Code Assistant** — VS Code extension with context-aware suggestions
2. **Web OS Simulation** — Browser-based desktop environment (this project!)
3. **Task Manager Pro** — Kanban + Calendar hybrid with AI prioritization

## 💡 Exploration
4. Recipe social network with meal planning
5. Personal finance dashboard with bank sync
6. Habit tracker with streak gamification

## 🗂️ Archived
- Chat app (market saturated)
- Note-taking app (too competitive)
`;

const initialState: FileSystemState = {
  version: CURRENT_VERSION,
  items: {
    root: { id: "root", name: "C:", type: "folder", parentId: null, createdAt: Date.now() },
    users: { id: "users", name: "Users", type: "folder", parentId: "root", createdAt: Date.now() },
    guest: { id: "guest", name: "Guest", type: "folder", parentId: "users", createdAt: Date.now() },
    desktop: { id: "desktop", name: "Desktop", type: "folder", parentId: "guest", createdAt: Date.now() },
    
    // Gallery
    gallery: { id: "gallery", name: "Gallery", type: "folder", parentId: "desktop", createdAt: Date.now() },
    wallpapers: { id: "wallpapers", name: "Wallpapers", type: "folder", parentId: "gallery", createdAt: Date.now() },
    wp_default: { id: "wp_default", name: "Desktop Wallpaper.jpg", type: "file", parentId: "wallpapers", content: "/wallpaper.jpg", createdAt: Date.now() },
    
    // Projects
    projects: { id: "projects", name: "Projects", type: "folder", parentId: "desktop", createdAt: Date.now() },
    web_redesign: { id: "web_redesign", name: "Website Redesign", type: "folder", parentId: "projects", createdAt: Date.now() },
    project_doc: { id: "project_doc", name: "Project Brief.md", type: "file", parentId: "web_redesign", content: PROJECT_DOC, createdAt: Date.now() },
    app_ideas: { id: "app_ideas", name: "App Ideas.md", type: "file", parentId: "projects", content: APP_IDEAS_DOC, createdAt: Date.now() },
    
    // Documents
    documents: { id: "documents", name: "Documents", type: "folder", parentId: "desktop", createdAt: Date.now() },
    resume: { id: "resume", name: "Resume.pdf", type: "file", parentId: "documents", content: "/resume.pdf", createdAt: Date.now() },
    
    // Shortcuts
    internet_lnk: { id: "internet_lnk", name: "The Internet.lnk", type: "file", parentId: "desktop", content: "app:browser", createdAt: Date.now() },
  },
  rootId: "root",
};

// Lazy initializer: runs once, synchronously, before first render
function loadInitialState(): FileSystemState {
  if (typeof window === "undefined") return initialState;
  
  try {
    const saved = localStorage.getItem("web_os_fs_v5");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only use saved state if version matches
      if (parsed && parsed.version === CURRENT_VERSION && parsed.items && Object.keys(parsed.items).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load FS state", e);
  }
  
  // Clear stale data and return fresh state
  localStorage.removeItem("web_os_fs_v5");
  return initialState;
}

const fileSystemReducer = (state: FileSystemState, action: FileSystemAction): FileSystemState => {
  switch (action.type) {
    case "CREATE_ITEM": {
      const id = Math.random().toString(36).substring(2, 9);
      const newItem: FileSystemItem = {
        ...action.payload,
        id,
        createdAt: Date.now(),
      };
      return {
        ...state,
        items: { ...state.items, [id]: newItem },
      };
    }
    case "RENAME_ITEM":
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: {
            ...state.items[action.payload.id],
            name: action.payload.newName,
          },
        },
      };
    case "DELETE_ITEM": {
      const newItems = { ...state.items };
      const deleteRecursive = (id: string) => {
        Object.values(newItems).forEach(item => {
          if (item.parentId === id) {
            deleteRecursive(item.id);
          }
        });
        delete newItems[id];
      };
      deleteRecursive(action.payload.id);
      return { ...state, items: newItems };
    }
    case "MOVE_ITEM":
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: {
            ...state.items[action.payload.id],
            parentId: action.payload.newParentId,
          },
        },
      };
    case "UPDATE_ITEM_POSITION":
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: {
            ...state.items[action.payload.id],
            position: { x: action.payload.x, y: action.payload.y },
          },
        },
      };
    case "RESET_ITEM_POSITION": {
      const newItem = { ...state.items[action.payload.id] };
      delete newItem.position;
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: newItem,
        },
      };
    }
    case "RESET_ALL_POSITIONS": {
      const newItems = { ...state.items };
      Object.keys(newItems).forEach(id => {
        if (newItems[id].parentId === action.payload.parentId) {
          const updatedItem = { ...newItems[id] };
          delete updatedItem.position;
          newItems[id] = updatedItem;
        }
      });
      return { ...state, items: newItems };
    }
    default:
      return state;
  }
};

const FileSystemContext = createContext<{
  state: FileSystemState;
  dispatch: React.Dispatch<FileSystemAction>;
  getItemPath: (id: string) => string;
  getItemIdByPath: (path: string) => string | null;
  getChildren: (parentId: string | null) => FileSystemItem[];
} | null>(null);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy init: loads from localStorage synchronously before first render — no race condition
  const [state, dispatch] = useReducer(fileSystemReducer, undefined, loadInitialState);
  const isFirstRender = useRef(true);

  // Save to localStorage on every state change EXCEPT the initial load
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem("web_os_fs_v5", JSON.stringify(state));
  }, [state]);

  const getItemPath = useCallback((id: string): string => {
    const buildPath = (itemId: string): string => {
      const item = state.items[itemId];
      if (!item) return "";
      if (item.parentId === null) return item.name;
      return buildPath(item.parentId) + "\\" + item.name;
    };
    return buildPath(id);
  }, [state.items]);

  const getChildren = useCallback((parentId: string | null): FileSystemItem[] => {
    return Object.values(state.items).filter(item => item.parentId === parentId);
  }, [state.items]);

  const getItemIdByPath = useCallback((path: string): string | null => {
    if (path === "C:") return "root";
    if (path.startsWith("C:\\")) {
      const parts = path.split("\\").slice(1);
      let currentId: string | null = "root";
      
      for (const part of parts) {
        const children = Object.values(state.items).filter(item => item.parentId === currentId);
        const next = children.find(c => c.name.toLowerCase() === part.toLowerCase());
        if (!next) return null;
        currentId = next.id;
      }
      return currentId;
    }
    return null;
  }, [state.items]);

  return (
    <FileSystemContext.Provider value={{ state, dispatch, getItemPath, getItemIdByPath, getChildren }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) throw new Error("useFileSystem must be used within a FileSystemProvider");
  return context;
};
