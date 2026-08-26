"use client";

import React, { useState } from "react";
import {
  Layers,
  ShieldCheck,
  Users,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODExaminationsPage() {
  const { activeDepartment } = useHOD();

  const seatingData = [
    { bench: "B-01", row: 1, col: 1, pos: "Left", roll: "CS-2026-001", name: "Alice Johnson", code: "CS401", title: "Algorithms" },
    { bench: "B-01", row: 1, col: 1, pos: "Right", roll: "MATH-2026-002", name: "Bob Williams", code: "MATH301", title: "Linear Algebra" },
    { bench: "B-02", row: 1, col: 2, pos: "Left", roll: "CS-2026-003", name: "Carol Davis", code: "CS401", title: "Algorithms" },
    { bench: "B-02", row: 1, col: 2, pos: "Right", roll: "EE-2026-004", name: "Dan Miller", code: "EE401", title: "DSP" },
    { bench: "B-03", row: 2, col: 1, pos: "Left", roll: "CS-2026-005", name: "Eva Wilson", code: "CS401", title: "Algorithms" },
    { bench: "B-03", row: 2, col: 1, pos: "Right", roll: "MATH-2026-006", name: "Frank Taylor", code: "MATH301", title: "Linear Algebra" },
  ];

  const invigilators = [
    { name: "Prof. John Smith", code: "FAC-CS-001", hall: "Tech Hall 101", slot: "Morning (09:30 AM - 12:30 PM)", status: "CONFIRMED" },
    { name: "Prof. Sarah Jones", code: "FAC-MATH-002", hall: "Science Block 201", slot: "Morning (09:30 AM - 12:30 PM)", status: "CONFIRMED" },
    { name: "Prof. David Lee", code: "FAC-EE-003", hall: "Main Auditorium A", slot: "Afternoon (02:00 PM - 05:00 PM)", status: "CONFIRMED" },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-400" />
            Examination Governance & Anti-Malpractice Seating
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Zig-zag alternating subject allocation, hall ticket compliance, and invigilator duties for {activeDepartment}
          </p>
        </div>

        <Button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-semibold"
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Print Examination Dossier
        </Button>
      </div>

      {/* Top Exam Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Scheduled Examination</p>
              <p className="text-sm font-bold text-white mt-1">Midterm Exam 1 - Fall 2026</p>
              <p className="text-[10px] text-blue-400">Sep 15 - Sep 22, 2026</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Anti-Malpractice Algorithm</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">Zig-Zag Interleaving Active</p>
              <p className="text-[10px] text-emerald-400">Zero adjacent course overlaps</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Invigilator Allocation</p>
              <p className="text-sm font-bold text-purple-400 mt-1">3 Faculty Assigned</p>
              <p className="text-[10px] text-purple-400">Workload score balanced</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invigilation Duty Allocation Table */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            Department Invigilation Duty Roster
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Workload-balanced hall supervision assignments for midterm examinations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invigilators.map((inv, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-white">{inv.name}</span>
                <span className="text-slate-500 font-mono ml-2">({inv.code})</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{inv.slot}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                  <Building className="h-3 w-3 mr-1" />
                  {inv.hall}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {inv.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Interactive Anti-Malpractice Desk Grid */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                Anti-Malpractice 2D Bench Allocation Layout (Tech Hall 101)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Adjacent left/right seats allocated to different courses mathematically preventing copying
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
              Zig-Zag Validated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["B-01", "B-02", "B-03"].map((benchNo) => {
            const seats = seatingData.filter((s) => s.bench === benchNo);
            const leftSeat = seats.find((s) => s.pos === "Left");
            const rightSeat = seats.find((s) => s.pos === "Right");

            return (
              <div
                key={benchNo}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-xs font-mono">BENCH {benchNo}</span>
                  <span className="text-[10px] text-slate-500">Row {leftSeat?.row}, Col {leftSeat?.col}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Left Seat */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                    <span className="text-[9px] text-indigo-400 font-bold block uppercase">Left Seat</span>
                    <p className="font-bold text-white truncate text-[11px]">{leftSeat?.name}</p>
                    <p className="text-[10px] text-indigo-300 font-mono">{leftSeat?.roll}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-indigo-500/20 text-indigo-200 border-indigo-500/40">
                      {leftSeat?.code}
                    </Badge>
                  </div>

                  {/* Right Seat */}
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                    <span className="text-[9px] text-emerald-400 font-bold block uppercase">Right Seat</span>
                    <p className="font-bold text-white truncate text-[11px]">{rightSeat?.name}</p>
                    <p className="text-[10px] text-emerald-300 font-mono">{rightSeat?.roll}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-emerald-500/20 text-emerald-200 border-emerald-500/40">
                      {rightSeat?.code}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
