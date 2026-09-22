"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Send,
  FileText,
  ShieldCheck,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Info,
  Clock,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Building,
  FlaskConical,
  Flame,
  BookOpen,
  FileBarChart,
  Award,
  BarChart3,
  Printer,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../context";
import { AnimatedBackground } from "@/components/animated-background";
import { DedicatedCopilotDrawer } from "@/components/ai/DedicatedCopilotDrawer";

// ─────────────────────────────────────────────────────────────────────────────
// PROVENANCE METADATA
// ─────────────────────────────────────────────────────────────────────────────
const PROVENANCE = {
  source: "ALITS Departmental SIS & AICTE Audit Database",
  datasetId: "hod-operations-v1",
  mode: "Departmental Governance Sandbox",
  isDemo: true,
};

export default function HODDashboardPage() {
  const { session, activeDepartment, setActiveDepartment, departments, isDean } = useHOD();

  // Tab State: "overview" | "nba" | "workload" | "exam_clearance" | "approvals"
  const [activeTab, setActiveTab] = useState<"overview" | "nba" | "workload" | "exam_clearance" | "approvals">("overview");

  // Core Data States
  const [commandCenterData, setCommandCenterData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [whatChanged, setWhatChanged] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [nbaAudit, setNbaAudit] = useState<any>(null);
  const [workloadData, setWorkloadData] = useState<any>(null);
  const [examClearanceData, setExamClearanceData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI Command Center State
  const [aiQuery, setAiQuery] = useState("What requires my immediate executive attention today?");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Interactive Modals & Actions
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [rebalanceApplied, setRebalanceApplied] = useState(false);

  const deptCode = typeof activeDepartment === "string" ? activeDepartment : (activeDepartment as any)?.code || "CSE";

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [cmdRes, healthRes, changedRes, proposalsRes, nbaRes, workloadRes] = await Promise.all([
        fetch(`/api/hod/command-center?department=${deptCode}`).then((r) => r.json()),
        fetch(`/api/hod/health?department=${deptCode}`).then((r) => r.json()),
        fetch(`/api/hod/what-changed?department=${deptCode}`).then((r) => r.json()),
        fetch(`/api/hod/proposals?department=${deptCode}`).then((r) => r.json()),
        fetch(`/api/hod/accreditation?department=${deptCode}`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/hod/workload?department=${deptCode}`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (cmdRes.summary) setCommandCenterData(cmdRes.summary);
      if (healthRes.health) setHealthData(healthRes.health);
      if (changedRes.deltas) setWhatChanged(changedRes.deltas);
      if (proposalsRes.proposals) setProposals(proposalsRes.proposals);
      if (nbaRes?.audit) setNbaAudit(nbaRes.audit);
      if (workloadRes?.workload) setWorkloadData(workloadRes.workload);

      // Seed Student Exam Clearance Data
      setExamClearanceData({
        statutoryAttendanceFloor: 75.0,
        medicalCondonationFloor: 65.0,
        totalAudited: 48,
        blockedCount: 4,
        students: [
          {
            studentId: "STU-003",
            rollNo: "22CS103",
            name: "Aarav Sharma",
            attendancePct: 68.5,
            internalMarksPct: 42.0,
            feeHold: false,
            hallTicketStatus: "WITHHELD_ATTENDANCE",
            condonationEligible: true,
            condonationReason: "Medical documentation verified by University Health Center (68.5% >= 65.0% condonation floor).",
            isCondoned: false,
          },
          {
            studentId: "STU-005",
            rollNo: "22CS105",
            name: "Chetan Verma",
            attendancePct: 62.0,
            internalMarksPct: 58.0,
            feeHold: false,
            hallTicketStatus: "WITHHELD_ATTENDANCE",
            condonationEligible: false,
            condonationReason: "Attendance below 65.0% condonation threshold. Requires Dean of Academic Affairs waiver.",
            isCondoned: false,
          },
          {
            studentId: "STU-007",
            rollNo: "22CS107",
            name: "Eshan Reddy",
            attendancePct: 71.0,
            internalMarksPct: 38.0,
            feeHold: false,
            hallTicketStatus: "WITHHELD_ATTENDANCE",
            condonationEligible: true,
            condonationReason: "On-Duty compensatory claim: Represented ALITS at Inter-University Autonomous Hackathon.",
            isCondoned: false,
          },
          {
            studentId: "STU-010",
            rollNo: "22CS110",
            name: "Harish Kalyan",
            attendancePct: 69.0,
            internalMarksPct: 45.0,
            feeHold: true,
            hallTicketStatus: "WITHHELD_ATTENDANCE_AND_FEE",
            condonationEligible: true,
            condonationReason: "Eligible for medical condonation (69.0% >= 65.0%). Requires Bursar fee clearance.",
            isCondoned: false,
          },
        ],
      });
    } catch (err) {
      console.error("Failed to load HOD dashboard intelligence:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptCode]);

  // AI Command Query
  const handleRunAiQuery = async (queryText?: string) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/hod/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, departmentCode: deptCode }),
      });
      const data = await res.json();
      if (data.report) {
        setAiReport(data.report);
      }
    } catch (err) {
      console.error("AI Command Center error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Resolve Proposal
  const handleResolveProposal = async (proposalId: string, action: "APPROVE" | "REJECT" | "ESCALATE") => {
    try {
      const res = await fetch("/api/hod/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, action, confirmedBy: session?.name || "HOD Admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(data.message || `Proposal ${action.toLowerCase()}d successfully.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error("Proposal resolution error:", err);
    }
  };

  // 1-Click Condonation
  const handleCondoneStudent = (studentId: string, studentName: string) => {
    if (!examClearanceData) return;
    setExamClearanceData((prev: any) => ({
      ...prev,
      students: prev.students.map((s: any) =>
        s.studentId === studentId ? { ...s, isCondoned: true, hallTicketStatus: "CONDONED_RELEASED" } : s
      ),
    }));
    setActionSuccessMsg(`HOD Attendance Condonation granted for ${studentName}. Hall ticket release approved under Ordinance 12.3.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // 1-Click Faculty Rebalance Simulation
  const handleApplyRebalance = () => {
    setRebalanceApplied(true);
    setActionSuccessMsg("Section redistribution executed: CSE204L Lab Section 02 reallocated from Prof. V. Rajesh to Prof. M. Sneha. Zero timetable clashes.");
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const alerts = commandCenterData?.alerts || {
    atRiskStudentsCount: 4,
    examBlockersCount: 4,
    overloadedFacultyCount: 1,
    timetableConflictsCount: 0,
    pendingApprovalsCount: proposals.filter((p) => p.status === "PENDING_HOD_CONFIRMATION").length || 2,
  };

  return (
    <AnimatedBackground>
      <div className="w-full space-y-6 pb-16 font-sans relative z-10">

        {/* ── 1. INSTITUTIONAL BRAND & DEPARTMENT SELECTOR HEADER ── */}
        <div className="bg-white/95 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative h-11 w-36 sm:w-44 flex items-center justify-start">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 tracking-tight uppercase">
                    Anantha Lakshmi Institute of Technology & Sciences
                  </span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Autonomous R23 Governance
                  </Badge>
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-1.5">
                  <Scale className="h-5 w-5 text-indigo-600" />
                  Department of {deptCode === "ALL" ? "All Engineering Programs" : deptCode} • Executive Command Center
                </h1>
              </div>
            </div>

            {/* Department Scoping Dropdown & Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500 pl-1">Scope:</span>
                <select
                  value={deptCode}
                  onChange={(e) => setActiveDepartment(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="CSE">CSE — Computer Science & Engineering</option>
                  <option value="IT">IT — Information Technology</option>
                  <option value="AI&DS">AI&DS — Artificial Intelligence & Data Science</option>
                  <option value="ECE">ECE — Electronics & Communication</option>
                  <option value="MECH">MECH — Mechanical Engineering</option>
                  <option value="CIVIL">CIVIL — Civil Engineering</option>
                  <option value="ALL">ALL — Dean Multi-Department View</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={refreshing}
                className="border-slate-200 bg-white text-slate-700 hover:text-slate-900 text-xs rounded-xl shadow-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
                <span>Sync SIS</span>
              </Button>
            </div>
          </div>

          {/* Explicit Data Provenance & Operational Mode Notice */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>
                Data Source: <strong>{PROVENANCE.source}</strong> • Dataset ID: <code>{PROVENANCE.datasetId}</code> • Mode: <code>{PROVENANCE.mode}</code>
              </span>
            </div>
            <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 w-fit">
              ⚠ Departmental Executive Sandbox • Deterministic Governance
            </span>
          </div>
        </div>

        {/* Action Success Toast Banner */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── 2. EXECUTIVE MORNING COMMAND RIBBON (4 HIGH-STAKE METERS) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Academic Risk & Exam Clearance */}
          <div
            onClick={() => setActiveTab("exam_clearance")}
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-full">
                Exam Clearance
              </span>
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-black text-rose-700 mt-1">{alerts.examBlockersCount} Students</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">Hall Tickets Withheld</p>
            <p className="text-[10px] text-rose-600 mt-0.5">Attendance &lt; 75% or Fee Holds</p>
            <div className="mt-3 pt-2 border-t border-rose-200/80 flex items-center text-[11px] font-bold text-rose-700">
              <span>Review Condonation Gateway</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </div>

          {/* Card 2: Faculty Workload Balancer */}
          <div
            onClick={() => setActiveTab("workload")}
            className="p-4 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-100 px-2 py-0.5 rounded-full">
                AICTE Workload
              </span>
              <Users className="h-4.5 w-4.5 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-black text-purple-700 mt-1">{alerts.overloadedFacultyCount} Overloaded</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">Faculty Load Cap Exceeded</p>
            <p className="text-[10px] text-purple-600 mt-0.5">&gt; 18 hrs/wk statutory ceiling</p>
            <div className="mt-3 pt-2 border-t border-purple-200/80 flex items-center text-[11px] font-bold text-purple-700">
              <span>Inspect Teaching Balancer</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </div>

          {/* Card 3: NBA Tier-1 Attainment Benchmark */}
          <div
            onClick={() => setActiveTab("nba")}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-full">
                Accreditation
              </span>
              <Award className="h-4.5 w-4.5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-black text-blue-700 mt-1">83.3% Attained</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">NBA Tier-1 Compliance</p>
            <p className="text-[10px] text-amber-600 mt-0.5">PO5 Modern Tools gap (-0.15)</p>
            <div className="mt-3 pt-2 border-t border-blue-200/80 flex items-center text-[11px] font-bold text-blue-700">
              <span>Open CO-PO Studio</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </div>

          {/* Card 4: Action Proposals Queue */}
          <div
            onClick={() => setActiveTab("approvals")}
            className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded-full">
                Action Proposals
              </span>
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-black text-indigo-700 mt-1">{alerts.pendingApprovalsCount} Actions</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">Pending HOD Confirmation</p>
            <p className="text-[10px] text-indigo-600 mt-0.5">Condonations & Section Shifts</p>
            <div className="mt-3 pt-2 border-t border-indigo-200/80 flex items-center text-[11px] font-bold text-indigo-700">
              <span>Review Action Queue</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </div>
        </div>

        {/* ── 3. FIVE HOD GOVERNANCE OPERATIONAL TABS ── */}
        <div className="bg-white/95 rounded-2xl border border-slate-200 shadow-sm overflow-hidden backdrop-blur-xl">
          {/* Tab Bar Header */}
          <div className="flex items-center overflow-x-auto p-2 bg-slate-50 border-b border-slate-200 gap-1.5 scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Scale className="h-4 w-4 text-indigo-600" />
              <span>Operations Hub</span>
            </button>

            <button
              onClick={() => setActiveTab("nba")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "nba"
                  ? "bg-white text-blue-900 shadow-xs border border-blue-200 ring-2 ring-blue-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Award className="h-4 w-4 text-blue-600" />
              <span>NBA Accreditation & CO-PO Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-mono">
                83.3% Compliant
              </span>
            </button>

            <button
              onClick={() => setActiveTab("workload")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "workload"
                  ? "bg-white text-purple-900 shadow-xs border border-purple-200 ring-2 ring-purple-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Users className="h-4 w-4 text-purple-600" />
              <span>Faculty Workload Balancer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-mono">
                AICTE 16/18h
              </span>
            </button>

            <button
              onClick={() => setActiveTab("exam_clearance")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "exam_clearance"
                  ? "bg-white text-rose-900 shadow-xs border border-rose-200 ring-2 ring-rose-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-rose-600" />
              <span>Exam Clearance & Condonation</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-mono">
                4 Blocked
              </span>
            </button>

            <button
              onClick={() => setActiveTab("approvals")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "approvals"
                  ? "bg-white text-indigo-900 shadow-xs border border-indigo-200 ring-2 ring-indigo-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Action Proposals & Approvals</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                {alerts.pendingApprovalsCount} Pending
              </span>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: OPERATIONS HUB & HEALTH INDEX                          */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* AI Operations Command Assistant ("What requires my attention today?") */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                      <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        HOD Cognitive Operations Command Assistant
                      </h3>
                      <p className="text-[11px] text-indigo-200">
                        Synthesizes departmental data, AICTE contact limits, and NBA Tier-1 accreditation metrics
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
                      Gemini 2.5 Flash Grounded
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setAiQuery("What requires my immediate executive attention today?");
                      handleRunAiQuery("What requires my immediate executive attention today?");
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-colors"
                  >
                    What requires attention today?
                  </button>
                  <button
                    onClick={() => {
                      setAiQuery("Analyze NBA Tier-1 PO5 Modern Tool Usage gap");
                      handleRunAiQuery("Analyze NBA Tier-1 PO5 Modern Tool Usage gap");
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-colors"
                  >
                    Analyze PO5 Modern Tools Gap (-0.15)
                  </button>
                  <button
                    onClick={() => {
                      setAiQuery("Audit faculty teaching contact overload");
                      handleRunAiQuery("Audit faculty teaching contact overload");
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-colors"
                  >
                    Audit Faculty Workload (&gt;18 hrs)
                  </button>
                  <button
                    onClick={() => {
                      setAiQuery("Audit student attendance condonations");
                      handleRunAiQuery("Audit student attendance condonations");
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-colors"
                  >
                    Review Exam Hall Ticket Holds
                  </button>
                </div>

                {/* AI Executive Summary Box */}
                {aiReport && (
                  <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/15 space-y-3 animate-in fade-in">
                    <p className="text-xs text-white leading-relaxed font-medium">
                      {aiReport.summary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">Root Causes Identified:</span>
                        <ul className="space-y-1">
                          {aiReport.primaryCauses?.map((c: string, idx: number) => (
                            <li key={idx} className="text-[11px] text-slate-200 flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block">Recommended HOD Interventions:</span>
                        <ul className="space-y-1">
                          {aiReport.recommendedActions?.map((act: any, idx: number) => (
                            <li key={idx} className="text-[11px] text-slate-200 flex items-start gap-1.5">
                              <span className="text-emerald-400">•</span>
                              <span><strong>{act.action}:</strong> {act.impact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 7-Dimensional Health Score & What Changed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Dimensional Health Score (2 Cols) */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-indigo-600" />
                        7-Dimensional Department Health Index
                      </h4>
                      <p className="text-[11px] text-slate-500">Live PostgreSQL SIS records, workload engines, and RAG policies</p>
                    </div>
                    {healthData && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1">
                        Score: {healthData.overallScore}/100 ({healthData.status})
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {healthData?.metrics?.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedMetric(m)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{m.category}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                m.status === "GOOD"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {m.status}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-[11px]">{m.summary}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                m.score >= 80 ? "bg-emerald-500" : m.score >= 70 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${m.score}%` }}
                            />
                          </div>
                          <span className="font-bold font-mono text-slate-800 text-xs w-8 text-right">{m.score}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* "What Changed?" Weekly Shift Radar (1 Col) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                        "What Changed?" Shift Radar
                      </h4>
                      <p className="text-[11px] text-slate-500">Weekly temporal variance</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                      Weekly Delta
                    </Badge>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {whatChanged.slice(0, 4).map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[11px]">{d.metric}</span>
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              d.direction === "DOWN" && d.severity === "CRITICAL"
                                ? "text-rose-600"
                                : d.direction === "UP" && d.severity === "POSITIVE"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {d.previousValue} → {d.currentValue}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">{d.changeDescription}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-Feature Quick Launch Links */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                  Department Operational Modules:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  <Link href="/hod/approvals" className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-center transition-colors">
                    <ShieldCheck className="h-4 w-4 mx-auto text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">Approvals</span>
                  </Link>
                  <Link href="/hod/faculty" className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-center transition-colors">
                    <Users className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">Faculty Roster</span>
                  </Link>
                  <Link href="/hod/students" className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-center transition-colors">
                    <GraduationCap className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">Students</span>
                  </Link>
                  <Link href="/hod/timetable" className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-center transition-colors">
                    <Calendar className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">Timetable</span>
                  </Link>
                  <Link href="/hod/facilities" className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-center transition-colors">
                    <Building className="h-4 w-4 mx-auto text-teal-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">Labs & Equip</span>
                  </Link>
                  <Link href="/hod/audit" className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-center transition-colors">
                    <FileText className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">Audit Trail</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 2: NBA TIER-1 ACCREDITATION & CO-PO STUDIO               */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "nba" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    NBA Tier-1 Accreditation & CO-PO Attainment Studio
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mathematical 3.00 scale calculation across Program Outcomes PO1–PO12 with direct & indirect course mappings
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-mono py-1">
                    Compliance: 83.3% (11 of 12 Attained)
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="border-slate-300 text-slate-700 text-xs font-bold gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print SAR Summary
                  </Button>
                </div>
              </div>

              {/* Critical PO5 Gap Alert Banner */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Critical Accreditation Deficit Detected: PO5 Modern Tool Usage (-0.15 Gap)
                  </span>
                  <Badge className="bg-amber-200 text-amber-900 border-amber-300 text-[10px]">
                    Current: 1.85 / Target: 2.00
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Remedial Plan Enacted:</strong> Mandatory 2-week weekend workshop on Docker/Kubernetes container orchestration and GitHub Actions CI/CD pipelines assigned to <strong>Prof. V. Rajesh</strong>. Target completion date: <strong>October 15, 2026</strong>.
                </p>
              </div>

              {/* PO1 to PO12 Attainment Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  Program Outcomes (PO1–PO12) Attainment Matrix:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(nbaAudit?.programOutcomes || [
                    { code: "PO1", name: "Engineering Knowledge", attained: 2.85, benchmark: 2.0, status: "SURPASSED" },
                    { code: "PO2", name: "Problem Analysis", attained: 2.40, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO3", name: "Design & Development", attained: 2.65, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO4", name: "Investigations & Experiments", attained: 2.50, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO5", name: "Modern Tool Usage (DevOps/Cloud)", attained: 1.85, benchmark: 2.0, status: "GAP_IDENTIFIED" },
                    { code: "PO6", name: "The Engineer & Society", attained: 2.20, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO7", name: "Environment & Sustainability", attained: 2.10, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO8", name: "Ethics & Integrity", attained: 2.35, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO9", name: "Individual & Team Work", attained: 2.45, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO10", name: "Communication Skills", attained: 2.30, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO11", name: "Project Management", attained: 2.15, benchmark: 2.0, status: "ATTAINED" },
                    { code: "PO12", name: "Life-long Learning", attained: 2.40, benchmark: 2.0, status: "ATTAINED" },
                  ]).map((po: any) => {
                    const isGap = po.status === "GAP_IDENTIFIED";
                    const isSurpassed = po.status === "SURPASSED";
                    return (
                      <div
                        key={po.code}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          isGap
                            ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/20"
                            : isSurpassed
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm text-indigo-700">{po.code}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${
                              isGap
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : isSurpassed
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {isGap ? "Gap (-0.15)" : isSurpassed ? "Surpassed" : "Attained"}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{po.name}</p>

                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                            <span>Score: {po.attained.toFixed(2)}</span>
                            <span>Target: {po.benchmark.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isGap ? "bg-amber-500" : isSurpassed ? "bg-emerald-600" : "bg-indigo-600"
                              }`}
                              style={{ width: `${Math.min(100, (po.attained / 3.0) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 3: FACULTY TEACHING WORKLOAD BALANCER                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "workload" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Faculty Teaching Workload Balancer & AICTE Quota Audit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Statutory AICTE weekly contact limits: <strong>Professors: 16 hrs/wk</strong> • <strong>Assistant Professors: 18 hrs/wk</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleApplyRebalance}
                    disabled={rebalanceApplied}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    {rebalanceApplied ? "Rebalance Applied" : "Simulate 1-Click Rebalance"}
                  </Button>
                </div>
              </div>

              {/* Proposed Rebalancing Simulator Box */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    Recommended Section Redistribution Invariant:
                  </span>
                  <Badge className="bg-purple-200 text-purple-900 border-purple-300 text-[10px]">
                    Timetable Collision Free
                  </Badge>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Reallocate <strong>CSE204L Lab Section 02 (2 contact hours/week)</strong> from overloaded instructor <strong>Prof. V. Rajesh (19 hrs → 17 hrs)</strong> to available instructor <strong>Prof. M. Sneha (12 hrs → 14 hrs)</strong>.
                </p>
              </div>

              {/* Faculty Workload Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">Faculty Member</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3 text-center">Theory Hours</th>
                        <th className="p-3 text-center">Lab Hours</th>
                        <th className="p-3 text-center">Total Contact</th>
                        <th className="p-3 text-center">AICTE Cap</th>
                        <th className="p-3 text-right">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(workloadData?.faculty || [
                        { name: "Dr. K. S. Ramanujan", designation: "Professor & Chair", breakdown: { theory: 8, lab: 6 }, totalHours: 16, aicteLimitHours: 16, status: "COMPLIANT" },
                        { name: "Dr. S. Ananya", designation: "Associate Professor", breakdown: { theory: 8, lab: 4 }, totalHours: 14, aicteLimitHours: 16, status: "BALANCED" },
                        { name: "Prof. V. Rajesh", designation: "Assistant Professor", breakdown: { theory: 9, lab: 8 }, totalHours: rebalanceApplied ? 17 : 19, aicteLimitHours: 18, status: rebalanceApplied ? "COMPLIANT" : "OVERLOADED" },
                        { name: "Prof. M. Sneha", designation: "Assistant Professor", breakdown: { theory: 6, lab: 4 }, totalHours: rebalanceApplied ? 14 : 12, aicteLimitHours: 18, status: "CAPACITY_AVAILABLE" },
                        { name: "Dr. B. Harish", designation: "Associate Professor", breakdown: { theory: 8, lab: 5 }, totalHours: 15, aicteLimitHours: 16, status: "COMPLIANT" },
                      ]).map((f: any, idx: number) => {
                        const isOver = f.status === "OVERLOADED";
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isOver ? "bg-purple-50/30" : ""}`}>
                            <td className="p-3 font-semibold text-slate-900">{f.name}</td>
                            <td className="p-3 text-slate-600">{f.designation}</td>
                            <td className="p-3 text-center font-mono">{f.breakdown?.theory || 8} hrs</td>
                            <td className="p-3 text-center font-mono">{f.breakdown?.lab || 4} hrs</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-900">{f.totalHours} hrs/wk</td>
                            <td className="p-3 text-center font-mono text-slate-500">{f.aicteLimitHours} hrs/wk</td>
                            <td className="p-3 text-right">
                              {isOver ? (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">
                                  Overloaded (+1h)
                                </Badge>
                              ) : f.status === "CAPACITY_AVAILABLE" ? (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
                                  Capacity Available
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                                  Compliant
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 4: STUDENT EXAM CLEARANCE & CONDONATION GATEWAY           */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "exam_clearance" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-rose-600" />
                    Student Exam Clearance & Statutory Condonation Gateway
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Statutory Ordinance 12.3: Students with 65.0%–74.9% attendance may be condoned by HOD upon verified medical grounds
                  </p>
                </div>

                <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-mono py-1">
                  Threshold: 75.0% Mandatory Attendance
                </Badge>
              </div>

              {/* Roster Table of Blocked Students */}
              <div className="space-y-3">
                {examClearanceData?.students?.map((stu: any) => {
                  const condoned = stu.isCondoned;
                  return (
                    <div
                      key={stu.studentId}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        condoned
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-white border-rose-200 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 font-mono font-bold text-xs text-slate-800">
                            {stu.rollNo}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{stu.name}</h4>
                            <p className="text-[11px] text-slate-500">{stu.condonationReason}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Attendance</span>
                            <span className="font-mono font-bold text-xs text-rose-600">
                              {stu.attendancePct}%
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">CIE Internals</span>
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {stu.internalMarksPct}%
                            </span>
                          </div>

                          {condoned ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                              Condoned & Released
                            </Badge>
                          ) : stu.condonationEligible ? (
                            <Button
                              size="sm"
                              onClick={() => handleCondoneStudent(stu.studentId, stu.name)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Grant Medical Condonation
                            </Button>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                              Escalate to Dean (&lt;65%)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 5: ACTION PROPOSALS & APPROVALS QUEUE                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "approvals" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    Human-in-the-Loop Action Proposals & Policy Waivers
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proposals generated by governance engines requiring authorized HOD confirmation or Dean escalation
                  </p>
                </div>

                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-mono py-1">
                  Audit Logging Active
                </Badge>
              </div>

              {/* Proposals Cards */}
              <div className="space-y-4">
                {proposals.map((prop: any) => {
                  const isApproved = prop.status === "APPROVED";
                  const isRejected = prop.status === "REJECTED";
                  return (
                    <div
                      key={prop.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isApproved
                          ? "bg-emerald-50/40 border-emerald-200"
                          : isRejected
                          ? "bg-slate-100 border-slate-300 opacity-60"
                          : "bg-white border-indigo-200 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{prop.title}</span>
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                              {prop.category}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{prop.summary}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isApproved ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                              Approved by {prop.confirmedBy || "HOD"}
                            </Badge>
                          ) : isRejected ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs">
                              Rejected
                            </Badge>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleResolveProposal(prop.id, "APPROVE")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveProposal(prop.id, "REJECT")}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResolveProposal(prop.id, "ESCALATE")}
                                className="text-indigo-600 hover:bg-indigo-50 text-xs font-bold"
                              >
                                Escalate
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Evidence & Policy Citations */}
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                        {prop.evidence?.map((e: string, ei: number) => (
                          <div key={ei} className="flex items-center gap-1.5">
                            <span className="text-indigo-500 font-bold">✓</span>
                            <span>{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. HEALTH PROVENANCE DRILLDOWN MODAL ── */}
        {selectedMetric && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-500" />
                  {selectedMetric.category} Metric Grounding & Audit Provenance
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMetric(null)}
                  className="text-slate-500 hover:text-slate-700 h-7 w-7 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Calculated Score</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {selectedMetric.score} / {selectedMetric.maxScore}
                  </p>
                  <p className="text-slate-600 text-[11px]">{selectedMetric.summary}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Source Provenance Pipeline</span>
                  <p className="text-indigo-600 font-mono text-[11px]">{selectedMetric.provenance}</p>
                  <p className="text-slate-600 text-[10px] mt-1">
                    Derived deterministically from PostgreSQL raw tables, AICTE quota formulas, and RAG curriculum policies.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setSelectedMetric(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-bold"
                >
                  Close Provenance View
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. DEDICATED HOD LANGGRAPH COPILOT DRAWER ── */}
        <DedicatedCopilotDrawer
          role="hod"
          title="HOD Governance Copilot"
          subtitle="NBA CO-PO Attainment • Faculty Workload Balancing • Accreditation"
          departmentId={deptCode}
          quickPrompts={[
            {
              label: "Audit NBA CO-PO Attainment & PO5 Gap",
              query: `Execute mathematical CO-PO attainment analysis for ${deptCode} department and formulate a 2-week remedial workshop for PO5 Modern Tool Usage deficit.`,
            },
            {
              label: "Run Faculty Workload Balancer (AICTE 16/18h)",
              query: `Run Faculty Workload Balancer for ${deptCode} to evaluate weekly contact hours against AICTE limits and simulate section rebalancing.`,
            },
            {
              label: "Audit Exam Hall Ticket Holds (<75%)",
              query: `Identify students in ${deptCode} with attendance below 75% and evaluate condonation eligibility under Examination Ordinance 12.3.`,
            },
            {
              label: "Synthesize Executive Department Dossier",
              query: `Produce a comprehensive executive overview of ${deptCode} operations, syllabus pacing, and lab infrastructure for Dean review.`,
            },
          ]}
        />
      </div>
    </AnimatedBackground>
  );
}
