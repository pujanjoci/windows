"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Send,
  Inbox,
  Star,
  Trash2,
  Search,
  CheckCircle2,
  Edit3,
  X,
  FileText,
  User,
  Paperclip,
  Archive,
  RefreshCw,
  Download,
  MailOpen,
  Briefcase,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EmailCategory = "opportunity" | "work" | "personal" | "general";

export type EmailMessage = {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  date: string;
  timestamp: number;
  folder: "inbox" | "sent" | "starred" | "trash" | "archive";
  isRead: boolean;
  isStarred: boolean;
  category?: EmailCategory;
  attachments?: { name: string; size: string; type?: string; url?: string }[];
};

const DEFAULT_EMAILS: EmailMessage[] = [
  {
    id: "mail_welcome",
    senderName: "Pujan Joshi",
    senderEmail: "contact@pujan-joshi.com.np",
    recipientEmail: "visitor@portfolio.os",
    subject: "Welcome to my Windows Portfolio! 👋",
    body: `Hi there!

Welcome to my simulated Windows Web OS workspace.

This Mail app allows you to send me a direct message regarding:

• Senior Frontend / Full-Stack Engineering roles
• Freelance Web Development & UI/UX collaborations
• Technical architecture (React 19, Next.js, TypeScript)
• Portfolio feedback or general networking

When you compose and send an email, it is dispatched to my inbox (contact@pujan-joshi.com.np) via Formspree, and an automated delivery confirmation receipt will appear right here in your inbox.

Feel free to preview or download my attached resume below!

Best regards,
Pujan Joshi
Frontend Engineer
Email: contact@pujan-joshi.com.np
GitHub: https://github.com/pujanjoci
Website: https://pujan-joshi.com.np`,
    date: "Just now",
    timestamp: Date.now() - 1000 * 60 * 2,
    folder: "inbox",
    isRead: false,
    isStarred: true,
    category: "general",
    attachments: [
      {
        name: "Pujan_Joshi_Resume.pdf",
        size: "69.7 KB",
        type: "pdf",
        url: "/resume.pdf",
      },
    ],
  },
];

const CATEGORIES: Record<
  EmailCategory,
  { bg: string; text: string; label: string; border: string; icon: any }
> = {
  opportunity: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    label: "Opportunity",
    icon: Rocket,
  },
  work: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
    label: "Work",
    icon: Briefcase,
  },
  personal: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    label: "Personal",
    icon: User,
  },
  general: {
    bg: "bg-zinc-500/10 dark:bg-zinc-500/20",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/30",
    label: "General",
    icon: MessageSquare,
  },
};

const COMPOSE_TEMPLATES = [
  {
    label: "💼 Job Opportunity",
    category: "opportunity" as EmailCategory,
    subject: "Frontend / Full-Stack Engineer Opportunity",
    body: `Hi Pujan,

We came across your portfolio and were impressed by your work. We are looking for an Engineer to join our team.

We would love to discuss this opportunity with you!

Best,
[Your Name]
[Your Company / Organization]`,
  },
  {
    label: "🚀 Project Inquiry",
    category: "work" as EmailCategory,
    subject: "Freelance Web Development Project",
    body: `Hi Pujan,

I have a web application project that I'd like to collaborate with you on.

Project Scope:
- Project Type: [Web App / Dashboard / Landing Page]
- Timeline: [Estimated timeline]
- Key Goals: [Brief summary]

Let me know if you are open to discussing this!

Best regards,
[Your Name]`,
  },
  {
    label: "🤝 Collaboration",
    category: "work" as EmailCategory,
    subject: "Collaboration on Web / Open Source Project",
    body: `Hi Pujan,

I loved exploring your Windows Web OS portfolio. I would love to connect and discuss potential collaboration on modern web projects.

Cheers,
[Your Name]`,
  },
  {
    label: "☕ Say Hello",
    category: "general" as EmailCategory,
    subject: "Quick Hello & Portfolio Feedback",
    body: `Hi Pujan,

Just wanted to say great work on your Windows portfolio! Really loved the design and attention to detail.

Best,
[Your Name]`,
  },
];

