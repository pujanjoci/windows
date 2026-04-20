"use client";

import React, { useState } from "react";
import { Mail, Send, User, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

export const ContactWindow: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("https://formspree.io/f/xwpvdyey", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white p-8 animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
        <p className="text-black/60 dark:text-white/60 text-center text-sm mb-6 max-w-[250px]">
          Thanks for reaching out. I'll get back to you as soon as possible.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="px-6 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg text-sm transition-colors border border-black/5 dark:border-white/5"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white transition-colors duration-300">
      {/* Sidebar Info */}
      <div className="hidden sm:flex flex-col w-[200px] border-r border-black/5 dark:border-white/5 bg-black/5 dark:bg-[#252526] p-6">
        <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
        <h2 className="text-lg font-bold mb-2 leading-tight">Get in Touch</h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-6 leading-relaxed">
          Fill out the form to send me a direct message straight to my inbox via Formspree.
        </p>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-w-md mx-auto">
          {status === "error" && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Oops! There was a problem sending your message. Please try again.
              </p>
            </div>
          )}

          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-medium text-black/70 dark:text-white/70 ml-1">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full bg-black/5 dark:bg-[#2d2d2d] border border-black/10 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-medium text-black/70 dark:text-white/70 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full bg-black/5 dark:bg-[#2d2d2d] border border-black/10 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

            <div className="space-y-1 flex-1 flex flex-col min-h-[150px]">
              <label htmlFor="message" className="text-xs font-medium text-black/70 dark:text-white/70 ml-1">
                Message
              </label>
              <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-black/40 dark:text-white/40" />
                <textarea
                  id="message"
                  name="message"
                  required
                  className="w-full h-full min-h-[120px] bg-black/5 dark:bg-[#2d2d2d] border border-black/10 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                  placeholder="How can I help you?"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {status === "submitting" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
