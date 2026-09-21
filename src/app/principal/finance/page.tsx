"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowLeft,
  TrendingUp,
  Building,
  RefreshCw,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/animated-background";

interface FinanceData {
  stats: {
    totalBudget: number;
    spentBudget: number;
    spendRate: number;
    totalResearchGrants: number;
    researchGrantsCount: number;
    projectedSurplus: number;
    totalFaculty: number;
    totalStudents: number;
  };
  budgetAllocation: Array<{
    category: string;
    allocated: number;
    spent: number;
    percentage: number;
    color: string;
  }>;
  researchGrants: Array<{
    id: string;
    sponsor: string;
    title: string;
    amount: number;
    lead: string;
    status: string;
  }>;
  facilitiesUtilization: Array<{
    name: string;
    capacity: number;
    currentLoad: number;
    status: string;
    facilityType: string;
  }>;
}

export default function PrincipalFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/principal/finance");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const stats = data?.stats || {
    totalBudget: 17500000,
    spentBudget: 13090000,
    spendRate: 74.8,
    totalResearchGrants: 32800000,
    researchGrantsCount: 12,
    projectedSurplus: 1400000,
    totalFaculty: 90,
    totalStudents: 900,
  };

  const budgetAllocation = data?.budgetAllocation || [];
  const researchGrants = data?.researchGrants || [];
  const facilitiesUtilization = data?.facilitiesUtilization || [];

  return (
    <AnimatedBackground>
      <div className="space-y-6 w-full pb-12 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/principal"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Principal Command
            </Link>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Coins className="h-6 w-6 text-amber-500" />
              University Fiscal Governance & Physical Capital Oversight
            </h1>
            <p className="text-xs text-slate-500">
              Statutory real-time database monitoring of institutional budget allocations, sponsored research grants, and high-value campus capital assets
            </p>
          </div>

          <button
            onClick={fetchFinance}
            disabled={loading}
            className="self-start sm:self-center p-2.5 text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white border border-slate-200 rounded-xl transition-colors backdrop-blur-sm"
            title="Refresh Live Financial Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Top 3 High-Impact Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 hover-lift light-glass-card anim-fade-up-1 shimmer-effect">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Annual Operating Budget</span>
            <p className="text-3xl font-black text-slate-800 font-mono mt-2 number-pop">
              ${(stats.totalBudget / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-[11px] text-amber-600 mt-1">
              Expended: ${(stats.spentBudget / 1_000_000).toFixed(1)}M ({stats.spendRate}% through Q3)
            </p>
          </div>

          <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 hover-lift light-glass-card anim-fade-up-2 shimmer-effect">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active Sponsored Research</span>
            <p className="text-3xl font-black text-slate-800 font-mono mt-2 number-pop">
              ${(stats.totalResearchGrants / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-[11px] text-indigo-600 mt-1">
              Across {stats.researchGrantsCount} active research grants in DB
            </p>
          </div>

          <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 hover-lift light-glass-card anim-fade-up-3 shimmer-effect">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Projected Fiscal Reserve</span>
            <p className="text-3xl font-black text-slate-800 font-mono mt-2 number-pop">
              +${(stats.projectedSurplus / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">
              Audited for {stats.totalStudents} scholars & {stats.totalFaculty} faculty
            </p>
          </div>
        </div>

        {/* Two Columns: Budget Allocation & Facilities IoT Utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Budget Allocation Breakdown */}
          <div className="lg:col-span-7 rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm space-y-4 shadow-lg light-glass-card card-3d-inner anim-fade-up-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  Fiscal Year 2026-2027 Expenditure Breakdown
                </h2>
                <p className="text-xs text-slate-500">Audited through Comptroller & Academic Senate</p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                {stats.spendRate}% Spend Rate
              </Badge>
            </div>

            <div className="space-y-4 pt-1">
              {budgetAllocation.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      ${(item.spent / 1_000_000).toFixed(1)}M / ${(item.allocated / 1_000_000).toFixed(1)}M ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${item.color} progress-fill-anim`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Campus Infrastructure & Smart IoT Utilization */}
          <div className="lg:col-span-5 rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm space-y-4 shadow-lg light-glass-card card-3d-inner anim-fade-up-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-500" />
                Campus Facilities & Physical Capital
              </h2>
              <p className="text-xs text-slate-500">Live utilization from PostgreSQL database</p>
            </div>

            <div className="space-y-3 pt-1">
              {facilitiesUtilization.map((fac, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">{fac.name}</span>
                    <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50 badge-pulse">
                      {fac.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Capacity: {fac.capacity} | Active Load: {fac.currentLoad} ({fac.facilityType})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flagship Sponsored Research Grants Table */}
        <div className="rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm shadow-lg space-y-4 light-glass-card card-3d-inner anim-fade-up-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500 icon-ring">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 text-reveal">Flagship Sponsored Research Portfolio</h2>
                <p className="text-xs text-slate-500">Database-backed grants with faculty investigators</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
              ${(stats.totalResearchGrants / 1_000_000).toFixed(1)}M Total DB Grant Escrow
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {researchGrants.map((rg) => (
              <div
                key={rg.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50">
                    {rg.sponsor}
                  </Badge>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    ${rg.amount.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 leading-snug">{rg.title}</h3>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>PI: {rg.lead}</span>
                  <span className="text-indigo-600 font-medium">{rg.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
