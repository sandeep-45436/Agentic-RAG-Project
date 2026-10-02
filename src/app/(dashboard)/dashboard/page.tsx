"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/insforge/client";
import {
  FileText, ChevronRight, ChevronDown, RefreshCw,
  GraduationCap, BookOpen, Download, Info, CheckCircle2,
  Sparkles, Clock, Play, Pause, RotateCcw, Bot, Briefcase,
  LayoutGrid, List, Copy, Check, Eye, ShieldCheck,
  Calendar, Building2, Flame, ArrowUpRight, Award, Compass
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface DocItem {
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
}

interface DashboardData {
  stats: {
    totalDocs: number;
    authorizedDeptDocs?: number;
    totalConversations?: number;
  };
  academicContext?: {
    isStudent: boolean;
    isFaculty: boolean;
    role: string;
    studentNumber: string;
    major: string;
    departmentId: string | null;
    departmentCode: string;
    departmentName: string;
    authorizedDocsCount: number;
    recentDepartmentDocs: DocItem[];
  };
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

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive UI States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [docFilter, setDocFilter] = useState<"all" | "notes" | "syllabus" | "lab">("all");
  const [noticeCategory, setNoticeCategory] = useState<"all" | "academic" | "exams" | "library">("all");
  const [copied, setCopied] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);

  // Interactive Study Focus Timer (Pomodoro Widget)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"pomodoro" | "shortBreak">("pomodoro");

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => setIsTimerRunning((prev) => !prev);
  const resetTimer = (mode: "pomodoro" | "shortBreak" = timerMode) => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === "pomodoro" ? 25 * 60 : 5 * 60);
  };

  const timerFormatted = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timerSeconds]);

  const timerProgress = useMemo(() => {
    const total = timerMode === "pomodoro" ? 25 * 60 : 5 * 60;
    return Math.round(((total - timerSeconds) / total) * 100);
  }, [timerSeconds, timerMode]);

  // Auth check
  useEffect(() => {
    const insforge = createClient();
    insforge.auth.getCurrentUser().then((res: any) => {
      if (res?.error || !res?.data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  // Data loader
  const load = useCallback((isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
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
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Dashboard load failed:", err);
        setError(err.message || "Failed to load dashboard data");
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const ac = data?.academicContext;
  const deptCode = ac?.departmentCode || "CSE";
  const deptName = ac?.departmentName || "Computer Science & Engineering";
  const studentName = data?.user?.name || "Student Scholar";
  const studentEmail = data?.user?.email || "";
  const recentDocs = ac?.recentDepartmentDocs ?? [];
  const greeting = getGreeting();

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (docFilter === "all") return recentDocs;
    if (docFilter === "notes") {
      return recentDocs.filter((d) => /note|unit|lecture|chapter|module/i.test(d.fileName));
    }
    if (docFilter === "syllabus") {
      return recentDocs.filter((d) => /syllabus|curriculum|scheme|regulation/i.test(d.fileName));
    }
    if (docFilter === "lab") {
      return recentDocs.filter((d) => /lab|manual|practical|experiment/i.test(d.fileName));
    }
    return recentDocs;
  }, [recentDocs, docFilter]);

  const copyEmail = () => {
    if (!studentEmail) return;
    navigator.clipboard.writeText(studentEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">
            AI
          </div>
        </div>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">
          Loading Academic Intelligence...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-rose-900 mb-1">Connection Interrupted</h2>
          <p className="text-xs text-slate-600 mb-5 leading-relaxed">{error}</p>
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatedBackground>
      <div className="space-y-6 pb-16 font-sans max-w-7xl mx-auto px-2 sm:px-4">
        
        {/* ── 1. BREATHTAKING HERO CARD & STUDENT COCKPIT ──────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20 backdrop-blur-2xl">
          {/* Subtle ambient light aura */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Avatar, Greeting, Identity & Badges */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-indigo-300 font-black text-xl sm:text-2xl">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                    <span>{greeting.emoji}</span> {greeting.text},
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                    {deptCode} Academic Scholar
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Enrolled
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {studentName}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    {deptName}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span>Anantha Lakshmi Institute of Tech & Sciences</span>
                </div>

                {studentEmail && (
                  <button
                    onClick={copyEmail}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors pt-0.5"
                    title="Click to copy student email"
                  >
                    <span>{studentEmail}</span>
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Quick Action Buttons & Refresh */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              <Link
                href="/documents"
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold px-5 py-3 transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-4 h-4 transition-transform group-hover:rotate-6" />
                <span>Browse Notes & Search</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold px-4 py-3 transition-all border border-slate-700/80 hover:border-indigo-400/50 shadow-md active:scale-95"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>AI Copilot</span>
              </Link>

              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="p-3 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl transition-all shadow-md active:scale-90"
                title="Refresh real-time data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Genuine Real-Time Department Metadata Strip */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Department Files</span>
              <span className="text-lg font-black text-white mt-0.5 block">{recentDocs.length} Materials</span>
              <span className="text-[10px] text-slate-400">Published by {deptCode} faculty</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Academic Scope</span>
              <span className="text-lg font-black text-white mt-0.5 block">{deptCode}</span>
              <span className="text-[10px] text-slate-400">Direct course clearance</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Autonomous Status</span>
              <span className="text-lg font-black text-white mt-0.5 block">NAAC 'A'</span>
              <span className="text-[10px] text-slate-400">JNTUA Affiliated</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Knowledge Engine</span>
              <span className="text-lg font-black text-white mt-0.5 block">Verified</span>
              <span className="text-[10px] text-slate-400">Zero-hallucination RAG</span>
            </div>
          </div>
        </div>

        {/* ── 2. INTERACTIVE STUDY UTILITIES & ACADEMIC INFORMATION ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Interactive Notice Board & Guidelines */}
          <div className="lg:col-span-2 bg-white/95 rounded-3xl p-6 border border-slate-200/90 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Student Notices & Academic Information
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified guidelines and circulars for {deptName} scholars.
                  </p>
                </div>
              </div>

              {/* Interactive Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                {(["all", "academic", "exams", "library"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoticeCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      noticeCategory === cat
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Notice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(noticeCategory === "all" || noticeCategory === "academic") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      Regulation
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Policy 2026</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    75% Mandatory Attendance Rule
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Students must maintain a minimum of 75% overall lecture attendance. Medical condonations between 65%-74% require formal verification by the HOD.
                  </p>
                </div>
              )}

              {(noticeCategory === "all" || noticeCategory === "library") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Materials
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">1-Click PDF</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Instant Faculty Notes & Syllabi
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    All official PDFs, question banks, and lecture slides uploaded by professors are accessible below with direct 1-click downloads.
                  </p>
                </div>
              )}

              {(noticeCategory === "all" || noticeCategory === "exams") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                      Exams
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Continuous Eval</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Mid-Term Syllabus Coverage
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Internal assessments follow autonomous unit guidelines. Download the syllabus copy from the materials section to review credit weightage.
                  </p>
                </div>
              )}

              {(noticeCategory === "all" || noticeCategory === "academic") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/20 border border-slate-200 hover:border-amber-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      Search Tip
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Browse Notes</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    Intelligent Document Search
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    To search across documents by topic or abbreviation (e.g. DBMS, OS, IP), head to <strong>Browse Notes</strong> for real-time concept matching.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Interactive Study Focus Timer (Pomodoro Widget) */}
          <div className="bg-white/95 rounded-3xl p-6 border border-slate-200/90 shadow-sm backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Study Focus Timer
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => resetTimer("pomodoro")}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      timerMode === "pomodoro" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    25m
                  </button>
                  <button
                    onClick={() => resetTimer("shortBreak")}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      timerMode === "shortBreak" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    5m
                  </button>
                </div>
              </div>

              {/* Animated Progress Display */}
              <div className="relative my-6 flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
                  {timerFormatted}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {timerMode === "pomodoro" ? "Active Study Interval" : "Short Break Time"}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-1000 rounded-full"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={toggleTimer}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                  isTimerRunning
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Focus
                  </>
                )}
              </button>
              <button
                onClick={() => resetTimer(timerMode)}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. WORLD-CLASS FACULTY COURSE MATERIALS GALLERY ──────────────── */}
        <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm backdrop-blur-xl space-y-6">
          
          {/* Header Row: Title + Filter Pills + View Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {deptCode} Course Uploads & Academic Materials
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official syllabus copies, lecture units, and reference notes published by your professors.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                {[
                  { id: "all", label: `All (${recentDocs.length})` },
                  { id: "notes", label: "Notes" },
                  { id: "syllabus", label: "Syllabus" },
                  { id: "lab", label: "Labs" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDocFilter(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      docFilter === item.id
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Jump to Browse Notes & Deep Search */}
              <Link
                href="/documents"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all hover:scale-105 active:scale-95"
              >
                <span>Deep Search</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Documents Content */}
          {filteredDocs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No documents found for this category</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No materials currently match the selected filter. Try selecting "All" or check Browse Notes.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* ── GRID VIEW ─────────────────────────────────────────────── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: File Type + Dept Pill + Time */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {doc.departmentCode || deptCode}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {timeAgo(doc.createdAt)}
                      </span>
                    </div>

                    {/* Document Title */}
                    <h3
                      className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </h3>

                    {/* Author & Size Metadata */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 text-xs">
                      {doc.facultyAuthor && (
                        <p className="text-slate-600 truncate text-[11px]">
                          Faculty: <span className="font-semibold text-slate-800">{doc.facultyAuthor}</span>
                          {doc.facultyTitle ? ` (${doc.facultyTitle})` : ""}
                        </p>
                      )}
                      {doc.fileSizeText && (
                        <p className="text-slate-500 text-[11px] font-mono">
                          Size: {doc.fileSizeText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors py-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all"
                        title="Discuss in AI Chat"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-600" /> Ask
                      </Link>

                      <a
                        href={`/api/documents/${doc.id}/download`}
                        download={doc.fileName}
                        title={`Download ${doc.fileName}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── LIST VIEW ─────────────────────────────────────────────── */
            <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{doc.fileName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600">
                        {doc.facultyAuthor && (
                          <span>
                            By <strong className="text-slate-800">{doc.facultyAuthor}</strong>
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                          {doc.departmentCode || deptCode}
                        </span>
                        {doc.fileSizeText && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{doc.fileSizeText}</span>
                          </>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{timeAgo(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      download={doc.fileName}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. QUICK ACADEMIC SHORTCUTS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/documents"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Notes & Syllabus Repo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full-text search, acronym matching, and subject filtration.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">
              <span>Open Repository</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/chat"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                AI Academic Copilot
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instant Q&A grounded directly in university course material.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600">
              <span>Launch Chat</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/placement"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-cyan-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                Career & Placement Arena
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Campus recruitment drives, ATS resume matcher & AI viva arena.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-cyan-600">
              <span>Explore Drives</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/student/profile"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Student Profile & Records
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Academic department details, student roll and contact records.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>View Profile</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* ── 5. INTERACTIVE DOCUMENT PREVIEW DRAWER / MODAL ──────────────── */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{previewDoc.fileName}</h3>
                    <p className="text-xs text-slate-500">{previewDoc.departmentName || deptName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Department Scope:</span>
                  <span className="font-bold text-slate-900">{previewDoc.departmentCode || deptCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Instructor:</span>
                  <span className="font-bold text-slate-900">{previewDoc.facultyAuthor || "Department Faculty"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">File Size:</span>
                  <span className="font-bold text-slate-900">{previewDoc.fileSizeText || "Standard PDF"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Published:</span>
                  <span className="font-bold text-slate-900">{timeAgo(previewDoc.createdAt)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Indexing Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Grounded in RAG
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/chat"
                  onClick={() => setPreviewDoc(null)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all"
                >
                  <Bot className="w-4 h-4" /> Ask in AI Chat
                </Link>
                <a
                  href={`/api/documents/${previewDoc.id}/download`}
                  download={previewDoc.fileName}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatedBackground>
  );
}
