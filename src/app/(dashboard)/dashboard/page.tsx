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
    <div className="bg-[#121824] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`${iconBg} p-2.5 rounded-xl shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
            {badge}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1 tracking-tight font-mono">{value}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-1 leading-tight">{subtext}</p>}
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-[#121824] border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Connection Issue</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => load()}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-sm font-medium transition-colors shadow-lg"
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
      <div className="bg-[#121824] rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Student Academic Modules & Resources Hub</h2>
              <p className="text-[11px] text-slate-400">Access your department faculty materials, AI study assistant, notes repository, and research tools</p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 w-fit">
            5 Student Sub-Features Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <a
            href="#dept-feed"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-indigo-500/40 hover:bg-[#0E1422] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Live Feed</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">Faculty Uploads Feed</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Syllabi, course handouts & lecture notes</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center text-[10px] font-semibold text-indigo-400">
              <span>Jump to Feed</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </a>

          <Link
            href="/chat"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-purple-500/40 hover:bg-[#0E1422] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">RAG AI</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">AI Academic Chat</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ask questions on textbooks, syllabus & slides</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center text-[10px] font-semibold text-purple-400">
              <span>Start Chat</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/documents"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-blue-500/40 hover:bg-[#0E1422] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Docs</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Browse Notes & Docs</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Searchable textbook chunks & question banks</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center text-[10px] font-semibold text-blue-400">
              <span>Browse Documents</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/knowledge-bases"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-emerald-500/40 hover:bg-[#0E1422] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Repositories</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Knowledge Bases</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Indexed department collections & curriculum</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center text-[10px] font-semibold text-emerald-400">
              <span>View Repositories</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/research"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-[#0B0F17] hover:border-amber-500/40 hover:bg-[#0E1422] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <BookMarked className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Research</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Research Workspace</p>
              <p className="text-[11px] text-slate-400 mt-0.5">AI literature analysis & project research</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center text-[10px] font-semibold text-amber-400">
              <span>Open Workspace</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── ALITS STUDENT INSTITUTIONAL BRAND HEADER ──────────────────────── */}
      <div className="bg-[#121824] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="relative h-11 w-36 sm:w-44 flex items-center justify-start">
            <img
              src="/images/college-logo.png"
              alt="ALITS University Logo"
              className="h-10 object-contain drop-shadow-sm brightness-110"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-xs font-bold text-white block tracking-tight">
              Anantha Lakshmi Institute of Technology & Sciences
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              Student Academic Intelligence & Learning Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm text-xs font-semibold px-4 py-2.5 transition-all"
          >
            <User className="h-4 w-4" />
            My Student Profile ({ac?.studentNumber || "STU-CSE-001"})
            <ChevronRight className="h-3.5 w-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* ── ACADEMIC HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121824] via-[#151D2C] to-[#121824] border border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-xs font-semibold px-2.5 py-0.5">
                Academic Year 2026-2027 • Fall Term
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs">
                {ac?.academicStatus || "Good Standing"}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {ac?.studentNumber || "STU-CS-101"}
              </span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {greeting()}, {studentName}
            </h1>
            
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              <span className="font-semibold text-slate-200">{deptName} ({deptCode})</span>
              {" • "}
              <span>{ac?.enrolledCoursesCount || 5} Active Enrolled Courses</span>
              {" • "}
              <span className="text-emerald-400 font-medium">Department Retrieval Scope Active</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm text-xs font-semibold px-4 py-2.5 transition-all gap-2"
            >
              <Bot className="h-4 w-4" />
              Ask Department AI
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center justify-center border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all gap-2"
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
              Browse Notes
            </Link>
            <button
              onClick={() => load()}
              className="p-2.5 text-slate-400 hover:text-white bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
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
          <div id="dept-feed" className="bg-[#121824] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {deptCode} Faculty Course Uploads & Syllabi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Official documents & lecture notes uploaded by {deptName} faculty
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/faculty/documents"
                  className="text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-medium transition-all"
                >
                  + Upload Material
                </Link>
                <Link
                  href="/documents"
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                >
                  All Docs <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Department Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-2 border-b border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Switch Dept:</span>
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-[#0B0F17] hover:bg-slate-800 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-slate-800/80">
              {(!ac?.recentDepartmentDocs || ac.recentDepartmentDocs.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No materials uploaded yet for this department.
                </div>
              ) : (
                ac.recentDepartmentDocs.map((doc) => (
                  <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{doc.fileName}</p>
                        {doc.facultyAuthor && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Uploaded by <span className="font-semibold text-slate-300">{doc.facultyAuthor}</span>
                            {doc.facultyTitle ? ` • ${doc.facultyTitle}` : ""}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {doc.courseCode && (
                            <span className="text-[10px] font-bold text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                              {doc.courseCode}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono bg-[#0B0F17] px-1.5 py-0.5 rounded border border-slate-800">
                            {doc.departmentCode}
                          </span>
                          {doc.fileSizeText && (
                            <span className="text-[10px] text-slate-500">
                              {doc.fileSizeText}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {timeAgo(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => openDocViewer(doc.id)}
                        className="text-[11px] text-slate-300 hover:text-white bg-[#0B0F17] hover:bg-slate-800 px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 border border-slate-800 shadow-xs"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" /> View
                      </button>
                      <Link
                        href={`/chat`}
                        className="text-[11px] text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-semibold transition-all border border-indigo-500/20 shadow-xs"
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
          <div className="bg-[#121824] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Live Knowledge Platform Activity
              </h3>
            </div>

            <div className="space-y-2.5">
              {(!data?.activity || data.activity.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent activity.</p>
              ) : (
                data.activity.map((act) => (
                  <div key={act.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/80 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${act.type === "document" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {act.type === "document" ? <FileText className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{act.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{act.sublabel}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(act.time)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Col: Scope Policy Card & Quick Shortcuts ──────────── */}
        <div className="space-y-6">

          {/* Active Knowledge Scope Card */}
          <div className="bg-[#121824] border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Access Authorization Policy
                </h3>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="bg-[#0B0F17] rounded-xl p-3 border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300 font-medium">Your Scoped Retrieval Boundary:</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{deptCode} Department Documents</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>University-Wide Regulations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Other Academic Departments (Blocked)</span>
                </div>
              </div>
            </div>

            <Link
              href="/chat"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold py-2.5 rounded-xl transition-all"
            >
              Open Scoped Chat Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Academic Shortcuts */}
          <div className="bg-[#121824] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              University Subsystems
            </h3>

            <div className="space-y-2">
              <Link
                href="/chat"
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400">Department AI Chat</p>
                    <p className="text-[10px] text-slate-400">Grounded Q&A with page citations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </Link>

              <Link
                href="/documents"
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400">Academic Repository</p>
                    <p className="text-[10px] text-slate-400">Course notes & regulations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </Link>

              <Link
                href="/faculty/timetables"
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400">Class & Lab Schedules</p>
                    <p className="text-[10px] text-slate-400">Weekly timetable matrix</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </Link>

              <Link
                href="/faculty/login"
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400">Faculty Portal Gateway</p>
                    <p className="text-[10px] text-slate-400">Instructor auth & document uploads</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerDocId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {viewerDoc?.fileName || "Loading Document..."}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {viewerDoc?.department?.name || deptName} • {viewerDoc?.visibility || "DEPARTMENT"} Scope
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setViewerDocId(null); setViewerDoc(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {loadingDoc ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Loading document metadata and extracted chunks...</span>
              </div>
            ) : viewerDoc ? (
              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 bg-[#0B0F17] p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Size</span>
                    <span className="font-bold text-slate-200">{(viewerDoc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">RAG Chunks</span>
                    <span className="font-bold text-indigo-400">{viewerDoc._count?.chunks || viewerDoc.chunks?.length || 0} Chunks</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Status</span>
                    <span className="font-bold text-emerald-400">{viewerDoc.processingStatus}</span>
                  </div>
                </div>

                {/* Chunks Preview */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Extracted Text Chunks ({viewerDoc.chunks?.length || 0} displayed)
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewerDoc.chunks && viewerDoc.chunks.length > 0 ? (
                      viewerDoc.chunks.map((c: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-indigo-400 block font-semibold">
                            Chunk {c.chunkIndex + 1} {c.pageNumber ? `(Page ${c.pageNumber})` : ""} · {c.tokenCount} Tokens
                          </span>
                          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
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
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <Link
                    href={`/chat`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    <Bot className="w-4 h-4" /> Ask Questions in Chat
                  </Link>

                  {viewerDoc.signedUrl && (
                    <a
                      href={viewerDoc.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Full Document
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-rose-400 text-center py-6">Failed to load document details.</p>
            )}
          </div>
        </div>
      )}
    </div>
    </AnimatedBackground>
  );
}
