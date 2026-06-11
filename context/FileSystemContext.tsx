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
  | { type: "UPDATE_ITEM_CONTENT"; payload: { id: string; content: string } }
  | { type: "UPDATE_ITEM_POSITION"; payload: { id: string; x: number; y: number } }
  | { type: "RESET_ITEM_POSITION"; payload: { id: string } }
  | { type: "RESET_ALL_POSITIONS"; payload: { parentId: string } };

// Bump this to force a reset of stale local storage caches
const CURRENT_VERSION = 16;

const ABOUT_ME_TXT = `Hi! I'm Pujan Joshi, a passionate React and TypeScript Frontend Engineer.
I specialize in building rich, interactive, and high-performance web applications with stunning user interfaces and smooth user experiences.

Main Tech Stack:
- Frontend: React, Next.js, TypeScript, JavaScript
- Styling: Tailwind CSS, CSS Custom Properties
- State & Animation: Zustand, React Context, Framer Motion
- Database & Backend: PostgreSQL, Prisma, Node.js

I enjoy turning complex requirements into beautiful, accessible, and performant code.
Feel free to browse around my simulated Web OS to explore my projects, photos, and contact information!`;

const CONTACT_TXT = `You can connect with me through the following channels:

- Email: contact@pujan-joshi.com.np
- GitHub: https://github.com/pujanjoci
- LinkedIn: https://www.linkedin.com/in/pujan-joshi-np/
- Website: https://pujan-joshi.com.np

Feel free to visit my live website in the browser in my projects or in the desktop!`;

const WINDOWS_OS_CLONE_MD = `# Windows OS Clone Simulation
A high-fidelity Windows-inspired operating system simulation built inside a web browser.

## Tech Stack
- React 19
- Next.js 16 (App Router)
- TypeScript
- Framer Motion
- Tailwind CSS v4

## Features
- Drag, resize, and edge snap windows (left/right)
- Custom Notepad, Calculator, and Image Viewer applications
- Themes support: Windows 11, Windows XP, and Dark
- Persisted desktop state (localStorage)
- Boot screen animation and login screen
- Clock date calendar and notification center tray`;

const PORTFOLIO_V2_MD = `# Personal Portfolio Website v2
My personal web portfolio showing my developer journey, skills, and projects.

## Tech Stack
- Astro
- React (Islands Architecture)
- Tailwind CSS
- Three.js (3D Interactive Hero)

## Features
- Ultra-fast page load times (Zero JS by default)
- Interactive 3D graphics in the background
- Clean, responsive design for all screen sizes
- Integrates blog posts written in Markdown`;

const ECOMMERCE_APP_MD = `# Full-Stack E-Commerce Application
A modern, production-ready e-commerce platform with stripe checkout and admin portal.

## Tech Stack
- Next.js
- Tailwind CSS
- Prisma + PostgreSQL
- Stripe API
- Zustand

## Features
- Real-time cart management and checkout
- Admin panel for managing products, categories, and orders
- Responsive product grids and search filtering
- User authentication and order history tracking`;

