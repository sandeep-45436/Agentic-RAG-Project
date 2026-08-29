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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODDashboardPage() {
  const { session, activeDepartment, isDean } = useHOD();

  // State
  const [commandCenterData, setCommandCenterData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [whatChanged, setWhatChanged] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI Command Center State
  const [aiQuery, setAiQuery] = useState("What requires my attention today?");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Health Provenance Modal
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [cmdRes, healthRes, changedRes, proposalsRes] = await Promise.all([
        fetch(`/api/hod/command-center?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/health?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/what-changed?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/proposals?department=${activeDepartment}`).then((r) => r.json()),
      ]);

      if (cmdRes.summary) setCommandCenterData(cmdRes.summary);
      if (healthRes.health) setHealthData(healthRes.health);
      if (changedRes.deltas) setWhatChanged(changedRes.deltas);
      if (proposalsRes.proposals) setProposals(proposalsRes.proposals);
    } catch (err) {
      console.error("Failed to load dashboard intelligence:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeDepartment]);

  const handleRunAiQuery = async (queryText?: string) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/hod/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, departmentCode: activeDepartment }),
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

  const handleResolveProposal = async (proposalId: string, action: "APPROVE" | "REJECT" | "ESCALATE") => {
    try {
      const res = await fetch("/api/hod/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, action, confirmedBy: session?.name || "HOD" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Proposal resolution error:", err);
    }
  };

  const stats = commandCenterData?.stats || {
    totalStudents: 6,
    totalFaculty: 3,
    totalCourses: 4,
    totalExams: 1,
    totalFacilities: 4,
    totalResearch: 3,
  };

  const alerts = commandCenterData?.alerts || {
    atRiskStudentsCount: 3,
    examBlockersCount: 2,
    overloadedFacultyCount: 1,
    timetableConflictsCount: 0,
    pendingApprovalsCount: 2,
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & OPERATIONAL BRIEF BANNER                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs px-2 py-0.5">
              Department Executive Hub
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Academic Term: <strong className="text-slate-200">Fall 2026</strong>
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-400" />
            {activeDepartment === "ALL" ? "All Departments" : `${activeDepartment} Department`} Operational Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time departmental governance, academic risk orchestration, faculty workload balancing, and policy-grounded decision intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh State
          </Button>

          <Link href="/hod/approvals">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl">
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Approval Center ({alerts.pendingApprovalsCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. LIVE DEPARTMENT METRICS PULSE                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link href="/hod/students">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">Enrolled Students</span>
                <GraduationCap className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalStudents}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Active SIS Cohort</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/faculty">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">Faculty Roster</span>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalFaculty}</p>
              <p className="text-[10px] text-purple-400 mt-0.5">Instructors Active</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/courses">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">Courses & Syllabi</span>
                <FileText className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalCourses}</p>
              <p className="text-[10px] text-amber-400 mt-0.5">RAG Vector Indexed</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/examinations">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">Scheduled Exams</span>
                <Layers className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalExams}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Zig-Zag Seating Active</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/facilities">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">Facilities & Labs</span>
                <Building className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalFacilities}</p>
              <p className="text-[10px] text-cyan-400 mt-0.5">Physical Rooms</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/research">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">Research Grants</span>
                <FlaskConical className="h-4 w-4 text-pink-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalResearch}</p>
              <p className="text-[10px] text-pink-400 mt-0.5">Funded Projects</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. FIVE CRITICAL OPERATIONAL THREAT & GOVERNANCE ALERTS             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Link href="/hod/students?filter=AT_RISK" className="block">
          <Card className="bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60 transition-all">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-rose-300 font-semibold block">Academic Risk Radar</span>
                <p className="text-lg font-black text-rose-400 mt-0.5">
                  {alerts.atRiskStudentsCount} Students
                </p>
                <span className="text-[10px] text-rose-300/80">GPA &lt; 2.0 or Probation</span>
              </div>
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/students?filter=ATTENDANCE_SHORTFALL" className="block">
          <Card className="bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60 transition-all">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-300 font-semibold block">Hall Ticket Blockers</span>
                <p className="text-lg font-black text-amber-400 mt-0.5">
                  {alerts.examBlockersCount} Blocked
                </p>
                <span className="text-[10px] text-amber-300/80">Attendance &lt; 75% or Hold</span>
              </div>
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/faculty" className="block">
          <Card className="bg-purple-950/20 border-purple-900/40 hover:border-purple-700/60 transition-all">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-purple-300 font-semibold block">Faculty Overloads</span>
                <p className="text-lg font-black text-purple-400 mt-0.5">
                  {alerts.overloadedFacultyCount} Overloaded
                </p>
                <span className="text-[10px] text-purple-300/80">&gt; 15 hrs/week Teaching Cap</span>
              </div>
              <Clock className="h-5 w-5 text-purple-400 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/timetable" className="block">
          <Card className="bg-cyan-950/20 border-cyan-900/40 hover:border-cyan-700/60 transition-all">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-cyan-300 font-semibold block">Timetable Conflicts</span>
                <p className="text-lg font-black text-cyan-400 mt-0.5">
                  {alerts.timetableConflictsCount} Collisions
                </p>
                <span className="text-[10px] text-cyan-300/80">Room & Slot Verified</span>
              </div>
              <Calendar className="h-5 w-5 text-cyan-400 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/hod/approvals" className="block">
          <Card className="bg-blue-950/20 border-blue-900/40 hover:border-blue-700/60 transition-all">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-300 font-semibold block">Pending Approvals</span>
                <p className="text-lg font-black text-blue-400 mt-0.5">
                  {alerts.pendingApprovalsCount} Actions
                </p>
                <span className="text-[10px] text-blue-300/80">Condonations & Waivers</span>
              </div>
              <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. AI OPERATIONS COMMAND ASSISTANT ("What requires attention?")    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border-slate-800 backdrop-blur shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  Autonomous HOD Cognitive Operations Assistant
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Live RAG + Decision Engines
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Ask natural language questions across PostgreSQL SIS, Faculty Workload Engine, and Policy Regulations
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunAiQuery("What requires my attention today?")}
                className="text-[11px] h-7 px-2.5 rounded-lg border-slate-700 bg-slate-950 text-blue-300 hover:bg-slate-800"
              >
                What requires my attention today?
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunAiQuery("Identify students below 75% attendance threshold")}
                className="text-[11px] h-7 px-2.5 rounded-lg border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
              >
                Attendance Shortfalls
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunAiQuery("Check faculty teaching load distribution and overloads")}
                className="text-[11px] h-7 px-2.5 rounded-lg border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
              >
                Faculty Load
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Query Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunAiQuery();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Input
                placeholder="e.g. 'What requires my attention today?' or 'Summarize CS401 midterm risk factors'..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs rounded-xl pr-10"
              />
            </div>
            <Button
              type="submit"
              disabled={aiLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 rounded-xl shrink-0"
            >
              {aiLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Run Cognitive Query
            </Button>
          </form>

          {/* AI Report Card (if present) */}
          {aiReport && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                    COGNITIVE SYNTHESIS
                  </Badge>
                  <span className="font-semibold text-white">{aiReport.query}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(aiReport.generatedAt).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">{aiReport.summary}</p>

              {/* Health Snapshot Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Dept Avg GPA</span>
                  <span className="font-bold text-white">{aiReport.healthSnapshot.gpa} / 4.00</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Attendance</span>
                  <span className="font-bold text-emerald-400">{aiReport.healthSnapshot.attendance}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">At-Risk Students</span>
                  <span className="font-bold text-rose-400">{aiReport.healthSnapshot.atRiskCount} Flagged</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Overloaded Faculty</span>
                  <span className="font-bold text-amber-400">{aiReport.healthSnapshot.overloadedCount} Instructors</span>
                </div>
              </div>

              {/* Causes & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                    Identified Operational Causes:
                  </p>
                  <ul className="space-y-1 pl-1">
                    {aiReport.primaryCauses?.map((c: string, idx: number) => (
                      <li key={idx} className="text-slate-300 flex items-start gap-1.5 text-[11px]">
                        <span className="text-amber-400">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    Recommended HOD Interventions:
                  </p>
                  <ul className="space-y-1 pl-1">
                    {aiReport.recommendedActions?.map((act: any, idx: number) => (
                      <li key={idx} className="text-slate-300 flex items-start gap-1.5 text-[11px]">
                        <span className="text-emerald-400">•</span>
                        <div>
                          <strong className="text-white">{act.action}</strong>
                          <p className="text-[10px] text-slate-400">{act.impact} • Authority: {act.authority}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Policy Grounding Citations */}
              <div className="space-y-1 pt-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-400" />
                  Grounding Policy Regulations:
                </p>
                <div className="space-y-1">
                  {aiReport.policyEvidence?.map((ev: any, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <strong className="text-blue-300 block">{ev.title}</strong>
                      <span className="text-slate-400">{ev.citation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. 7-DIMENSIONAL HEALTH SCORE & "WHAT CHANGED?" DELTAS              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Dimension Department Health */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-400" />
                    7-Dimensional Department Health Index
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Weighted operational evaluation with live database provenance proof
                  </CardDescription>
                </div>
                {healthData && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-1">
                    Overall Score: {healthData.overallScore}/100 ({healthData.status})
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {healthData?.metrics?.map((m: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMetric(m)}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.category}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          m.status === "GOOD"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {m.status}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-[11px]">{m.summary}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          m.score >= 80 ? "bg-emerald-500" : m.score >= 70 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    <span className="font-bold font-mono text-white text-xs w-8 text-right">{m.score}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: "What Changed?" Weekly Shift Radar */}
        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-400" />
                  "What Changed?" Shift Radar
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300">
                  Weekly Vector
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Temporal operations shifts between cycles
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs">
              {whatChanged.slice(0, 4).map((d) => (
                <div key={d.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{d.metric}</span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        d.direction === "DOWN" && d.severity === "CRITICAL"
                          ? "text-rose-400"
                          : d.direction === "UP" && d.severity === "POSITIVE"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {d.previousValue} → {d.currentValue}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{d.changeDescription}</p>
                </div>
              ))}

              <div className="pt-2">
                <Link href="/hod/reports" className="block">
                  <Button variant="outline" className="w-full text-xs border-slate-800 bg-slate-950 text-slate-300 hover:text-white rounded-xl">
                    View Full Executive Shift Dossier <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. HEALTH PROVENANCE DRILLDOWN MODAL                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                {selectedMetric.category} Metric Provenance & Grounding
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMetric(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category Score</span>
                <p className="text-xl font-bold text-white font-mono">
                  {selectedMetric.score} / {selectedMetric.maxScore}
                </p>
                <p className="text-slate-300 text-[11px]">{selectedMetric.summary}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Provenance Grounding Engine</span>
                <p className="text-blue-300 font-mono text-[11px]">{selectedMetric.provenance}</p>
                <p className="text-slate-400 text-[10px] mt-1">
                  Derived deterministically from raw database tables, attendance logs, and Faculty Workload Engine equations.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setSelectedMetric(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-semibold"
              >
                Close Provenance View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
