"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFileSystem } from "@/context/FileSystemContext";
import { useWindows } from "@/context/WindowContext";
import { 
  FileText, Save, Download, FilePlus, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  Link2, Image as ImageIcon, Table, Minimize2, ZoomIn, ZoomOut, RotateCcw,
  Sparkles, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WordProcessorProps {
  fileId?: string;
  initialContent?: string;
  onClose: () => void;
}

export const WordProcessor: React.FC<WordProcessorProps> = ({ fileId, initialContent = "", onClose }) => {
  const { state: fsState, dispatch } = useFileSystem();
  const { openWindow } = useWindows();
  const [docContent, setDocContent] = useState(initialContent);
  const [fileName, setFileName] = useState("Untitled Document.docx");
  const [currentTab, setCurrentTab] = useState<"home" | "insert" | "layout">("home");
  
  // Format states
  const [fontSize, setFontSize] = useState("14px");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("transparent");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoom, setZoom] = useState(100); // percentage
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("saved");

  const editorRef = useRef<HTMLDivElement>(null);

  // Sync loaded file metadata
  useEffect(() => {
    if (fileId && fsState.items[fileId]) {
      setFileName(fsState.items[fileId].name);
      setDocContent(fsState.items[fileId].content || "");
      if (editorRef.current) {
        editorRef.current.innerHTML = fsState.items[fileId].content || "";
      }
    }
  }, [fileId, fsState]);

  // Track counts on input
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const cleanText = text.trim();
    
    setWordCount(cleanText ? cleanText.split(/\s+/).length : 0);
    setCharCount(text.length);
    setSaveStatus("unsaved");
  };

  // Run initial count on mount
  useEffect(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      const cleanText = text.trim();
      setWordCount(cleanText ? cleanText.split(/\s+/).length : 0);
      setCharCount(text.length);
    }
  }, [docContent]);

  // Execute formatting command
  const execCmd = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
    handleEditorInput();
    editorRef.current?.focus();
  };

  // Insert Table Helper
  const insertTable = () => {
    const rows = prompt("Enter number of rows:", "3");
    const cols = prompt("Enter number of columns:", "3");
    if (!rows || !cols) return;

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: sans-serif; font-size: 14px;">`;
    tableHtml += `<thead><tr style="background-color: #f3f4f6;">`;
    for (let c = 0; c < parseInt(cols, 10); c++) {
      tableHtml += `<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Header ${c+1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < parseInt(rows, 10); r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < parseInt(cols, 10); c++) {
        tableHtml += `<td style="border: 1px solid #d1d5db; padding: 8px;">Cell</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p></p>`;

    execCmd("insertHTML", tableHtml);
  };

  // Insert Link Helper
  const insertLink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://google.com):", "https://");
    if (url && url.trim()) {
      execCmd("createLink", url.trim());
    }
  };

  // Insert Image Helper
  const insertImage = () => {
    const url = prompt("Enter image URL:", "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500");
    if (url && url.trim()) {
      execCmd("insertImage", url.trim());
    }
  };

  // Save Document to VFS
  const handleSave = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;

    setSaveStatus("saving");
    
    setTimeout(() => {
      if (fileId && fsState.items[fileId]) {
        // Save existing document content
        dispatch({
          type: "UPDATE_ITEM_CONTENT",
          payload: { id: fileId, content: html }
        });
        setSaveStatus("saved");
      } else {
        // Create new document on desktop
        const defaultName = prompt("Enter document name:", fileName);
        if (!defaultName) {
          setSaveStatus("unsaved");
          return;
        }

        const nameWithExt = defaultName.endsWith(".docx") ? defaultName : `${defaultName}.docx`;
        dispatch({
          type: "CREATE_ITEM",
          payload: {
            name: nameWithExt,
            type: "file",
            parentId: "documents", // save in documents folder
            content: html
          }
        });
        setFileName(nameWithExt);
        setSaveStatus("saved");
      }
    }, 600);
  };

  // Export HTML File to local computer
  const handleExport = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const formattedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fileName.replace(".docx", "")}</title>
  <style>
    body { font-family: sans-serif; padding: 40px; background-color: #ffffff; color: #000000; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table, th, td { border: 1px solid #d1d5db; padding: 8px; }
    th { background-color: #f3f4f6; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

    const blob = new Blob([formattedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.replace(".docx", "") + ".html";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Setup Hotkeys (Ctrl + S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fileId, fileName]);

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] dark:bg-[#0f1115] text-zinc-800 dark:text-zinc-200 select-none">
      
      {/* MS Word Ribbon Header */}
      <div className="bg-[#fcfcfd] dark:bg-[#161a22] border-b border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
        
        {/* Document Title / Actions Bar */}
        <div className="flex items-center px-4 py-2 border-b border-zinc-200/50 dark:border-zinc-800/50 gap-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#2b579a] flex items-center justify-center text-white shrink-0 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <input 
                type="text"
                value={fileName}
                onChange={(e) => {
                  setFileName(e.target.value);
                  setSaveStatus("unsaved");
                }}
                className="bg-transparent border-none font-bold text-xs outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 px-1 py-0.5 rounded max-w-[180px] sm:max-w-xs text-zinc-900 dark:text-white"
                placeholder="Document Name"
              />
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1.5 px-1 mt-0.5">
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-0.5 text-emerald-500 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Saved to VFS
                  </span>
                )}
                {saveStatus === "saving" && <span className="animate-pulse">Saving...</span>}
                {saveStatus === "unsaved" && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <AlertCircle className="w-3 h-3" /> Unsaved Changes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick file operations */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === "saved"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b579a] hover:bg-[#204377] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors cursor-default"
              title="Save changes (Ctrl + S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-default"
              title="Export HTML document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export HTML</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Ribbon Bar */}
        <div className="flex items-center px-4 gap-1 bg-zinc-50 dark:bg-[#12151c]">
          {(["home", "insert", "layout"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={cn(
                "px-4 py-2 text-xs font-semibold tracking-wide border-b-2 transition-all capitalize cursor-default",
                currentTab === tab 
                  ? "border-[#2b579a] text-[#2b579a] dark:text-blue-400 font-bold"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Formatting Command Ribbon Container */}
        <div className="p-2 px-4 bg-zinc-50 dark:bg-[#12151c] border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-wrap gap-2.5 items-center min-h-[50px]">
          {currentTab === "home" && (
            <>
              {/* Font Family selector */}
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  execCmd("fontName", e.target.value);
                }}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs rounded px-1.5 py-1 outline-none text-current"
              >
                <option value="sans-serif">Sans-Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="cursive">Cursive</option>
              </select>

              {/* Font Size selector */}
              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  // Approximate HTML size (1-7) mapping for document.execCommand
                  const sizeMap: Record<string, string> = {
                    "12px": "2", "14px": "3", "16px": "4", "18px": "5", "20px": "6", "24px": "7"
                  };
                  execCmd("fontSize", sizeMap[e.target.value] || "3");
                }}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs rounded px-1.5 py-1 outline-none text-current"
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>

              <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800" />

              {/* Bold, Italic, Underline */}
              <div className="flex rounded border border-zinc-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800 gap-[2px]">
                <button onClick={() => execCmd("bold")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("italic")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("underline")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("strikeThrough")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Strike Through"><Strikethrough className="w-3.5 h-3.5" /></button>
              </div>

              {/* Alignment */}
              <div className="flex rounded border border-zinc-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800 gap-[2px]">
                <button onClick={() => execCmd("justifyLeft")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("justifyCenter")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("justifyRight")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("justifyFull")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
              </div>

              {/* Lists */}
              <div className="flex rounded border border-zinc-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800 gap-[2px]">
                <button onClick={() => execCmd("insertUnorderedList")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd("insertOrderedList")} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
              </div>

              {/* Text color pickers */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold opacity-40">Color:</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    execCmd("foreColor", e.target.value);
                  }}
                  className="w-5 h-5 rounded border border-zinc-300 cursor-pointer"
                  title="Text Color"
                />
                <select
                  value={highlightColor}
                  onChange={(e) => {
                    setHighlightColor(e.target.value);
                    execCmd("hiliteColor", e.target.value);
                  }}
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] rounded px-1 py-0.5 outline-none text-current"
                  title="Highlight Color"
                >
                  <option value="transparent">None</option>
                  <option value="#ffff00">Yellow</option>
                  <option value="#00ffff">Cyan</option>
                  <option value="#00ff00">Green</option>
                  <option value="#ff00ff">Magenta</option>
                </select>
              </div>
            </>
          )}

          {currentTab === "insert" && (
            <>
              <button
                onClick={insertTable}
                className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold rounded shadow-sm text-zinc-700 dark:text-zinc-300 cursor-default"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={insertLink}
                className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold rounded shadow-sm text-zinc-700 dark:text-zinc-300 cursor-default"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link</span>
              </button>
              <button
                onClick={insertImage}
                className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold rounded shadow-sm text-zinc-700 dark:text-zinc-300 cursor-default"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image</span>
              </button>
              <button
                onClick={() => execCmd("insertHorizontalRule")}
                className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold rounded shadow-sm text-zinc-700 dark:text-zinc-300 cursor-default"
              >
                <Minimize2 className="w-3.5 h-3.5 rotate-90" />
                <span>Divider</span>
              </button>
            </>
          )}

          {currentTab === "layout" && (
            <>
              {/* Preset headings */}
              <button
                onClick={() => execCmd("formatBlock", "H1")}
                className="px-2.5 py-1 text-xs font-extrabold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-sm cursor-default hover:bg-zinc-50"
              >
                Heading 1
              </button>
              <button
                onClick={() => execCmd("formatBlock", "H2")}
                className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-sm cursor-default hover:bg-zinc-50"
              >
                Heading 2
              </button>
              <button
                onClick={() => execCmd("formatBlock", "P")}
                className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-sm cursor-default hover:bg-zinc-50"
              >
                Normal Paragraph
              </button>
            </>
          )}
        </div>
      </div>

      {/* Centered Document Page Sheet Workspace */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#f0f0f4] dark:bg-[#0c0d10] relative">
        <div 
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          className="transition-transform duration-100 origin-top flex flex-col shrink-0"
        >
          {/* A4 sheet page box */}
          <div 
            ref={editorRef}
            contentEditable={true}
            onInput={handleEditorInput}
            className="w-[794px] min-h-[1123px] bg-white text-black p-[96px] shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.05)] border border-zinc-200/50 outline-none select-text prose prose-zinc max-w-none prose-sm cursor-text"
            style={{ fontFamily: fontFamily, fontSize: fontSize }}
            dangerouslySetInnerHTML={{ __html: docContent }}
          />
        </div>
      </div>

      {/* Document Editor Status Bar */}
      <div className="h-6 shrink-0 bg-white dark:bg-[#161a22] border-t border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>Words: <strong className="text-zinc-600 dark:text-zinc-300">{wordCount}</strong></span>
          <span>Chars: <strong className="text-zinc-600 dark:text-zinc-300">{charCount}</strong></span>
        </div>

        {/* Zoom adjustment controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-default"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span>{zoom}%</span>
          <button 
            onClick={() => setZoom(z => Math.min(150, z + 10))}
            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-default"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button 
            onClick={() => setZoom(100)}
            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-default ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
