"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import {
  FileText, MessageSquare, Zap, Users, ArrowUpRight,
  ArrowDownRight, Loader2, UploadCloud, Bot, Database,
  BarChart2, ChevronRight, RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  stats: {
    totalDocs: number;
    docsTrend: number | null;
    totalConversations: number;
    conversationsTrend: number | null;
    totalTokens: number;
    tokensTrend: number | null;
    totalMembers: number;
    membersTrend: number | null;
  };
  tokenChart: { date: string; tokens: number }[];
  storage: {
    docBytes: number;
    embeddingBytes: number;
    kbBytes: number;
    otherBytes: number;
    totalBytes: number;
    limitBytes: number;
  };
  activity: {
    id: string;
    type: "document" | "chat";
    label: string;
    sublabel: string;
    time: string;
  }[];
  topKBs: { id: string; name: string; runs: number }[];
  user: { email: string; name: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function fmtBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
  if (b >= 1e3) return (b / 1e3).toFixed(1) + " KB";
  return b + " B";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  trend,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  trend: number | null;
}) {
  const up = trend === null ? null : trend >= 0;
  return (
    <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
      <div className={`${iconBg} p-3 rounded-xl shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {trend !== null && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
    </div>
  );
}

// ── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({
  type,
  label,
  sublabel,
  time,
}: {
  type: "document" | "chat";
  label: string;
  sublabel: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div
        className={`p-2 rounded-lg shrink-0 ${
          type === "document" ? "bg-red-500/15" : "bg-blue-500/15"
        }`}
      >
        {type === "document" ? (
          <FileText className="w-4 h-4 text-red-400" />
        ) : (
          <MessageSquare className="w-4 h-4 text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{label}</p>
        <p className="text-xs text-gray-400 truncate">{sublabel}</p>
      </div>
      <span className="text-xs text-gray-500 shrink-0">{timeAgo(time)}</span>
    </div>
  );
}

// ── Donut tooltip ─────────────────────────────────────────────────────────────

const DonutTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-gray-300">{fmtBytes(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────────────────

const STORAGE_COLORS = ["#6366f1", "#3b82f6", "#22c55e", "#f59e0b"];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"30d" | "7d">("30d");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/stats")
      .then(async (r) => {
        const contentType = r.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          // Redirected to login page (unauthorized)
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.error) {
          throw new Error(d.error);
        }
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard load failed:", err);
        setError(err.message || "Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const chartData =
    chartRange === "7d" && data?.tokenChart
      ? data.tokenChart.slice(-7)
      : data?.tokenChart ?? [];

  const storageDonut = data?.storage
    ? [
        { name: "Documents", value: data.storage.docBytes },
        { name: "Embeddings", value: data.storage.embeddingBytes },
        { name: "Knowledge Graph", value: data.storage.kbBytes },
        { name: "Others", value: data.storage.otherBytes },
      ]
    : [];

  const storagePct = data?.storage
    ? Math.min(
        Number(((data.storage.totalBytes / data.storage.limitBytes) * 100).toFixed(1)),
        100
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-[#1a1f2e] border border-red-500/20 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Connection Issue</h2>
          <p className="text-sm text-gray-300 mb-6">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-sm font-medium transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pb-12 px-1">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting()}, {data?.user?.name || "User"} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Here's what's happening with your workspace today.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FileText}
          iconBg="bg-indigo-500/80"
          label="Total Documents"
          value={fmtNum(s?.totalDocs ?? 0)}
          trend={s?.docsTrend ?? null}
        />
        <StatCard
          icon={MessageSquare}
          iconBg="bg-blue-500/80"
          label="Total Conversations"
          value={fmtNum(s?.totalConversations ?? 0)}
          trend={s?.conversationsTrend ?? null}
        />
        <StatCard
          icon={Zap}
          iconBg="bg-emerald-500/80"
          label="Tokens Used"
          value={fmtNum(s?.totalTokens ?? 0)}
          trend={s?.tokensTrend ?? null}
        />
        <StatCard
          icon={Users}
          iconBg="bg-amber-500/80"
          label="Active Users"
          value={fmtNum(s?.totalMembers ?? 0)}
          trend={s?.membersTrend ?? null}
        />
      </div>

      {/* ── Token Usage Chart + Recent Activity ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* Token chart */}
        <div className="lg:col-span-3 bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Token Usage</h2>
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {(["7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${
                    chartRange === r
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Last {r === "7d" ? "7 days" : "30 days"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={chartRange === "30d" ? 4 : 0}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtNum(v)}
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
                      <p className="text-gray-400 mb-1">{label}</p>
                      <p className="font-semibold">{fmtNum(payload[0].value as number)} tokens</p>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#tokenGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            <Link
              href="/documents"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </Link>
          </div>
          {!data?.activity.length ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
              No activity yet
            </div>
          ) : (
            data.activity.map((a) => (
              <ActivityRow key={a.id} {...a} />
            ))
          )}
        </div>
      </div>

      {/* ── Bottom Row: Top KBs + Storage + Quick Actions ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Knowledge Bases */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Knowledge Bases</h2>
            <Link
              href="/knowledge-bases"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </Link>
          </div>
          {!data?.topKBs.length ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
              <Database className="w-7 h-7 opacity-30" />
              No knowledge bases yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.topKBs.map((kb, i) => (
                <div key={kb.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{
                      background: ["#6366f1","#3b82f6","#22c55e","#f59e0b","#ec4899"][i % 5],
                    }}
                  >
                    {kb.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{kb.name}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{kb.runs} docs</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storage Usage */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-white">Storage Usage</h2>
            <span className="text-xs text-gray-400">
              {data ? `${fmtBytes(data.storage.totalBytes)} / ${fmtBytes(data.storage.limitBytes)}` : "—"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">{storagePct}% used</p>

          {/* Donut */}
          {data && (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie
                    data={storageDonut}
                    innerRadius={32}
                    outerRadius={52}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {storageDonut.map((_, i) => (
                      <Cell key={i} fill={STORAGE_COLORS[i % STORAGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {storageDonut.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: STORAGE_COLORS[i] }}
                    />
                    <span className="text-xs text-gray-400 flex-1 truncate">{d.name}</span>
                    <span className="text-xs text-white font-medium">{fmtBytes(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/usage"
            className="mt-4 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              {
                href: "/documents",
                icon: UploadCloud,
                label: "Upload Document",
                color: "text-indigo-400 bg-indigo-500/10",
              },
              {
                href: "/chat",
                icon: MessageSquare,
                label: "Start New Chat",
                color: "text-blue-400 bg-blue-500/10",
              },
              {
                href: "/knowledge-bases",
                icon: Database,
                label: "Create Knowledge Base",
                color: "text-emerald-400 bg-emerald-500/10",
              },
              {
                href: "/usage",
                icon: BarChart2,
                label: "View Analytics",
                color: "text-amber-400 bg-amber-500/10",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">
                  {action.label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
