"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  RefreshCw,
  X,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODExaminationsPage() {
  const { activeDepartment, session } = useHOD();
  const [examinations, setExaminations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [invigilators, setInvigilators] = useState<any[]>([]);
  const [seatings, setSeatings] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Appoint Invigilator Modal
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [appointFacultyId, setAppointFacultyId] = useState("");
  const [appointHall, setAppointHall] = useState("Tech Hall 101");
  const [appointLoading, setAppointLoading] = useState(false);

  // Generate Seating Loading
  const [generatingSeating, setGeneratingSeating] = useState(false);
  const [seatingSuccessMsg, setSeatingSuccessMsg] = useState<string | null>(null);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const [examRes, facRes] = await Promise.all([
        fetch(`/api/hod/examinations?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/faculty?department=${activeDepartment}`).then((r) => r.json()),
      ]);

      if (examRes.examinations) setExaminations(examRes.examinations);
      if (examRes.schedules) setSchedules(examRes.schedules);
      if (examRes.invigilators) setInvigilators(examRes.invigilators);
      if (examRes.seatings) setSeatings(examRes.seatings);
      if (facRes.faculty) setFacultyList(facRes.faculty);
    } catch (err) {
      console.error("Failed to load examinations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [activeDepartment]);

  const handleGenerateSeating = async () => {
    setGeneratingSeating(true);
    setSeatingSuccessMsg(null);

    try {
      const res = await fetch("/api/hod/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_SEATING",
          examinationId: examinations[0]?.id || "seed-exam-001",
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeatingSuccessMsg(`Generated ${data.count} anti-malpractice interleaved seating allocations with zero adjacent overlap.`);
        fetchExamData();
      }
    } catch (err) {
      console.error("Generate seating error:", err);
    } finally {
      setGeneratingSeating(false);
    }
  };

  const handleAppointInvigilator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointFacultyId) return;
    setAppointLoading(true);

    try {
      const res = await fetch("/api/hod/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_INVIGILATOR",
          examinationId: examinations[0]?.id || "seed-exam-001",
          facultyId: appointFacultyId,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExamData();
        setAppointModalOpen(false);
      }
    } catch (err) {
      console.error("Appoint invigilator error:", err);
    } finally {
      setAppointLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExamData}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleGenerateSeating}
            disabled={generatingSeating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            <Sparkles className={`mr-1.5 h-4 w-4 ${generatingSeating ? "animate-spin" : ""}`} />
            Generate Zig-Zag Seating
          </Button>

          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Print Dossier
          </Button>
        </div>
      </div>

      {seatingSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{seatingSuccessMsg}</span>
        </div>
      )}

      {/* Top Exam Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Scheduled Examination</p>
              <p className="text-sm font-bold text-white mt-1">
                {examinations[0]?.name || "Midterm Exam 1 - Fall 2026"}
              </p>
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
              <p className="text-[10px] text-emerald-400">{seatings.length} Allocated Slots (Zero Overlap)</p>
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
              <p className="text-sm font-bold text-purple-400 mt-1">{invigilators.length} Faculty Assigned</p>
              <p className="text-[10px] text-purple-400">Workload score balanced</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invigilators Section */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-400" />
              Assigned Faculty Invigilator Roster
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Faculty examination proctoring duties and hall assignments
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setAppointModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Appoint Invigilator
          </Button>
        </CardHeader>

        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {invigilators.map((inv, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{inv.name}</span>
                  <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-300 border-purple-500/30">
                    {inv.status}
                  </Badge>
                </div>
                <p className="text-slate-400 text-[11px]">Venue: <strong className="text-slate-200">{inv.hall}</strong></p>
                <p className="text-slate-500 text-[10px]">{inv.slot}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Seating Plan Matrix */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            Live Anti-Malpractice Zig-Zag Seating Matrix (Tech Hall 101)
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Alternating subject allocation preventing adjacent students from writing the same examination paper
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {seatings.map((seat) => (
              <div
                key={seat.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-400">{seat.bench} • Seat {seat.pos}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      seat.code.startsWith("CS")
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        : seat.code.startsWith("MATH")
                        ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {seat.code}
                  </Badge>
                </div>
                <p className="font-bold text-white text-xs">{seat.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{seat.roll}</p>
                <p className="text-[10px] text-slate-500 truncate">{seat.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* APPOINT INVIGILATOR MODAL                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {appointModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-400" />
                Appoint Faculty Invigilator
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppointModalOpen(false)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAppointInvigilator} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Faculty Instructor *</label>
                <select
                  required
                  value={appointFacultyId}
                  onChange={(e) => setAppointFacultyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  <option value="">Choose faculty member...</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.facultyCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Exam Hall / Venue</label>
                <Input
                  value={appointHall}
                  onChange={(e) => setAppointHall(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAppointModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={appointLoading || !appointFacultyId}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl"
                >
                  {appointLoading ? "Appointing..." : "Assign Duty"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
