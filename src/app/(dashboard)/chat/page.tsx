"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send, Loader2, Plus, MessageSquare, Trash2, Sparkles,
  FileText, ThumbsUp, ThumbsDown, Copy, RotateCcw,
  MoreHorizontal, Paperclip, AtSign, Command, Share2,
  ChevronRight, Bot,
  Bug, Eye, EyeOff, Clock, BarChart3,
  Building, GraduationCap, Shield, CheckCircle2, XCircle,
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

/** Extract text from a message that may use parts (UI Message Stream) or plain content. */
function getMessageContent(m: any): string {
  // If the message has parts (UI Message Stream protocol), extract text from them
  if (m.parts && Array.isArray(m.parts)) {
    return m.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  // Fallback to plain content string
  return typeof m.content === "string" ? m.content : "";
}

function getConfidenceLevel(score: number): "high" | "medium" | "low" {
  const pct = score * 100;
  if (pct >= 70) return "high";
  if (pct >= 40) return "medium";
  return "low";
}

function confidenceBarColor(level: "high" | "medium" | "low") {
  switch (level) {
    case "high": return "bg-emerald-500";
    case "medium": return "bg-amber-500";
    case "low": return "bg-red-500";
  }
}

// ── Retrieval Debug Panel Content ─────────────────────────────────────────────

function RetrievalDebugContent({
  chunks,
  latency,
}: {
  chunks: DebugChunk[];
  latency: number | null;
}) {
  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="p-3 rounded-2xl bg-primary/10 mb-3">
          <Bug className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">No retrieval data</p>
        <p className="text-xs text-muted-foreground mt-1">
          Send a message to see retrieval debug information here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Latency display */}
      {latency !== null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Retrieval latency:</span>
          <span className={`text-xs font-semibold ${
            latency > 500 ? "confidence-low" : latency > 200 ? "confidence-medium" : "confidence-high"
          }`}>
            {latency}ms
          </span>
        </div>
      )}

      {/* Chunks list */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Retrieved Chunks ({chunks.length})
        </p>
        {chunks.map((chunk, i) => {
          const mainScore = chunk.fusionScore ?? chunk.vectorScore ?? chunk.score;
          const level = mainScore !== null && mainScore !== undefined
            ? getConfidenceLevel(mainScore)
            : "medium";

          return (
            <div
              key={i}
              className="glass-subtle rounded-xl p-3 space-y-2.5 hover:bg-muted/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                  <FileText className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">
                    {chunk.documentName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Chunk {chunk.chunkIndex + 1}
                  </p>
                </div>
                {mainScore !== null && mainScore !== undefined && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${
                      level === "high"
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : level === "medium"
                        ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : "border-red-500/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {Math.round(mainScore * 100)}%
                  </Badge>
                )}
              </div>

              {/* Confidence bar */}
              {mainScore !== null && mainScore !== undefined && (
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${confidenceBarColor(level)}`}
                    style={{ width: `${Math.round(mainScore * 100)}%` }}
                  />
                </div>
              )}

              {/* Score breakdowns */}
              {(chunk.vectorScore !== undefined || chunk.bm25Score !== undefined || chunk.fusionScore !== undefined) && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {chunk.vectorScore !== null && chunk.vectorScore !== undefined && (
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Vector</p>
                      <p className="text-xs font-semibold tabular-nums">{Math.round(chunk.vectorScore * 100)}%</p>
                    </div>
                  )}
                  {chunk.bm25Score !== null && chunk.bm25Score !== undefined && (
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">BM25</p>
                      <p className="text-xs font-semibold tabular-nums">{Math.round(chunk.bm25Score * 100)}%</p>
                    </div>
                  )}
                  {chunk.fusionScore !== null && chunk.fusionScore !== undefined && (
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Fusion</p>
                      <p className="text-xs font-semibold tabular-nums">{Math.round(chunk.fusionScore * 100)}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* Chunk text preview */}
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                {chunk.chunkText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Context Panel Content ───────────────────────────────────────────────────

function ContextPanelContent({
  chunks,
  model,
  temperature,
}: {
  chunks: Chunk[];
  model: string;
  temperature: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? chunks : chunks.slice(0, 2);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Relevant chunks */}
      <div className="p-4 space-y-3 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Relevant Chunks</p>

        {chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-6 h-6 text-primary/40 mb-2" />
            <p className="text-xs text-gray-500">
              Chunks will appear here after you send a message.
            </p>
          </div>
        ) : (
          <>
            {visible.map((c, i) => (
              <div key={i} className="bg-[#1a1f2e] rounded-xl p-3 border border-white/5 space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-red-500/15 rounded-lg shrink-0 mt-0.5">
                    <FileText className="w-3 h-3 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {c.documentName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Chunk {c.chunkIndex + 1}
                      {c.score !== null && (
                        <span className="ml-1 text-primary">
                          · {Math.round(c.score * 100)}%
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
                  {c.chunkText}
                </p>
              </div>
            ))}

            {chunks.length > 2 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full text-xs text-primary hover:text-primary/80 py-2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
              >
                {showAll ? "Show less" : `View all ${chunks.length} sources`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Model info */}
      <div className="p-4 border-t border-white/5 space-y-4">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Model</p>
          <div className="flex items-center gap-2 bg-[#1a1f2e] rounded-xl px-3 py-2 border border-white/5">
            <span className="text-sm">🚀</span>
            <span className="text-xs text-white font-medium">{model}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Temperature</p>
            <span className="text-xs text-white font-medium">{temperature}</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
              style={{ width: `${(temperature / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Context Panel (Desktop) ─────────────────────────────────────────────────

function ContextPanel({ chunks, model, temperature }: {
  chunks: Chunk[];
  model: string;
  temperature: number;
}) {
  return (
    <aside className="w-72 shrink-0 bg-[#141720] border-l border-white/5 hidden xl:flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Context & Citations</h3>
      </div>
      <ContextPanelContent chunks={chunks} model={model} temperature={temperature} />
    </aside>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onSuggest, deptCode = "CSE" }: { onSuggest: (q: string) => void; deptCode?: string }) {
  const suggestions = [
    `Explain the Unit 3 topics in Data Structures (${deptCode})`,
    "What is the university attendance and academic regulations requirement?",
    "Explain Digital Signal Processing and filter design",
    `Summarize the key requirements from the ${deptCode} curriculum syllabus`,
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
      <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Ask University AI Knowledge Base</h2>
        <p className="text-sm text-gray-400 mt-1.5 max-w-md">
          Ask questions scoped to your department (<span className="text-indigo-400 font-semibold">{deptCode}</span>) and university-wide official documents with ground-truth citations.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {suggestions.map((s, idx) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left text-xs text-gray-300 bg-[#1a1f2e] hover:bg-[#1e2435] border border-white/5 hover:border-primary/40 hover:text-white rounded-xl px-4 py-3 transition-all flex items-start gap-2 group"
          >
            <span className="text-primary/60 group-hover:text-primary font-mono text-[11px] mt-0.5">0{idx + 1}.</span>
            <span className="leading-relaxed">{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function UserBubble({ content, time, name, initials }: {
  content: string; time?: string; name: string; initials: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{name}</span>
          {time && <span className="text-[11px] text-gray-500">{time}</span>}
        </div>
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ id, content, time, onCopy, onRetry, chunks, initialFeedback }: {
  id?: string; content: string; time?: string; onCopy: () => void; onRetry: () => void; chunks?: Chunk[]; initialFeedback?: "thumbs_up" | "thumbs_down" | null;
}) {
  const [feedback, setFeedback] = useState<"thumbs_up" | "thumbs_down" | null>(initialFeedback || null);

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

  // Extract sources list from content if present
  const sourceMatch = content.match(/(?:Sources?|References?|Citations?):\s*([\s\S]*?)(?:\n\n|$)/i);

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-white">AI Assistant</span>
          {time && <span className="text-[11px] text-gray-500">{time}</span>}
        </div>
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose prose-invert prose-sm max-w-none text-gray-200
            prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-white
            prose-headings:text-white prose-code:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-1 mt-2 ml-1">
          <button
            onClick={() => handleFeedback("thumbs_up")}
            title="Good response"
            className={`p-1.5 rounded-lg transition-colors ${
              feedback === "thumbs_up"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("thumbs_down")}
            title="Bad response"
            className={`p-1.5 rounded-lg transition-colors ${
              feedback === "thumbs_down"
                ? "text-rose-400 bg-rose-500/10"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCopy}
            title="Copy"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRetry}
            title="Retry"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationMeta[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [userName, setUserName] = useState("You");
  const [userInitials, setUserInitials] = useState("U");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mobile drawer states
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);

  const [debugOpen, setDebugOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"simple" | "debug">("simple");
  const [debugChunks, setDebugChunks] = useState<DebugChunk[]>([]);
  const [retrievalLatency, setRetrievalLatency] = useState<number | null>(null);

  // Department Knowledge Scope State
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [userScope, setUserScope] = useState<any>(null);

  // Load departments and user scope
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
        "You";
      setUserName(name);
      setUserInitials(name.slice(0, 2).toUpperCase());
    });
  }, []);

  // Load conversation history list
  const loadHistory = useCallback(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => { setHistory(d.conversations ?? []); setHistoryLoading(false); })
      .catch(() => setHistoryLoading(false));
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

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
      // Restore last assistant citations if available
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
    if (conversationId === id) { setConversationId(null); setInitialMessages([]); setChunks([]); setDebugChunks([]); setRetrievalLatency(null); }
    loadHistory();
  }, [conversationId, loadHistory]);

  // useChat hook — intercept the fetch to read X-Retrieved-Chunks header
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
              // Map to debug chunks with extended score fields
              const debugParsed: DebugChunk[] = parsed.map((c: any) => ({
                documentName: c.documentName,
                chunkText: c.chunkText,
                score: c.score ?? null,
                chunkIndex: c.chunkIndex,
                vectorScore: c.vectorScore ?? c.score ?? null,
                bm25Score: c.bm25Score ?? null,
                fusionScore: c.fusionScore ?? null,
              }));
              setDebugChunks(debugParsed);
            }
          } catch {}
        }
        const debugRaw = res.headers.get("X-Retrieval-Debug-Info");
        if (debugRaw) {
          try {
            const debugInfo = JSON.parse(decodeURIComponent(debugRaw));
            if (debugInfo.latencyMs) {
              setRetrievalLatency(debugInfo.latencyMs);
            }
            if (debugInfo.fusedChunks && Array.isArray(debugInfo.fusedChunks)) {
              const debugParsed: DebugChunk[] = debugInfo.fusedChunks.map((c: any) => ({
                documentName: c.documentName,
                chunkText: c.chunkText,
                score: c.fusionScore ?? null,
                chunkIndex: c.chunkIndex,
                vectorScore: c.vectorScore ?? null,
                bm25Score: c.bm25Score ?? null,
                fusionScore: c.fusionScore ?? null,
              }));
              setDebugChunks(debugParsed);
            }
          } catch {}
        }
        return res;
      }
    }),
    onFinish: () => { loadHistory(); },
  } as any);

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  // Sync initialMessages when switching conversations
  useEffect(() => { setMessages(initialMessages); }, [initialMessages]); // eslint-disable-line

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-create conversation on first submit if none exists
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input?.trim()) return;

      let currentId = conversationId;

      // Auto-create conversation if none exists
        if (!currentId) {
          try {
            const res = await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              const msg = errData.error || res.statusText;
              console.error("Failed to create conversation:", msg);
              alert(`Failed to create conversation: ${msg}`);
              return;
            }
            const data = await res.json();
            if (data.conversation?.id) {
              currentId = data.conversation.id;
              setConversationId(currentId);
              loadHistory();
            } else {
              console.error("No conversation ID returned");
              alert("Failed to create conversation: No ID returned");
              return;
            }
          } catch (err) {
            console.error("Error creating conversation:", err);
            alert(`Error creating conversation: ${err}`);
            return;
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
    },
    [conversationId, input, sendMessage, loadHistory, selectedDepartmentId]
  );

  const currentTitle = history.find((h) => h.id === conversationId)?.title ?? "New Chat";

  // Debug panel content for rendering in both desktop sidebar and mobile sheet
  const debugPanelContent = (
    <div className="flex flex-col h-full">
      {/* View mode toggle */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50">
          <button
            onClick={() => setViewMode("simple")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              viewMode === "simple"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3 h-3" />
            Simple
          </button>
          <button
            onClick={() => setViewMode("debug")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              viewMode === "debug"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bug className="w-3 h-3" />
            Debug
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "simple" ? (
          /* Simple view — just sources */
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Retrieved Sources
            </p>
            {debugChunks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="w-6 h-6 text-primary/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Sources will appear here after you send a message.
                </p>
              </div>
            ) : (
              debugChunks.map((c, i) => (
                <div key={i} className="glass-subtle rounded-xl p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                      <FileText className="w-3 h-3 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.documentName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Chunk {c.chunkIndex + 1}
                        {c.score !== null && (
                          <span className="ml-1 text-primary">
                            · {Math.round(c.score * 100)}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {c.chunkText}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Debug view — detailed scores */
          <RetrievalDebugContent chunks={debugChunks} latency={retrievalLatency} />
        )}
      </div>
    </div>
  );

  const historyListContent = (
    <div className="flex flex-col h-full bg-[#0f1117]">
      <div className="p-3">
        <button
          onClick={() => {
            createNew();
            setMobileHistoryOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-500 text-white text-sm font-medium transition-all duration-200 shadow-md"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>
      </div>

      <div className="px-3 pb-2">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1 mb-1">
          Recent Conversations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8 px-4">No conversations yet.</p>
        ) : (
          history.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                loadConversation(conv.id);
                setMobileHistoryOpen(false);
              }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                conversationId === conv.id
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="text-xs flex-1 truncate">{conv.title || "New Chat"}</span>
              <button
                onClick={(e) => deleteConv(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all"
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#0f1117] text-white overflow-hidden -m-6 md:-m-10">

      {/* ── Left sidebar: conversation history (Desktop) ─────────── */}
      <aside className="w-60 shrink-0 bg-[#0f1117] border-r border-white/5 flex-col hidden md:flex">
        {historyListContent}
      </aside>

      {/* ── Main chat area ──────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Conversation History Drawer */}
            <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
              <SheetTrigger
                className="md:hidden flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
                aria-label="Open chats history"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span className="hidden xs:inline">Chats</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:max-w-xs bg-[#0f1117] border-r border-white/10 p-0 text-white">
                <SheetHeader className="p-3 border-b border-white/5">
                  <SheetTitle className="text-white text-sm">Conversations</SheetTitle>
                  <SheetDescription className="text-xs text-gray-400">
                    Switch or start new chats
                  </SheetDescription>
                </SheetHeader>
                {historyListContent}
              </SheetContent>
            </Sheet>

            <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-md">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Context / Citations Sheet */}
            <Sheet open={mobileContextOpen} onOpenChange={setMobileContextOpen}>
              <SheetTrigger
                className="xl:hidden flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
                title="View source citations"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Sources</span>
                {chunks.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-primary/20 text-[10px] text-primary font-bold">
                    {chunks.length}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:max-w-sm bg-[#141720] border-l border-white/10 p-0 text-white">
                <SheetHeader className="p-4 border-b border-white/5">
                  <SheetTitle className="text-white text-sm">Context & Citations</SheetTitle>
                  <SheetDescription className="text-xs text-gray-400">
                    Retrieved ground-truth university chunks
                  </SheetDescription>
                </SheetHeader>
                <ContextPanelContent chunks={chunks} model="GPT-4o (via OpenRouter)" temperature={0.3} />
              </SheetContent>
            </Sheet>

            {/* Department Scope Selector */}
            <div className="flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] text-gray-400 hidden sm:inline font-medium">Scope:</span>
              <select
                value={selectedDepartmentId || ""}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  setChunks([]);
                  setDebugChunks([]);
                }}
                className="bg-transparent text-xs font-semibold text-indigo-200 border-none outline-none focus:ring-0 cursor-pointer pr-1"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-[#141720] text-white">
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Debug panel toggle — desktop */}
            <button
              onClick={() => setDebugOpen((v) => !v)}
              className={`hidden md:flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-all duration-200 ${
                debugOpen
                  ? "text-primary bg-primary/10 border-primary/30"
                  : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/10"
              }`}
              title="Toggle retrieval debug panel"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>{debugOpen ? "Hide Debug" : "Debug"}</span>
            </button>

            {/* Debug panel toggle — mobile (sheet) */}
            <Sheet>
              <SheetTrigger
                className="md:hidden flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Bug className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Debug</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:max-w-sm bg-background p-0">
                <SheetHeader className="p-4 border-b border-border/50">
                  <SheetTitle>Retrieval Debug</SheetTitle>
                  <SheetDescription>
                    Inspect retrieved chunks and scores
                  </SheetDescription>
                </SheetHeader>
                {debugPanelContent}
              </SheetContent>
            </Sheet>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: currentTitle, url: window.location.href }).catch(() => {});
                } else {
                  copyText(window.location.href);
                  alert("Chat link copied to clipboard!");
                }
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Knowledge Scope Banner */}
        <div className="mx-3 sm:mx-6 mt-3 p-3 bg-[#131622] border border-indigo-500/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Active Knowledge Scope:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/30">
                  {selectedDepartment?.code || "CSE"}
                </span>
                <span className="text-xs text-gray-300 hidden sm:inline font-medium">
                  {selectedDepartment?.name || "Computer Science & Engineering"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {selectedDepartment?.code || "CSE"} Department
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              University-wide
            </span>
            <span className="flex items-center gap-1 text-gray-400 font-normal bg-white/5 px-2 py-0.5 rounded border border-white/10">
              <XCircle className="w-3 h-3 text-gray-500" />
              Other Departments
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <EmptyState onSuggest={(q) => setInput(q)} deptCode={selectedDepartment?.code || "CSE"} />
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
                />
              );
            })
          )}

          {/* Typing indicator — show when loading and the last assistant message has no content yet */}
          {isLoading && (messages[messages.length - 1]?.role === "user" || (messages[messages.length - 1]?.role === "assistant" && !getMessageContent(messages[messages.length - 1]))) && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 0.15, 0.3].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Synthesizing context...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm">
                Something went wrong.
                <button onClick={() => regenerate()} className="underline text-xs">Retry</button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-3 sm:px-6 pb-3 sm:pb-5 pt-2 sm:pt-3 border-t border-white/5">
          <form onSubmit={handleFormSubmit}>
            <div className="bg-[#1a1f2e] border border-white/10 focus-within:border-primary/50 rounded-2xl transition-colors overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => {
                  handleInputChange(e as any);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e as any);
                  }
                }}
                placeholder="Ask anything about course syllabi, slides, policies..."
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 px-3.5 sm:px-4 pt-3 sm:pt-3.5 pb-1 resize-none outline-none min-h-[44px] max-h-40"
              />
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-1">
                  {[
                    { icon: Paperclip, label: "Attach" },
                    { icon: AtSign, label: "Mention" },
                    { icon: Command, label: "Commands" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      title={label}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input?.trim()}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="text-center text-[10px] sm:text-[11px] text-gray-600 mt-2">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>

      {/* ── Right: Debug panel (desktop) ─────────────────────────── */}
      {debugOpen && (
        <aside className="w-80 shrink-0 bg-background/95 backdrop-blur-xl border-l border-border/50 flex-col overflow-hidden hidden md:flex animate-slide-up-fade">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Retrieval Debug</h3>
            </div>
            <button
              onClick={() => setDebugOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Close debug panel"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
          {debugPanelContent}
        </aside>
      )}

      {/* ── Right context panel (desktop: always visible on xl screens when debug is closed) ── */}
      {!debugOpen && (
        <ContextPanel
          chunks={chunks}
          model="GPT-4o (via OpenRouter)"
          temperature={0.3}
        />
      )}
    </div>
  );
}
