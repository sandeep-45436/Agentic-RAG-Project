"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, FileText, Network, BarChart2, MessageSquare, ShieldCheck,
  Mail, Database, Play, Loader2, MoreHorizontal, Plus, X, Check,
  ArrowUpRight, Bot, CheckCircle2, Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentData {
  id: string;
  name: string;
  purpose: string;
  type: string;
  status: string;
  tasks: number;
  successRate: number | null;
  lastActive: string | null;
  icon: string;
  promptText: string;
}

interface KBData {
  id: string;
  name: string;
}

interface Metrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  tasksCompleted: number;
  successRate: number;
}

// Map icon string to Lucide component and colors
function renderAgentIcon(iconName: string, size = 16) {
  switch (iconName.toLowerCase()) {
    case "search":
      return (
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm shrink-0">
          <Search style={{ width: size, height: size }} />
        </div>
      );
    case "file":
      return (
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
          <FileText style={{ width: size, height: size }} />
        </div>
      );
    case "graph":
      return (
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm shrink-0">
          <Network style={{ width: size, height: size }} />
        </div>
      );
    case "chart":
      return (
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shrink-0">
          <BarChart2 style={{ width: size, height: size }} />
        </div>
      );
    case "chat":
      return (
        <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-sm shrink-0">
          <MessageSquare style={{ width: size, height: size }} />
        </div>
      );
    case "shield":
      return (
        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shrink-0">
          <ShieldCheck style={{ width: size, height: size }} />
        </div>
      );
    case "envelope":
      return (
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm shrink-0">
          <Mail style={{ width: size, height: size }} />
        </div>
      );
    case "database":
      return (
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shrink-0">
          <Database style={{ width: size, height: size }} />
        </div>
      );
    default:
      return (
        <div className="p-2 rounded-xl bg-gray-500/10 text-gray-400 border border-gray-500/20 shadow-sm shrink-0">
          <Bot style={{ width: size, height: size }} />
        </div>
      );
  }
}

