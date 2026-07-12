"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ContextMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
};

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;

      if (x + menuRect.width > window.innerWidth) {
        newX = x - menuRect.width;
      }
      if (y + menuRect.height > window.innerHeight) {
        newY = y - menuRect.height;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [x, y, mounted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[99999] min-w-[170px] py-1.5 rounded-xl",
        "glass-menu border border-black/10 dark:border-white/10 shadow-xl",
        "animate-in fade-in zoom-in-95 duration-100"
      )}
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            className="w-[calc(100%-8px)] mx-1 px-2.5 py-1.5 flex items-center gap-2.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all text-left cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
          >
            {item.icon && <span className="w-3.5 h-3.5 opacity-75 shrink-0">{item.icon}</span>}
            <span className="flex-1 truncate">{item.label}</span>
          </button>
          {item.divider && <div className="my-1 border-t border-black/5 dark:border-white/10 mx-1" />}
        </React.Fragment>
      ))}
    </div>,
    document.body
  );
};
