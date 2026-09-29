"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatedBackground } from "@/components/animated-background";
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
  Calendar, Layers, ArrowRight, Eye, Download, User, BookMarked,
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
      courseCode?: string;
      visibility: string;
      departmentCode: string;
      departmentName: string;
      facultyAuthor?: string;
      facultyTitle?: string;
      fileSizeText?: string;
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
  cardBg,
  borderColor,
  label,
  value,
  subtext,
  badge,
  badgeClass,
}: {
  icon: React.ElementType;
  iconBg: string;
  cardBg?: string;
  borderColor?: string;
  label: string;
  value: string;
  subtext?: string;
  badge?: string;
  badgeClass?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm border ${cardBg || "bg-white/95"} ${borderColor || "border-slate-200/90"} backdrop-blur-xl`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`${iconBg} p-3 rounded-2xl shrink-0 shadow-md text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass || "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {badge}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">{label}</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight font-mono">{value}</p>
        {subtext && <p className="text-[11px] text-slate-600 mt-1 font-medium leading-tight">{subtext}</p>}
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
  
  // Document Viewer Modal State
  const [viewerDocId, setViewerDocId] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const openDocViewer = async (id: string) => {
    setViewerDocId(id);
    setLoadingDoc(true);
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (data.document) {
        setViewerDoc(data.document);
      }
    } catch (err) {
      console.error("Failed to load document preview:", err);
    } finally {
      setLoadingDoc(false);
    }
  };

  useEffect(() => {
    const insforge = createClient();
    insforge.auth.getCurrentUser().then((res: any) => {
      if (res?.error || !res?.data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const load = useCallback((deptOverride?: string) => {
    setLoading(true);
    setError(null);
    const targetDept = deptOverride !== undefined ? deptOverride : selectedDept;
    const url = targetDept ? `/api/dashboard/stats?department=${encodeURIComponent(targetDept)}` : "/api/dashboard/stats";
    fetch(url)
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
  }, [selectedDept]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-white border border-red-200 rounded-3xl p-8 max-w-md text-center shadow-xl">
          <h2 className="text-lg font-bold text-red-600 mb-2">Connection Issue</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => load()}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-sm font-semibold transition-all shadow-md shadow-indigo-600/25"
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
    <AnimatedBackground>
    <div className="space-y-6 pb-12 font-sans">
      {/* ── STUDENT ACADEMIC OPERATIONS SUB-FEATURES HUB ────────────────── */}
      <div className="bg-white/95 rounded-3xl border border-indigo-100/90 p-5 sm:p-6 shadow-sm shadow-indigo-100/30 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Student Academic Modules & Resources Hub</h2>
              <p className="text-xs text-slate-500">Access your department faculty materials, AI study assistant, notes repository, and research tools</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs w-fit">
            ✨ 5 Student Sub-Features Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <a
            href="#dept-feed"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Live Feed</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Faculty Uploads Feed</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Syllabi, course handouts & lecture notes</p>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-100/80 flex items-center text-[11px] font-bold text-indigo-600">
              <span>Jump to Feed</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          <Link
            href="/chat"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/40 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">RAG AI</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">AI Academic Chat</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Ask questions on textbooks, syllabus & slides</p>
            </div>
            <div className="mt-3 pt-2 border-t border-purple-100/80 flex items-center text-[11px] font-bold text-purple-600">
              <span>Start Chat</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/documents"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/40 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Docs</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Browse Notes & Docs</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Searchable textbook chunks & question banks</p>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-100/80 flex items-center text-[11px] font-bold text-blue-600">
              <span>Browse Documents</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/knowledge-bases"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Repositories</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Knowledge Bases</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Indexed department collections & curriculum</p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-100/80 flex items-center text-[11px] font-bold text-emerald-600">
              <span>View Repositories</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/research"
            className="group flex flex-col justify-between p-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <BookMarked className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Research</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Research Workspace</p>
              <p className="text-[11px] text-slate-600 mt-0.5">AI literature analysis & project research</p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-100/80 flex items-center text-[11px] font-bold text-amber-600">
              <span>Open Workspace</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── ALITS STUDENT INSTITUTIONAL BRAND HEADER ──────────────────────── */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/90 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative h-12 w-36 sm:w-44 flex items-center justify-start">
            <img
              src="/images/college-logo.png"
              alt="ALITS University Logo"
              className="h-10 object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block tracking-tight">
              Anantha Lakshmi Institute of Technology & Sciences
            </span>
            <span className="text-[11px] sm:text-xs text-indigo-600 font-semibold flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Student Academic Intelligence & Learning Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-600/25 text-xs font-bold px-4 py-2.5 transition-all hover:scale-105"
          >
            <User className="h-4 w-4" />
            My Student Profile ({ac?.studentNumber || "STU-CSE-001"})
            <ChevronRight className="h-3.5 w-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* ── ACADEMIC HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 hover:bg-white/25 text-white border-white/30 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                🎓 Academic Year 2026-2027 • Fall Term
              </Badge>
              <Badge className="bg-emerald-400/30 text-white border-emerald-300/40 text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
                ✓ {ac?.academicStatus || "Good Standing"}
              </Badge>
              <span className="text-xs text-white/80 font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md">
                {ac?.studentNumber || "STU-CS-101"}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              {greeting()}, {studentName}
            </h1>
            
            <p className="text-sm text-indigo-50 max-w-xl leading-relaxed font-medium">
              <span className="font-bold text-white bg-white/15 px-2 py-0.5 rounded-md">{deptName} ({deptCode})</span>
              {" • "}
              <span>{ac?.enrolledCoursesCount || 5} Active Enrolled Courses</span>
              {" • "}
              <span className="text-emerald-200 font-semibold">Department Retrieval Scope Active</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl shadow-lg shadow-black/10 text-xs font-bold px-5 py-3 transition-all gap-2 hover:scale-105"
            >
              <Bot className="h-4 w-4 text-indigo-600" />
              Ask Department AI
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center justify-center border border-white/40 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold px-4 py-3 transition-all gap-2 backdrop-blur-md"
            >
              <BookOpen className="h-4 w-4" />
              Browse Notes
            </Link>
            <button
              onClick={() => load()}
              className="p-3 text-white hover:text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl transition-all backdrop-blur-md"
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
          iconBg="bg-gradient-to-tr from-indigo-600 to-blue-500"
          cardBg="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40"
          borderColor="border-indigo-100"
          label="Authorized Knowledge Base"
          value={fmtNum(authDocs)}
          subtext={`Syllabi & Notes in ${deptCode} + University-wide`}
          badge="Live Synced"
          badgeClass="bg-emerald-100 text-emerald-800 border-emerald-300"
        />
        <StatCard
          icon={Building}
          iconBg="bg-gradient-to-tr from-purple-600 to-fuchsia-500"
          cardBg="bg-gradient-to-br from-purple-50/60 via-white to-fuchsia-50/40"
          borderColor="border-purple-100"
          label="Active Knowledge Scope"
          value={deptCode}
          subtext={deptName}
          badge="Scoped"
          badgeClass="bg-purple-100 text-purple-800 border-purple-300"
        />
        <StatCard
          icon={MessageSquare}
          iconBg="bg-gradient-to-tr from-blue-600 to-cyan-500"
          cardBg="bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/40"
          borderColor="border-blue-100"
          label="Grounded AI Consultations"
          value={fmtNum(s?.totalConversations ?? 0)}
          subtext="Verified Page-Level Citations"
          badge="Grounded"
          badgeClass="bg-blue-100 text-blue-800 border-blue-300"
        />
        <StatCard
          icon={Database}
          iconBg="bg-gradient-to-tr from-emerald-600 to-teal-500"
          cardBg="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40"
          borderColor="border-emerald-100"
          label="Cognitive Subsystems"
          value="Hybrid RAG"
          subtext="Qdrant + BM25 + Neo4j Graph"
          badge="Online"
          badgeClass="bg-emerald-100 text-emerald-800 border-emerald-300"
        />
      </div>

      {/* ── TWO-COLUMN DETAILED VIEW ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 2 Cols: Recent Department Materials & Activity ──────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Department Course Materials Feed */}
          <div id="dept-feed" className="bg-white/95 border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {deptCode} Faculty Course Uploads & Syllabi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official documents & lecture notes uploaded by {deptName} faculty
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/faculty/documents"
                  className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs"
                >
                  + Upload Material
                </Link>
                <Link
                  href="/documents"
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                >
                  All Docs <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Department Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Switch Dept:</span>
              {[
                { code: "CSE", name: "Computer Science" },
                { code: "ECE", name: "Electronics" },
                { code: "MECH", name: "Mechanical" },
                { code: "EEE", name: "Electrical" },
                { code: "AIDS", label: "AI&DS", name: "AI & Data Sci" },
              ].map((d) => {
                const label = (d as any).label || d.code;
                const isActive = (selectedDept ? selectedDept === d.code : deptCode.toUpperCase() === d.code.toUpperCase());
                return (
                  <button
                    key={d.code}
                    onClick={() => {
                      setSelectedDept(d.code);
                      load(d.code);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-slate-100">
              {(!ac?.recentDepartmentDocs || ac.recentDepartmentDocs.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No materials uploaded yet for this department.
                </div>
              ) : (
                ac.recentDepartmentDocs.map((doc) => (
                  <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/30 px-3 rounded-2xl transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5 shadow-xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{doc.fileName}</p>
                        {doc.facultyAuthor && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            Uploaded by <span className="font-semibold text-slate-900">{doc.facultyAuthor}</span>
                            {doc.facultyTitle ? ` • ${doc.facultyTitle}` : ""}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {doc.courseCode && (
                            <span className="text-[10px] font-bold text-indigo-700 font-mono bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                              {doc.courseCode}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-700 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                            {doc.departmentCode}
                          </span>
                          {doc.fileSizeText && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {doc.fileSizeText}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium">
                            {timeAgo(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => openDocViewer(doc.id)}
                        className="text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 border border-slate-200 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-600" /> View
                      </button>
                      <Link
                        href={`/chat`}
                        className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm shadow-indigo-600/20"
                      >
                        Ask AI
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Live Knowledge Platform Activity
              </h3>
            </div>

            <div className="space-y-2.5">
              {(!data?.activity || data.activity.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent activity.</p>
              ) : (
                data.activity.map((act) => (
                  <div key={act.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${act.type === "document" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {act.type === "document" ? <FileText className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{act.label}</p>
                        <p className="text-xs text-slate-600 truncate">{act.sublabel}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium shrink-0">{timeAgo(act.time)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Col: Scope Policy Card & Quick Shortcuts ──────────── */}
        <div className="space-y-6">

          {/* Active Knowledge Scope Card */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border border-indigo-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Access Authorization Policy
                </h3>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="bg-white rounded-2xl p-4 border border-indigo-100 space-y-2.5 shadow-xs">
              <p className="text-xs text-slate-800 font-bold">Your Scoped Retrieval Boundary:</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{deptCode} Department Documents</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>University-Wide Regulations</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                  <XCircle className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Other Academic Departments (Blocked)</span>
                </div>
              </div>
            </div>

            <Link
              href="/chat"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-2xl shadow-md shadow-indigo-600/25 transition-all hover:scale-102"
            >
              Open Scoped Chat Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Academic Shortcuts */}
          <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              University Subsystems
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/chat"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Department AI Chat</p>
                    <p className="text-[11px] text-slate-500">Grounded Q&A with page citations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              <Link
                href="/documents"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Academic Repository</p>
                    <p className="text-[11px] text-slate-500">Course notes & regulations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </Link>

              <Link
                href="/faculty/timetables"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Class & Lab Schedules</p>
                    <p className="text-[11px] text-slate-500">Weekly timetable matrix</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Link>

              <Link
                href="/faculty/login"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Faculty Portal Gateway</p>
                    <p className="text-[11px] text-slate-500">Instructor auth & document uploads</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerDocId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col popup-card-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {viewerDoc?.fileName || "Loading Document..."}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewerDoc?.department?.name || deptName} • {viewerDoc?.visibility || "DEPARTMENT"} Scope
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setViewerDocId(null); setViewerDoc(null); }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {loadingDoc ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Loading document metadata and extracted chunks...</span>
              </div>
            ) : viewerDoc ? (
              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-sans font-semibold uppercase">Total Size</span>
                    <span className="font-bold text-slate-900 text-sm">{(viewerDoc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-sans font-semibold uppercase">RAG Chunks</span>
                    <span className="font-bold text-indigo-600 text-sm">{viewerDoc._count?.chunks || viewerDoc.chunks?.length || 0} Chunks</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-sans font-semibold uppercase">Status</span>
                    <span className="font-bold text-emerald-600 text-sm">{viewerDoc.processingStatus}</span>
                  </div>
                </div>

                {/* Chunks Preview */}
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold text-slate-700 block">
                    Extracted Text Chunks ({viewerDoc.chunks?.length || 0} displayed)
                  </span>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {viewerDoc.chunks && viewerDoc.chunks.length > 0 ? (
                      viewerDoc.chunks.map((c: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-mono text-indigo-600 block font-bold">
                            Chunk {c.chunkIndex + 1} {c.pageNumber ? `(Page ${c.pageNumber})` : ""} · {c.tokenCount} Tokens
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                            {c.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic py-2">No chunks indexed.</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <Link
                    href={`/chat`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25"
                  >
                    <Bot className="w-4 h-4" /> Ask Questions in Chat
                  </Link>

                  {viewerDoc.signedUrl && (
                    <a
                      href={viewerDoc.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Full Document
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-rose-500 text-center py-6 font-medium">Failed to load document details.</p>
            )}
          </div>
        </div>
      )}
    </div>
    </AnimatedBackground>
  );
}