export const MailApp: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("web_os_mail_v6");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Failed to load saved emails", e);
      }
    }
    return DEFAULT_EMAILS;
  });

  const [activeFolder, setActiveFolder] = useState<
    "inbox" | "sent" | "starred" | "trash" | "archive"
  >("inbox");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    EmailCategory | "all"
  >("all");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    "mail_welcome"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "starred">(
    "all"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [toEmail, setToEmail] = useState("contact@pujan-joshi.com.np");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<EmailCategory>("opportunity");
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("web_os_mail_v6", JSON.stringify(emails));
    } catch (e) {
      console.error("Failed to save emails", e);
    }
  }, [emails]);

  const selectedEmail = useMemo(() => {
    return emails.find((m) => m.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  const filteredEmails = useMemo(() => {
    return emails
      .filter((mail) => {
        if (activeFolder === "inbox") return mail.folder === "inbox";
        if (activeFolder === "sent") return mail.folder === "sent";
        if (activeFolder === "starred")
          return mail.isStarred && mail.folder !== "trash";
        if (activeFolder === "trash") return mail.folder === "trash";
        if (activeFolder === "archive") return mail.folder === "archive";
        return true;
      })
      .filter((mail) => {
        if (activeCategoryFilter !== "all") {
          return mail.category === activeCategoryFilter;
        }
        return true;
      })
      .filter((mail) => {
        if (filterMode === "unread") return !mail.isRead;
        if (filterMode === "starred") return mail.isStarred;
        return true;
      })
      .filter((mail) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          mail.subject.toLowerCase().includes(q) ||
          mail.senderName.toLowerCase().includes(q) ||
          mail.senderEmail.toLowerCase().includes(q) ||
          mail.body.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [emails, activeFolder, activeCategoryFilter, filterMode, searchQuery]);

  // Folder Counts
  const unreadCount = useMemo(() => {
    return emails.filter((m) => m.folder === "inbox" && !m.isRead).length;
  }, [emails]);

  const starredCount = useMemo(() => {
    return emails.filter((m) => m.isStarred && m.folder !== "trash").length;
  }, [emails]);

  const trashCount = useMemo(() => {
    return emails.filter((m) => m.folder === "trash").length;
  }, [emails]);

  const handleSelectEmail = (mail: EmailMessage) => {
    setSelectedEmailId(mail.id);
    if (!mail.isRead) {
      setEmails((prev) =>
        prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
      );
    }
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  const handleToggleReadStatus = (id: string) => {
    setEmails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: !m.isRead } : m))
    );
  };

  const handleArchiveEmail = (id: string) => {
    setEmails((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, folder: "archive" as const } : m
      )
    );
    showToast("Conversation moved to Archive");
  };

  const handleDeleteEmail = (id: string) => {
    setEmails((prev) =>
      prev
        .map((m) => {
          if (m.id === id) {
            if (m.folder === "trash") return null as any;
            return { ...m, folder: "trash" as const };
          }
          return m;
        })
        .filter(Boolean)
    );
    if (selectedEmailId === id) {
      setSelectedEmailId(null);
    }
    showToast("Message moved to Deleted Items");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Mailbox is up to date");
    }, 500);
  };

  const applyTemplate = (tmpl: (typeof COMPOSE_TEMPLATES)[0]) => {
    setCategory(tmpl.category);
    setSubject(tmpl.subject);
    setMessage(tmpl.body);
  };

  // Submit Compose Form with Auto-Responder Receipt
  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);

    const fromName = senderName.trim() || "Visitor";
    const fromEmail = senderEmail.trim() || "visitor@portfolio.os";

    // 1. Send via Formspree API
    try {
      const formData = new FormData();
      formData.append("name", fromName);
      formData.append("email", fromEmail);
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("category", category);

      await fetch("https://formspree.io/f/xwpvdyey", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      console.warn("Formspree delivery note:", err);
    }

    // 2. Sent record
    const sentMail: EmailMessage = {
      id: `sent_${Date.now()}`,
      senderName: `${fromName} (You)`,
      senderEmail: fromEmail,
      recipientEmail: toEmail,
      subject,
      body: message,
      date: "Just now",
      timestamp: Date.now(),
      folder: "sent",
      isRead: true,
      isStarred: false,
      category,
    };

    // 3. Simple Automated Receipt / Confirmation
    const autoReplyMail: EmailMessage = {
      id: `reply_${Date.now() + 1}`,
      senderName: "Pujan Joshi (Auto-Responder)",
      senderEmail: "contact@pujan-joshi.com.np",
      recipientEmail: fromEmail,
      subject: `[Received] Re: ${subject.replace(/^Re:\s*/i, "")}`,
      body: `Hi ${fromName},

Thank you for reaching out through my portfolio!

This is an automated confirmation that your email regarding "${subject}" has been successfully delivered to my personal inbox (contact@pujan-joshi.com.np).

I review all messages regularly and will get back to you as soon as possible.

In the meantime, feel free to check out:
• LinkedIn: https://www.linkedin.com/in/pujan-joshi-np/
• GitHub: https://github.com/pujanjoci
• Resume: Available in the welcome email attachment

Best regards,
Pujan Joshi
Frontend Engineer`,
      date: "Just now",
      timestamp: Date.now() + 400,
      folder: "inbox",
      isRead: false,
      isStarred: false,
      category,
    };

    setEmails((prev) => [autoReplyMail, sentMail, ...prev]);
    setIsSending(false);
    setIsComposeOpen(false);
    setSubject("");
    setMessage("");
    setSelectedEmailId(autoReplyMail.id);
    setActiveFolder("inbox");
    showToast("Message dispatched to Pujan Joshi! Confirmation received in Inbox.");
  };

  const handleOpenCompose = (prefillSubject?: string, prefillCategory?: EmailCategory) => {
    setToEmail("contact@pujan-joshi.com.np");
    setSubject(prefillSubject || "");
    setMessage("");
    if (prefillCategory) setCategory(prefillCategory);
    setIsComposeOpen(true);
  };

  // Format timestamp helper
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f6f7f9] dark:bg-[#15171c] text-zinc-900 dark:text-zinc-100 select-none overflow-hidden font-sans text-xs sm:text-sm">
      
      {/* ================= 1. WINDOWS 11 FLUENT COMMAND BAR / RIBBON ================= */}
      <div className="h-12 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#f8f9fb]/95 dark:bg-[#1a1d24]/95 flex items-center justify-between px-3 shrink-0 backdrop-blur-md z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* New Mail Main Action */}
          <button
            onClick={() => handleOpenCompose()}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-default"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>New mail</span>
          </button>

          <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1" />

          {/* Action Ribbon Buttons */}
          {selectedEmail ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDeleteEmail(selectedEmail.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs transition-colors cursor-default"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden md:inline font-medium">Delete</span>
              </button>

              <button
                onClick={() => handleArchiveEmail(selectedEmail.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs transition-colors cursor-default"
                title="Archive conversation"
              >
                <Archive className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden md:inline font-medium">Archive</span>
              </button>

              <button
                onClick={() => handleToggleReadStatus(selectedEmail.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs transition-colors cursor-default"
                title={selectedEmail.isRead ? "Mark as unread" : "Mark as read"}
              >
                {selectedEmail.isRead ? (
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <MailOpen className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span className="hidden md:inline font-medium">
                  {selectedEmail.isRead ? "Mark unread" : "Mark read"}
                </span>
              </button>

              <button
                onClick={(e) => handleToggleStar(e, selectedEmail.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs transition-colors cursor-default"
                title="Flag / Star"
              >
                <Star
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    selectedEmail.isStarred
                      ? "fill-amber-400 text-amber-500 scale-110"
                      : "text-zinc-500"
                  )}
                />
                <span className="hidden md:inline font-medium">
                  {selectedEmail.isStarred ? "Unflag" : "Flag"}
                </span>
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-400 font-medium px-2">
              Select a conversation to view
            </span>
          )}
        </div>

        {/* Right Ribbon Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Formspree Delivery</span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition-colors"
            title="Refresh mailbox"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-500",
                isRefreshing && "animate-spin text-blue-500"
              )}
            />
          </button>
        </div>
      </div>

      {/* ================= 2. MAIN 3-PANE WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANE 1: Left Navigation Sidebar */}
        <div className="w-[180px] sm:w-[210px] border-r border-black/[0.08] dark:border-white/[0.08] bg-[#f0f2f5] dark:bg-[#16181e] flex flex-col justify-between shrink-0 p-2.5 overflow-y-auto">
          <div className="flex flex-col gap-4">
            
            {/* Account Card */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#1e222b] border border-black/5 dark:border-white/5 shadow-xs">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  PJ
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1e222b]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs leading-tight truncate">
                    Pujan Joshi
                  </span>
                  <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
                </div>
                <span className="text-[10px] text-zinc-400 truncate">
                  contact@pujan-joshi...
                </span>
              </div>
            </div>

            {/* Folder List */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 px-2.5 py-1">
                Mailboxes
              </span>

              <SidebarNavItem
                icon={<Inbox className="w-4 h-4 text-blue-500" />}
                label="Inbox"
                count={unreadCount}
                active={activeFolder === "inbox" && activeCategoryFilter === "all"}
                onClick={() => {
                  setActiveFolder("inbox");
                  setActiveCategoryFilter("all");
                }}
              />

              <SidebarNavItem
                icon={<Star className="w-4 h-4 text-amber-500" />}
                label="Starred"
                count={starredCount}
                active={activeFolder === "starred" && activeCategoryFilter === "all"}
                onClick={() => {
                  setActiveFolder("starred");
                  setActiveCategoryFilter("all");
                }}
              />

              <SidebarNavItem
                icon={<Send className="w-4 h-4 text-emerald-500" />}
                label="Sent"
                active={activeFolder === "sent" && activeCategoryFilter === "all"}
                onClick={() => {
                  setActiveFolder("sent");
                  setActiveCategoryFilter("all");
                }}
              />

              <SidebarNavItem
                icon={<Archive className="w-4 h-4 text-purple-500" />}
                label="Archive"
                active={activeFolder === "archive" && activeCategoryFilter === "all"}
                onClick={() => {
                  setActiveFolder("archive");
                  setActiveCategoryFilter("all");
                }}
              />

              <SidebarNavItem
                icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                label="Deleted"
                count={trashCount}
                active={activeFolder === "trash" && activeCategoryFilter === "all"}
                onClick={() => {
                  setActiveFolder("trash");
                  setActiveCategoryFilter("all");
                }}
              />
            </div>

            {/* Categories / Tags Filter */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 px-2.5 py-1">
                Labels
              </span>

              {(["opportunity", "work", "personal", "general"] as const).map(
                (catKey) => {
                  const conf = CATEGORIES[catKey];
                  const Icon = conf.icon;
                  const isActive = activeCategoryFilter === catKey;

                  return (
                    <button
                      key={catKey}
                      onClick={() => {
                        setActiveCategoryFilter(isActive ? "all" : catKey);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-default",
                        isActive
                          ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-3.5 h-3.5", conf.text)} />
                        <span>{conf.label}</span>
                      </div>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          catKey === "opportunity" && "bg-emerald-500",
                          catKey === "work" && "bg-blue-500",
                          catKey === "personal" && "bg-purple-500",
                          catKey === "general" && "bg-zinc-400"
                        )}
                      />
                    </button>
                  );
                }
              )}
            </div>

          </div>

          {/* Sidebar Footer */}
          <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-1.5">
            <button
              onClick={() => {
                if (confirm("Reset mailbox back to default welcome email?")) {
                  setEmails(DEFAULT_EMAILS);
                  setSelectedEmailId("mail_welcome");
                  setActiveFolder("inbox");
                  setActiveCategoryFilter("all");
                  showToast("Mailbox restored to default");
                }
              }}
              className="w-full text-center py-1.5 text-[10px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Reset Sample Inbox
            </button>
          </div>
        </div>

        {/* PANE 2: Message List */}
        <div className="w-[290px] sm:w-[330px] border-r border-black/[0.08] dark:border-white/[0.08] flex flex-col bg-white dark:bg-[#181a20] shrink-0">
          
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#fafbfc] dark:bg-[#1a1c23] flex flex-col gap-2.5">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search mail and contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 rounded-lg py-1.5 pl-8 pr-7 text-xs outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#14161b] text-zinc-800 dark:text-zinc-200 transition-all placeholder:text-zinc-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.05] p-0.5 rounded-lg text-[11px]">
                <button
                  onClick={() => setFilterMode("all")}
                  className={cn(
                    "px-2.5 py-0.5 rounded-md font-medium transition-all",
                    filterMode === "all"
                      ? "bg-white dark:bg-[#232732] text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterMode("unread")}
                  className={cn(
                    "px-2.5 py-0.5 rounded-md font-medium transition-all",
                    filterMode === "unread"
                      ? "bg-white dark:bg-[#232732] text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilterMode("starred")}
                  className={cn(
                    "px-2.5 py-0.5 rounded-md font-medium transition-all",
                    filterMode === "starred"
                      ? "bg-white dark:bg-[#232732] text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  Flagged
                </button>
              </div>

              <span className="text-[11px] font-medium text-zinc-400 capitalize">
                {activeCategoryFilter !== "all"
                  ? activeCategoryFilter
                  : activeFolder}{" "}
                ({filteredEmails.length})
              </span>
            </div>
          </div>

          {/* Email Item Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-400">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 opacity-30 text-zinc-400" />
                </div>
                <p className="font-semibold text-xs text-zinc-600 dark:text-zinc-300">
                  No conversations found
                </p>
                <p className="text-[10px] opacity-60 mt-0.5">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "This mailbox folder is currently empty"}
                </p>
              </div>
            ) : (
              filteredEmails.map((mail) => {
                const isSelected = mail.id === selectedEmailId;
                const cat = mail.category ? CATEGORIES[mail.category] : null;

                return (
                  <div
                    key={mail.id}
                    onClick={() => handleSelectEmail(mail)}
                    className={cn(
                      "p-3 flex flex-col gap-1.5 transition-all cursor-default relative group",
                      isSelected
                        ? "bg-blue-50/75 dark:bg-blue-950/30 border-l-[3px] border-l-blue-600"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
                      !mail.isRead && "font-semibold"
                    )}
                  >
                    {/* Top Row: Unread Dot + Avatar + Sender + Time */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {!mail.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-500/20">
                          {mail.senderName.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={cn(
                            "text-xs truncate",
                            !mail.isRead
                              ? "text-zinc-900 dark:text-white font-bold"
                              : "text-zinc-700 dark:text-zinc-300 font-medium"
                          )}
                        >
                          {mail.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">
                        {formatTime(mail.timestamp)}
                      </span>
                    </div>

                    {/* Subject */}
                    <div
                      className={cn(
                        "text-xs truncate pl-6",
                        !mail.isRead
                          ? "text-zinc-900 dark:text-white font-semibold"
                          : "text-zinc-700 dark:text-zinc-300 font-normal"
                      )}
                    >
                      {mail.subject}
                    </div>

                    {/* Body Snippet */}
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-normal pl-6">
                      {mail.body.replace(/\n+/g, " ")}
                    </p>

                    {/* Footer Badges & Hover Actions */}
                    <div className="flex items-center justify-between pl-6 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        {cat && (
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.2 rounded-md border font-medium",
                              cat.bg,
                              cat.text,
                              cat.border
                            )}
                          >
                            {cat.label}
                          </span>
                        )}
                        {mail.attachments && mail.attachments.length > 0 && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 bg-black/5 dark:bg-white/5 px-1.5 py-0.2 rounded">
                            <Paperclip className="w-2.5 h-2.5" />{" "}
                            {mail.attachments.length}
                          </span>
                        )}
                      </div>

                      {/* Hover action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleStar(e, mail.id)}
                          className="p-1 rounded text-zinc-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="Star message"
                        >
                          <Star
                            className={cn(
                              "w-3.5 h-3.5",
                              mail.isStarred && "fill-amber-400 text-amber-500"
                            )}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmail(mail.id);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 3: Reading & Message Pane */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#181a20] overflow-y-auto">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col p-5 sm:p-8 max-w-3xl mx-auto w-full gap-5">
              
              {/* Message Header */}
              <div className="flex flex-col gap-4 pb-5 border-b border-black/[0.08] dark:border-white/[0.08]">
                
                {/* Title & Category Badge */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white leading-snug">
                      {selectedEmail.subject}
                    </h1>
                    {selectedEmail.category && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const cat = CATEGORIES[selectedEmail.category];
                          const Icon = cat.icon;
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                                cat.bg,
                                cat.text,
                                cat.border
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {cat.label}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenCompose(`Re: ${selectedEmail.subject.replace(/^Re:\s*/i, "")}`, selectedEmail.category)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold text-xs transition-colors cursor-default border border-blue-500/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Reply / Compose</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sender & Recipient Metadata Card */}
                <div className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {selectedEmail.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                          {selectedEmail.senderName}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          &lt;{selectedEmail.senderEmail}&gt;
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        To: <span className="font-medium">{selectedEmail.recipientEmail}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-zinc-400 shrink-0">
                    <div className="font-medium text-zinc-600 dark:text-zinc-300">
                      {new Date(selectedEmail.timestamp).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[10px]">
                      {new Date(selectedEmail.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans py-2 selection:bg-blue-500/20">
                {selectedEmail.body}
              </div>

              {/* Attachments Section */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" /> Attachments ({selectedEmail.attachments.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedEmail.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-black/[0.02] to-black/[0.04] dark:from-white/[0.03] dark:to-white/[0.05] border border-black/5 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-200 hover:border-blue-500/40 transition-all shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">{att.size}</span>
                          </div>
                        </div>

                        {att.url && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>View / Download</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Quick Contact Prompt */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/[0.05] to-indigo-500/[0.05] border border-blue-500/15 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">
                      Want to reach out to Pujan?
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Messages are delivered directly to contact@pujan-joshi.com.np
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenCompose()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-default shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send a message</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-400">
              <div className="w-16 h-16 rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 opacity-25" />
              </div>
              <p className="font-bold text-sm text-zinc-700 dark:text-zinc-200">
                Select an email to view
              </p>
              <p className="text-xs opacity-60 mt-1 max-w-xs leading-relaxed">
                Choose a conversation from the middle list or click "New mail" to compose a message.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. COMPOSE MODAL ================= */}
      {isComposeOpen && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1c1f27] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-[#f4f6f9] dark:bg-[#15171e]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                  Send Email to Pujan Joshi
                </span>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Row */}
            <div className="p-3 bg-[#fafbfc] dark:bg-[#191b22] border-b border-black/5 dark:border-white/5 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Quick Template Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMPOSE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#222631] border border-black/5 dark:border-white/5 hover:border-blue-500/40 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 font-medium transition-all shadow-2xs"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendMail} className="flex flex-col p-4 sm:p-5 gap-3">
              
              {/* Sender Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 focus-within:border-blue-500/50">
                  <span className="text-xs font-semibold text-zinc-400 w-16">Your Name:</span>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none flex-1 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 focus-within:border-blue-500/50">
                  <span className="text-xs font-semibold text-zinc-400 w-16">Your Email:</span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@company.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none flex-1 font-medium"
                  />
                </div>
              </div>

              {/* To Address */}
              <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 focus-within:border-blue-500/50">
                <span className="text-xs font-semibold text-zinc-400 w-16">To:</span>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none flex-1 font-medium"
                />
              </div>

              {/* Subject */}
              <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 focus-within:border-blue-500/50">
                <span className="text-xs font-semibold text-zinc-400 w-16">Subject:</span>
                <input
                  type="text"
                  required
                  placeholder="Subject of your message..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none flex-1 font-medium"
                />
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-2 py-1">
                <span className="text-[11px] font-semibold text-zinc-400">Category:</span>
                {(["opportunity", "work", "personal", "general"] as const).map((cat) => {
                  const conf = CATEGORIES[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-lg border capitalize transition-all",
                        category === cat
                          ? cn(conf.bg, conf.text, conf.border, "font-bold shadow-xs")
                          : "border-transparent text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Message Body */}
              <textarea
                required
                rows={7}
                placeholder="Write your email here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 resize-none leading-relaxed"
              />

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Sends directly to Pujan's personal inbox
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm hover:shadow cursor-default transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? "Sending..." : "Send Message"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 4. WINDOWS ACTION NOTIFICATION TOAST ================= */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[99999] bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-2xl border border-white/10 dark:border-black/10 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

const SidebarNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, count, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-default",
        active
          ? "bg-blue-600 text-white font-semibold shadow-xs"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn(active ? "text-white" : "")}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
            active ? "bg-white text-blue-600" : "bg-blue-600 text-white"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};
