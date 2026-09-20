"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Bot,
  User,
  Sliders,
  Play,
  RotateCcw,
  GraduationCap,
  Scale,
  Landmark,
  Briefcase,
  TrendingUp,
  Award,
  Download,
  Terminal,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface QuickPrompt {
  label: string;
  query: string;
  category?: string;
}

interface DedicatedCopilotDrawerProps {
  role: "faculty" | "hod" | "principal" | "placement";
  title: string;
  subtitle: string;
  departmentId?: string;
  quickPrompts: QuickPrompt[];
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  trace?: string[];
  artifacts?: any[];
  isFallback?: boolean;
}

export function DedicatedCopilotDrawer({
  role,
  title,
  subtitle,
  departmentId = "CSE",
  quickPrompts,
}: DedicatedCopilotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "simulator" | "artifacts">("chat");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  // Close drawer on Escape key (Desktop/Laptop UX)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Conversational Multi-Turn Message History
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Role Theme Details
  const roleThemes = {
    faculty: {
      badge: "bg-purple-100 text-purple-700 border-purple-300",
      buttonBg: "from-purple-600 via-indigo-600 to-blue-600",
      accent: "text-purple-600",
      icon: GraduationCap,
      welcomeTitle: "Faculty Academic Copilot",
      welcomeDesc: "Generate Bloom's-taxonomy quizzes, evaluate at-risk students (<75% attendance), and draft remedial roadmaps.",
    },
    hod: {
      badge: "bg-blue-100 text-blue-700 border-blue-300",
      buttonBg: "from-blue-600 via-cyan-600 to-indigo-600",
      accent: "text-blue-600",
      icon: Scale,
      welcomeTitle: "HOD Governance Copilot",
      welcomeDesc: "Run deterministic NBA CO-PO attainment matrix dot products and audit faculty teaching workloads.",
    },
    principal: {
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      buttonBg: "from-amber-600 via-orange-600 to-indigo-700",
      accent: "text-amber-600",
      icon: Landmark,
      welcomeTitle: "Executive Intelligence Copilot",
      welcomeDesc: "Audit university-wide benchmarks across all 9 departments and draft official AICTE/UGC circulars.",
    },
    placement: {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      buttonBg: "from-emerald-600 via-teal-600 to-cyan-700",
      accent: "text-emerald-600",
      icon: Briefcase,
      welcomeTitle: "Placement Orchestrator",
      welcomeDesc: "Parse job descriptions, filter candidates via deterministic eligibility (CGPA + backlogs), and synthesize mock vivas.",
    },
  }[role];

  const RoleIcon = roleThemes.icon;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Execute Agent Workflow
  const handleExecute = async (promptQuery?: string) => {
    const q = promptQuery || query;
    if (!q.trim() || isLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

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
      const assistantMsgId = `ast-${Date.now()}`;

      if (data.success) {
        const assistantMsg: Message = {
          id: assistantMsgId,
          sender: "assistant",
          content: data.summary || "Workflow completed successfully.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          trace: data.executionTrace || [],
          artifacts: data.artifacts || [],
          isFallback: data.isFallback,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setExpandedTraceId(assistantMsgId);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: "assistant",
            content: `Execution encounter: ${data.error || "Unknown error"}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            trace: ["❌ Pipeline failed"],
            artifacts: [],
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: "assistant",
          content: `Network connection error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          trace: ["❌ Network unreachable"],
          artifacts: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Collect all generated artifacts from history
  const allArtifacts = messages.flatMap((m) => m.artifacts || []);

  return (
    <>
      {/* ── Sleek Floating Action Trigger Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r ${roleThemes.buttonBg} text-white font-semibold text-sm rounded-full shadow-2xl hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all group`}
      >
        <div className="relative">
          <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <span>{title}</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white hidden sm:inline-block">
          LangGraph
        </span>
      </button>

      {/* ── Slide-over Interactive Drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
            <div
              className={`w-screen ${
                isExpanded ? "max-w-5xl xl:max-w-6xl" : "max-w-xl sm:max-w-2xl"
              } bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all duration-300 ease-in-out`}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <RoleIcon className={`h-5 w-5 ${roleThemes.accent}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${roleThemes.badge}`}>
                        Gemini 2.5 Flash
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Restore compact drawer" : "Expand to wide desktop view"}
                    className="hidden md:flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setMessages([])}
                    title="Clear Conversation"
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    title="Close Drawer (Esc)"
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* View Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "chat"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Interactive Copilot</span>
                </button>
                <button
                  onClick={() => setActiveTab("artifacts")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "artifacts"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Deliverables ({allArtifacts.length})</span>
                </button>
              </div>

              {/* Tab 1: Chat & Copilot Experience */}
              {activeTab === "chat" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Welcome Card & Quick Chips */}
                  {messages.length === 0 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-800/40 dark:to-slate-900/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className={`h-4 w-4 ${roleThemes.accent}`} />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {roleThemes.welcomeTitle}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {roleThemes.welcomeDesc}
                        </p>
                      </div>

                      {/* Quick-Action Workflows Ribbon */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Instant One-Click Actions:
                        </span>
                        <div className={`grid gap-2.5 ${isExpanded ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                          {quickPrompts.map((qp, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleExecute(qp.query)}
                              disabled={isLoading}
                              className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all text-left disabled:opacity-50"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {qp.label}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                                    {qp.query}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Thread */}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-2 ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Avatar & Sender Label */}
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 px-1">
                        {msg.sender === "user" ? (
                          <>
                            <span>You</span>
                            <User className="h-3 w-3 text-slate-400" />
                          </>
                        ) : (
                          <>
                            <RoleIcon className={`h-3.5 w-3.5 ${roleThemes.accent}`} />
                            <span>{title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({msg.timestamp})
                            </span>
                          </>
                        )}
                      </div>

                      {/* Content Bubble */}
                      <div
                        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-xs shadow-md"
                            : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-tl-xs shadow-xs"
                        }`}
                      >
                        {msg.sender === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-line">{msg.content}</p>
                        )}

                        {/* Live Execution Trace Dropdown */}
                        {msg.trace && msg.trace.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 font-mono text-[11px]">
                            <button
                              onClick={() =>
                                setExpandedTraceId(
                                  expandedTraceId === msg.id ? null : msg.id
                                )
                              }
                              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold hover:text-indigo-600 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                Agent Execution Trace ({msg.trace.length} steps)
                              </span>
                              {expandedTraceId === msg.id ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {expandedTraceId === msg.id && (
                              <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                {msg.trace.map((step, sIdx) => (
                                  <div key={sIdx} className="flex items-start gap-2">
                                    <span className="text-emerald-500 shrink-0">●</span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Inline Artifact Cards */}
                        {msg.artifacts && msg.artifacts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                              Synthesized Output:
                            </span>
                            {msg.artifacts.map((art, aIdx) => {
                              const rawString =
                                typeof art.data === "object"
                                  ? JSON.stringify(art.data, null, 2)
                                  : art.content || JSON.stringify(art, null, 2);

                              return (
                                <div
                                  key={aIdx}
                                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {art.title || art.type}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(rawString, `${msg.id}-${aIdx}`)}
                                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                                    >
                                      {copiedId === `${msg.id}-${aIdx}` ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      <span>
                                        {copiedId === `${msg.id}-${aIdx}` ? "Copied" : "Copy"}
                                      </span>
                                    </button>
                                  </div>
                                  <pre className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48">
                                    {rawString}
                                  </pre>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 animate-pulse max-w-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {title} is synthesizing...
                        </p>
                        <p className="text-[11px] text-slate-500">
                          ETR Tools → Deterministic Engines → Gemini 2.5 Flash
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Tab 2: All Deliverables Repository */}
              {activeTab === "artifacts" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  {allArtifacts.length === 0 ? (
                    <div className="text-center py-16 space-y-3 text-slate-500">
                      <FileText className="h-10 w-10 mx-auto opacity-40" />
                      <p className="text-sm font-semibold">No deliverables generated yet.</p>
                      <p className="text-xs max-w-xs mx-auto">
                        Ask {title} to synthesize question papers, audit matrices, or interview roadmaps to generate institutional documents.
                      </p>
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${isExpanded ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                      {allArtifacts.map((art, idx) => {
                        const contentStr =
                          typeof art.data === "object"
                            ? JSON.stringify(art.data, null, 2)
                            : art.content || JSON.stringify(art, null, 2);

                        return (
                          <div
                            key={idx}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 space-y-3 shadow-xs flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {art.title || art.type}
                                </h4>
                              </div>
                              <button
                                onClick={() => copyToClipboard(contentStr, `art-${idx}`)}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
                              >
                                {copiedId === `art-${idx}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span>{copiedId === `art-${idx}` ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                            <pre className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto ${isExpanded ? "max-h-[380px]" : "max-h-60"}`}>
                              {contentStr}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecute();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Ask ${title} anything (e.g. syllabus, audit, risk, drive)...`}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className={`p-2.5 rounded-xl bg-gradient-to-r ${roleThemes.buttonBg} text-white font-medium hover:opacity-90 disabled:opacity-40 transition-all shadow-sm`}
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
