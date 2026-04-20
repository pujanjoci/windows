"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFileSystem } from "@/context/FileSystemContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type HistoryItem = {
  type: "command" | "output";
  content: string;
};

export const TerminalWindow: React.FC = () => {
  const { state, dispatch, getItemPath, getItemIdByPath, getChildren } = useFileSystem();
  const [currentPathId, setCurrentPathId] = useState("desktop");
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: "output", content: "Desktop Profile [Version 1.0.0]" },
    { type: "output", content: "(c) Microsoft Corporation. All rights reserved." },
    { type: "output", content: "" },
  ]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const isMobile = useIsMobile();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = getItemPath(currentPathId) + ">";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmdStr: string) => {
    const trimmedCmd = cmdStr.trim();
    if (!trimmedCmd) return;

    setHistory(prev => [...prev, { type: "command", content: prompt + cmdStr }]);
    setCmdHistory(prev => [cmdStr, ...prev]);
    setHistoryIdx(-1);

    const parts = trimmedCmd.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        setHistory(prev => [...prev, { type: "output", content: `
Available commands:
  help      - Show this help message
  ls        - List directory contents
  pwd       - Print current directory
  cd <dir>  - Change directory
  mkdir <n> - Create a directory
  touch <n> - Create a file
  rm <n>    - Remove a file or directory
  clear     - Clear the screen
` }]);
        break;

      case "clear":
        setHistory([]);
        break;

      case "pwd":
        setHistory(prev => [...prev, { type: "output", content: getItemPath(currentPathId) }]);
        break;

      case "ls":
        const children = getChildren(currentPathId);
        if (children.length === 0) break;
        const list = children.map(c => 
          c.type === "folder" ? `<DIR>          ${c.name}` : `               ${c.name}`
        ).join("\n");
        setHistory(prev => [...prev, { type: "output", content: list }]);
        break;

      case "cd":
        if (!args[0]) break;
        if (args[0] === "..") {
          const item = state.items[currentPathId];
          if (item?.parentId) setCurrentPathId(item.parentId);
          break;
        }
        
        const pathStr = getItemPath(currentPathId) + "\\" + args[0];
        const targetId = getItemIdByPath(pathStr);
        if (targetId && state.items[targetId].type === "folder") {
          setCurrentPathId(targetId);
        } else {
          setHistory(prev => [...prev, { type: "output", content: "The system cannot find the path specified." }]);
        }
        break;

      case "mkdir":
        if (!args[0]) break;
        dispatch({
          type: "CREATE_ITEM",
          payload: { name: args[0], type: "folder", parentId: currentPathId }
        });
        break;

      case "touch":
        if (!args[0]) break;
        dispatch({
          type: "CREATE_ITEM",
          payload: { name: args[0], type: "file", parentId: currentPathId, content: "" }
        });
        break;

      case "rm":
        if (!args[0]) break;
        const toDelete = getChildren(currentPathId).find(c => c.name.toLowerCase() === args[0].toLowerCase());
        if (toDelete) {
          dispatch({ type: "DELETE_ITEM", payload: { id: toDelete.id } });
        } else {
          setHistory(prev => [...prev, { type: "output", content: "Could not find file or directory." }]);
        }
        break;

      default:
        setHistory(prev => [...prev, { type: "output", content: `'${cmd}' is not recognized as an internal or external command, operable program or batch file.` }]);
    }

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(inputValue);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < cmdHistory.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      } else {
        setHistoryIdx(-1);
        setInputValue("");
      }
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-black text-[#cccccc] font-mono overflow-hidden p-2",
        isMobile ? "text-[10px]" : "text-sm"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar whitespace-pre-wrap mb-1 transition-all">
        {history.map((item, i) => (
          <div key={i} className={item.type === "command" ? "text-white" : ""}>
            {item.content}
          </div>
        ))}
        
        {/* Current Prompt */}
        <div className="flex items-start">
          <span className="shrink-0 text-white mr-1">{prompt}</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-[#cccccc] caret-transparent"
          />
          <div className="terminal-cursor" />
        </div>
      </div>
    </div>
  );
};
