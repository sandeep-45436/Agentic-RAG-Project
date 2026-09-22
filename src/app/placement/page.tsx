"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { DedicatedCopilotDrawer } from "@/components/ai/DedicatedCopilotDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Zap,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  Search,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Users,
  Sparkles,
  Download,
  Flame,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  X,
  Target,
  BookOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function PlacementPortalPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "drives";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDriveForModal, setSelectedDriveForModal] = useState<any | null>(null);
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ATS State
  const [atsResume, setAtsResume] = useState<string>(
    "Experienced software engineering student with expertise in Python, AWS cloud architectures, and PostgreSQL. Developed distributed microservices and hybrid semantic RAG pipelines using LangGraph and Qdrant. Strong background in data structures, algorithms, and containerization with Docker."
  );
  const [selectedAtsDriveId, setSelectedAtsDriveId] = useState<string>("drv_aws_cloud_arch");
  const [atsAnalyzing, setAtsAnalyzing] = useState<boolean>(false);
  const [atsResult, setAtsResult] = useState<any | null>(null);

  // Mock Interview State
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [candidateAnswer, setCandidateAnswer] = useState<string>("");
  const [evaluatingInterview, setEvaluatingInterview] = useState<boolean>(false);
  const [interviewEvaluation, setInterviewEvaluation] = useState<any | null>(null);

  // TPO Cockpit State
  const [tpoMinCgpa, setTpoMinCgpa] = useState<number>(7.5);
  const [tpoMaxBacklogs, setTpoMaxBacklogs] = useState<number>(0);
  const [tpoRunning, setTpoRunning] = useState<boolean>(false);
  const [tpoShortlist, setTpoShortlist] = useState<any[]>([]);

  const [portalMode, setPortalMode] = useState<"student" | "tpo">("student");

  // New Drive Form state for TPO Admin
  const [newDriveCompany, setNewDriveCompany] = useState<string>("");
  const [newDriveRole, setNewDriveRole] = useState<string>("");
  const [newDriveCtc, setNewDriveCtc] = useState<string>("₹14.50 LPA");
  const [newDriveTier, setNewDriveTier] = useState<string>("Dream");
  const [newDriveMinCgpa, setNewDriveMinCgpa] = useState<number>(7.0);
  const [newDriveMaxBacklogs, setNewDriveMaxBacklogs] = useState<number>(0);
  const [newDriveLocation, setNewDriveLocation] = useState<string>("Bengaluru / Hyderabad");
  const [newDriveDeadline, setNewDriveDeadline] = useState<string>("Nov 15, 2026");
  const [newDriveSkills, setNewDriveSkills] = useState<string>("Python, SQL, AWS, Problem Solving");
  const [newDriveDesc, setNewDriveDesc] = useState<string>("");
  const [creatingDrive, setCreatingDrive] = useState<boolean>(false);

  // Load Main Placement Portal Data
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/placement");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load placement portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // Synchronize Tab with URL search params if present
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["drives", "pipeline", "ats", "mock-interview", "eligibility", "tpo", "analytics", "create-drive"].includes(tab)) {
      if (tab === "tpo" || tab === "create-drive") {
        setPortalMode("tpo");
      }
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle New Drive creation (TPO Admin)
  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveCompany.trim() || !newDriveRole.trim()) {
      showToast("Please enter Company Name and Role", true);
      return;
    }
    setCreatingDrive(true);
    try {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_drive",
          drive: {
            company: newDriveCompany.trim(),
            role: newDriveRole.trim(),
            ctc: newDriveCtc,
            tier: newDriveTier,
            minCgpa: newDriveMinCgpa,
            maxBacklogs: newDriveMaxBacklogs,
            location: newDriveLocation,
            applicationDeadline: newDriveDeadline,
            requiredSkills: newDriveSkills.split(",").map((s) => s.trim()).filter(Boolean),
            description: newDriveDesc.trim() || `Official campus recruitment drive for ${newDriveRole} at ${newDriveCompany}.`,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Drive for ${newDriveCompany} published! Students can now apply.`);
        setNewDriveCompany("");
        setNewDriveRole("");
        setNewDriveDesc("");
        await loadPortalData();
        setActiveTab("drives");
      } else {
        showToast(json.error || "Failed to publish drive", true);
      }
    } catch {
      showToast("Network error publishing drive", true);
    } finally {
      setCreatingDrive(false);
    }
  };

  // Load Interview Questions when switching to mock interview
  useEffect(() => {
    if (activeTab === "mock-interview" && interviewQuestions.length === 0) {
      fetch("/api/placement/interview")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.questions) {
            setInterviewQuestions(d.questions);
          }
        })
        .catch(console.error);
    }
  }, [activeTab, interviewQuestions.length]);

  // Handle 1-Click Drive Application
  const handleApply = async (driveId: string) => {
    setApplyingDriveId(driveId);
    try {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", driveId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Application submitted successfully! Track progress in Pipeline tab.");
        await loadPortalData();
      } else {
        showToast(json.error || "Application submission failed.", true);
      }
    } catch {
      showToast("Network error submitting application.", true);
    } finally {
      setApplyingDriveId(null);
    }
  };

  // Handle Offer Acceptance
  const handleAcceptOffer = async (applicationId: string) => {
    try {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept_offer", applicationId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Offer accepted! Placement dossier locked.");
        await loadPortalData();
      } else {
        showToast(json.error || "Failed to accept offer.", true);
      }
    } catch {
      showToast("Error processing offer acceptance.", true);
    }
  };

  // Run ATS Analysis
  const handleRunAts = async () => {
    setAtsAnalyzing(true);
    try {
      const res = await fetch("/api/placement/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContent: atsResume,
          targetDriveId: selectedAtsDriveId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAtsResult(json.result);
      } else {
        showToast(json.error || "ATS analysis failed.", true);
      }
    } catch {
      showToast("Error running ATS evaluation.", true);
    } finally {
      setAtsAnalyzing(false);
    }
  };

  // Run Mock Interview Answer Evaluation
  const handleEvaluateInterview = async () => {
    if (!candidateAnswer.trim()) {
      showToast("Please provide an answer before submitting.", true);
      return;
    }
    const currentQ = interviewQuestions[selectedQuestionIndex];
    if (!currentQ) return;

    setEvaluatingInterview(true);
    try {
      const res = await fetch("/api/placement/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          answer: candidateAnswer,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInterviewEvaluation(json.evaluation);
      } else {
        showToast(json.error || "Evaluation failed.", true);
      }
    } catch {
      showToast("Network error submitting interview answer.", true);
    } finally {
      setEvaluatingInterview(false);
    }
  };

  // Run TPO Shortlist
  const handleRunTpoShortlist = async () => {
    setTpoRunning(true);
    try {
      const res = await fetch("/api/placement/tpo/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minCgpa: tpoMinCgpa,
          maxBacklogs: tpoMaxBacklogs,
          allowedBranches: ["CSE", "AI&DS", "IT", "ECE"],
          requiredSkills: ["Python", "AWS", "SQL", "Docker"],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTpoShortlist(json.candidates || []);
        showToast(`Shortlist generated: ${json.eligibleCount} candidates eligible.`);
      }
    } catch {
      showToast("Failed to run TPO shortlisting.", true);
    } finally {
      setTpoRunning(false);
    }
  };

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const drives: any[] = data?.drives || [];
  const applications: any[] = data?.applications || [];
  const studentProfile = data?.studentProfile || {
    name: "Aditya Nair",
    studentId: "STU-CSE-001",
    cgpa: 8.85,
    activeBacklogs: 0,
    department: "Computer Science & Engineering",
  };
  const analytics = data?.analytics;

  // Filter drives by Tier and Search
  const filteredDrives = drives.filter((d) => {
    const matchesTier = selectedTier === "ALL" || d.tier.toUpperCase() === selectedTier.toUpperCase();
    const matchesSearch =
      searchQuery === "" ||
      d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.requiredSkills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTier && matchesSearch;
  });

  return (
    <AnimatedBackground>
      <div className="space-y-6 pb-16 font-sans">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-cyan-500/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── 1. OFFICIAL INSTITUTIONAL HEADER & ACCREDITATION BANNER ──── */}
        <div className="light-glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/90">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-36 sm:w-44 flex items-center justify-start">
              <img
                src="/images/college-logo.png"
                alt="ALITS University Logo"
                className="h-10 object-contain drop-shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 tracking-tight">
                  Anantha Lakshmi Institute of Technology & Sciences
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  NAAC A++ Accredited
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 hidden sm:inline">
                  Autonomous
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Directorate of Training & Campus Placement • Industry Relations Board
              </span>
            </div>
          </div>

          {/* Provenance Badge & Quick Student Switcher */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Data Source: <strong>Demo University Dataset</strong> (deterministic-demo-v1)</span>
            </div>
            <Link
              href="/skills"
              className="text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Zap className="h-3.5 w-3.5" /> Skills Radar
            </Link>
          </div>
        </div>

        {/* ── 2. HERO COCKPIT BANNER WITH ACTIVE SEASON BENCHMARKS ───────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30 p-6 lg:p-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 h-60 w-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs font-semibold px-2.5 py-0.5">
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Campus Recruitment Season 2025–2026
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/40 text-xs">
                  Simulation / Demo Drives Active
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  Logged in as: <strong className="text-white">{studentProfile.name}</strong> ({studentProfile.studentId}) • CGPA: <strong className="text-cyan-300">{Number(studentProfile.cgpa).toFixed(2)}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Corporate Placement Command Center
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Autonomous corporate recruitment gateway. Explore high-tier campus drives with deterministic eligibility verification, track multi-stage interview pipelines, optimize resumes with AI ATS scoring, and prepare with live technical viva challenges.
              </p>
            </div>

            {/* Quick KPI Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-cyan-300 block">Placement Rate</span>
                <span className="text-xl font-black text-white font-mono">95.2%</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Simulation Data</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Average CTC</span>
                <span className="text-xl font-black text-white font-mono">₹8.42 L</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">+14% YoY</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">Highest CTC</span>
                <span className="text-xl font-black text-white font-mono">₹44.5 L</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Google SDE-1</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Total Offers</span>
                <span className="text-xl font-black text-white font-mono">648</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">142 Recruiter JDs</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2.5 ROLE BOUNDARY & OPERATIONAL SCOPE BANNER ──────── */}
        <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
              portalMode === "student" ? "bg-indigo-600" : "bg-cyan-700"
            }`}>
              {portalMode === "student" ? <Users className="h-5 w-5" /> : <Sliders className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Active Mode:
                </span>
                <Badge className={portalMode === "student" ? "bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-bold" : "bg-cyan-100 text-cyan-800 border-cyan-200 text-xs font-bold"}>
                  {portalMode === "student" ? "🎓 Student Operations Mode" : "🏢 Placement Center Admin (TPO) Mode"}
                </Badge>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  {portalMode === "student" ? "Role: Candidate / Student" : "Role: Directorate Admin"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                {portalMode === "student"
                  ? `Logged in as: ${studentProfile.name} (${studentProfile.studentId} • CGPA: ${Number(studentProfile.cgpa).toFixed(2)}) • Only student operations are available. Recruitment drives, cutoffs, and hiring rules are published by the Placement Center Admin.`
                  : `Officer: Dr. R. Sundaram (Director of Placement & Industry Relations) • Authorized to create campus recruitment drives, configure cutoff criteria, and execute candidate shortlists.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {portalMode === "student" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPortalMode("tpo");
                  setActiveTab("create-drive");
                  showToast("Switched to Placement Center Admin (TPO) Mode");
                }}
                className="text-xs font-bold border-cyan-300 text-cyan-800 hover:bg-cyan-50 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Sliders className="h-3.5 w-3.5 text-cyan-700" />
                <span>Switch to TPO Admin Cockpit</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPortalMode("student");
                  setActiveTab("drives");
                  showToast("Returned to Student Operations Mode");
                }}
                className="text-xs font-bold border-indigo-300 text-indigo-800 hover:bg-indigo-50 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Users className="h-3.5 w-3.5 text-indigo-700" />
                <span>Return to Student Mode</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── 3. OPERATIONAL NAVIGATION PILLS ──────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          {(portalMode === "student"
            ? [
                { id: "drives", label: "Live Campus Drives", icon: Briefcase, badge: `${drives.length} Active` },
                { id: "pipeline", label: "My Application Pipeline", icon: TrendingUp, badge: `${applications.length} Active` },
                { id: "ats", label: "AI Resume ATS Optimizer", icon: FileText, badge: "AI Match" },
                { id: "mock-interview", label: "AI Technical Viva Arena", icon: Award, badge: "Simulate" },
                { id: "eligibility", label: "Placement Eligibility & Clearance", icon: CheckCircle2, badge: "Verified" },
              ]
            : [
                { id: "create-drive", label: "➕ Post New Campus Drive", icon: Sparkles, badge: "Admin Form" },
                { id: "drives", label: "Manage Active Drives", icon: Briefcase, badge: `${drives.length} Posted` },
                { id: "tpo", label: "Deterministic Shortlist Engine", icon: Sliders, badge: "Cutoff Ops" },
                { id: "analytics", label: "Placement Analytics & Salary", icon: Target, badge: "NAAC Reports" },
              ]
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-2 ring-cyan-500/40"
                    : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: LIVE CAMPUS RECRUITMENT DRIVES ─────────────────────── */}
        {activeTab === "drives" && (
          <div className="space-y-5">
            {portalMode === "student" ? (
              <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-cyan-700 shrink-0" />
                  <span>
                    <strong>Directorate Notice:</strong> Campus recruitment drives below are officially published by the Placement Center Admin. You are viewing candidate operations. Your CGPA (<strong>{Number(studentProfile.cgpa).toFixed(2)}</strong>) and backlog clearance are validated in real-time.
                  </span>
                </div>
                <Badge className="bg-cyan-200 text-cyan-900 border-cyan-300 shrink-0 self-start sm:self-center">
                  TPO Verified
                </Badge>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
                <div>
                  <span className="font-bold text-sm block">Directorate Drive Master Control</span>
                  <span className="text-slate-300 text-[11px] block mt-0.5">
                    Currently managing {drives.length} published campus recruitment drives. Need to register another visiting company?
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("create-drive")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Post New Campus Drive
                </Button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="light-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search company, role or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              {/* Tier Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Tier:
                </span>
                {["ALL", "Super Dream", "Dream", "Enterprise"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                      selectedTier === tier
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Drives Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDrives.map((drive) => {
                const eligibility = drive.studentEligibility;
                const isEligible = eligibility?.isEligible;
                const isAlreadyApplied = applications.some((a) => a.driveId === drive.id);

                return (
                  <div
                    key={drive.id}
                    className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between hover:border-cyan-500/50 space-y-4 group"
                  >
                    <div>
                      {/* Top Row: Tier badge & Demo flag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            drive.tier === "Super Dream"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : drive.tier === "Dream"
                              ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {drive.tier} Tier
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          Simulation Drive
                        </span>
                      </div>

                      {/* Company & Role */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shrink-0">
                          <Building2 className="h-6 w-6 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-cyan-700 transition-colors leading-snug">
                            {drive.company}
                          </h3>
                          <p className="text-xs text-slate-600 font-medium">{drive.role}</p>
                        </div>
                      </div>

                      {/* Package & Location Details */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total CTC Package:</span>
                          <span className="font-mono font-black text-emerald-600 text-sm">{drive.ctc}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Base Component:</span>
                          <span className="font-mono font-semibold text-slate-700">{drive.baseSalary}</span>
                        </div>
                        {drive.stipend && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Internship Stipend:</span>
                            <span className="font-mono text-cyan-700 font-bold">{drive.stipend}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Location:</span>
                          <span className="text-slate-700 truncate max-w-[160px]">{drive.location}</span>
                        </div>
                      </div>

                      {/* Cutoff Requirements & Deterministic Eligibility */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Cutoff Eligibility:</span>
                          <span className="font-mono font-semibold text-slate-700">
                            Min CGPA: {drive.minCgpa.toFixed(1)} • 0 Backlogs
                          </span>
                        </div>

                        {/* Real-Time Student Deterministic Gate */}
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                            isEligible
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isEligible ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {isEligible ? `Eligible (${eligibility?.matchPercentage}% Fit)` : "Cutoff Not Met"}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono shrink-0 bg-white/70 px-1.5 py-0.5 rounded">
                            {isEligible ? "Gate Cleared" : "Ineligible"}
                          </span>
                        </div>

                        {/* Required skills chips */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {drive.requiredSkills.slice(0, 4).map((sk: string, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              {sk}
                            </span>
                          ))}
                          {drive.requiredSkills.length > 4 && (
                            <span className="text-[10px] text-slate-400 px-1 py-0.5">
                              +{drive.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDriveForModal(drive)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-950 underline underline-offset-2 flex items-center gap-1"
                      >
                        View JD & Rounds
                      </button>

                      {isAlreadyApplied ? (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Applied
                        </span>
                      ) : (
                        <Button
                          disabled={!isEligible || applyingDriveId === drive.id}
                          onClick={() => handleApply(drive.id)}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          {applyingDriveId === drive.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "1-Click Apply"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: MY APPLICATION PIPELINE (KANBAN & INTERVIEW TRACKER) ── */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            <div className="light-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs border border-slate-200">
              <div>
                <h2 className="text-sm font-black text-slate-900">Live Campus Drive Application Tracker</h2>
                <p className="text-xs text-slate-500">
                  Track progress through multi-stage technical evaluation rounds and institutional offer letters
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {applications.length} Active Candidacies
              </span>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {applications.map((app) => {
                const isOfferExtended = app.stage === "OFFER_EXTENDED";
                const isOfferAccepted = app.stage === "OFFER_ACCEPTED";

                return (
                  <div
                    key={app.id}
                    className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{app.company}</h3>
                            <Badge className={`text-[10px] font-bold ${app.stageBadgeColor}`}>
                              {app.stage.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">{app.role} • Applied on {app.appliedAt}</p>
                        </div>
                      </div>

                      {/* Offer acceptance action */}
                      {isOfferExtended && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleAcceptOffer(app.id)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                          >
                            Accept Offer ({app.offerDetails?.ctc})
                          </Button>
                        </div>
                      )}

                      {isOfferAccepted && (
                        <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">
                          ✓ Offer Formally Accepted (Locked)
                        </Badge>
                      )}
                    </div>

                    {/* Multi-Stage Visual Pipeline Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                      {[
                        { label: "1. Applied", active: true },
                        { label: "2. Shortlisted", active: ["SHORTLISTED", "OA_SCHEDULED", "TECH_ROUND_1", "TECH_ROUND_2", "HR_ROUND", "OFFER_EXTENDED", "OFFER_ACCEPTED"].includes(app.stage) },
                        { label: "3. Online Test", active: ["OA_SCHEDULED", "TECH_ROUND_1", "TECH_ROUND_2", "HR_ROUND", "OFFER_EXTENDED", "OFFER_ACCEPTED"].includes(app.stage) },
                        { label: "4. Tech Rounds", active: ["TECH_ROUND_1", "TECH_ROUND_2", "HR_ROUND", "OFFER_EXTENDED", "OFFER_ACCEPTED"].includes(app.stage) },
                        { label: "5. HR / Bar Raiser", active: ["HR_ROUND", "OFFER_EXTENDED", "OFFER_ACCEPTED"].includes(app.stage) },
                        { label: "6. Offer Letter", active: ["OFFER_EXTENDED", "OFFER_ACCEPTED"].includes(app.stage) },
                      ].map((st, si) => (
                        <div
                          key={si}
                          className={`p-2 rounded-xl border text-[11px] font-bold transition-all ${
                            st.active
                              ? "bg-indigo-50 border-indigo-300 text-indigo-800 ring-1 ring-indigo-200"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                        >
                          {st.label}
                        </div>
                      ))}
                    </div>

                    {/* Interview Details Subcard if interview scheduled */}
                    {app.interviewDetails && (
                      <div className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-900 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-cyan-600" />
                            Next Scheduled Interview: {app.interviewDetails.roundName}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-cyan-800">
                            {app.interviewDetails.date} at {app.interviewDetails.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-cyan-700">
                          Interviewer Panel: <strong>{app.interviewDetails.interviewer}</strong>
                        </p>
                        <div className="pt-1 flex items-center justify-between">
                          <a
                            href={app.interviewDetails.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline"
                          >
                            Join Mock Virtual Interview <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Admit Card Validated by ALITS TPO
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: AI RESUME ATS OPTIMIZER ───────────────────────────── */}
        {activeTab === "ats" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Input & Target JD */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-600" />
                  AI Resume ATS Analyzer
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluate your resume against target company criteria and generate STAR impact statements
                </p>
              </div>

              {/* Target Drive Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Target Drive:</label>
                <select
                  value={selectedAtsDriveId}
                  onChange={(e) => setSelectedAtsDriveId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.company} - {d.role} ({d.tier})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resume Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Your Resume Content / Executive Summary:</label>
                <textarea
                  rows={8}
                  value={atsResume}
                  onChange={(e) => setAtsResume(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-sans leading-relaxed"
                  placeholder="Paste resume summary, skills, and project descriptions..."
                />
              </div>

              <Button
                disabled={atsAnalyzing}
                onClick={handleRunAts}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2"
              >
                {atsAnalyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Run AI ATS Evaluation
                  </>
                )}
              </Button>
            </div>

            {/* Right 7 Cols: ATS Score Breakdown & Bullet Enhancer */}
            <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">ATS Evaluation & Keyword Gap Matrix</h3>
                <span className="text-[10px] font-mono text-slate-500">Gemini 2.5 Flash Scoring Engine</span>
              </div>

              {atsResult ? (
                <div className="space-y-4">
                  {/* Gauge Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-cyan-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg">
                        <span className="text-xl font-mono leading-none">{atsResult.atsScore}</span>
                        <span className="text-[9px] uppercase font-bold">/ 100</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">High Match Potential</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{atsResult.summary}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-600 block">
                        Keyword Match: {atsResult.keywordMatchRate}%
                      </span>
                      <span className="text-xs font-bold text-indigo-600 block">
                        Impact Score: {atsResult.impactScore}%
                      </span>
                    </div>
                  </div>

                  {/* Matched & Missing Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Matched Core Skills:
                      </span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {atsResult.matchedKeywords.map((k: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                      <span className="font-bold text-rose-800 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Missing Keyword Gaps:
                      </span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {atsResult.missingKeywords.map((k: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white text-rose-800 border border-rose-300">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Bullet Points (STAR Method) */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                      AI STAR Bullet Point Rewrite Recommendations:
                    </span>
                    {atsResult.enhancedBulletPoints?.map((bp: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                        <p className="text-slate-500 line-through text-[11px]">{bp.original}</p>
                        <p className="font-semibold text-slate-900 text-xs flex items-start gap-1">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{bp.enhanced}</span>
                        </p>
                        <p className="text-[10px] text-cyan-700 italic">Rationale: {bp.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-slate-400 space-y-2">
                  <FileText className="h-10 w-10 text-slate-300 stroke-1" />
                  <p className="text-xs">Click "Run AI ATS Evaluation" to inspect keyword density and generate enhanced bullets.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: AI TECHNICAL VIVA & MOCK INTERVIEW SIMULATOR ──────── */}
        {activeTab === "mock-interview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Question Selector & Scenario */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                  Technical Viva Arena
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Company-specific high-yield technical challenges and live multi-dimensional scoring
                </p>
              </div>

              {/* Scenario selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Select Interview Scenario:</span>
                {interviewQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionIndex(idx);
                      setInterviewEvaluation(null);
                      setCandidateAnswer("");
                    }}
                    className={`w-full text-left p-3 rounded-2xl border text-xs transition-all ${
                      selectedQuestionIndex === idx
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-200 font-bold"
                        : "bg-slate-50 hover:bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{q.company}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{q.topic}</p>
                  </button>
                ))}
              </div>

              {/* Active Question Prompt */}
              {interviewQuestions[selectedQuestionIndex] && (
                <div className="p-4 rounded-2xl bg-indigo-950 text-white space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                    Technical Prompt:
                  </span>
                  <p className="font-semibold text-xs leading-relaxed">
                    {interviewQuestions[selectedQuestionIndex].question}
                  </p>
                  <p className="text-[11px] text-slate-300 italic">
                    Constraint: {interviewQuestions[selectedQuestionIndex].contextOrConstraint}
                  </p>
                </div>
              )}
            </div>

            {/* Right 7 Cols: Answer Submission & Live Evaluator */}
            <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Your Technical Response</h3>
                <button
                  onClick={() =>
                    setCandidateAnswer(
                      "To handle 200,000 req/s with sub-5ms overhead, I would implement a tiered sliding-window rate limiter using Envoy proxy sidecars with in-memory token buckets. Instead of writing to a central database on every request, local nodes decrement their in-memory quota and batch sync deltas to a regional Redis cluster every 50ms using pipeline writes. If network partitions occur, nodes fall back to safe conservative local limits to ensure high availability."
                    )
                  }
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Fill Sample Answer
                </button>
              </div>

              <textarea
                rows={6}
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="Structure your architectural justification, complexity analysis, and concurrency handling here..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
              />

              <Button
                disabled={evaluatingInterview}
                onClick={handleEvaluateInterview}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-2"
              >
                {evaluatingInterview ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit for AI Rubric Evaluation
                  </>
                )}
              </Button>

              {/* Evaluation Results */}
              {interviewEvaluation && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in">
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block">Overall Score</span>
                      <span className="text-xl font-mono font-black text-indigo-900">
                        {interviewEvaluation.overallScore}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200">
                      <span className="text-[10px] uppercase font-bold text-cyan-600 block">Correctness</span>
                      <span className="text-xl font-mono font-black text-cyan-900">
                        {interviewEvaluation.technicalCorrectnessScore}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] uppercase font-bold text-purple-600 block">Scalability</span>
                      <span className="text-xl font-mono font-black text-purple-900">
                        {interviewEvaluation.systemScalabilityScore}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-800 block">Expert Feedback:</span>
                    <p className="text-slate-600 leading-relaxed">{interviewEvaluation.feedback}</p>
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="font-bold text-emerald-800 text-[11px] block">Model Benchmark Answer:</span>
                      <p className="text-[11px] text-slate-700 mt-0.5">{interviewEvaluation.modelAnswer}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: TPO & RECRUITER COMMAND COCKPIT ─────────────────────── */}
        {activeTab === "tpo" && (
          <div className="space-y-6">
            <div className="light-glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs border border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">TPO Autonomous Candidate Shortlist Orchestrator</h2>
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px]">TPO Control</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure corporate recruitment cutoff rules and execute deterministic batch ranking
                </p>
              </div>

              {/* TPO Cutoff Filter Inputs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Cutoff CGPA:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="5.0"
                    max="10.0"
                    value={tpoMinCgpa}
                    onChange={(e) => setTpoMinCgpa(parseFloat(e.target.value) || 7.0)}
                    className="w-16 p-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-slate-50 text-center"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Max Backlogs:</span>
                  <select
                    value={tpoMaxBacklogs}
                    onChange={(e) => setTpoMaxBacklogs(parseInt(e.target.value))}
                    className="p-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-bold"
                  >
                    <option value={0}>0 (Strict)</option>
                    <option value={1}>At most 1</option>
                  </select>
                </div>

                <Button
                  disabled={tpoRunning}
                  onClick={handleRunTpoShortlist}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  {tpoRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Run Shortlist & Ranking"}
                </Button>
              </div>
            </div>

            {/* Candidate Shortlist Table */}
            <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Candidate Ranks ({tpoShortlist.length > 0 ? tpoShortlist.length : "Click Run Shortlist to load"} Evaluated)
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">
                  ✓ Deterministic Invariants Enforced
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-center">CGPA</th>
                      <th className="p-3 text-center">Backlogs</th>
                      <th className="p-3">Verified Skills</th>
                      <th className="p-3 text-center">Skill Fit %</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(tpoShortlist.length > 0
                      ? tpoShortlist
                      : [
                          { rank: 1, studentId: "22AD115", name: "Gayathri Pillai", department: "AI & Data Science", cgpa: 9.10, activeBacklogs: 0, skills: ["Python", "AWS", "Distributed Systems", "SQL"], matchPercentage: 98, isEligible: true },
                          { rank: 2, studentId: "22CS101", name: "Aditya Nair", department: "Computer Science", cgpa: 8.85, activeBacklogs: 0, skills: ["Python", "AWS", "SQL", "Docker"], matchPercentage: 94, isEligible: true },
                          { rank: 3, studentId: "22CS104", name: "Bhavana Iyer", department: "Computer Science", cgpa: 7.80, activeBacklogs: 0, skills: ["Java", "Spring Boot", "SQL"], matchPercentage: 82, isEligible: true },
                          { rank: 4, studentId: "22IT109", name: "Dinesh Kumar", department: "Information Technology", cgpa: 7.10, activeBacklogs: 1, skills: ["Python", "AWS"], matchPercentage: 65, isEligible: false, reason: "Backlog constraint" },
                        ]
                    ).map((cand: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">#{cand.rank || idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{cand.studentId}</td>
                        <td className="p-3 font-medium text-slate-900">{cand.name}</td>
                        <td className="p-3 text-slate-600">{cand.department}</td>
                        <td className="p-3 text-center font-bold text-indigo-700">{Number(cand.cgpa).toFixed(2)}</td>
                        <td className="p-3 text-center font-mono">{cand.activeBacklogs}</td>
                        <td className="p-3 text-[11px] text-slate-600">{cand.skills?.join(", ")}</td>
                        <td className="p-3 text-center font-bold text-cyan-700">{cand.matchPercentage}%</td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] ${
                              cand.isEligible
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-rose-100 text-rose-800 border-rose-300"
                            }`}
                          >
                            {cand.isEligible ? "Shortlisted" : "Cutoff Disqualified"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: INSTITUTIONAL PLACEMENT ANALYTICS & SALARY BENCHMARKS ─ */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            {/* Provenance Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Data Provenance Notice:</strong> All placement rates and salary bands shown below are generated from the <strong>{analytics.provenance.source}</strong> (<code>{analytics.provenance.datasetId}</code>) for simulation purposes.
                </span>
              </div>
              <span className="font-mono text-[10px] bg-white/70 px-2 py-1 rounded border border-amber-200 shrink-0">
                {analytics.provenance.freshness}
              </span>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Branch Placement Rate Bar Chart */}
              <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Branch-wise Placement Rate %</h3>
                    <p className="text-xs text-slate-500">Comparative cross-departmental success benchmark</p>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                    Campus Average: {analytics.overallPlacementRate}%
                  </Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.branchPerformance}>
                      <XAxis dataKey="branch" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderRadius: "0.75rem",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="placementRate" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                        {analytics.branchPerformance.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.placementRate >= 95 ? "#06b6d4" : "#4f46e5"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Salary Tier Distribution */}
              <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Salary Tier Distribution</h3>
                  <p className="text-xs text-slate-500">Breakdown of 648 institutional offers</p>
                </div>

                <div className="space-y-3 pt-2">
                  {analytics.salaryTierDistribution.map((tier: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{tier.tier}</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {tier.count} offers ({tier.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${tier.percentage}%`,
                            backgroundColor: tier.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Recruiters Table */}
            <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Top 8 Corporate Recruiting Partners</h3>
                <span className="text-[10px] text-slate-500">2025–2026 Academic Season</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-3">Recruiting Partner</th>
                      <th className="p-3">Hiring Tier</th>
                      <th className="p-3 text-center">Offers Extended</th>
                      <th className="p-3 text-right">Average Package</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.topRecruitingPartners.map((rec: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{rec.company}</td>
                        <td className="p-3">
                          <Badge className="text-[10px] bg-slate-100 text-slate-700 border-slate-200">
                            {rec.tier}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                          {rec.offersCount}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-600">
                          {rec.avgPackage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: POST NEW CAMPUS DRIVE (TPO ADMIN ONLY) ────────── */}
        {activeTab === "create-drive" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
                    TPO Officer Authoring Desk
                  </Badge>
                  <span className="text-xs text-slate-300 font-mono">Form Action: <code>create_drive</code></span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Publish New Campus Recruitment Drive
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Configure hiring criteria, compensation package, and cutoff filters. Published drives immediately synchronize across the ALITS Student Portal so students can verify eligibility and submit 1-click applications.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("drives")}
                className="border-slate-700 text-white hover:bg-white/10 rounded-xl text-xs"
              >
                View Existing Drives ({drives.length})
              </Button>
            </div>

            <form onSubmit={handleCreateDrive} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Systems, Oracle, Microsoft"
                    value={newDriveCompany}
                    onChange={(e) => setNewDriveCompany(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Job Role / Profile *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Systems Engineer, SDE-1"
                    value={newDriveRole}
                    onChange={(e) => setNewDriveRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Total CTC Package *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹16.50 LPA"
                    value={newDriveCtc}
                    onChange={(e) => setNewDriveCtc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Recruitment Tier *</label>
                  <select
                    value={newDriveTier}
                    onChange={(e) => setNewDriveTier(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Super Dream">Super Dream Tier (₹20+ LPA)</option>
                    <option value="Dream">Dream Tier (₹8 - 20 LPA)</option>
                    <option value="Enterprise">Enterprise Tier (&lt; ₹8 LPA)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Minimum CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newDriveMinCgpa}
                    onChange={(e) => setNewDriveMinCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Max Active Backlogs Allowed</label>
                  <select
                    value={newDriveMaxBacklogs}
                    onChange={(e) => setNewDriveMaxBacklogs(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-mono"
                  >
                    <option value={0}>0 Backlogs (Strict Zero Tolerance)</option>
                    <option value={1}>At most 1 Active Backlog</option>
                    <option value={2}>At most 2 Active Backlogs</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Work Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru / Hyderabad / Pune"
                    value={newDriveLocation}
                    onChange={(e) => setNewDriveLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Application Deadline</label>
                  <input
                    type="text"
                    placeholder="e.g. Nov 25, 2026"
                    value={newDriveDeadline}
                    onChange={(e) => setNewDriveDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, SQL, AWS, Docker"
                    value={newDriveSkills}
                    onChange={(e) => setNewDriveSkills(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Job Description & Profile Overview</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed job overview, team responsibilities, and expected technical challenges..."
                  value={newDriveDesc}
                  onChange={(e) => setNewDriveDesc(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  ⚡ All criteria are deterministically enforced when students click Apply.
                </span>
                <Button
                  type="submit"
                  disabled={creatingDrive}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 px-5"
                >
                  {creatingDrive ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Publishing Drive...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Publish Campus Recruitment Drive
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB: PLACEMENT ELIGIBILITY & CLEARANCE (STUDENT ONLY) ──── */}
        {activeTab === "eligibility" && (
          <div className="space-y-6">
            {/* Clearance Pass Card */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-emerald-500/40 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <CheckCircle2 className="h-48 w-48 text-emerald-400" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Institutional Placement Clearance Pass
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">ID: ALITS-TPO-2026-CS101</span>
                  </div>
                  <Badge className="bg-white/10 text-white border-white/20 text-xs">
                    Season 2025–2026 Active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Name</span>
                    <span className="text-base font-black text-white">{studentProfile.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{studentProfile.studentId}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cumulative GPA</span>
                    <span className="text-base font-black text-cyan-300 font-mono">{Number(studentProfile.cgpa).toFixed(2)} / 10.0</span>
                    <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">✓ First Class Distinction</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Backlogs</span>
                    <span className="text-base font-black text-emerald-300 font-mono">{studentProfile.activeBacklogs} Backlogs</span>
                    <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">✓ Zero Backlog Clearance</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Department / Branch</span>
                    <span className="text-base font-black text-white truncate block">{studentProfile.department}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">CSE Autonomous Program</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clearance Checklist & Tier Eligibility Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* TPO Clearance Gateways */}
              <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Official Placement Gateways</h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    All 4 Clearances Passed
                  </Badge>
                </div>

                <div className="space-y-3">
                  {[
                    { title: "Central TPO Registration", desc: "Mandatory campus placement registry completed and verified with Aadhaar/Govt ID.", pass: true, code: "TPO-REG-VERIFIED" },
                    { title: "Department HOD Clearance (NOC)", desc: "Department of Computer Science & Engineering academic standing & attendance clearance (>80%).", pass: true, code: "CS-HOD-NOC-882" },
                    { title: "Career Development Cell Resume Audit", desc: "STAR-method resume approved by college communication panel.", pass: true, code: "CDC-RESUME-A1" },
                    { title: "Institutional Placement Policy Undertaking", desc: "Signed agreement to adhere to the ALITS One-Offer / Dream Upgrade recruitment rule.", pass: true, code: "POLICY-SIGNED" },
                  ].map((gw, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{gw.title}</span>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold">{gw.code}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{gw.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier-by-Tier Cutoff Verification Matrix */}
              <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Campus Recruitment Tier Matrix</h3>
                  <span className="text-[11px] text-slate-500">Based on CGPA {studentProfile.cgpa}</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] font-bold">
                          Super Dream Tier
                        </Badge>
                        <span className="text-xs font-bold text-slate-900">₹20+ LPA (Google, AWS, Microsoft)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Rule: CGPA ≥ 8.00 and 0 active backlogs</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                      ✓ Eligible
                    </Badge>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-cyan-200 bg-cyan-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300 text-[10px] font-bold">
                          Dream Tier
                        </Badge>
                        <span className="text-xs font-bold text-slate-900">₹8 - 20 LPA (Deloitte, Tata Elxsi, Infosys)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Rule: CGPA ≥ 6.50 and ≤ 1 active backlog</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                      ✓ Eligible
                    </Badge>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                          Enterprise Tier
                        </Badge>
                        <span className="text-xs font-bold text-slate-900">&lt; ₹8 LPA (Mass / Service Recruiters)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Rule: CGPA ≥ 6.00 and all departments allowed</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                      ✓ Eligible
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Want to test interview readiness?</span>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("mock-interview")}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs"
                  >
                    Start AI Viva Simulation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── JOB DESCRIPTION & HIRING ROUNDS MODAL ────────────────────── */}
        {selectedDriveForModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <Badge className="text-[10px] font-bold mb-1 bg-purple-100 text-purple-800">
                    {selectedDriveForModal.tier} Tier Drive (Simulation)
                  </Badge>
                  <h3 className="text-lg font-black text-slate-900">{selectedDriveForModal.company}</h3>
                  <p className="text-xs text-slate-600">{selectedDriveForModal.role} • {selectedDriveForModal.location}</p>
                </div>
                <button
                  onClick={() => setSelectedDriveForModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Job Profile Description:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {selectedDriveForModal.description}
                  </p>
                </div>

                {/* Compensation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Total CTC</span>
                    <span className="font-mono font-black text-emerald-600 text-xs">{selectedDriveForModal.ctc}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Base Salary</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">{selectedDriveForModal.baseSalary}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stipend</span>
                    <span className="font-mono font-bold text-cyan-700 text-xs">{selectedDriveForModal.stipend || "N/A"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Cutoff CGPA</span>
                    <span className="font-mono font-bold text-indigo-700 text-xs">{selectedDriveForModal.minCgpa.toFixed(1)}</span>
                  </div>
                </div>

                {/* Rounds */}
                <div>
                  <span className="font-bold text-slate-900 block mb-1.5">Evaluation & Hiring Rounds:</span>
                  <div className="space-y-2">
                    {selectedDriveForModal.hiringRounds.map((rnd: any) => (
                      <div key={rnd.roundNumber} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {rnd.roundNumber}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{rnd.name}</span>
                          <p className="text-[11px] text-slate-600 mt-0.5">{rnd.description}</p>
                          <span className="text-[10px] font-mono text-cyan-700 font-bold block mt-1">Date: {rnd.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDriveForModal(null)}
                  className="rounded-xl text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleApply(selectedDriveForModal.id);
                    setSelectedDriveForModal(null);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm 1-Click Application
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. PLACEMENT ORCHESTRATOR DEDICATED LANGGRAPH COPILOT DRAWER ── */}
        <DedicatedCopilotDrawer
          role="placement"
          title="Placement Orchestrator"
          subtitle="Intent Router • Deterministic Eligibility & Ranking • Mock Viva • Provenance"
          quickPrompts={[
            {
              label: "Shortlist students for Amazon SDE",
              query:
                "Run deterministic candidate ranking for Amazon AWS Cloud Solutions Architect with minimum CGPA 7.5, zero active backlogs, and required skills Python, AWS, SQL.",
            },
            {
              label: "Analyze a Job Description (Google)",
              query:
                "Parse the Google Software Engineer SDE-1 JD into structured constraints and verify branch eligibility.",
            },
            {
              label: "Prepare for Technical Viva",
              query:
                "Generate 2 technical interview viva scenarios and scoring rubrics for Distributed Systems & Low-Latency Caching.",
            },
            {
              label: "Analyze Placement Statistics",
              query:
                "Synthesize an executive briefing on institutional placement metrics, salary distribution, and top recruiting partners.",
            },
            {
              label: "Optimize Candidate Resume ATS",
              query:
                "Perform ATS keyword matching and impact bullet point optimization for Amazon Web Services Cloud Solutions Architect.",
            },
          ]}
        />
      </div>
    </AnimatedBackground>
  );
}
