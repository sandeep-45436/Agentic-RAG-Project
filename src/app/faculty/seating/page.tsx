"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Printer,
  Trash2,
  Building,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function FacultyExamSeatingPage() {
  const [seating, setSeating] = useState<any[]>([]);
  const [examinations, setExaminations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Selected filters
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedHall, setSelectedHall] = useState("Tech Hall 101");
  const [examDate, setExamDate] = useState("2026-09-15");
  const [sessionSlot, setSessionSlot] = useState("Morning (09:30 AM - 12:30 PM)");
  const [benchesCount, setBenchesCount] = useState(12);
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(3);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSeatingData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faculty/seating");
      const data = await res.json();
      if (data.seating) setSeating(data.seating);
      if (data.examinations) {
        setExaminations(data.examinations);
        if (!selectedExamId && data.examinations.length > 0) {
          setSelectedExamId(data.examinations[0].id);
        }
      }
      if (data.facilities) setFacilities(data.facilities);
    } catch (err) {
      console.error("Failed to load seating:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatingData();
  }, []);

  const handleGeneratePlan = async () => {
    if (!selectedExamId) {
      setStatusMessage({ type: "error", text: "Please select an examination first." });
      return;
    }

    setGenerating(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/faculty/seating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          examinationId: selectedExamId,
          hallNumber: selectedHall,
          examDate: new Date(examDate).toISOString(),
          sessionSlot,
          benchesCount,
          rows,
          columns,
          seatsPerBench: 2,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate seating plan.");
      }

      setStatusMessage({
        type: "success",
        text: `Generated ${data.allocations.length} seating allocations with zig-zag alternate distribution!`,
      });
      fetchSeatingData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to generate plan." });
    } finally {
      setGenerating(false);
    }
  };

  const handleClearPlan = async () => {
    if (!confirm(`Clear all seating arrangements for ${selectedHall}?`)) return;
    try {
      await fetch(`/api/faculty/seating?examinationId=${selectedExamId}&hallNumber=${encodeURIComponent(selectedHall)}`, {
        method: "DELETE",
      });
      fetchSeatingData();
      setStatusMessage({ type: "success", text: `Seating plan for ${selectedHall} cleared.` });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to clear plan" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group seating allocations by bench
  const benchesMap: { [key: string]: { benchNumber: string; left?: any; right?: any; row: number; col: number } } = {};
  const currentHallSeating = seating.filter(
    (s) => s.hallNumber === selectedHall && (!selectedExamId || s.examinationId === selectedExamId)
  );

  for (const item of currentHallSeating) {
    if (!benchesMap[item.benchNumber]) {
      benchesMap[item.benchNumber] = {
        benchNumber: item.benchNumber,
        row: item.rowNumber,
        col: item.columnNumber,
      };
    }
    if (item.seatPosition === "Left") {
      benchesMap[item.benchNumber].left = item;
    } else {
      benchesMap[item.benchNumber].right = item;
    }
  }

  const benchesList = Object.values(benchesMap).sort((a, b) => a.benchNumber.localeCompare(b.benchNumber));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-pink-400" />
            Academic Examination Seating Arrangement Hub
          </h1>
          <p className="text-sm text-slate-400">
            Generate and visualize anti-malpractice zig-zag alternate seating plans for university examinations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md"
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Print Seating Notice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSeatingData}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs border ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/10 text-rose-300 border-rose-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── CONTROLS & GENERATOR CARD ─────────────────────────────── */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            Intelligent Seating Plan Generator
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Distributes students across exam benches in alternate interleaving sequences to prevent cheating.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Examination Session</Label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2"
              >
                {examinations.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Examination Hall / Facility</Label>
              <select
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2"
              >
                <option value="Tech Hall 101">Tech Hall 101 (Cap: 40)</option>
                <option value="Science Block 201">Science Block 201 (Cap: 35)</option>
                <option value="Main Auditorium A">Main Auditorium A (Cap: 120)</option>
                <option value="Engineering Wing 301">Engineering Wing 301 (Cap: 40)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Exam Date</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Exam Time Slot</Label>
              <select
                value={sessionSlot}
                onChange={(e) => setSessionSlot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2"
              >
                <option value="Morning (09:30 AM - 12:30 PM)">Morning (09:30 AM - 12:30 PM)</option>
                <option value="Afternoon (02:00 PM - 05:00 PM)">Afternoon (02:00 PM - 05:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Number of Benches</Label>
              <Input
                type="number"
                min={2}
                max={50}
                value={benchesCount}
                onChange={(e) => setBenchesCount(Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Hall Rows</Label>
              <Input
                type="number"
                min={1}
                max={15}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Hall Columns</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold py-2.5 px-5 shadow-lg shadow-pink-600/20"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Computing Anti-Malpractice Matrix..." : "Generate Seating Plan"}
            </Button>
            {benchesList.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearPlan}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Clear {selectedHall} Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── VISUAL DESK & BENCH MATRIX ────────────────────────────── */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-white font-semibold">
                Hall Seating Layout: {selectedHall}
              </CardTitle>
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">
                {currentHallSeating.length} Allocated Students
              </Badge>
            </div>
            <CardDescription className="text-slate-400 text-xs mt-0.5">
              {sessionSlot} • {new Date(examDate).toLocaleDateString()}
            </CardDescription>
          </div>

          {/* Color Key */}
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              CS401
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              MATH301
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              EE401
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
              Loading seating allocations...
            </div>
          ) : benchesList.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Layers className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No seating plan generated for {selectedHall}</p>
              <p className="text-xs text-slate-500">
                Click &quot;Generate Seating Plan&quot; above to produce an automated layout.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benchesList.map((bench) => (
                <div
                  key={bench.benchNumber}
                  className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 relative hover:border-pink-500/40 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-white tracking-wider font-mono flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-pink-400" />
                      BENCH {bench.benchNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Row {bench.row}, Col {bench.col}
                    </span>
                  </div>

                  {/* Left & Right Seats */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Left Seat */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">SEAT L</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 border-cyan-500/40 text-cyan-300 bg-cyan-500/10 font-mono"
                        >
                          {bench.left?.courseCode || "FREE"}
                        </Badge>
                      </div>
                      {bench.left ? (
                        <>
                          <p className="text-xs font-semibold text-white truncate">{bench.left.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{bench.left.studentRollNo}</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-600 italic">Unassigned</p>
                      )}
                    </div>

                    {/* Right Seat */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">SEAT R</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 border-emerald-500/40 text-emerald-300 bg-emerald-500/10 font-mono"
                        >
                          {bench.right?.courseCode || "FREE"}
                        </Badge>
                      </div>
                      {bench.right ? (
                        <>
                          <p className="text-xs font-semibold text-white truncate">{bench.right.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{bench.right.studentRollNo}</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-600 italic">Unassigned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
