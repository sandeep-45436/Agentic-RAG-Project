"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  Award,
  Users,
  Coins,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBackground } from "@/components/animated-background";

export default function PrincipalDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("ALL");

  useEffect(() => {
    fetch("/api/principal/departments")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.departments) {
          setDepartments(d.departments);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const colleges = ["ALL", ...Array.from(new Set(departments.map((d) => d.collegeName).filter(Boolean)))];

  const filtered = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchesCollege =
      selectedCollege === "ALL" || d.collegeName === selectedCollege;
    return matchesSearch && matchesCollege;
  });

  return (
    <AnimatedBackground>
      <div className="space-y-6 pb-12 font-sans">
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
              <Building2 className="h-6 w-6 text-amber-500" />
              Inter-Departmental Comparative Benchmarking Matrix
            </h1>
            <p className="text-xs text-slate-500">
              Multi-tier analytical evaluation of academic rigor, research grant yield, and student success
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-amber-100 text-amber-600 border-amber-200 text-xs px-3 py-1">
              {departments.length} Total Academic Departments
            </Badge>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl bg-white/80 border border-slate-200 p-4 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 light-glass-card anim-fade-up-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search departments or codes (e.g. CSE, ECE, MECH)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-800 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {colleges.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollege(col)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedCollege === col
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {col === "ALL" ? "All Departments" : col}
              </button>
            ))}
          </div>
        </div>

        {/* Comparative Table */}
        <div className="rounded-3xl bg-white/80 border border-slate-200 overflow-hidden backdrop-blur-sm shadow-lg light-glass-card card-3d-inner anim-fade-up-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Department & College</th>
                  <th className="py-3.5 px-4 text-right">Scholars</th>
                  <th className="py-3.5 px-4 text-right">Faculty</th>
                  <th className="py-3.5 px-4 text-right">Avg CGPA</th>
                  <th className="py-3.5 px-4 text-right">Attendance</th>
                  <th className="py-3.5 px-4 text-right">Research Grants</th>
                  <th className="py-3.5 px-4 text-right">Placement</th>
                  <th className="py-3.5 px-4 text-center">Health Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.code} className="hover:bg-indigo-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center font-bold text-amber-600 font-mono text-xs">
                          {d.code}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-sm">{d.name}</span>
                          <span className="text-[10px] text-slate-500">{d.collegeName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800 number-pop">
                      {d.studentCount.toLocaleString()}
                    </td>

                    <td className="py-4 px-4 text-right font-mono text-slate-700">
                      {d.facultyCount}
                    </td>

                    <td className="py-4 px-4 text-right font-mono">
                      <span className={`font-bold ${d.avgGpa >= 3.5 ? "text-emerald-600" : "text-amber-600"}`}>
                        {d.avgGpa.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500"> / 4.0</span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono">
                      <span className={d.avgAttendance >= 80 ? "text-emerald-600" : "text-rose-600 font-bold"}>
                        {d.avgAttendance}%
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-indigo-600">
                      ${(d.fundedResearchUsd / 1_000_000).toFixed(2)}M
                    </td>

                    <td className="py-4 px-4 text-right font-mono text-slate-600">
                      {d.placementRate}%
                    </td>

                    <td className="py-4 px-4 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold ${
                          d.status === "EXEMPLARY"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : d.status === "STABLE"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {d.healthIndex} / 100
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