function timeAgo(isoString: string | null) {
  if (!isoString) return "—";
  const diff = new Date().getTime() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  
  // Running state for local agent triggers
  const [runningAgentIds, setRunningAgentIds] = useState<Record<string, boolean>>({});

  // Creation Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPurpose, setNewAgentPurpose] = useState("");
  const newAgentType = "Custom";
  const [newAgentKB, setNewAgentKB] = useState("");
  const [newAgentIcon, setNewAgentIcon] = useState("search");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Executed toasts
  const [toastLog, setToastLog] = useState<{ id: string; text: string; success: boolean }[]>([]);

  // Fetch agents data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const json = await res.json();
      if (!json.error) {
        setAgents(json.agents);
        setMetrics(json.metrics);
      }
    } catch (e) {
      console.error("Failed fetching agents", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch knowledge bases
  useEffect(() => {
    fetch("/api/knowledge-bases")
      .then((res) => res.json())
      .then((json) => {
        if (json.knowledgeBases) {
          setKnowledgeBases(json.knowledgeBases);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling updates for metrics and status tracking (real-time data)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Triggers simulated agent run
  const runAgent = async (agentId: string, agentName: string) => {
    if (runningAgentIds[agentId]) return;

    // Put into running state
    setRunningAgentIds((prev) => ({ ...prev, [agentId]: true }));

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const json = await res.json();

      if (json.success) {
        const text = `Agent ${agentName} completed task in ${json.result.latencyMs}ms!`;
        const newToast = {
          id: Math.random().toString(),
          text,
          success: json.result.status === "success",
        };
        setToastLog((prev) => [newToast, ...prev]);

        // Auto remove toast after 4s
        setTimeout(() => {
          setToastLog((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 4000);

        // Refresh agent stats immediately
        loadData(true);
      }
    } catch (e) {
      console.error("Agent execution trigger failed", e);
    } finally {
      // Clear running state
      setRunningAgentIds((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  // Submit new Agent Form
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentPrompt.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName,
          purpose: newAgentPurpose,
          type: newAgentType,
          promptText: newAgentPrompt,
          icon: newAgentIcon,
          knowledgeBaseId: newAgentKB || null,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setIsModalOpen(false);
        // Reset inputs
        setNewAgentName("");
        setNewAgentPurpose("");
        setNewAgentPrompt("");
        setNewAgentKB("");
        setNewAgentIcon("search");
        
        loadData(true);
      }
    } catch (e) {
      console.error("Agent creation failed", e);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter logic
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && agent.status === "Active") ||
      (statusFilter === "idle" && agent.status === "Idle");

    return matchesSearch && matchesStatus;
  });

  if (loading && agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing Agent workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 relative">
      {/* ── Toast Container ────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toastLog.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-card/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl animate-scale-in pointer-events-auto"
          >
            <div className={`p-1.5 rounded-lg ${toast.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {toast.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            Agents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor your AI agents and workflows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl shadow-soft transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent</span>
          </button>
          
          <button className="p-2.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-white transition-colors bg-card">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Metrics Row ────────────────────────────────────────── */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Agents */}
          <div className="group bg-[#13161e] border border-white/5 rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Agents</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalAgents}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>14%</span>
              <span className="text-muted-foreground font-normal ml-1">from last month</span>
            </div>
          </div>

          {/* Card 2: Active Agents */}
          <div className="group bg-[#13161e] border border-white/5 rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Agents</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.activeAgents}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span>{metrics.idleAgents} idle</span>
            </div>
          </div>

          {/* Card 3: Tasks Completed */}
          <div className="group bg-[#13161e] border border-white/5 rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tasks Completed</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.tasksCompleted.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>23%</span>
              <span className="text-muted-foreground font-normal ml-1">from last month</span>
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="group bg-[#13161e] border border-white/5 rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Success Rate</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.successRate}%
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>2.4%</span>
              <span className="text-muted-foreground font-normal ml-1">from last month</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main List Card ─────────────────────────────────────── */}
      <div className="bg-[#13161e] border border-white/5 rounded-2xl overflow-hidden shadow-soft">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-white">Agent List</h2>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1f2a] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex items-center bg-[#1c1f2a] border border-white/5 rounded-xl p-0.5">
              {(["all", "active", "idle"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-[10px] font-semibold uppercase px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === filter
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {filter === "all" ? "All Status" : filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground font-semibold">
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tasks</th>
                <th className="px-6 py-4">Success Rate</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No agents found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredAgents
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((agent) => {
                  const isRunning = runningAgentIds[agent.id];
                  
                  return (
                    <tr key={agent.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Name & Type */}
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          {renderAgentIcon(agent.icon)}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{agent.name}</p>
                            <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                              agent.type === "System"
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {agent.type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                        {agent.purpose}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isRunning ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            <span>Running...</span>
                          </div>
                        ) : agent.status === "Active" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            <span>Idle</span>
                          </div>
                        )}
                      </td>

                      {/* Tasks */}
                      <td className="px-6 py-4 font-bold text-white">
                        {agent.tasks.toLocaleString()}
                      </td>

                      {/* Success Rate */}
                      <td className="px-6 py-4">
                        {agent.successRate !== null ? (
                          <div className="flex flex-col gap-1 w-24">
                            <span className="font-bold text-white">{agent.successRate}%</span>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${agent.successRate}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {timeAgo(agent.lastActive)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => runAgent(agent.id, agent.name)}
                            disabled={isRunning}
                            className={`p-2 rounded-lg border hover:text-white transition-all bg-card ${
                              isRunning
                                ? "text-muted-foreground/40 border-border/40 cursor-not-allowed"
                                : "text-muted-foreground hover:bg-[#1c1f2a] border-border/60"
                            }`}
                            title="Execute Agent Task"
                          >
                            {isRunning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-muted-foreground hover:fill-white" />
                            )}
                          </button>
                          
                          <Link
                            href="/analytics"
                            className="p-2 rounded-lg border border-border/60 hover:bg-[#1c1f2a] hover:text-white text-muted-foreground transition-colors bg-card"
                            title="View Agent Analytics"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {filteredAgents.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredAgents.length)} of {filteredAgents.length} agents
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 border border-border/60 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredAgents.length / PAGE_SIZE) || 1, p + 1))}
              disabled={currentPage >= Math.ceil(filteredAgents.length / PAGE_SIZE)}
              className="px-2.5 py-1.5 border border-border/60 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── New Agent Creation Modal ──────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#13161e] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animate-scale-in text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-primary" />
              <span>Create New AI Agent</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Configure a specialized agent workflow with instructions.
            </p>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              {/* Agent Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Reviewer, Sales Copywriter"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full bg-[#1c1f2a] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Purpose Description</label>
                <input
                  type="text"
                  placeholder="e.g. Audit codebase changes for standards"
                  value={newAgentPurpose}
                  onChange={(e) => setNewAgentPurpose(e.target.value)}
                  className="w-full bg-[#1c1f2a] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-4">
                {/* Knowledge Base */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Connected Knowledge Base</label>
                  <select
                    value={newAgentKB}
                    onChange={(e) => setNewAgentKB(e.target.value)}
                    className="w-full bg-[#1c1f2a] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="">None (General Intelligence)</option>
                    {knowledgeBases.map((kb) => (
                      <option key={kb.id} value={kb.id}>
                        {kb.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icon selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Display Icon</label>
                  <select
                    value={newAgentIcon}
                    onChange={(e) => setNewAgentIcon(e.target.value)}
                    className="w-full bg-[#1c1f2a] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="search">Search Lens (Purple)</option>
                    <option value="file">File Summary (Green)</option>
                    <option value="graph">Network Nodes (Blue)</option>
                    <option value="chart">Donut Chart (Amber)</option>
                    <option value="chat">Bubble Dialogue (Pink)</option>
                    <option value="shield">Audit Shield (Teal)</option>
                    <option value="envelope">Mail Letter (Indigo)</option>
                    <option value="database">Cylinder DB (Cyan)</option>
                  </select>
                </div>
              </div>

              {/* System Instructions / Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">System Instructions (Prompt)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide precise instructions for this agent's behaviors, outputs, constraints..."
                  value={newAgentPrompt}
                  onChange={(e) => setNewAgentPrompt(e.target.value)}
                  className="w-full bg-[#1c1f2a] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-soft transition-colors disabled:opacity-40"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Create Agent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
