"use client";

import { AnimatedBackground } from "@/components/animated-background";
import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Share2,
  ChevronDown,
  ChevronUp,
  Bot,
  Bug,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  GraduationCap,
  Shield,
  CheckCircle2,
  Check,
  Zap,
  BookOpen,
  FlaskConical,
  Scale,
  Search,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/utils/insforge/client";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { NeuralSynapseLoader, QuantumNexusLoader } from "@/components/ui/extraordinary-loader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: string;
}

interface Chunk {
  documentName: string;
  chunkText: string;
  score: number | null;
  chunkIndex: number;
  pageNumber?: number | null;
}

interface DebugChunk extends Chunk {
  vectorScore?: number | null;
  bm25Score?: number | null;
  fusionScore?: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function getMessageContent(m: any): string {
  if (m.parts && Array.isArray(m.parts)) {
    return m.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  return typeof m.content === "string" ? m.content : "";
}

function getConfidenceLevel(score: number): "high" | "medium" | "low" {
  const pct = score * 100;
  if (pct >= 70) return "high";
  if (pct >= 40) return "medium";
  return "low";
}

// ── Multi-Agent Reasoning Visualizer ─────────────────────────────────────────

function ReasoningAccordion({
  latency,
  chunkCount,
  deptCode,
}: {
  latency: number | null;
  chunkCount: number;
  deptCode: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-md overflow-hidden transition-all text-xs">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-indigo-300 hover:text-indigo-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Neural Agentic Pipeline
          </span>
          <span className="text-[11px] text-indigo-400/80">
            ({chunkCount} chunks grounded {latency ? `· ${latency}ms` : ""})
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-indigo-500/10 space-y-2 text-[11px]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white">1. RBAC & Scope Isolation</span>
              <p className="text-slate-400">Restricted query execution strictly to authorized [{deptCode}] and university documents.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white">2. Hybrid Vector Search (Dense + BM25)</span>
              <p className="text-slate-400">Scanned Qdrant high-dimensional collection with reciprocal rank fusion.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white">3. Knowledge Cross-Verification</span>
              <p className="text-slate-400">Selected top {chunkCount} authoritative syllabus & regulation excerpts for citations.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white">4. Grounded Synthesis Engine</span>
              <p className="text-slate-400">Generated hallucination-free response matching curriculum directives.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interactive Citations Chips ──────────────────────────────────────────────

function CitationChips({
  chunks,
  onSelectChunk,
}: {
  chunks: Chunk[];
  onSelectChunk: (chunk: Chunk) => void;
}) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1 mr-1">
        <FileText className="w-3 h-3 text-indigo-400" />
        Verified Sources:
      </span>
      {chunks.slice(0, 4).map((c, i) => {
        const scorePct = c.score ? Math.round(c.score * 100) : null;
        return (
          <button
            key={i}
            onClick={() => onSelectChunk(c)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-indigo-400/50 text-[11px] text-indigo-200 transition-all active:scale-95 group"
            title="Click to view extracted chunk text"
          >
            <span className="font-medium truncate max-w-[120px]">{c.documentName}</span>
            {c.pageNumber && (
              <span className="text-[9px] px-1 bg-indigo-500/20 rounded text-indigo-300">
                P.{c.pageNumber}
              </span>
            )}
            {scorePct && (
              <span className="text-[9px] text-emerald-400 font-mono">
                {scorePct}%
              </span>
            )}
          </button>
        );
      })}
      {chunks.length > 4 && (
        <span className="text-[10px] text-slate-400 pl-1">
          +{chunks.length - 4} more
        </span>
      )}
    </div>
  );
}

// ── Message Bubbles ──────────────────────────────────────────────────────────

function UserBubble({
  content,
  time,
  name,
  initials,
}: {
  content: string;
  time?: string;
  name: string;
  initials: string;
}) {
  return (
    <div className="flex gap-3 items-start justify-end group animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-slate-300">{name}</span>
          {time && <span className="text-[10px] text-slate-400">{time}</span>}
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-indigo-900/20 border border-indigo-400/20">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 mt-5">
        {initials}
      </div>
    </div>
  );
}

function AssistantBubble({
  id,
  content,
  time,
  onCopy,
  onRetry,
  chunks,
  initialFeedback,
  onSelectChunk,
  latency,
  deptCode,
}: {
  id?: string;
  content: string;
  time?: string;
  onCopy: () => void;
  onRetry: () => void;
  chunks?: Chunk[];
  initialFeedback?: "thumbs_up" | "thumbs_down" | null;
  onSelectChunk: (c: Chunk) => void;
  latency?: number | null;
  deptCode: string;
}) {
  const [feedback, setFeedback] = useState<"thumbs_up" | "thumbs_down" | null>(initialFeedback || null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = async (val: "thumbs_up" | "thumbs_down") => {
    if (!id) return;
    const newValue = feedback === val ? null : val;
    setFeedback(newValue);
    try {
      await fetch(`/api/messages/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: newValue }),
      });
    } catch (e) {
      console.error("Failed sending feedback:", e);
    }
  };

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3 items-start group animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 mt-5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 max-w-[92%] sm:max-w-[85%]">
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            Campus AI Assistant
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-mono border border-emerald-500/20">
              GROUNDED
            </span>
          </span>
          {time && <span className="text-[10px] text-slate-400">{time}</span>}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-2xl transition-all">
          {/* Multi-Agent Reasoning Steps */}
          {chunks && chunks.length > 0 && (
            <ReasoningAccordion
              latency={latency ?? null}
              chunkCount={chunks.length}
              deptCode={deptCode}
            />
          )}

          {/* Formatted Markdown Body */}
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed
            prose-headings:text-white prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
            prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-ul:my-2 prose-li:my-0.5
            prose-code:text-indigo-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl
            prose-table:border-collapse prose-th:bg-white/5 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-white/10"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>

          {/* Interactive Source Chips */}
          {chunks && chunks.length > 0 && (
            <CitationChips chunks={chunks} onSelectChunk={onSelectChunk} />
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1 mt-2 ml-1">
          <button
            onClick={() => handleFeedback("thumbs_up")}
            title="Helpful response"
            className={`p-1.5 rounded-lg transition-colors ${
              feedback === "thumbs_up"
                ? "text-emerald-400 bg-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("thumbs_down")}
            title="Inaccurate response"
            className={`p-1.5 rounded-lg transition-colors ${
              feedback === "thumbs_down"
                ? "text-rose-400 bg-rose-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy message"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onRetry}
            title="Regenerate response"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hero Empty State ─────────────────────────────────────────────────────────

function EmptyState({
  onSuggest,
  deptCode = "CSE",
  deptName = "Computer Science & Engineering",
}: {
  onSuggest: (q: string) => void;
  deptCode?: string;
  deptName?: string;
}) {
  const categories = [
    {
      icon: BookOpen,
      title: "Course Syllabi & Notes",
      desc: "Curriculum units, chapter outlines, key formulas, and exam weightage.",
      prompt: `Summarize the high-yield topics and syllabus units for ${deptCode}`,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    },
    {
      icon: FlaskConical,
      title: "Lab Manuals & Code",
      desc: "Step-by-step experiment procedures, requirements, and test scenarios.",
      prompt: `Explain the required laboratory experiments and expected outputs for ${deptCode}`,
      color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    },
    {
      icon: Scale,
      title: "Academic Regulations",
      desc: "Official university attendance requirements, grading scale, and exam condonation.",
      prompt: "What is the official university policy regarding minimum attendance and semester examinations?",
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
    {
      icon: Sparkles,
      title: "AI Concept Breakdown",
      desc: "Clear pedagogical explanations with pseudo-code and intuitive examples.",
      prompt: "Explain Artificial Intelligence search algorithms (A*, Minimax, Alpha-Beta pruning) with examples",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 text-center max-w-4xl mx-auto">
      {/* Brand Emblem */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl opacity-70 animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center shadow-2xl border border-indigo-400/40">
          <Bot className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Scope Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4 backdrop-blur-md">
        <GraduationCap className="w-4 h-4 text-indigo-400" />
        <span>{deptName} ({deptCode}) Knowledge Base</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
        Campus Academic Intelligence
      </h1>
      <p className="text-sm text-slate-400 max-w-lg mb-8 leading-relaxed">
        Ask questions scoped directly to your department repository. Every answer is cross-verified against official faculty documents with source citations.
      </p>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <button
              key={idx}
              onClick={() => onSuggest(cat.prompt)}
              className="group text-left p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 hover:border-indigo-500/50 backdrop-blur-xl transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cat.color} border shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Prompts Chips */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
        <span className="text-xs text-slate-500 font-medium">Quick starters:</span>
        {[
          "AI Units 1-2 Syllabus",
          "CNIP Lab Manual",
          "Attendance Shortage Condonation",
          "Credit Requirements",
        ].map((tag) => (
          <button
            key={tag}
            onClick={() => onSuggest(`Explain the details regarding ${tag}`)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/80 text-slate-300 transition-all"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Context / Citations Panel ────────────────────────────────────────────────

function ContextPanelContent({
  chunks,
  selectedChunk,
  onClearSelected,
}: {
  chunks: Chunk[];
  selectedChunk: Chunk | null;
  onClearSelected: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {selectedChunk ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Source Excerpt
            </span>
            <button
              onClick={onClearSelected}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Back to all
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2">
            <p className="text-xs font-semibold text-white">{selectedChunk.documentName}</p>
            {selectedChunk.pageNumber && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono inline-block">
                Page {selectedChunk.pageNumber}
              </span>
            )}
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {selectedChunk.chunkText}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Retrieved Chunks ({chunks.length})
            </span>
          </div>

          {chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Sparkles className="w-6 h-6 text-indigo-400/40 mx-auto" />
              <p className="text-xs">No citations yet. Ask a question to view ground-truth excerpts.</p>
            </div>
          ) : (
            chunks.map((c, i) => {
              const scorePct = c.score ? Math.round(c.score * 100) : null;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 space-y-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{c.documentName}</p>
                      <p className="text-[10px] text-slate-400">
                        Chunk {c.chunkIndex + 1}
                        {c.pageNumber && ` · Page ${c.pageNumber}`}
                      </p>
                    </div>
                    {scorePct && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold shrink-0">
                        {scorePct}% match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed font-sans">
                    {c.chunkText}
                  </p>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationMeta[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [userName, setUserName] = useState("Student");
  const [userInitials, setUserInitials] = useState("ST");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile drawers
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);

  const [debugOpen, setDebugOpen] = useState(false);
  const [debugChunks, setDebugChunks] = useState<DebugChunk[]>([]);
  const [retrievalLatency, setRetrievalLatency] = useState<number | null>(null);

  // Department Knowledge Scope
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [userScope, setUserScope] = useState<any>(null);

  // Load departments and scope
  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => {
        if (d.departments && d.departments.length > 0) {
          setDepartments(d.departments);
          setUserScope(d.userScope);
          const defaultDept = d.departments.find((dep: any) => dep.code === "CSE") || d.departments[0];
          setSelectedDepartmentId(d.userScope?.primaryDepartmentId || defaultDept.id);
        }
      })
      .catch((e) => console.error("Failed loading departments:", e));
  }, []);

  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId) || departments[0] || null;

  // Load user info
  useEffect(() => {
    const insforge = createClient();
    insforge.auth.getCurrentUser().then((res: any) => {
      const user = res?.data?.user;
      if (!user) return;
      const name =
        user.profile?.name ??
        user.email?.split("@")[0] ??
        "Student";
      setUserName(name);
      setUserInitials(name.slice(0, 2).toUpperCase());
    });
  }, []);

  // Load conversation history
  const loadHistory = useCallback(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        setHistory(d.conversations ?? []);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Create new conversation
  const createNew = useCallback(async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.conversation?.id) {
      setConversationId(data.conversation.id);
      setInitialMessages([]);
      setChunks([]);
      setDebugChunks([]);
      setRetrievalLatency(null);
      loadHistory();
    }
  }, [loadHistory]);

  // Load existing conversation
  const loadConversation = useCallback(async (id: string) => {
    setConversationId(id);
    setChunks([]);
    setDebugChunks([]);
    setRetrievalLatency(null);
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    if (data.conversation?.messages) {
      const msgs = data.conversation.messages.map((m: any) => ({
        id: m.id,
        role: m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system",
        content: m.content,
        createdAt: new Date(m.createdAt),
      }));
      setInitialMessages(msgs);
      const lastAssistant = [...data.conversation.messages].reverse()
        .find((m: any) => m.role === "ASSISTANT" && m.citations);
      if (lastAssistant?.citations) {
        try {
          const parsed = typeof lastAssistant.citations === "string"
            ? JSON.parse(lastAssistant.citations)
            : lastAssistant.citations;
          if (Array.isArray(parsed)) {
            setChunks(parsed.slice(0, 5));
            setDebugChunks(parsed.slice(0, 5));
          }
        } catch {}
      }
    }
  }, []);

  // Delete conversation
  const deleteConv = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (conversationId === id) {
      setConversationId(null);
      setInitialMessages([]);
      setChunks([]);
      setDebugChunks([]);
      setRetrievalLatency(null);
    }
    loadHistory();
  }, [conversationId, loadHistory]);

  // useChat hook
  const { messages, setMessages, sendMessage, regenerate, status, error } = useChat({
    initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, init) => {
        const startTime = Date.now();
        const res = await fetch(url, init);
        const elapsed = Date.now() - startTime;
        setRetrievalLatency(elapsed);
        const raw = res.headers.get("X-Retrieved-Chunks");
        if (raw) {
          try {
            const parsed = JSON.parse(decodeURIComponent(raw));
            if (Array.isArray(parsed)) {
              setChunks(parsed);
              const debugParsed: DebugChunk[] = parsed.map((c: any) => ({
                documentName: c.documentName,
                chunkText: c.chunkText,
                score: c.score ?? null,
                chunkIndex: c.chunkIndex,
                pageNumber: c.pageNumber ?? null,
                vectorScore: c.vectorScore ?? c.score ?? null,
                bm25Score: c.bm25Score ?? null,
                fusionScore: c.fusionScore ?? null,
              }));
              setDebugChunks(debugParsed);
            }
          } catch {}
        }
        return res;
      },
    }),
    onFinish: () => {
      loadHistory();
    },
  } as any);

  const isLoading = status === "submitted" || status === "streaming";

  // Sync initialMessages when switching conversations
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]); // eslint-disable-line

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Submit handler
  const handleFormSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!input?.trim() || isLoading) return;

      let currentId = conversationId;

      if (!currentId) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const data = await res.json();
          if (data.conversation?.id) {
            currentId = data.conversation.id;
            setConversationId(currentId);
            loadHistory();
          }
        } catch (err) {
          console.error("Error creating conversation:", err);
        }
      }

      sendMessage(
        { text: input },
        {
          body: {
            conversationId: currentId,
            departmentId: selectedDepartmentId,
          },
        }
      );
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [conversationId, input, isLoading, sendMessage, loadHistory, selectedDepartmentId]
  );

  const currentTitle = history.find((h) => h.id === conversationId)?.title ?? "Campus AI Consultation";

  return (
    <AnimatedBackground>
      <div className="flex h-[calc(100vh-3.5rem)] text-white overflow-hidden -m-6 md:-m-10 bg-slate-950/80 backdrop-blur-2xl">
        
        {/* ── Left Sidebar: Conversations (Desktop) ────────────────── */}
        <aside className="w-64 shrink-0 border-r border-white/10 bg-slate-950/60 backdrop-blur-xl hidden md:flex flex-col">
          <div className="p-3.5">
            <button
              onClick={createNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
          </div>

          <div className="px-4 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recent Consultations
            </span>
            <span className="text-[10px] font-mono text-slate-500">{history.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500 text-xs">
                No previous conversations.
              </div>
            ) : (
              history.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    conversationId === conv.id
                      ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-400 opacity-70 group-hover:opacity-100" />
                  <span className="flex-1 truncate font-medium">{conv.title || "New Consultation"}</span>
                  <button
                    onClick={(e) => deleteConv(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* User Status Footer */}
          <div className="p-3 border-t border-white/10 flex items-center gap-2.5 bg-slate-950/40">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified Student
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Chat Area ────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          
          {/* Executive Header */}
          <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/40 backdrop-blur-md shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Drawer Trigger */}
              <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
                <SheetTrigger className="md:hidden flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chats</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:max-w-xs bg-slate-950 border-r border-white/10 p-0 text-white">
                  <SheetHeader className="p-4 border-b border-white/10">
                    <SheetTitle className="text-white text-sm">Consultations</SheetTitle>
                    <SheetDescription className="text-xs text-slate-400">
                      Switch or resume previous sessions
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-3">
                    <button
                      onClick={() => {
                        createNew();
                        setMobileHistoryOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                    >
                      <Plus className="w-4 h-4" /> New Session
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {history.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          loadConversation(conv.id);
                          setMobileHistoryOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate flex-1">{conv.title || "New Consultation"}</span>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
                <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] xs:max-w-[260px] sm:max-w-md">
                  {currentTitle}
                </h1>
              </div>
            </div>

            {/* Department Knowledge Scope Badge & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-indigo-200">
                <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-white">
                  {selectedDepartment?.code || "CSE"}
                </span>
                <span className="text-[11px] text-slate-400 hidden lg:inline truncate max-w-[140px]">
                  {selectedDepartment?.name || "Department Knowledge"}
                </span>
              </div>

              {/* Citations Sheet Trigger */}
              <Sheet open={mobileContextOpen} onOpenChange={setMobileContextOpen}>
                <SheetTrigger
                  className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl px-3 py-1.5 transition-colors"
                  title="View citations"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Citations</span>
                  {chunks.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-[10px] text-white font-bold">
                      {chunks.length}
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="right" className="w-[90vw] sm:max-w-md bg-slate-950 border-l border-white/10 p-0 text-white">
                  <SheetHeader className="p-4 border-b border-white/10">
                    <SheetTitle className="text-white text-sm">Grounded Sources & Citations</SheetTitle>
                    <SheetDescription className="text-xs text-slate-400">
                      Authoritative excerpts retrieved from official syllabus & documents
                    </SheetDescription>
                  </SheetHeader>
                  <ContextPanelContent
                    chunks={chunks}
                    selectedChunk={selectedChunk}
                    onClearSelected={() => setSelectedChunk(null)}
                  />
                </SheetContent>
              </Sheet>

              {/* Share Button */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: currentTitle, url: window.location.href }).catch(() => {});
                  } else {
                    copyText(window.location.href);
                    alert("Chat link copied to clipboard!");
                  }
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Share session"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
            {messages.length === 0 ? (
              <EmptyState
                onSuggest={(q) => setInput(q)}
                deptCode={selectedDepartment?.code || "CSE"}
                deptName={selectedDepartment?.name || "Computer Science"}
              />
            ) : (
              messages.map((m: any) => {
                const textContent = getMessageContent(m);
                return m.role === "user" ? (
                  <UserBubble
                    key={m.id}
                    content={textContent}
                    time={m.createdAt ? fmtTime(m.createdAt.toISOString?.() ?? m.createdAt) : undefined}
                    name={userName}
                    initials={userInitials}
                  />
                ) : (
                  <AssistantBubble
                    key={m.id}
                    id={m.id}
                    initialFeedback={
                      m.metadata
                        ? typeof m.metadata === "string"
                          ? JSON.parse(m.metadata).feedback
                          : (m.metadata as any).feedback
                        : null
                    }
                    content={textContent}
                    time={m.createdAt ? fmtTime(m.createdAt.toISOString?.() ?? m.createdAt) : undefined}
                    onCopy={() => copyText(textContent)}
                    onRetry={() => regenerate()}
                    chunks={chunks}
                    onSelectChunk={(c) => {
                      setSelectedChunk(c);
                      setMobileContextOpen(true);
                    }}
                    latency={retrievalLatency}
                    deptCode={selectedDepartment?.code || "CSE"}
                  />
                );
              })
            )}

            {/* Typing / Agent Processing State */}
            {isLoading && (messages[messages.length - 1]?.role === "user" || (messages[messages.length - 1]?.role === "assistant" && !getMessageContent(messages[messages.length - 1]))) && (
              <div className="flex gap-3 items-start popup-card-in">
                <NeuralSynapseLoader text={`Reasoning over ${selectedDepartment?.code || "department"} knowledge base...`} />
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-2.5 text-xs">
                  An error occurred while communicating with the AI model.
                  <button onClick={() => regenerate()} className="underline font-bold text-white hover:text-rose-200">
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Executive Floating Input Dock */}
          <div className="shrink-0 px-4 sm:px-8 pb-4 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleFormSubmit}>
                <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/70 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-2xl backdrop-blur-2xl transition-all">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFormSubmit();
                      }
                    }}
                    placeholder={`Ask questions about ${selectedDepartment?.code || "CSE"} course syllabi, lab manuals, regulations...`}
                    disabled={isLoading}
                    rows={1}
                    className="w-full bg-transparent text-sm text-white placeholder-slate-400 px-4 pt-3.5 pb-2 resize-none outline-none min-h-[48px] max-h-44 leading-relaxed font-sans"
                  />

                  {/* Input Footer Bar */}
                  <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Shield className="w-3 h-3 text-indigo-400" />
                        Grounded Search
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        Press Enter ↵ to send
                      </span>
                      <button
                        type="submit"
                        disabled={isLoading || !input?.trim()}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <p className="text-center text-[10px] text-slate-400 mt-2">
                All responses are synthesized from verified university documents. Cross-check citations for examination purposes.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AnimatedBackground>
  );
}
