"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Users,
  Coins,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  FileText,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/animated-background";

export default function PrincipalProfilePage() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/principal/overview");
      const data = await res.json();
      if (data.success) {
        setOverview(data.overview);
      }
    } catch (err) {
      console.error("Failed to load overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ov = overview || {
    totalColleges: 1,
    totalDepartments: 9,
    totalStudents: 900,
    totalFaculty: 90,
    totalResearchFundingUsd: 32800000,
    annualBudgetTotalUsd: 17500000,
    annualBudgetSpentUsd: 13090000,
    naacAccreditationScore: 3.78,
    nirfNationalRank: 12,
  };

  return (
    <AnimatedBackground showCampusWatermark={true}>
      <div className="w-full space-y-8 font-sans">
        {/* ── 1. INSTITUTIONAL TOP BAR ─────────────────────────────────── */}
        <div className="light-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3.5">
            <Link href="/principal" className="flex items-center gap-3 group">
              <div className="relative h-12 w-36 sm:w-44 flex items-center justify-start">
                <img
                  src="/images/college-logo.png"
                  alt="ALITS University Logo"
                  className="h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            </Link>
            <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-xs font-bold text-slate-900 block tracking-tight">
                Anantha Lakshmi Institute of Technology & Sciences
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                Office of the Principal & Academic Senate Secretariat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/principal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Principal Command Cockpit
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-amber-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
              title="Refresh dossier"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── 2. HERO PRINCIPAL EXECUTIVE DOSSIER BANNER ───────────────── */}
        <div className="relative rounded-3xl overflow-hidden light-glass-card border border-amber-200/80 shadow-xl shadow-amber-950/5">
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950">
            <img
              src="/images/college-campus.jpg"
              alt="ALITS Campus"
              className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/40" />

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Badge className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 shadow-sm">
                🏛️ Plenary Executive Seal
              </Badge>
              <Badge className="bg-white/90 text-slate-900 border-white/50 backdrop-blur-md text-xs font-semibold px-3 py-1 shadow-sm">
                NAAC Grade A++ ({ov.naacAccreditationScore})
              </Badge>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 pt-0 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl p-1.5 bg-white shadow-2xl border-2 border-amber-300 shrink-0">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-3xl font-black shadow-inner">
                  🏛️
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Prof. (Dr.) Executive Principal
                  </h1>
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-amber-50 border-amber-300 text-amber-800 px-2.5">
                    STATUTORY CHAIR
                  </Badge>
                </div>

                <p className="text-sm font-bold text-slate-700">
                  Principal & Vice-Chancellor • Academic Senate President
                </p>

                <p className="text-xs text-slate-500 max-w-xl leading-relaxed pt-1">
                  Plenary institutional administrator charged with fiduciary oversight, academic accreditation renewals, faculty appointments, and capital allocation across all 9 university branches.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
              <div className="light-glow-amber rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">NIRF Rank</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">#{ov.nirfNationalRank}</p>
                <span className="text-[10px] text-amber-700 font-semibold">National Top Tier</span>
              </div>

              <div className="light-glow-indigo rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block">Scholars</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{ov.totalStudents}</p>
                <span className="text-[10px] text-indigo-700 font-semibold">{ov.totalDepartments} Branches</span>
              </div>

              <div className="light-glow-emerald rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Budget</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">${(ov.annualBudgetTotalUsd / 1_000_000).toFixed(1)}M</p>
                <span className="text-[10px] text-emerald-700 font-semibold">Audited Fiscal</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. STATUTORY RESPONSIBILITIES & GOVERNANCE TILES ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 w-fit">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Institutional Governance & Senate</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Presides over the University Academic Council and Governing Body meetings. Mandates curriculum revisions, semester examinations schedules, and convocation degree conferrals.
            </p>
            <Link href="/principal/departments" className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 pt-1">
              View All 9 Departments <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Fiscal & Grants Ratification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Oversees the ${ (ov.annualBudgetTotalUsd / 1_000_000).toFixed(1) }M annual university budget and ${ (ov.totalResearchFundingUsd / 1_000_000).toFixed(1) }M sponsored research grant escrow across DARPA, NSF, and industry consortia.
            </p>
            <Link href="/principal/finance" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 pt-1">
              Open Fiscal Dashboard <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Executive Approvals Council</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exercises statutory sign-off on faculty tenure, curriculum modifications, student condonation dispensations, and campus infrastructure capital acquisitions.
            </p>
            <Link href="/principal/approvals" className="text-xs font-bold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 pt-1">
              Executive Approvals Desk <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
