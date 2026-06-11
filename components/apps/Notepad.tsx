"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFileSystem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { Save, File, Trash2, X } from "lucide-react";

interface NotepadProps {
  fileId?: string;
  initialContent?: string;
  onClose?: () => void;
}

export const Notepad: React.FC<NotepadProps> = ({ fileId, initialContent = "", onClose }) => {
  const { state: fsState, dispatch } = useFileSystem();
  const { closeWindow, windows } = useWindows();
  
  const [text, setText] = useState(initialContent);
  const [isSaved, setIsSaved] = useState(true);
  const textRef = useRef(text);
  textRef.current = text;

  // Find the window ID of this Notepad instance to close it if needed
  const notepadWindow = windows.find(w => w.type === "notepad" && w.props?.fileId === fileId);
  const windowId = notepadWindow?.id;

  // Load content if fileId changes or if file content changes in filesystem
  useEffect(() => {
    if (fileId && fsState.items[fileId]) {
      const currentContent = fsState.items[fileId].content || "";
      setText(currentContent);
      setIsSaved(true);
    } else {
      setText(initialContent);
      setIsSaved(true);
    }
  }, [fileId, fsState, initialContent]);

  // Debounced auto-save
  useEffect(() => {
    if (!fileId) return;

    const timer = setTimeout(() => {
      if (text !== (fsState.items[fileId]?.content || "")) {
        handleSave();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [text, fileId, fsState]);

  const handleSave = () => {
    if (fileId) {
      dispatch({
        type: "UPDATE_ITEM_CONTENT",
        payload: { id: fileId, content: text },
      });
      setIsSaved(true);
    }
  };

  // Keyboard shortcut listener for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, fileId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsSaved(false);
  };

  const handleNew = () => {
    if (confirm("Create a new empty file? Unsaved changes will be lost.")) {
      setText("");
      setIsSaved(true);
    }
  };

  const handleClear = () => {
    if (confirm("Clear all text?")) {
      setText("");
      setIsSaved(false);
    }
  };

  const handleExit = () => {
    if (windowId) {
      closeWindow(windowId);
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] text-black dark:text-zinc-200 font-sans">
      {/* Menu Bar */}
      <div className="h-6 flex items-center px-2 border-b border-black/5 dark:border-white/5 bg-[#f0f0f0] dark:bg-[#252526] text-xs select-none">
        <div className="flex gap-4">
          <MenuDropdown label="File">
            <MenuAction label="New" onClick={handleNew} icon={<File className="w-3.5 h-3.5" />} />
            <MenuAction label="Save (Ctrl+S)" onClick={handleSave} disabled={isSaved || !fileId} icon={<Save className="w-3.5 h-3.5" />} />
            <div className="border-t border-black/5 dark:border-white/5 my-1" />
            <MenuAction label="Exit" onClick={handleExit} icon={<X className="w-3.5 h-3.5" />} />
          </MenuDropdown>
          
          <MenuDropdown label="Edit">
            <MenuAction label="Clear All" onClick={handleClear} icon={<Trash2 className="w-3.5 h-3.5" />} />
          </MenuDropdown>
        </div>
        <div className="ml-auto px-2 opacity-50 text-[10px]">
          {isSaved ? "Saved" : "Unsaved changes"}
        </div>
      </div>

      {/* Editor Area */}
      <textarea
        value={text}
        onChange={handleChange}
        className="flex-1 p-4 resize-none outline-none font-mono text-sm bg-transparent leading-relaxed custom-scrollbar border-none focus:ring-0 focus:outline-none w-full h-full text-black dark:text-zinc-100"
        placeholder="Start typing..."
        spellCheck="false"
      />

      {/* Status Bar */}
      <div className="h-5 flex items-center px-4 bg-[#f0f0f0] dark:bg-[#252526] border-t border-black/5 dark:border-white/5 text-[10px] text-zinc-500 select-none">
        <span>Ln {text.split("\n").length}, Col {text.length}</span>
        <span className="ml-auto uppercase">{fileId ? "UTF-8" : "No File (Draft)"}</span>
      </div>
    </div>
  );
};

// Dropdown Helper Components
const MenuDropdown: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-0.5 rounded cursor-default hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 ${
          isOpen ? "bg-black/10 dark:bg-white/10" : ""
        }`}
      >
        {label}
      </button>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="absolute left-0 mt-0.5 min-w-[150px] bg-white dark:bg-[#252526] border border-black/10 dark:border-white/10 rounded shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {children}
        </div>
      )}
    </div>
  );
};

const MenuAction: React.FC<{ label: string; onClick: () => void; disabled?: boolean; icon?: React.ReactNode }> = ({
  label,
  onClick,
  disabled = false,
  icon,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs cursor-default hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent text-black dark:text-zinc-200 transition-colors"
    >
      {icon && <span className="opacity-70">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  );
};
