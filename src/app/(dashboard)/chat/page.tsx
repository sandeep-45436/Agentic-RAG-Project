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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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

// ── Context Panel ─────────────────────────────────────────────────────────────

function ContextPanel({ chunks, model, temperature }: {
  chunks: Chunk[];
  model: string;
  temperature: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? chunks : chunks.slice(0, 2);

  return (
    <aside className="w-72 shrink-0 bg-[#141720] border-l border-white/5 flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Context</h3>
      </div>

      {/* Relevant chunks */}
      <div className="p-4 space-y-3 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Relevant Chunks</p>

        {chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-6 h-6 text-indigo-400/40 mb-2" />
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
                        <span className="ml-1 text-indigo-400">
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
                className="w-full text-xs text-indigo-400 hover:text-indigo-300 py-2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
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
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${(temperature / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  const suggestions = [
    "Summarize the key points from my documents",
    "What are the main topics in my knowledge base?",
    "Find information about financial performance",
    "What were the Q2 highlights?",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Ask your Knowledge Base</h2>
        <p className="text-sm text-gray-400 mt-1.5 max-w-sm">
          I can answer questions based on your uploaded documents with source citations.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left text-xs text-gray-300 bg-[#1a1f2e] hover:bg-[#1e2435] border border-white/5 hover:border-indigo-500/30 rounded-xl px-4 py-3 transition-all"
          >
            {s}
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
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
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

function AssistantBubble({ content, time, onCopy, onRetry, chunks }: {
  content: string; time?: string; onCopy: () => void; onRetry: () => void; chunks?: Chunk[];
}) {
  // Extract sources list from content if present
  const sourceMatch = content.match(/(?:Sources?|References?|Citations?):\s*([\s\S]*?)(?:\n\n|$)/i);

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shrink-0">
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
            prose-headings:text-white prose-code:text-indigo-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-1 mt-2 ml-1">
          {[
            { icon: ThumbsUp, label: "Good response" },
            { icon: ThumbsDown, label: "Bad response" },
            { icon: Copy, label: "Copy", onClick: onCopy },
            { icon: RotateCcw, label: "Retry", onClick: onRetry },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              title={label}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
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

  // Load user info
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name =
        user.user_metadata?.full_name ??
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
      loadHistory();
    }
  }, [loadHistory]);

  // Load existing conversation
  const loadConversation = useCallback(async (id: string) => {
    setConversationId(id);
    setChunks([]);
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
          if (Array.isArray(parsed)) setChunks(parsed.slice(0, 5));
        } catch {}
      }
    }
  }, []);

  // Delete conversation
  const deleteConv = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (conversationId === id) { setConversationId(null); setInitialMessages([]); setChunks([]); }
    loadHistory();
  }, [conversationId, loadHistory]);

  // useChat hook — intercept the fetch to read X-Retrieved-Chunks header
  const { messages, setMessages, sendMessage, regenerate, status, error } = useChat({
    initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, init) => {
        const res = await fetch(url, init);
        const raw = res.headers.get("X-Retrieved-Chunks");
        if (raw) {
          try {
            const parsed = JSON.parse(decodeURIComponent(raw));
            if (Array.isArray(parsed)) setChunks(parsed);
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

      if (!currentId) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (!res.ok) {
            console.error("Failed to create conversation:", res.statusText);
            return;
          }
          const data = await res.json();
          if (data.conversation?.id) {
            currentId = data.conversation.id;
            setConversationId(currentId);
            loadHistory();
          } else {
            console.error("No conversation ID returned");
            return;
          }
        } catch (err) {
          console.error("Error creating conversation:", err);
          return;
        }
      }

      sendMessage(
        { text: input },
        {
          body: {
            conversationId: currentId,
          },
        }
      );
      setInput("");
    },
    [conversationId, input, sendMessage, loadHistory]
  );

  const currentTitle = history.find((h) => h.id === conversationId)?.title ?? "New Chat";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#0f1117] text-white overflow-hidden -m-6 md:-m-10">

      {/* ── Left sidebar: conversation history ─────────────────── */}
      <aside className="w-60 shrink-0 bg-[#0f1117] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-3">
          <button
            onClick={createNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="px-3 pb-2">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1 mb-1">
            Recent
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
                onClick={() => loadConversation(conv.id)}
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
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat area ──────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h1 className="text-base font-semibold text-white">{currentTitle}</h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            <EmptyState onSuggest={(q) => setInput(q)} />
          ) : (
            messages.map((m: any) =>
              m.role === "user" ? (
                <UserBubble
                  key={m.id}
                  content={m.content}
                  time={m.createdAt ? fmtTime(m.createdAt.toISOString?.() ?? m.createdAt) : undefined}
                  name={userName}
                  initials={userInitials}
                />
              ) : (
                <AssistantBubble
                  key={m.id}
                  content={m.content}
                  time={m.createdAt ? fmtTime(m.createdAt.toISOString?.() ?? m.createdAt) : undefined}
                  onCopy={() => copyText(m.content)}
                  onRetry={() => regenerate()}
                  chunks={chunks}
                />
              )
            )
          )}

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 0.15, 0.3].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
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
        <div className="shrink-0 px-6 pb-5 pt-3 border-t border-white/5">
          <form onSubmit={handleFormSubmit}>
            <div className="bg-[#1a1f2e] border border-white/10 focus-within:border-indigo-500/50 rounded-2xl transition-colors overflow-hidden">
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
                placeholder="Ask anything about your data..."
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 px-4 pt-3.5 pb-1 resize-none outline-none min-h-[44px] max-h-40"
              />
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
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
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input?.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="text-center text-[11px] text-gray-600 mt-2.5">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>

      {/* ── Right context panel ─────────────────────────────────── */}
      <ContextPanel
        chunks={chunks}
        model="GPT-4o (via OpenRouter)"
        temperature={0.3}
      />
    </div>
  );
}
