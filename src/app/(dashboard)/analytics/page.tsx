"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  MessageSquare, FileText, Users, Bot, Zap, Calendar, Download,
  TrendingUp, Info, AlertTriangle, CheckCircle2, Loader2,
  ChevronDown, Play, Square, ArrowUpRight, ArrowDownRight,
  Sparkles, Check, ChevronRight, RefreshCw, Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  stats: {
    totalQueries: number;
    queriesTrend: number;
    totalDocs: number;
    docsTrend: number;
    totalActiveUsers: number;
    usersTrend: number;
    totalAgentsExecuted: number;
    agentsTrend: number;
    avgResponseTime: number;
    responseTimeTrend: number;
  };
  queriesOverTime: { date: string; queries: number }[];
  queriesByCategory: { name: string; value: number; percentage: number }[];
  topDocuments: { name: string; queries: number; type: string }[];
  userEngagement: {
    score: number;
    activeUsers: number;
    returningUsers: number;
    newUsers: number;
    activeTrend: number;
    returningTrend: number;
    newTrend: number;
  };
  responseTimeOverTime: { date: string; responseTime: number }[];
  insights: { text: string; type: string }[];
}

interface SimulatedToast {
  id: string;
  type: string;
  latencyMs: number;
  model: string;
  timestamp: Date;
}

const CATEGORY_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];

