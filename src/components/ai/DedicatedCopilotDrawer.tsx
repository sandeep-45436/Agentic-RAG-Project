"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bot
} from "lucide-react";

interface DedicatedCopilotDrawerProps {
  role: "faculty" | "hod" | "principal" | "placement";
  title: string;
  subtitle: string;
  departmentId?: string;
  quickPrompts: { label: string; query: string }[];
}

export function DedicatedCopilotDrawer({
  role,
  title,
  subtitle,
  departmentId = "CSE",
  quickPrompts,
}: DedicatedCopilotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTrace, setShowTrace] = useState(true);
  const [copied, setCopied] = useState(false);

  const [response, setResponse] = useState<{
    summary: string;
    executionTrace: string[];
    artifacts: any[];
    isFallback?: boolean;
  } | null>(null);

  const handleExecute = async (promptQuery: string) => {
    const q = promptQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`/api/agents/dedicated/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          departmentId,
          courseId: "CSE204",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data);
      } else {
        setResponse({
          summary: `Execution failed: ${data.error || "Unknown error"}`,
          executionTrace: ["❌ Graph execution error"],
          artifacts: [],
        });
      }
    } catch (err: any) {
      setResponse({
        summary: `Network error connecting to agent: ${err.message}`,
        executionTrace: ["❌ Network unreachable"],
        artifacts: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyArtifact = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-semibold text-sm rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
      >
        <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
        <span>{title}</span>
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {title}
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        LangGraph
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Quick Prompts */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Role-Specialized Quick Workflows
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(qp.query);
                          handleExecute(qp.query);
                        }}
                        disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 text-left"
                      >
                        ⚡ {qp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Executing LangGraph Workflow...
                    </p>
                    <p className="text-xs text-slate-500">
                      ETR Tools → Deterministic Engines → Gemini 2.5 Flash
                    </p>
                  </div>
                )}

                {/* Response Display */}
                {response && (
                  <div className="space-y-4">
                    {/* Execution Trace Box */}
                    {response.executionTrace && response.executionTrace.length > 0 && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden">
                        <button
                          onClick={() => setShowTrace(!showTrace)}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200/50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Agent Execution Trace ({response.executionTrace.length} steps)
                          </span>
                          {showTrace ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {showTrace && (
                          <div className="p-3 font-mono text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                            {response.executionTrace.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400">●</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary Card */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Synthesis Summary
                        </h3>
                        {response.isFallback && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            <AlertTriangle className="h-3 w-3" /> Read-Only Fallback
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {response.summary}
                      </p>
                    </div>

                    {/* Generated Artifacts */}
                    {response.artifacts && response.artifacts.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Generated Institutional Deliverables
                        </h3>
                        {response.artifacts.map((art, idx) => {
                          const contentStr =
                            typeof art.data === "object"
                              ? JSON.stringify(art.data, null, 2)
                              : art.content || JSON.stringify(art, null, 2);

                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {art.title || art.type}
                                  </span>
                                </div>
                                <button
                                  onClick={() => copyArtifact(contentStr)}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                                >
                                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                  <span>{copied ? "Copied" : "Copy"}</span>
                                </button>
                              </div>

                              <pre className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-72">
                                {contentStr}
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecute(query);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Ask ${title}...`}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="p-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
