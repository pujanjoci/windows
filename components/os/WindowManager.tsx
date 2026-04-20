"use client";

import React from "react";
import { useWindows } from "@/context/WindowContext";
import { Window } from "./Window";
import { FolderWindow } from "@/components/apps/FolderWindow";
import { TerminalWindow } from "@/components/apps/TerminalWindow";
import { FileViewer } from "@/components/apps/FileViewer";
import { BrowserWindow } from "@/components/apps/BrowserWindow";
import { ProjectsWindow } from "@/components/apps/ProjectsWindow";
import { ContactWindow } from "@/components/apps/ContactWindow";
import { Terminal, Folder, Monitor, FileText, Image as ImageIcon, Globe, GitBranch, Mail } from "lucide-react";

export const WindowManager: React.FC = () => {
  const { windows } = useWindows();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full">
        {windows.map((w) => (
          <Window 
            key={w.id} 
            {...w}
            icon={getWindowIcon(w.type, w.title)}
          >
            {renderWindowContent(w)}
          </Window>
        ))}
      </div>
    </div>
  );
};

function getWindowIcon(type: string, title: string) {
  const ext = title.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");

  switch (type) {
    case "terminal":
      return <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case "folder":
      return <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case "generic":
      return isImage ? <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" /> : <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
    case "browser":
      return <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case "projects":
      return <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" /> ;
    case "contact":
      return <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Monitor className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />;
  }
}

function renderWindowContent(window: any) {
  switch (window.type) {
    case "folder":
      return <FolderWindow initialPathId={window.props?.path} />;
    case "terminal":
      return <TerminalWindow />;
    case "generic":
      return <FileViewer name={window.title} content={window.props?.content} />;
    case "browser":
      return <BrowserWindow />;
    case "projects":
      return <ProjectsWindow />;
    case "contact":
      return <ContactWindow />;
    default:
      return (
        <div className="p-8 text-white/50 text-center flex flex-col items-center justify-center h-full">
          <Monitor className="w-12 h-12 mb-4 opacity-20" />
          <p>Application content not implemented.</p>
        </div>
      );
  }
}
