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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PortalSwitcher } from "@/components/portal-switcher";

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
    <div className="space-y-6 pb-12 font-sans">
      {/* ── 1. PORTAL SWITCHER MATRIX ─────────────────────────────────── */}
      <PortalSwitcher />

      {/* ── 2. HERO EXECUTIVE GOVERNANCE BANNER ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-900 border border-amber-500/30 p-6 lg:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-semibold px-2.5 py-0.5">
                🏛️ Institutional Governance Council
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                NAAC Grade A++ ({ov.naacAccreditationScore} / 4.00)
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs font-mono">
                NIRF Rank #{ov.nirfNationalRank} National
              </Badge>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              University Executive Operations Cockpit
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Plenary institutional oversight across {ov.totalColleges} constituent college, {ov.totalDepartments} academic departments, {ov.totalStudents.toLocaleString()} verified scholars, and autonomous policy enforcement engines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/principal/approvals"
              className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 text-xs px-4 py-3 transition-all hover:scale-105 gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Executive Approvals ({approvals.length})
            </Link>

            <Link
              href="/principal/departments"
              className="inline-flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold px-4 py-3 transition-all gap-2"
            >
              <Building2 className="h-4 w-4 text-amber-400" />
              Benchmarking Matrix
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
              title="Refresh institutional state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. SIX EXECUTIVE MACRO KPI METRICS ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="glass-glow-gold rounded-2xl p-4 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Total Scholars</span>
            <GraduationCap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">{ov.totalStudents.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">94.6% Placement Rate</p>
          </div>
        </div>

        <div className="glass-glow-indigo rounded-2xl p-4 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Faculty Roster</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">{ov.totalFaculty}</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Ratio {ov.studentFacultyRatio}</p>
          </div>
        </div>

        <div className="glass-glow-cyan rounded-2xl p-4 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Colleges & Depts</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">{ov.totalColleges} / {ov.totalDepartments}</p>
            <p className="text-[10px] text-cyan-300 mt-0.5">{ov.totalDepartments} Scoped Branches</p>
          </div>
        </div>

        <div className="glass-glow-emerald rounded-2xl p-4 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Research Grants</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">${(ov.totalResearchFundingUsd / 1_000_000).toFixed(1)}M</p>
            <p className="text-[10px] text-emerald-300 mt-0.5">+18% YoY Growth</p>
          </div>
        </div>

        <div className="glass-glow-cyan rounded-2xl p-4 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Exam Integrity</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">{ov.examIntegrityScore}%</p>
            <p className="text-[10px] text-cyan-300 mt-0.5">Zero Leakage / Collisions</p>
          </div>
        </div>

        <div className="glass-glow-gold rounded-2xl p-4 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Fiscal Spend</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white font-mono">${(ov.annualBudgetSpentUsd / 1_000_000).toFixed(1)}M</p>
            <p className="text-[10px] text-slate-400 mt-0.5">of ${(ov.annualBudgetTotalUsd / 1_000_000).toFixed(1)}M Budget</p>
          </div>
        </div>
      </div>

      {/* ── 4. AUTONOMOUS PRINCIPAL STRATEGIC AI ADVISOR ─────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/25 p-6 backdrop-blur shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Autonomous University Strategic Intelligence Engine
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                  Institutional Synthesis
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Cross-correlates multi-college SIS records, research grant milestones, faculty workload caps, and statutory policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunAi("What is the comprehensive university operations state?")}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 transition-colors"
            >
              Operations Brief
            </button>
            <button
              onClick={() => handleRunAi("Provide NAAC accreditation Criterion breakdown & gap analysis")}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 bg-slate-950 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              NAAC / NIRF Readiness
            </button>
            <button
              onClick={() => handleRunAi("Evaluate fiscal spend rate and research CapEx allocation")}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 bg-slate-950 text-slate-300 hover:bg-slate-800 transition-colors"
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
            className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
          />
          <Button
            type="submit"
            disabled={aiLoading}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl px-5 shrink-0 shadow-md shadow-amber-500/20"
          >
            {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
            Synthesize
          </Button>
        </form>

        {/* AI Report Output */}
        {aiReport && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/25 space-y-3.5 text-xs animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-bold text-amber-300">Executive Strategic Dossier</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(aiReport.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-slate-200 leading-relaxed text-xs font-sans">
              {aiReport.executiveSummary}
            </p>

            {/* Institutional Findings */}
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                Institutional Audit Observations:
              </span>
              <ul className="space-y-1">
                {aiReport.institutionalFindings?.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiReport.strategicRecommendations?.map((r: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                  <strong className="text-white block text-[11px]">{r.action}</strong>
                  <p className="text-[10px] text-slate-400">{r.impact}</p>
                  <div className="flex items-center justify-between text-[9px] text-amber-300/80 font-mono pt-1">
                    <span>Assigned: {r.responsibleDean}</span>
                    <span>Timeline: {r.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Statutory Grounding Citations */}
            <div className="space-y-1 pt-1 text-[10px] text-slate-400">
              <span className="font-bold uppercase tracking-wider text-slate-500 block">
                Statutory Charter Citations:
              </span>
              {aiReport.policyGrounding?.map((p: any, i: number) => (
                <p key={i} className="text-slate-400">
                  <strong className="text-amber-400">{p.rule}:</strong> {p.citation}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. TWO-COLUMN: EXECUTIVE APPROVALS DESK & BENCHMARKING PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Executive Approvals Desk */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-white/10 p-6 backdrop-blur space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                Executive Approvals Council
              </h2>
              <p className="text-xs text-slate-400">
                Matters requiring Principal / Vice-Chancellor statutory sign-off
              </p>
            </div>
            <Link
              href="/principal/approvals"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
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
                  className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-3 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300 bg-amber-500/10">
                          {app.category.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">{app.departmentCode}</span>
                        {app.financialImpactUsd && (
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">
                            ${app.financialImpactUsd.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-white mt-1.5 leading-snug">
                        {app.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">{app.justification}</p>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {app.submittedDate}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>AI Risk Scan: {app.aiRiskAssessment}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">By: {app.submittedBy}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolveApproval(app.id, "REJECT")}
                        className="h-7 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveApproval(app.id, "APPROVE")}
                        className="h-7 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
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
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-white/10 p-6 backdrop-blur space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="h-5 w-5 text-cyan-400" />
                  Department Health Ranking
                </h2>
                <p className="text-xs text-slate-400">
                  Multivariate operational composite index
                </p>
              </div>
              <Link
                href="/principal/departments"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                Matrix <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 pt-3">
              {departments.slice(0, 5).map((d, i) => (
                <div
                  key={d.code}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-slate-500 text-xs w-4">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{d.code} - {d.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {d.studentCount} Students • Avg GPA: {d.avgGpa}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        d.status === "EXEMPLARY"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : d.status === "STABLE"
                          ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {d.healthIndex}/100
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Link href="/principal/departments" className="block">
              <Button variant="outline" className="w-full text-xs border-white/10 bg-slate-950 text-slate-300 hover:text-white rounded-xl">
                Open Full Institutional Benchmarking Matrix <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
