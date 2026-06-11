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
        "fixed z-[99999] min-w-[160px] py-1 rounded-lg glass-dark border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
      )}
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            className="w-full px-3 py-1.5 flex items-center gap-3 text-sm text-white/90 hover:bg-white/10 transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </button>
          {item.divider && <div className="my-1 border-t border-white/10" />}
        </React.Fragment>
      ))}
    </div>,
    document.body
  );
};
