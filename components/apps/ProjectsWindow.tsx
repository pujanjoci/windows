"use client";

import React, { useState, useEffect } from "react";
import { useWindows } from "@/context/WindowContext";
import {
  Star,
  GitFork,
  ExternalLink,
  GitBranch,
  Code2,
  Clock,
  AlertCircle,
  RefreshCcw,
  Loader2,
  Globe,
  Scale,
  ChevronLeft,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type Repo = {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  url: string;
  homepage: string | null;
  updated: string;
  created: string;
  topics: string[];
  isForked: boolean;
  defaultBranch: string;
  size: number;
  openIssues: number;
  license: string | null;
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

export const ProjectsWindow: React.FC = () => {
  const { openWindow } = useWindows();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [filter, setFilter] = useState<"all" | "original" | "forked">("all");
  const [sortBy, setSortBy] = useState<"updated" | "stars" | "name">("updated");
  const isMobile = useIsMobile();

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/github");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRepos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const filteredRepos = repos
    .filter((r) => {
      if (filter === "original") return !r.isForked;
      if (filter === "forked") return r.isForked;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return b.stars - a.stars;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#0d1117] text-black dark:text-white gap-4 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-black/50 dark:text-white/50">Fetching repositories from GitHub...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#0d1117] text-black dark:text-white gap-4 transition-colors duration-300">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        <p className="text-sm text-black/60 dark:text-white/60">{error}</p>
        <button
          onClick={fetchRepos}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-[#0d1117] text-black dark:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Main Content */}
      <div className={cn(
        "flex flex-col min-w-0 transition-all duration-300",
        isMobile ? "w-full" : "flex-1"
      )}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/5 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-black/80 dark:text-white/80" />
            <h2 className="font-semibold text-sm">pujanjoci</h2>
            <span className="text-[11px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-black/50 dark:text-white/50">
              {repos.length} repos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRepos}
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80 transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 flex items-center gap-4 text-xs bg-black/[0.02] dark:bg-transparent">
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
            {(["all", "original", "forked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  filter === f
                    ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    : "text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-black/70 dark:text-white/70 outline-none text-xs cursor-pointer"
          >
            <option value="updated">Recently Updated</option>
            <option value="stars">Most Stars</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Repo List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => setSelectedRepo(repo)}
              className={`px-4 py-3 border-b border-black/5 dark:border-white/5 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/[0.03] group ${
                selectedRepo?.id === repo.id ? "bg-blue-600/5 dark:bg-blue-500/5 border-l-2 border-l-blue-600 dark:border-l-blue-400" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Code2 className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                    <span className="font-medium text-sm text-blue-600 dark:text-blue-400 truncate hover:underline">
                      {repo.name}
                    </span>
                    {repo.isForked && (
                      <span className="text-[9px] bg-black/10 dark:bg-white/5 px-1.5 py-0.5 rounded text-black/30 dark:text-white/30">
                        fork
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-black/50 dark:text-white/40 line-clamp-1 mb-1.5 pl-6">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-black/40 dark:text-white/30 pl-6">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              LANGUAGE_COLORS[repo.language] || "#8b949e",
                          }}
                        />
                        {repo.language}
                      </span>
                    )}
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3" /> {repo.stars}
                      </span>
                    )}
                    {repo.forks > 0 && (
                      <span className="flex items-center gap-0.5">
                        <GitFork className="w-3 h-3" /> {repo.forks}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {formatDate(repo.updated)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Topics */}
              {repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pl-6">
                  {repo.topics.slice(0, 5).map((topic) => (
                    <span
                      key={topic}
                      className="text-[10px] bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredRepos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <Code2 className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No repositories found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRepo && (
        <div className={cn(
          "border-l border-black/5 dark:border-white/5 bg-[#f6f8fa] dark:bg-[#161b22] flex flex-col transition-all duration-300 z-10",
          isMobile 
            ? "fixed inset-0 w-full h-full translate-x-0" 
            : "w-[280px] shrink-0"
        )}>
          {isMobile && (
            <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center bg-black/5 dark:bg-black/20">
              <button 
                onClick={() => setSelectedRepo(null)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to list
              </button>
            </div>
          )}
          <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
            {/* Repo Name */}
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm truncate text-black dark:text-white">{selectedRepo.name}</h3>
            </div>

            {/* Description */}
            {selectedRepo.description && (
              <p className="text-xs text-black/60 dark:text-white/50 mb-4 leading-relaxed">
                {selectedRepo.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mb-4">
              <a
                href={selectedRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-xs transition-colors border border-black/10 dark:border-white/10 text-black dark:text-white"
              >
                <GitBranch className="w-3.5 h-3.5" />
                View on GitHub
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </a>
              {selectedRepo.homepage && (
                <a
                  href={selectedRepo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs transition-colors border border-blue-600/20 dark:border-blue-500/20"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Live Demo
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2.5 text-center">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                <span className="text-sm font-bold text-black dark:text-white">{selectedRepo.stars}</span>
                <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">Stars</p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2.5 text-center">
                <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <span className="text-sm font-bold text-black dark:text-white">{selectedRepo.forks}</span>
                <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">Forks</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5 text-xs">
              {selectedRepo.language && (
                <div className="flex items-center justify-between">
                  <span className="text-black/40 dark:text-white/30">Language</span>
                  <span className="flex items-center gap-1.5 text-black dark:text-white">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          LANGUAGE_COLORS[selectedRepo.language] || "#8b949e",
                      }}
                    />
                    {selectedRepo.language}
                  </span>
                </div>
              )}
              {selectedRepo.license && (
                <div className="flex items-center justify-between">
                  <span className="text-black/40 dark:text-white/30">License</span>
                  <span className="flex items-center gap-1 text-black dark:text-white">
                    <Scale className="w-3 h-3" />
                    {selectedRepo.license}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-black/40 dark:text-white/30">Size</span>
                <span className="text-black dark:text-white">{formatSize(selectedRepo.size)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/40 dark:text-white/30">Branch</span>
                <span className="font-mono text-[11px] text-black dark:text-white">{selectedRepo.defaultBranch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/40 dark:text-white/30">Issues</span>
                <span className="text-black dark:text-white">{selectedRepo.openIssues}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/40 dark:text-white/30">Updated</span>
                <span className="text-black dark:text-white">{formatDate(selectedRepo.updated)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/40 dark:text-white/30">Created</span>
                <span className="text-black dark:text-white">{formatDate(selectedRepo.created)}</span>
              </div>
            </div>

            {/* Topics */}
            {selectedRepo.topics.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wider text-black/30 dark:text-white/20 mb-2 font-semibold">
                  Topics
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedRepo.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-[10px] bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
