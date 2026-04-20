"use client";

import React, { useMemo } from "react";
import { FileText, Image as ImageIcon, FileCode, Download, ExternalLink } from "lucide-react";

interface FileViewerProps {
  name: string;
  content?: string;
}

// Simple Markdown to HTML renderer
function renderMarkdown(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-3 text-white border-b border-white/10 pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-white">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del class="opacity-50">$1</del>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-300 leading-relaxed">$1</li>')
    // Ordered lists  
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-zinc-300 leading-relaxed">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-4 border-white/10" />')
    // Em dash
    .replace(/ — /g, ' — ')
    // Line breaks
    .replace(/\n\n/g, '<div class="h-3"></div>')
    .replace(/\n/g, '<br/>');

  // Tables
  html = html.replace(/(<br\/>)?\|(.+)\|(<br\/>)\|[-| :]+\|(<br\/>)((?:\|.+\|(?:<br\/>)?)+)/g, (match) => {
    const lines = match.split(/<br\/?>/);
    const headerLine = lines.find(l => l.includes('|') && !l.includes('---'));
    const dataLines = lines.filter(l => l.includes('|') && !l.includes('---') && l !== headerLine);
    
    if (!headerLine) return match;
    
    const headers = headerLine.split('|').filter(c => c.trim());
    let table = '<table class="w-full text-sm border-collapse my-4">';
    table += '<thead><tr>';
    headers.forEach(h => {
      table += `<th class="text-left py-2 px-3 border-b border-white/20 text-white/80 font-semibold">${h.trim()}</th>`;
    });
    table += '</tr></thead><tbody>';
    
    dataLines.forEach(line => {
      if (!line.trim()) return;
      const cells = line.split('|').filter(c => c.trim());
      table += '<tr>';
      cells.forEach(c => {
        table += `<td class="py-1.5 px-3 border-b border-white/5 text-zinc-300">${c.trim()}</td>`;
      });
      table += '</tr>';
    });
    
    table += '</tbody></table>';
    return table;
  });

  return html;
}

export const FileViewer: React.FC<FileViewerProps> = ({ name, content = "" }) => {
  const extension = name.split(".").pop()?.toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "");
  const isPdf = extension === "pdf";
  const isMarkdown = extension === "md";
  const isCode = ["js", "ts", "tsx", "css", "html", "json"].includes(extension || "");

  const markdownHtml = useMemo(() => {
    if (isMarkdown && content) return renderMarkdown(content);
    return "";
  }, [isMarkdown, content]);

  const handleDownload = () => {
    if (content.startsWith("data:") || content.startsWith("/") || content.startsWith("http")) {
      const link = document.createElement("a");
      link.href = content;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Text content — create a blob
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const renderContent = () => {
    if (!content) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4">
          <FileText className="w-16 h-16 opacity-20" />
          <p>No content available for this file.</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full p-4 bg-black/60">
          <img 
            src={content} 
            alt={name} 
            className="max-w-full max-h-full object-contain shadow-2xl rounded"
          />
        </div>
      );
    }

    if (isPdf) {
      // Append #toolbar=1 to show the browser's built-in PDF toolbar
      const pdfUrl = content.startsWith("data:") ? content : `${content}#toolbar=1&navpanes=0`;
      return (
        <div className="w-full h-full bg-zinc-800 flex flex-col">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full flex-1"
          >
            {/* Fallback if the browser can't render the PDF inline */}
            <div className="flex flex-col items-center justify-center h-full gap-6 text-white/50">
              <FileText className="w-16 h-16 opacity-30" />
              <p className="text-sm">Your browser cannot display this PDF inline.</p>
              <a
                href={content}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                Open PDF in New Tab
              </a>
            </div>
          </object>
        </div>
      );
    }

    if (isMarkdown) {
      return (
        <div className="h-full overflow-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-8 py-6">
            {/* Document header bar */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-xs text-white/40 font-mono">{name}</span>
            </div>
            <div 
              className="text-zinc-300 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownHtml }}
            />
          </div>
        </div>
      );
    }

    if (isCode) {
      return (
        <div className="p-6 h-full overflow-auto bg-black/40 custom-scrollbar">
          <pre className="font-mono text-sm text-emerald-300 leading-relaxed whitespace-pre-wrap">{content}</pre>
        </div>
      );
    }

    // Default: Plain text viewer
    return (
      <div className="p-6 h-full overflow-auto bg-black/40 custom-scrollbar">
        <pre className="font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      {/* File Viewer Toolbar */}
      <div className="h-10 flex items-center px-4 gap-4 border-b border-white/5 bg-[#2d2d2d] justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {isImage ? <ImageIcon className="w-4 h-4 text-purple-400" /> : 
           isMarkdown ? <FileText className="w-4 h-4 text-blue-400" /> :
           isCode ? <FileCode className="w-4 h-4 text-amber-400" /> : 
           <FileText className="w-4 h-4 text-zinc-400" />}
          <span className="text-xs font-medium truncate opacity-80">{name}</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
          {(isPdf || content.startsWith("http")) && (
            <a 
              href={content} 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 rounded hover:bg-white/10 text-white/60 transition-colors"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};
