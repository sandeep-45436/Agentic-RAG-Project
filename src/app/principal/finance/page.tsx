"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowLeft,
  TrendingUp,
  Building,
  Cpu,
  Layers,
  Sparkles,
  PieChart,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PrincipalFinancePage() {
  const budgetAllocation = [
    { category: "Academic Faculty & Salaries", allocated: 18500000, spent: 14200000, percentage: 76.7, color: "bg-indigo-500" },
    { category: "Research Grants & Laboratories", allocated: 12000000, spent: 9400000, percentage: 78.3, color: "bg-cyan-500" },
    { category: "Campus Infrastructure & IoT", allocated: 6500000, spent: 4800000, percentage: 73.8, color: "bg-amber-500" },
    { category: "Student Scholarships & Aid", allocated: 3500000, spent: 2500000, percentage: 71.4, color: "bg-emerald-500" },
    { category: "Operational Contingency", allocated: 2000000, spent: 900000, percentage: 45.0, color: "bg-purple-500" },
  ];

  const researchGrants = [
    { id: "rg_1", sponsor: "DARPA", title: "Cognitive Multi-Agent Swarm Orchestration", amount: 2800000, lead: "Prof. John Smith (CSE)", status: "Active (Year 2)" },
    { id: "rg_2", sponsor: "National Science Foundation", title: "Quantum-Resistant Lattice Cryptography", amount: 1950000, lead: "Dr. Elena Rostova (CSE)", status: "Active (Year 1)" },
    { id: "rg_3", sponsor: "Industry Consortia (NVIDIA/Intel)", title: "Edge Neural Acceleration for Smart Cities", amount: 3400000, lead: "Dean Marcus Vance (AI&DS)", status: "Active (Year 3)" },
    { id: "rg_4", sponsor: "Department of Energy", title: "Campus-Scale Microgrid & Autonomous Storage", amount: 1500000, lead: "Dr. Alistair Finch (EE)", status: "Milestone Review" },
  ];

  const facilitiesUtilization = [
    { name: "Supercomputing & GPU AI Cluster", capacity: 96, currentLoad: 88, status: "OPTIMAL" },
    { name: "Nanotechnology Fabrication Cleanroom", capacity: 40, currentLoad: 32, status: "OPTIMAL" },
    { name: "Central Engineering Quad Classrooms", capacity: 850, currentLoad: 720, status: "PEAK_CAPACITY" },
    { name: "On-Campus Scholar Hostels (Block A-F)", capacity: 4800, currentLoad: 4620, status: "96.2% OCCUPIED" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div>
        <Link
          href="/principal"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Principal Command
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Coins className="h-6 w-6 text-amber-400" />
          University Fiscal Governance & Physical Capital Oversight
        </h1>
        <p className="text-xs text-slate-400">
          Statutory monitoring of institutional budget allocations, sponsored research grants, and high-value campus capital assets
        </p>
      </div>

      {/* Top 3 High-Impact Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-glow-gold rounded-2xl p-5 hover-lift">
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Annual Operating Budget</span>
          <p className="text-3xl font-black text-white font-mono mt-2">$42.5M</p>
          <p className="text-[11px] text-amber-300 mt-1">Expended: $31.8M (74.8% through Q3)</p>
        </div>

        <div className="glass-glow-cyan rounded-2xl p-5 hover-lift">
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Active Sponsored Research</span>
          <p className="text-3xl font-black text-white font-mono mt-2">$18.45M</p>
          <p className="text-[11px] text-cyan-300 mt-1">Across 42 funded global grant projects</p>
        </div>

        <div className="glass-glow-emerald rounded-2xl p-5 hover-lift">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Projected Year-End Surplus</span>
          <p className="text-3xl font-black text-white font-mono mt-2">+$4.2M</p>
          <p className="text-[11px] text-emerald-300 mt-1">Allocated to Faculty Seed Capital Escrow</p>
        </div>
      </div>

      {/* Two Columns: Budget Allocation & Facilities IoT Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Budget Allocation Breakdown */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-white/10 p-6 backdrop-blur space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-400" />
                Fiscal Year 2026-2027 Expenditure Breakdown
              </h2>
              <p className="text-xs text-slate-400">Audited through Comptroller & Academic Senate</p>
            </div>
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
              74.8% Spend Rate
            </Badge>
          </div>

          <div className="space-y-4 pt-1">
            {budgetAllocation.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{item.category}</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    ${(item.spent / 1_000_000).toFixed(1)}M / ${(item.allocated / 1_000_000).toFixed(1)}M ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Campus Infrastructure & Smart IoT Utilization */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-white/10 p-6 backdrop-blur space-y-4 shadow-xl">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-cyan-400" />
              Campus Infrastructure & Telemetry
            </h2>
            <p className="text-xs text-slate-400">Live IoT occupancy and compute load</p>
          </div>

          <div className="space-y-3 pt-1">
            {facilitiesUtilization.map((fac, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-[200px]">{fac.name}</span>
                  <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
                    {fac.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  Current Load: {fac.currentLoad} / {fac.capacity} Units Active
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagship Sponsored Research Grants Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 backdrop-blur shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Flagship Sponsored Research Portfolio</h2>
              <p className="text-xs text-slate-400">Multi-year federal and enterprise funded programs</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
            $18.45M Total Escrow
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {researchGrants.map((rg) => (
            <div
              key={rg.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-cyan-500/30 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-indigo-300 bg-indigo-500/10">
                  {rg.sponsor}
                </Badge>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${rg.amount.toLocaleString()}
                </span>
              </div>
              <h3 className="text-xs font-bold text-white leading-snug">{rg.title}</h3>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span>PI: {rg.lead}</span>
                <span className="text-cyan-300 font-medium">{rg.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
