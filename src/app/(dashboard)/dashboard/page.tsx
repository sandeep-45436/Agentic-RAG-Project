"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/insforge/client";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileText, MessageSquare, Zap, Users, ArrowUpRight,
  ArrowDownRight, Loader2, UploadCloud, Bot, Database,
  BarChart2, ChevronRight, RefreshCw, Sparkles, Building,
  GraduationCap, ShieldCheck, CheckCircle2, XCircle, BookOpen,
  Calendar, Layers, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    authorizedDeptDocs?: number;
  };
  academicContext?: {
    isStudent: boolean;
    isFaculty: boolean;
    role: string;
    studentNumber: string;
    major: string;
    gpa: number;
    academicStatus: string;
    enrolledCoursesCount: number;
    departmentId: string | null;
    departmentCode: string;
    departmentName: string;
    authorizedDocsCount: number;
    recentDepartmentDocs: Array<{
      id: string;
      fileName: string;
      visibility: string;
      departmentCode: string;
      departmentName: string;
      processingStatus: string;
      createdAt: string;
    }>;
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
  subtext,
  badge,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  subtext?: string;
  badge?: string;
}) {
  return (
    <div className="bg-[#141720] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`${iconBg} p-3 rounded-xl shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
            {badge}
          </Badge>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</p>
        {subtext && <p className="text-[11px] text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const insforge = createClient();
    insforge.auth.getCurrentUser().then((res: any) => {
      if (res?.error || !res?.data?.user) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-[#141720] border border-red-500/20 rounded-2xl p-8 max-w-md text-center shadow-xl">
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
  const ac = data?.academicContext;
  const deptCode = ac?.departmentCode || "CSE";
  const deptName = ac?.departmentName || "Computer Science & Engineering";
  const studentName = data?.user?.name || "Student Scholar";
  const authDocs = ac?.authorizedDocsCount ?? s?.authorizedDeptDocs ?? s?.totalDocs ?? 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pb-12 px-1 space-y-6">
      
      {/* ── ACADEMIC HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950/70 to-slate-900 border border-indigo-500/20 p-6 lg:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs font-semibold px-2.5 py-0.5">
                Academic Year 2026-2027 • Fall Term
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                {ac?.academicStatus || "Good Standing"}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {ac?.studentNumber || "STU-CS-101"}
              </span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {greeting()}, {studentName}
            </h1>
            
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              <span className="font-semibold text-indigo-300">{deptName} ({deptCode})</span>
              {" • "}
              <span>{ac?.enrolledCoursesCount || 5} Active Enrolled Courses</span>
              {" • "}
              <span className="text-emerald-400 font-medium">Department Retrieval Scope Active</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 text-xs font-semibold px-4 py-2.5 transition-all gap-2"
            >
              <Bot className="h-4 w-4" />
              Ask Department AI
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center justify-center border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all gap-2"
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
              Browse Notes
            </Link>
            <button
              onClick={load}
              className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 ACADEMIC STAT CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          iconBg="bg-indigo-600"
          label="Authorized Knowledge Base"
          value={fmtNum(authDocs)}
          subtext={`Syllabi & Notes in ${deptCode} + University-wide`}
          badge="Live Synced"
        />
        <StatCard
          icon={Building}
          iconBg="bg-purple-600"
          label="Active Knowledge Scope"
          value={deptCode}
          subtext={deptName}
          badge="Scoped"
        />
        <StatCard
          icon={MessageSquare}
          iconBg="bg-blue-600"
          label="Grounded AI Consultations"
          value={fmtNum(s?.totalConversations ?? 0)}
          subtext="Verified Page-Level Citations"
        />
        <StatCard
          icon={Database}
          iconBg="bg-emerald-600"
          label="Cognitive Subsystems"
          value="Hybrid RAG"
          subtext="Qdrant + BM25 + Neo4j Graph"
          badge="Online"
        />
      </div>

      {/* ── TWO-COLUMN DETAILED VIEW ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 2 Cols: Recent Department Materials & Activity ──────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Department Course Materials Feed */}
          <div className="bg-[#141720] border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Recent {deptCode} Course Materials & Syllabi
                </h3>
              </div>
              <Link
                href="/documents"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {(!ac?.recentDepartmentDocs || ac.recentDepartmentDocs.length === 0) ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  No materials uploaded yet for this department.
                </div>
              ) : (
                ac.recentDepartmentDocs.map((doc) => (
                  <div key={doc.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-500/15 rounded-lg shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{doc.fileName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            {doc.departmentCode}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {timeAgo(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/chat`}
                      className="shrink-0 text-[11px] text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-3 py-1.5 rounded-lg font-medium transition-all"
                    >
                      Ask AI
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#141720] border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Live Knowledge Platform Activity
              </h3>
            </div>

            <div className="space-y-2.5">
              {(!data?.activity || data.activity.length === 0) ? (
                <p className="text-xs text-gray-500 py-4 text-center">No recent activity.</p>
              ) : (
                data.activity.map((act) => (
                  <div key={act.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${act.type === "document" ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"}`}>
                        {act.type === "document" ? <FileText className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{act.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{act.sublabel}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(act.time)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Col: Scope Policy Card & Quick Shortcuts ──────────── */}
        <div className="space-y-6">

          {/* Active Knowledge Scope Card */}
          <div className="bg-gradient-to-b from-[#161a29] to-[#121522] border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Access Authorization Policy
                </h3>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
              <p className="text-xs text-gray-300 font-medium">Your Scoped Retrieval Boundary:</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{deptCode} Department Documents</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>University-Wide Regulations</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Other Academic Departments (Blocked)</span>
                </div>
              </div>
            </div>

            <Link
              href="/chat"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold py-2.5 rounded-xl transition-all"
            >
              Open Scoped Chat Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Academic Shortcuts */}
          <div className="bg-[#141720] border border-white/5 rounded-2xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              University Subsystems
            </h3>

            <div className="space-y-2">
              <Link
                href="/chat"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/15 rounded-lg text-blue-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300">Department AI Chat</p>
                    <p className="text-[10px] text-gray-400">Grounded Q&A with page citations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/documents"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/15 rounded-lg text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300">Academic Repository</p>
                    <p className="text-[10px] text-gray-400">Course notes & regulations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/faculty/timetables"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300">Class & Lab Schedules</p>
                    <p className="text-[10px] text-gray-400">Weekly timetable matrix</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/faculty/login"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/15 rounded-lg text-emerald-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-indigo-300">Faculty Portal Gateway</p>
                    <p className="text-[10px] text-gray-400">Instructor auth & document uploads</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