function getDocumentColor(type: string) {
  switch (type.toLowerCase()) {
    case "pdf": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "docx":
    case "doc": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "xlsx":
    case "xls": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "pptx":
    case "ppt": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

function getDocumentLabel(type: string) {
  return type.toUpperCase();
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState<"fast" | "medium" | "slow">("medium");
  const [toasts, setToasts] = useState<SimulatedToast[]>([]);
  const [queriesRange, setQueriesRange] = useState<"daily" | "hourly">("daily");
  
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Fetch Analytics data
  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.error) {
        console.error(json.error);
      } else {
        setData(json);
      }
    } catch (e) {
      console.error("Failed fetching analytics", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time polling
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, fetchAnalytics]);

  // Handle single manual event trigger
  const triggerSimulationEvent = async () => {
    try {
      const res = await fetch("/api/analytics/simulate", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const newToast: SimulatedToast = {
          id: json.event.id || Math.random().toString(),
          type: json.event.type,
          latencyMs: json.event.latencyMs,
          model: json.event.model,
          timestamp: new Date(),
        };
        setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
        
        // Auto-remove toast after 4s
        const timeoutId = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 4000);
        toastTimeoutRefs.current[newToast.id] = timeoutId;

        // Instantly poll to refresh
        fetchAnalytics(true);
      }
    } catch (e) {
      console.error("Simulation trigger failed", e);
    }
  };

  // Handle background auto-simulator
  useEffect(() => {
    if (isSimulating) {
      const delay = simSpeed === "fast" ? 1200 : simSpeed === "medium" ? 2500 : 6000;
      simulationIntervalRef.current = setInterval(() => {
        triggerSimulationEvent();
      }, delay);
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isSimulating, simSpeed]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading analytics engine...</p>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-8 pb-16 relative">
      {/* ── Simulated Toast Container ──────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-card/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl animate-scale-in pointer-events-auto"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                Live Traffic: {toast.type} query
              </p>
              <p className="text-[10px] text-muted-foreground">
                Model: {toast.model} • Latency: {toast.latencyMs}ms
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Analytics
            </h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
              isLive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              {isLive ? "LIVE" : "PAUSED"}
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Track usage, performance and key insights across your workspace.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Real-time Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-all ${
              isLive
                ? "bg-primary/10 border-primary/20 text-primary-foreground font-medium"
                : "bg-card border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {isLive ? "Real-time On" : "Real-time Off"}
          </button>

          {/* Simulator Panel */}
          <div className="flex items-center bg-card border border-border/80 rounded-xl p-1 shadow-soft">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
                isSimulating
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {isSimulating ? (
                <>
                  <Square className="w-3 h-3 fill-amber-300" />
                  Stop Sim
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-muted-foreground" />
                  Simulate Traffic
                </>
              )}
            </button>
            
            {isSimulating && (
              <div className="flex items-center gap-1 px-2 border-l border-border/60 ml-1.5">
                {(["slow", "medium", "fast"] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSimSpeed(speed)}
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded transition-all ${
                      simSpeed === speed
                        ? "bg-white/10 text-white"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {speed === "slow" ? "1x" : speed === "medium" ? "2x" : "3x"}
                  </button>
                ))}
              </div>
            )}

            {!isSimulating && (
              <button
                onClick={triggerSimulationEvent}
                className="text-[10px] font-semibold text-muted-foreground hover:text-white px-2.5 py-1.5 hover:bg-muted rounded-lg transition-colors border-l border-border/60 ml-1"
                title="Inject a single mock request"
              >
                + Inject Event
              </button>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors">
            <Calendar className="w-3.5 h-3.5 mr-2" />
            <span>May 24 – Jun 24, 2025</span>
            <ChevronDown className="w-3 h-3 ml-2 text-muted-foreground/60" />
          </div>

          {/* Export button */}
          <button
            onClick={() => alert("Report downloaded successfully (Mock).")}
            className="flex items-center gap-2 bg-card hover:bg-muted border border-border/60 text-xs px-3.5 py-2 rounded-xl font-medium text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards Grid ──────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Queries */}
          <div className="group relative bg-[#13161e] hover:bg-[#161a25] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-tr-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Queries</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalQueries.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stats.queriesTrend}%</span>
              <span className="text-muted-foreground font-normal ml-1">vs last 30 days</span>
            </div>
          </div>

          {/* Card 2: Documents Processed */}
          <div className="group relative bg-[#13161e] hover:bg-[#161a25] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-tr-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Documents Processed</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalDocs.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stats.docsTrend}%</span>
              <span className="text-muted-foreground font-normal ml-1">vs last 30 days</span>
            </div>
          </div>

          {/* Card 3: Active Users */}
          <div className="group relative bg-[#13161e] hover:bg-[#161a25] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-tr-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Users</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalActiveUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stats.usersTrend}%</span>
              <span className="text-muted-foreground font-normal ml-1">vs last 30 days</span>
            </div>
          </div>

          {/* Card 4: Agents Executed */}
          <div className="group relative bg-[#13161e] hover:bg-[#161a25] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-tr-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Agents Executed</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.totalAgentsExecuted.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stats.agentsTrend}%</span>
              <span className="text-muted-foreground font-normal ml-1">vs last 30 days</span>
            </div>
          </div>

          {/* Card 5: Avg. Response Time */}
          <div className="group relative bg-[#13161e] hover:bg-[#161a25] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-tr-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg. Response Time</span>
              <div className="p-2.5 rounded-xl bg-[#581c87]/20 text-[#c084fc] group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.avgResponseTime}s
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${
              stats.responseTimeTrend <= 0 ? "text-emerald-400" : "text-rose-500"
            }`}>
              {stats.responseTimeTrend <= 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(stats.responseTimeTrend)}%</span>
              <span className="text-muted-foreground font-normal ml-1">vs last 30 days</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 1: Charts (Queries Over Time + Queries By Category) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queries Over Time Chart */}
        <div className="lg:col-span-2 bg-[#13161e] border border-white/5 rounded-2xl p-6 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Queries Over Time</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Total Queries</span>
              </div>
            </div>

            {/* Daily/Hourly Toggle */}
            <div className="flex gap-1 bg-[#1c1f2a] rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => setQueriesRange("daily")}
                className={`text-[10px] px-2.5 py-1 rounded transition-colors font-medium ${
                  queriesRange === "daily"
                    ? "bg-[#6366f1] text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setQueriesRange("hourly")}
                className={`text-[10px] px-2.5 py-1 rounded transition-colors font-medium ${
                  queriesRange === "hourly"
                    ? "bg-[#6366f1] text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Hourly
              </button>
            </div>
          </div>

          <div className="h-64 w-full flex-1">
            {data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    queriesRange === "hourly"
                      ? data.queriesOverTime.slice(-6).map((q, i) => ({
                          ...q,
                          date: `${12 + i * 2}:00`,
                          queries: Math.round(q.queries / 12),
                        }))
                      : data.queriesOverTime
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={queriesRange === "daily" ? 4 : 0}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v)}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1c1f2a]/95 backdrop-blur border border-white/10 rounded-lg p-2.5 shadow-xl text-xs text-white">
                            <p className="text-muted-foreground mb-0.5">{label}</p>
                            <p className="font-semibold text-purple-400">
                              {payload[0].value?.toLocaleString()} Queries
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#purpleGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Queries by Category Donut Chart */}
        <div className="bg-[#13161e] border border-white/5 rounded-2xl p-6 shadow-soft flex flex-col">
          <h2 className="text-base font-semibold text-white mb-6">Queries by Category</h2>

          {data && (
            <div className="relative flex-1 flex flex-col justify-center items-center">
              {/* Outer Center Text container */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-7 flex flex-col items-center">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {stats?.totalQueries.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</span>
              </div>

              <div className="h-44 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.queriesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.queriesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#1c1f2a] border border-white/10 rounded-lg p-2 shadow-xl text-xs text-white">
                              <p className="font-semibold">{payload[0].name}</p>
                              <p className="text-muted-foreground">
                                {payload[0].value?.toLocaleString()} queries ({payload[0].payload.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="w-full space-y-2 text-xs">
                {data.queriesByCategory.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        {cat.value.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground/60 w-10 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Top Docs + Engagement + Latency Line ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Documents Card */}
        <div className="bg-[#13161e] border border-white/5 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Top Documents</h2>
              <div className="flex items-center text-xs text-muted-foreground hover:text-white cursor-pointer transition-colors bg-[#1c1f2a] px-2.5 py-1 rounded-lg border border-white/5">
                <span>By Queries</span>
                <ChevronDown className="w-3 h-3 ml-1.5" />
              </div>
            </div>

            <div className="space-y-4">
              {data?.topDocuments.map((doc, idx) => (
                <div key={doc.name + idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Document Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getDocumentColor(doc.type)}`}>
                      {getDocumentLabel(doc.type)}
                    </span>
                    <span className="text-sm text-gray-300 font-medium truncate group-hover:text-white transition-colors" title={doc.name}>
                      {doc.name}
                    </span>
                  </div>
                  <span className="text-xs text-white font-bold shrink-0">
                    {doc.queries.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/documents"
            className="mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View all documents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* User Engagement Radial Progress */}
        <div className="bg-[#13161e] border border-white/5 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">User Engagement</h2>
              <div className="flex items-center text-xs text-muted-foreground hover:text-white cursor-pointer transition-colors bg-[#1c1f2a] px-2.5 py-1 rounded-lg border border-white/5">
                <span>This Month</span>
                <ChevronDown className="w-3 h-3 ml-1.5" />
              </div>
            </div>

            {data && (
              <div className="flex items-center gap-5 my-3">
                {/* Visual Radial Score Indicator */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#ffffff05"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#6366f1"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={2 * Math.PI * 46 * (1 - data.userEngagement.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-white">
                      {data.userEngagement.score}%
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Score</span>
                  </div>
                </div>

                {/* Sub-Metrics list */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Active Users</span>
                    <div className="flex flex-col items-end">
                      <span className="text-white font-bold">{data.userEngagement.activeUsers}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                        +{data.userEngagement.activeTrend}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                    <span className="text-muted-foreground font-medium">Returning Users</span>
                    <div className="flex flex-col items-end">
                      <span className="text-white font-bold">{data.userEngagement.returningUsers}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                        +{data.userEngagement.returningTrend}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                    <span className="text-muted-foreground font-medium">New Users</span>
                    <div className="flex flex-col items-end">
                      <span className="text-white font-bold">{data.userEngagement.newUsers}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                        +{data.userEngagement.newTrend}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground bg-white/5 border border-white/5 rounded-xl p-3 leading-relaxed">
            Engagement score is based on user activity, queries, and feedback.
          </p>
        </div>

        {/* Avg Response Time Chart */}
        <div className="bg-[#13161e] border border-white/5 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Response Time (Avg.)</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Response Time</span>
              </div>
            </div>
            <div className="flex items-center text-xs text-muted-foreground hover:text-white cursor-pointer transition-colors bg-[#1c1f2a] px-2.5 py-1 rounded-lg border border-white/5">
              <span>Daily</span>
              <ChevronDown className="w-3 h-3 ml-1.5" />
            </div>
          </div>

          <div className="h-44 w-full mb-2">
            {data && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.responseTimeOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 8]}
                    tickFormatter={(v) => `${v}s`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1c1f2a]/95 border border-white/10 rounded-lg p-2 shadow-xl text-xs text-white">
                            <p className="text-muted-foreground mb-0.5">{label}</p>
                            <p className="font-semibold text-blue-400">
                              {payload[0].value}s (Avg)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {stats && (
            <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3.5">
              <span className="text-muted-foreground">Current Avg Response</span>
              <span className="text-white font-extrabold text-sm">{stats.avgResponseTime}s</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Insights & Recommendations ──────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Insights & Recommendations</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.insights.map((insight, index) => {
            let borderClass = "border-l-4 border-l-emerald-500 bg-emerald-500/5 text-white";
            let icon = <TrendingUp className="w-4 h-4 text-emerald-400" />;

            if (insight.type === "info") {
              borderClass = "border-l-4 border-l-blue-500 bg-blue-500/5 text-white";
              icon = <Info className="w-4 h-4 text-blue-400" />;
            } else if (insight.type === "warning") {
              borderClass = "border-l-4 border-l-amber-500 bg-amber-500/5 text-white";
              icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
            } else if (insight.type === "purple") {
              borderClass = "border-l-4 border-l-purple-500 bg-purple-500/5 text-white";
              icon = <Sparkles className="w-4 h-4 text-purple-400" />;
            }

            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-xl border border-white/5 shadow-soft transition-all duration-300 hover:bg-white/[0.02] ${borderClass}`}
              >
                <div className="mt-0.5 shrink-0">{icon}</div>
                <p className="text-xs leading-relaxed text-gray-300 font-medium">
                  {insight.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
