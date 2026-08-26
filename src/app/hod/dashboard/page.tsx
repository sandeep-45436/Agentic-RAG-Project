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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODDashboardPage() {
  const { session, activeDepartment, isDean } = useHOD();

  // State
  const [healthData, setHealthData] = useState<any>(null);
  const [whatChanged, setWhatChanged] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI Command Center State
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Health Provenance Modal
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [healthRes, changedRes, proposalsRes] = await Promise.all([
        fetch(`/api/hod/health?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/what-changed?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/proposals?department=${activeDepartment}`).then((r) => r.json()),
      ]);

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
        // Refresh proposal state
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "ESCALATED_TO_DEAN" } : p))
        );
      }
    } catch (err) {
      console.error("Failed to resolve proposal:", err);
    }
  };

  const samplePrompts = [
    "Why is CSE204 performance declining and what should I do?",
    "Check department faculty overload and room conflicts",
    "List students facing attendance hall ticket blocking",
    "Generate comprehensive department operations report",
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        <div className="h-40 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/20 p-6 lg:p-8 backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">
                Academic Year 2026-2027 • Fall Governance
              </Badge>
              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                Scope: {healthData?.departmentName || activeDepartment}
              </Badge>
              {isDean && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">
                  Dean Overview
                </Badge>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Department Operations & Cognitive Intelligence
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Welcome, {session?.title || session?.name}. Real-time operational health, policy-grounded decision intelligence, and academic risk orchestration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs rounded-xl"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link
              href="/hod/faculty"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 text-xs font-semibold px-4 py-2 transition-all"
            >
              <Users className="mr-1.5 h-4 w-4" />
              Faculty Workload
            </Link>
          </div>
        </div>
      </div>

      {/* ── 1. DEPARTMENT HEALTH SCORE SUMMARY & 7-DIMENSION METRICS ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score Gauge Card */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-400" />
                Department Health Index
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  healthData?.status === "EXCELLENT"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : healthData?.status === "STABLE"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {healthData?.status || "MODERATE"}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Evaluated across 7 operational dimensions
            </CardDescription>
          </CardHeader>

          <CardContent className="py-4 space-y-4">
            <div className="flex items-center justify-center py-2">
              <div className="relative flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent animate-spin-slow"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 80%, 0 80%)" }}
                  />
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-white font-mono">
                      {healthData?.overallScore ?? 75}
                    </span>
                    <span className="text-xs text-slate-400 block font-semibold">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 text-center leading-relaxed">
              {healthData?.provenanceExplanation ||
                "Department score indicates solid academic performance with active faculty overload in 2 core sections."}
            </p>
          </CardContent>

          <CardFooter className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              100% Provenance Grounded
            </span>
            <span className="text-blue-400 font-mono text-[10px]">
              {healthData?.evaluatedAt ? new Date(healthData.evaluatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
            </span>
          </CardFooter>
        </Card>

        {/* 7 Dimensions Radar Grid */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  Multi-Dimensional Health Breakdown
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Click any dimension to inspect data quality and policy provenance
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400">
                SIS Feeds Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {healthData?.metrics?.map((m: any) => (
              <div
                key={m.category}
                onClick={() => setSelectedMetric(m)}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {m.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-200">
                      {m.score}/100
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${
                        m.status === "GOOD"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : m.status === "MODERATE"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {m.status}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.score >= 80 ? "bg-emerald-500" : m.score >= 65 ? "bg-blue-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 truncate">{m.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 2. "WHAT CHANGED?" OPERATIONAL INTELLIGENCE ─────────────── */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  &quot;What Changed?&quot; — Operational Shift Intelligence
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Automated temporal diff comparing last week with current semester cycle
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
              {whatChanged.length} Significant Shifts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {whatChanged.map((delta) => (
            <div
              key={delta.id}
              className={`p-3.5 rounded-xl bg-slate-950/70 border transition-all space-y-2 ${
                delta.severity === "CRITICAL"
                  ? "border-rose-500/30 hover:border-rose-500/60"
                  : delta.severity === "WARNING"
                  ? "border-amber-500/30 hover:border-amber-500/60"
                  : "border-blue-500/20 hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[170px]">
                  {delta.metric}
                </span>
                <div className="flex items-center gap-1 font-mono text-xs font-semibold">
                  <span className="text-slate-500">{delta.previousValue}</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span
                    className={
                      delta.direction === "DOWN"
                        ? "text-rose-400 font-bold"
                        : delta.direction === "UP"
                        ? delta.severity === "POSITIVE"
                          ? "text-emerald-400 font-bold"
                          : "text-amber-400 font-bold"
                        : "text-blue-400"
                    }
                  >
                    {delta.currentValue}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{delta.changeDescription}</p>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                <p className="text-blue-300 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-blue-400 shrink-0" />
                  <span>{delta.recommendedIntervention}</span>
                </p>
                {delta.policyCitation && (
                  <p className="text-slate-500 text-[10px] truncate italic">{delta.policyCitation}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 3. HOD AI COMMAND CENTER (FLAGSHIP FEATURE) ─────────────── */}
      <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-blue-500/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>HOD AI Command Center</span>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px]">
                    Autonomous Diagnostics
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Ask natural language questions across Student DB, Course Data, Faculty Workload, and Policy RAG
                </CardDescription>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
              Model: Cognitive Engine v2026.4
            </span>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Suggested:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiQuery(p);
                  handleRunAiQuery(p);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-900/40 text-slate-300 hover:text-blue-200 border border-slate-700 hover:border-blue-500/40 transition-all text-left truncate max-w-[280px]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Search / Input Box */}
          <div className="relative pt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunAiQuery();
                }}
                placeholder="Ask anything about your department (e.g. 'Why is CSE204 performance declining and what should I do?')..."
                className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 pr-10 py-5 rounded-xl text-xs sm:text-sm focus:border-blue-500 shadow-inner"
              />
              <Sparkles className="absolute right-3.5 top-3.5 h-4 w-4 text-blue-400 pointer-events-none" />
            </div>
            <Button
              onClick={() => handleRunAiQuery()}
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-5 rounded-xl font-semibold text-xs shadow-lg shadow-blue-600/25 shrink-0"
            >
              {aiLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <span>Diagnose</span>
                  <Send className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* AI Output / Report View */}
        {aiReport && (
          <CardContent className="p-6 space-y-6 animate-in fade-in duration-300">
            {/* Header Snapshot */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-blue-500/20">
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Operational Diagnosis Summary
                </p>
                <p className="text-sm font-bold text-white mt-0.5">{aiReport.summary}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Avg GPA</span>
                  <span className="text-white font-bold">{aiReport.healthSnapshot?.gpa}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Attendance</span>
                  <span className="text-amber-400 font-bold">{aiReport.healthSnapshot?.attendance}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Faculty Overload</span>
                  <span className="text-rose-400 font-bold">{aiReport.healthSnapshot?.overloadedCount} Instructors</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">At-Risk Students</span>
                  <span className="text-rose-400 font-bold">{aiReport.healthSnapshot?.atRiskCount}</span>
                </div>
              </div>
            </div>

            {/* Split: Primary Causes vs Recommended Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Primary Causes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Primary Contributing Causes
                </h4>
                <div className="space-y-2">
                  {aiReport.primaryCauses?.map((cause: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="h-5 w-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Recommended Interventions & Action Plan
                </h4>
                <div className="space-y-2">
                  {aiReport.recommendedActions?.map((act: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{act.action}</p>
                        <p className="text-[11px] text-emerald-400">{act.impact}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30 shrink-0">
                        {act.authority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Policy Grounding Evidence */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                Policy Grounding & Citations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiReport.policyEvidence?.map((pol: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                    <span className="font-bold text-blue-300 block">{pol.title}</span>
                    <p className="text-slate-400 leading-relaxed text-[10px] italic">&quot;{pol.citation}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 4. ACTION PROPOSALS REVIEW SECTION (HUMAN IN THE LOOP) ──── */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                Action Proposals & Decision Reviews
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                High-impact governance actions require explicit Human-in-the-Loop confirmation with policy citations
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
              {proposals.filter((p) => p.status === "PENDING_HOD_CONFIRMATION").length} Pending Review
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm">{prop.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        prop.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : prop.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : prop.status === "ESCALATED_TO_DEAN"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {prop.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{prop.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {prop.status === "PENDING_HOD_CONFIRMATION" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleResolveProposal(prop.id, "APPROVE")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-lg"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveProposal(prop.id, "ESCALATE")}
                        className="border-purple-500/40 text-purple-300 hover:bg-purple-950/40 text-xs h-8 px-2.5 rounded-lg"
                      >
                        Escalate to Dean
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveProposal(prop.id, "REJECT")}
                        className="text-rose-400 hover:bg-rose-500/10 text-xs h-8 px-2 rounded-lg"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Resolved ({prop.status})
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence & Policy citation box */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Policy Citation & Verified Facts</span>
                  <span className="font-mono text-[10px] text-blue-400">Confidence: {(prop.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  {prop.evidence?.map((ev: string, idx: number) => (
                    <li key={idx}>{ev}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 5. PROVENANCE DRILL-DOWN MODAL ─────────────────────────── */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedMetric.category} Dimension Provenance
                  </h3>
                  <span className="text-xs text-slate-400">Score: {selectedMetric.score}/100</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Audit Summary</span>
                <p className="text-slate-200">{selectedMetric.summary}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Data Provenance Source</span>
                <p className="text-blue-400 font-mono text-[11px]">{selectedMetric.provenance}</p>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                All data points are computed deterministically from canonical student records and verified RAG regulations.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMetric(null)}
                className="border-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
