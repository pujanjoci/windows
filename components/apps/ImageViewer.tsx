"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFileSystem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Image as ImageIcon } from "lucide-react";

interface ImageViewerProps {
  fileId?: string;
  onClose?: () => void;
}

const isImageFile = (name: string): boolean => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

export const ImageViewer: React.FC<ImageViewerProps> = ({ fileId, onClose }) => {
  const { state: fsState } = useFileSystem();
  const { windows, activeWindowId } = useWindows();
  const [activeFileId, setActiveFileId] = useState(fileId);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Find the window ID of this ImageViewer instance to close it if needed
  const viewerWindow = windows.find(w => w.type === "image-viewer" && w.props?.fileId === fileId);
  const windowId = viewerWindow?.id;
  const isActive = viewerWindow && activeWindowId === viewerWindow.id;

  // Retrieve current active image item
  const currentImage = useMemo(() => {
    if (!activeFileId) return null;
    return fsState.items[activeFileId] || null;
  }, [activeFileId, fsState.items]);

  // Find all sibling images in the same directory
  const siblingImages = useMemo(() => {
    if (!currentImage) return [];
    const parentId = currentImage.parentId;
    return Object.values(fsState.items)
      .filter(item => item.parentId === parentId && item.type === "file" && isImageFile(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentImage, fsState.items]);

  // Current index in sibling array
  const currentIndex = useMemo(() => {
    if (siblingImages.length === 0 || !activeFileId) return -1;
    return siblingImages.findIndex(img => img.id === activeFileId);
  }, [siblingImages, activeFileId]);

  // Handle image updates when prop fileId changes
  useEffect(() => {
    if (fileId) {
      setActiveFileId(fileId);
      setZoom(1);
      setRotation(0);
    }
  }, [fileId]);

  const goNext = () => {
    if (siblingImages.length <= 1) return;
    const nextIdx = (currentIndex + 1) % siblingImages.length;
    setActiveFileId(siblingImages[nextIdx].id);
    setZoom(1);
    setRotation(0);
  };

  const goPrev = () => {
    if (siblingImages.length <= 1) return;
    const prevIdx = (currentIndex - 1 + siblingImages.length) % siblingImages.length;
    setActiveFileId(siblingImages[prevIdx].id);
    setZoom(1);
    setRotation(0);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentIndex, siblingImages]);

  if (!currentImage) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-white gap-4">
        <ImageIcon className="w-12 h-12 opacity-25" />
        <span className="text-sm opacity-50">No image loaded</span>
      </div>
    );
  }

  const imageUrl = currentImage.content || "";

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-white select-none relative group/viewer">
      {/* Top Header */}
      <div className="h-10 flex items-center px-4 bg-zinc-900 border-b border-white/5 justify-between text-xs font-medium z-10">
        <div className="truncate pr-4 opacity-80">
          {currentImage.name}
        </div>
        {siblingImages.length > 1 && (
          <div className="opacity-60 font-mono text-[11px]">
            {currentIndex + 1} / {siblingImages.length}
          </div>
        )}
      </div>

      {/* Main Image Container */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-black/60 p-4">
        
        {/* Left Arrow */}
        {siblingImages.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all opacity-0 group-hover/viewer:opacity-100 border border-white/10 z-20 cursor-default focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Image Canvas */}
        <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
          <img
            src={imageUrl}
            alt={currentImage.name}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl rounded-sm"
          />
        </div>

        {/* Right Arrow */}
        {siblingImages.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all opacity-0 group-hover/viewer:opacity-100 border border-white/10 z-20 cursor-default focus:outline-none"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-12 bg-zinc-900 border-t border-white/5 flex items-center justify-center gap-6 z-10">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-default"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="text-[11px] font-mono opacity-50 w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(z => Math.min(3, z + 0.25))}
          className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-default"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-default"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