const initialState: FileSystemState = {
  version: CURRENT_VERSION,
  items: {
    root: { id: "root", name: "C:", type: "folder", parentId: null, createdAt: Date.now() },
    users: { id: "users", name: "Users", type: "folder", parentId: "root", createdAt: Date.now() },
    guest: { id: "guest", name: "Guest", type: "folder", parentId: "users", createdAt: Date.now() },
    desktop: { id: "desktop", name: "Desktop", type: "folder", parentId: "guest", createdAt: Date.now() },
    
    // My Computer folder on desktop
    my_computer: { id: "my_computer", name: "My Computer", type: "folder", parentId: "desktop", createdAt: Date.now() },
    c_drive: { id: "c_drive", name: "Local Drive (C:)", type: "folder", parentId: "my_computer", createdAt: Date.now() },
    user_folder: { id: "user_folder", name: "User", type: "folder", parentId: "c_drive", createdAt: Date.now() },
    about_me_c: { id: "about_me_c", name: "About Me.txt", type: "file", parentId: "c_drive", content: ABOUT_ME_TXT, createdAt: Date.now() },
    downloads: { id: "downloads", name: "Downloads", type: "folder", parentId: "user_folder", createdAt: Date.now() },
    
    // Documents inside User folder
    documents: { id: "documents", name: "Documents", type: "folder", parentId: "user_folder", createdAt: Date.now() },
    
    // Files on desktop
    contact: { id: "contact", name: "Contact.txt", type: "file", parentId: "desktop", content: CONTACT_TXT, createdAt: Date.now() },
    resume: { id: "resume", name: "Resume.pdf", type: "file", parentId: "desktop", content: "/resume.pdf", createdAt: Date.now() },
    
    // Projects folder inside desktop
    projects: { id: "projects", name: "Projects", type: "folder", parentId: "desktop", createdAt: Date.now() },
    win_os_clone_dir: { id: "win_os_clone_dir", name: "windows-os-clone", type: "folder", parentId: "projects", createdAt: Date.now() },
    win_os_clone_readme: { id: "win_os_clone_readme", name: "README.md", type: "file", parentId: "win_os_clone_dir", content: WINDOWS_OS_CLONE_MD, createdAt: Date.now() },
    
    portfolio_v2_dir: { id: "portfolio_v2_dir", name: "portfolio-v2", type: "folder", parentId: "projects", createdAt: Date.now() },
    portfolio_v2_readme: { id: "portfolio_v2_readme", name: "README.md", type: "file", parentId: "portfolio_v2_dir", content: PORTFOLIO_V2_MD, createdAt: Date.now() },
    
    ecommerce_app_dir: { id: "ecommerce_app_dir", name: "ecommerce-app", type: "folder", parentId: "projects", createdAt: Date.now() },
    ecommerce_app_readme: { id: "ecommerce_app_readme", name: "README.md", type: "file", parentId: "ecommerce_app_dir", content: ECOMMERCE_APP_MD, createdAt: Date.now() },

    // Photos folder inside desktop
    photos: { id: "photos", name: "Photos", type: "folder", parentId: "desktop", createdAt: Date.now() },
    photo_1: { id: "photo_1", name: "profile-1.jpg", type: "file", parentId: "photos", content: "/profile-1.jpg", createdAt: Date.now() },
    photo_2: { id: "photo_2", name: "profile-2.jpg", type: "file", parentId: "photos", content: "/profile-2.jpg", createdAt: Date.now() },
    photo_3: { id: "photo_3", name: "profile-3.jpg", type: "file", parentId: "photos", content: "/profile-3.jpg", createdAt: Date.now() },
    photo_4: { id: "photo_4", name: "profile-4.jpg", type: "file", parentId: "photos", content: "/profile-4.jpg", createdAt: Date.now() },
    photo_5: { id: "photo_5", name: "profile-5.jpg", type: "file", parentId: "photos", content: "/profile-5.jpg", createdAt: Date.now() },
    photo_6: { id: "photo_6", name: "profile-6.jpg", type: "file", parentId: "photos", content: "/profile-6.jpg", createdAt: Date.now() },
    photo_7: { id: "photo_7", name: "profile-7.jpg", type: "file", parentId: "photos", content: "/profile-7.jpg", createdAt: Date.now() },
    photo_8: { id: "photo_8", name: "profile-8.jpg", type: "file", parentId: "photos", content: "/profile-8.jpg", createdAt: Date.now() },
    photo_9: { id: "photo_9", name: "profile-9.jpg", type: "file", parentId: "photos", content: "/profile-9.jpg", createdAt: Date.now() },

    // Shortcuts and templates in Documents / Downloads
    readme_downloads: { id: "readme_downloads", name: "Welcome.txt", type: "file", parentId: "downloads", content: "Welcome to Downloads! You can drag files here.", createdAt: Date.now() },
    doc_notes: { id: "doc_notes", name: "Ideas.txt", type: "file", parentId: "documents", content: "Write down portfolio project ideas here.", createdAt: Date.now() },

    internet_lnk: { id: "internet_lnk", name: "Browser", type: "file", parentId: "desktop", content: "app:browser", createdAt: Date.now() },
    typing_game_lnk: { id: "typing_game_lnk", name: "Typing Game", type: "file", parentId: "desktop", content: "app:typing-game", createdAt: Date.now() },
  },
  rootId: "root",
};

function loadInitialState(): FileSystemState {
  if (typeof window === "undefined") return initialState;
  
  const storageKey = `web_os_fs_v${CURRENT_VERSION}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.version === CURRENT_VERSION && parsed.items && Object.keys(parsed.items).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load FS state", e);
  }
  
  localStorage.removeItem(storageKey);
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
    case "UPDATE_ITEM_CONTENT":
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: {
            ...state.items[action.payload.id],
            content: action.payload.content,
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
  const [state, dispatch] = useReducer(fileSystemReducer, undefined, loadInitialState);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(`web_os_fs_v${CURRENT_VERSION}`, JSON.stringify(state));
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
