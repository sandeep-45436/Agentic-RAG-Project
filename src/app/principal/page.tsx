"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Coins,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Layers,
  ChevronRight,
  FileText,
  Clock,
  Compass,
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PortalSwitcher } from "@/components/portal-switcher";
import { DedicatedCopilotDrawer } from "@/components/ai/DedicatedCopilotDrawer";

export default function PrincipalDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Strategic AI State
  const [aiQuery, setAiQuery] = useState("What is the comprehensive university operations state?");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, deptRes, appRes] = await Promise.all([
        fetch("/api/principal/overview").then((r) => r.json()),
        fetch("/api/principal/departments").then((r) => r.json()),
        fetch("/api/principal/approvals").then((r) => r.json()),
      ]);

      if (ovRes.overview) setOverview(ovRes.overview);
      if (deptRes.departments) setDepartments(deptRes.departments);
      if (appRes.approvals) setApprovals(appRes.approvals);
    } catch (err) {
      console.error("Failed to load principal dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAi = async (customQuery?: string) => {
    const q = customQuery || aiQuery;
    if (!q.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/principal/strategic-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.report) {
        setAiReport(data.report);
      }
    } catch (err) {
      console.error("AI query failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleResolveApproval = async (id: string, action: "APPROVE" | "REJECT" | "HOLD") => {
    try {
      const res = await fetch("/api/principal/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: id, action }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovals((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to resolve approval:", err);
    }
  };

  const ov = overview || {
    totalColleges: 1,
    totalDepartments: 9,
    totalStudents: 900,
    totalFaculty: 90,
    totalResearchFundingUsd: 32800000,
    overallPlacementRate: 95.2,
    naacAccreditationScore: 3.82,
    nirfNationalRank: 12,
    examIntegrityScore: 99.1,
    annualBudgetTotalUsd: 17500000,
    annualBudgetSpentUsd: 13090000,
    studentFacultyRatio: "1:10",
  };

  return (
    <AnimatedBackground>
    <div className="space-y-6 pb-12 font-sans">
      {/* ── PRINCIPAL EXECUTIVE LEADERSHIP SUB-FEATURES HUB ─────────────── */}
      <div className="bg-white/95 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Office of the Principal • Executive Operations Hub</h2>
              <p className="text-[11px] text-slate-500">Institution-wide governance across all 9 departments, statutory approvals, and research financing</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 w-fit">
            4 Executive Sub-Features Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/principal"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-white hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 group-hover:scale-105 transition-transform">
                <Landmark className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Executive</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors">Executive Command Cockpit</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Institution overview, pass rates & NIRF radar</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-amber-800">
              <span>Current Dashboard</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/principal/departments"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">9 Depts</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">9-Department Matrix</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Comparative benchmarks across all engineering branches</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-blue-700">
              <span>View Matrix</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/principal/approvals"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Approvals</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Executive Approvals Registry</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Capital requests, faculty recruitments & university escalations</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-emerald-700">
              <span>Manage Approvals</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/principal/finance"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                <Coins className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Finance</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Budget & Research Grants</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Department fund utilization, government grants & endowments</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-purple-700">
              <span>View Finance</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── ALITS PRINCIPAL INSTITUTIONAL BRAND HEADER ────────────────────── */}
      <div className="light-glass-card anim-fade-up-1 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/80 bg-white/80 backdrop-blur-sm">
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
          <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-xs font-bold text-slate-900 block tracking-tight text-reveal">
              Anantha Lakshmi Institute of Technology & Sciences
            </span>
            <span className="text-[11px] text-slate-600 font-medium">
              Office of the Principal • Executive Operations Cockpit
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/principal/profile"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 rounded-xl shadow-md shadow-amber-500/20 text-xs font-bold px-4 py-2.5 transition-all hover:scale-105"
          >
            <ShieldCheck className="h-4 w-4" />
            Principal Executive Dossier
            <ChevronRight className="h-3.5 w-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* ── 2. HERO EXECUTIVE GOVERNANCE BANNER ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border border-indigo-100 p-6 lg:p-8 shadow-2xl anim-fade-up-1">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/40 text-xs font-semibold px-2.5 py-0.5 backdrop-blur-sm">
                🏛️ Institutional Governance Council
              </Badge>
              <Badge className="bg-white/20 text-white border-white/40 text-xs backdrop-blur-sm">
                NAAC Grade A++ ({ov.naacAccreditationScore} / 4.00)
              </Badge>
              <Badge className="bg-white/20 text-white border-white/40 text-xs font-mono backdrop-blur-sm">
                NIRF Rank #{ov.nirfNationalRank} National
              </Badge>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight gradient-text-animated">
              University Executive Operations Cockpit
            </h1>

            <p className="text-sm text-white max-w-2xl leading-relaxed">
              Plenary institutional oversight across {ov.totalColleges} constituent college, {ov.totalDepartments} academic departments, <span className="number-pop inline-block">{ov.totalStudents.toLocaleString()}</span> verified scholars, and autonomous policy enforcement engines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/principal/approvals"
              className="inline-flex items-center justify-center bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl shadow-lg shadow-white/25 text-xs px-4 py-3 transition-all hover:scale-105 gap-2"
            >
              <ShieldCheck className="h-4 w-4 icon-ring" />
              Executive Approvals ({approvals.length})
            </Link>

            <Link
              href="/principal/departments"
              className="inline-flex items-center justify-center border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold px-4 py-3 transition-all gap-2 backdrop-blur-sm"
            >
              <Building2 className="h-4 w-4 text-white" />
              Benchmarking Matrix
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 text-white hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors backdrop-blur-sm"
              title="Refresh institutional state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. SIX EXECUTIVE MACRO KPI METRICS ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 anim-fade-up-2">
        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-50 transition-colors bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Total Scholars</span>
            <GraduationCap className="h-4 w-4 text-indigo-500 icon-ring" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono number-pop">{ov.totalStudents.toLocaleString()}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">94.6% Placement Rate</p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-50 transition-colors bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Faculty Roster</span>
            <Users className="h-4 w-4 text-purple-500 icon-ring" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono number-pop">{ov.totalFaculty}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Ratio {ov.studentFacultyRatio}</p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-50 transition-colors bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Colleges & Depts</span>
            <Building2 className="h-4 w-4 text-cyan-600 icon-ring" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono number-pop">{ov.totalColleges} / {ov.totalDepartments}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{ov.totalDepartments} Scoped Branches</p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-50 transition-colors bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Research Grants</span>
            <Coins className="h-4 w-4 text-emerald-600 icon-ring" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono number-pop">${(ov.totalResearchFundingUsd / 1_000_000).toFixed(1)}M</p>
            <p className="text-[10px] text-slate-600 mt-0.5">+18% YoY Growth</p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-50 transition-colors bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Exam Integrity</span>
            <ShieldCheck className="h-4 w-4 text-pink-500 icon-ring" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono number-pop">{ov.examIntegrityScore}%</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Zero Leakage / Collisions</p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-4 flex flex-col justify-between hover:bg-indigo-50 transition-colors bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Fiscal Spend</span>
            <TrendingUp className="h-4 w-4 text-amber-500 icon-ring" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono number-pop">${(ov.annualBudgetSpentUsd / 1_000_000).toFixed(1)}M</p>
            <p className="text-[10px] text-slate-600 mt-0.5">of ${(ov.annualBudgetTotalUsd / 1_000_000).toFixed(1)}M Budget</p>
          </div>
        </div>
      </div>

      {/* ── 4. AUTONOMOUS PRINCIPAL STRATEGIC AI ADVISOR ─────────────── */}
      <div className="rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm shadow-xl space-y-4 anim-fade-up-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Autonomous University Strategic Intelligence Engine
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] badge-pulse">
                  Institutional Synthesis
                </Badge>
              </h2>
              <p className="text-xs text-slate-600">
                Cross-correlates multi-college SIS records, research grant milestones, faculty workload caps, and statutory policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunAi("What is the comprehensive university operations state?")}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Operations Brief
            </button>
            <button
              onClick={() => handleRunAi("Provide NAAC accreditation Criterion breakdown & gap analysis")}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              NAAC / NIRF Readiness
            </button>
            <button
              onClick={() => handleRunAi("Evaluate fiscal spend rate and research CapEx allocation")}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Budget & Grants ROI
            </button>
          </div>
        </div>

        {/* Input query form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAi();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="e.g. 'Assess inter-departmental research yield' or 'Identify faculties with teaching overloads'..."
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl"
          />
          <Button
            type="submit"
            disabled={aiLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl px-5 shrink-0 shadow-md shadow-indigo-500/20"
          >
            {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
            Synthesize
          </Button>
        </form>

        {/* AI Report Output */}
        {aiReport && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5 text-xs animate-in fade-in duration-300 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">Executive Strategic Dossier</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(aiReport.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-slate-700 leading-relaxed text-xs font-sans">
              {aiReport.executiveSummary}
            </p>

            {/* Institutional Findings */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-800 block mb-1">
                Institutional Audit Observations:
              </span>
              <ul className="space-y-1">
                {aiReport.institutionalFindings?.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiReport.strategicRecommendations?.map((r: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-[11px]">{r.action}</strong>
                  <p className="text-[10px] text-slate-600">{r.impact}</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
                    <span>Assigned: {r.responsibleDean}</span>
                    <span>Timeline: {r.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Statutory Grounding Citations */}
            <div className="space-y-1 pt-1 text-[10px] text-slate-600">
              <span className="font-bold uppercase tracking-wider text-slate-800 block">
                Statutory Charter Citations:
              </span>
              {aiReport.policyGrounding?.map((p: any, i: number) => (
                <p key={i} className="text-slate-600">
                  <strong className="text-indigo-600">{p.rule}:</strong> {p.citation}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. TWO-COLUMN: EXECUTIVE APPROVALS DESK & BENCHMARKING PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 anim-fade-up-3">
        {/* Left 7 Cols: Executive Approvals Desk */}
        <div className="lg:col-span-7 rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500 icon-ring" />
                Executive Approvals Council
              </h2>
              <p className="text-xs text-slate-600">
                Matters requiring Principal / Vice-Chancellor statutory sign-off
              </p>
            </div>
            <Link
              href="/principal/approvals"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              View all ({approvals.length}) <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {approvals.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">All executive matters resolved.</p>
            ) : (
              approvals.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-700 bg-slate-50 badge-pulse">
                          {app.category.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono">{app.departmentCode}</span>
                        {app.financialImpactUsd && (
                          <span className="text-[10px] font-bold text-emerald-600 font-mono">
                            ${app.financialImpactUsd.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                        {app.title}
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-1">{app.justification}</p>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {app.submittedDate}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <span>AI Risk Scan: {app.aiRiskAssessment}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-600">By: {app.submittedBy}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolveApproval(app.id, "REJECT")}
                        className="h-7 text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveApproval(app.id, "APPROVE")}
                        className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm"
                      >
                        Seal & Ratify
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 5 Cols: Top Performing Departments Summary */}
        <div className="lg:col-span-5 rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-indigo-500 icon-ring" />
                  Department Health Ranking
                </h2>
                <p className="text-xs text-slate-600">
                  Multivariate operational composite index
                </p>
              </div>
              <Link
                href="/principal/departments"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                Matrix <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 pt-3">
              {departments.slice(0, 5).map((d, i) => (
                <div
                  key={d.code}
                  className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-sm hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-slate-400 text-xs w-4">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{d.code} - {d.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {d.studentCount} Students • Avg GPA: {d.avgGpa}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        d.status === "EXEMPLARY"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : d.status === "STABLE"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {d.healthIndex}/100
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <Link href="/principal/departments" className="block">
              <Button variant="outline" className="w-full text-xs border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl">
                Open Full Institutional Benchmarking Matrix <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── PRINCIPAL DEDICATED LANGGRAPH COPILOT DRAWER ── */}
      <DedicatedCopilotDrawer
        role="principal"
        title="Executive Intelligence Copilot"
        subtitle="Institutional Benchmarking • Cross-Department Audit • Board Briefings"
        quickPrompts={[
          { label: "Synthesize Board of Governors Briefing", query: "Produce an executive briefing on institutional performance, placement benchmarks, and research outputs for the Governing Body meeting." },
          { label: "Benchmark Departmental Placement & Pass Rates", query: "Analyze cross-departmental comparative performance across CSE, ECE, MECH, and AI&DS." },
          { label: "Draft AICTE/UGC Compliance Circular", query: "Draft an official institutional circular regarding academic integrity and semester ordinance compliance." }
        ]}
      />
    </div>
    </AnimatedBackground>
  );
}
