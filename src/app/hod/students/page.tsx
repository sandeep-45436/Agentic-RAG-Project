"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ShieldAlert,
  UserCheck,
  Building,
  DollarSign,
  TrendingDown,
  Sparkles,
  Check,
  X,
  UserPlus,
  Edit,
  ShieldCheck,
  ArrowRight,
  UserX,
  Award,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODStudentsPage() {
  const { activeDepartment, session } = useHOD();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "AT_RISK" | "PROBATION" | "ATTENDANCE_SHORTFALL">("ALL");
  const [search, setSearch] = useState("");

  // Admit Student Modal
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    name: "",
    email: "",
    studentNumber: "",
    major: "Computer Science",
    gpa: "3.5",
    academicStatus: "Good Standing",
  });
  const [admitLoading, setAdmitLoading] = useState(false);

  // Formal Condonation Modal
  const [condonationStudent, setCondonationStudent] = useState<any | null>(null);
  const [condonationReason, setCondonationReason] = useState("");
  const [condonationEvidence, setCondonationEvidence] = useState("University Health Center Medical Certificate & Academic Recovery Plan");
  const [condonationLoading, setCondonationLoading] = useState(false);

  // Edit Standing Modal
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("Good Standing");
  const [editMajor, setEditMajor] = useState("");
  const [editReason, setEditReason] = useState("Semester evaluation standing review");
  const [updating, setUpdating] = useState(false);

  // Deregister / Withdrawn Modal
  const [withdrawingStudent, setWithdrawingStudent] = useState<any | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/students?department=${activeDepartment}&filter=${filter}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeDepartment, filter]);

  const handleAdmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmitLoading(true);
    try {
      const res = await fetch("/api/hod/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIT_STUDENT",
          ...admitForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStudents();
        setAdmitModalOpen(false);
        setAdmitForm({
          name: "",
          email: "",
          studentNumber: "",
          major: "Computer Science",
          gpa: "3.5",
          academicStatus: "Good Standing",
        });
      }
    } catch (err) {
      console.error("Admit error:", err);
    } finally {
      setAdmitLoading(false);
    }
  };

  const handleExecuteCondonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condonationStudent) return;
    setCondonationLoading(true);

    try {
      const res = await fetch("/api/hod/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONDONE_ATTENDANCE",
          studentId: condonationStudent.id,
          reason: condonationReason,
          evidenceDocument: condonationEvidence,
          condonedPercentage: 75.0,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStudents();
        setCondonationStudent(null);
        setCondonationReason("");
      }
    } catch (err) {
      console.error("Condonation error:", err);
    } finally {
      setCondonationLoading(false);
    }
  };

  const handleUpdateStanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/hod/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editingStudent.id,
          academicStatus: editStatus,
          major: editMajor,
          reason: editReason,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStudents();
        setEditingStudent(null);
      }
    } catch (err) {
      console.error("Standing update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleWithdrawStudent = async () => {
    if (!withdrawingStudent) return;
    setWithdrawLoading(true);

    try {
      const res = await fetch(
        `/api/hod/students?studentId=${withdrawingStudent.id}&reason=${encodeURIComponent(
          withdrawReason || "Student voluntary withdrawal"
        )}&department=${activeDepartment}&actorName=${encodeURIComponent(session?.name || "HOD")}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchStudents();
        setWithdrawingStudent(null);
        setWithdrawReason("");
      }
    } catch (err) {
      console.error("Withdraw error:", err);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-400" />
            Student Academic Risk & Governance Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Attendance monitoring, probation interventions, and policy-grounded exam eligibility condonation for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Cohort
          </Button>

          <Button
            size="sm"
            onClick={() => setAdmitModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Admit Student
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "ALL" ? "bg-blue-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400"
            }`}
          >
            All Students ({students.length})
          </button>
          <button
            onClick={() => setFilter("AT_RISK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "AT_RISK" ? "bg-rose-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400"
            }`}
          >
            At-Risk Radar
          </button>
          <button
            onClick={() => setFilter("PROBATION")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "PROBATION" ? "bg-amber-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400"
            }`}
          >
            Academic Probation
          </button>
          <button
            onClick={() => setFilter("ATTENDANCE_SHORTFALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "ATTENDANCE_SHORTFALL" ? "bg-cyan-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400"
            }`}
          >
            Attendance &lt; 75%
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            placeholder="Search by student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const isAtRisk = s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH";
          const isWithdrawn = s.academicStatus === "Withdrawn";

          return (
            <Card
              key={s.id}
              className={`border backdrop-blur space-y-3 transition-all ${
                isWithdrawn
                  ? "bg-slate-950/40 border-slate-800/40 opacity-70"
                  : isAtRisk
                  ? "bg-slate-900/90 border-rose-900/40 hover:border-rose-700/60"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-white">{s.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          s.academicStatus === "Good Standing"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : s.academicStatus === "Academic Probation"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {s.academicStatus}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      {s.studentNumber} • {s.major}
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono shrink-0 ${
                      s.gpa >= 3.0
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : s.gpa >= 2.0
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    GPA: {s.gpa.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Academic Metrics Snapshot */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Attendance</span>
                    <span
                      className={`font-bold ${
                        s.attendancePercentage >= 75 ? "text-emerald-400" : "text-rose-400 font-bold"
                      }`}
                    >
                      {s.attendancePercentage.toFixed(1)}% ({s.attendedClasses}/{s.totalClasses})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Internal Marks</span>
                    <span className="font-bold text-white">
                      {s.internalMarks} / {s.maxInternalMarks}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Fee Clearance</span>
                    <span className={s.feeStatus === "Paid" ? "text-emerald-400" : "text-amber-400"}>
                      {s.feeStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Faculty Advisor</span>
                    <span className="text-slate-300 truncate block">{s.advisorName || "Assigned"}</span>
                  </div>
                </div>

                {/* Exam Hall Ticket Status */}
                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Exam Hall Ticket:</span>
                  {s.attendancePercentage >= 75 && s.feeStatus === "Paid" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Eligible
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/20 text-rose-300 text-[10px] border-rose-500/30">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Blocked (Action Required)
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {s.attendancePercentage < 75 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setCondonationStudent(s);
                        setCondonationReason(`Documented medical leave submitted by student. Attendance at ${s.attendancePercentage.toFixed(1)}%.`);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-xl flex-1 font-semibold"
                    >
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      Grant Condonation
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingStudent(s);
                      setEditStatus(s.academicStatus);
                      setEditMajor(s.major);
                    }}
                    className="border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs rounded-xl flex-1"
                  >
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Edit Standing
                  </Button>

                  {!isWithdrawn && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWithdrawingStudent(s)}
                      className="border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs rounded-xl px-2.5"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADMIT STUDENT MODAL                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {admitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-400" />
                Admit New Student to Department
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdmitModalOpen(false)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAdmitStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Student Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Grace Hopper"
                    value={admitForm.name}
                    onChange={(e) => setAdmitForm({ ...admitForm, name: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Student ID / Roll No *</label>
                  <Input
                    required
                    placeholder="e.g. CS-2026-042"
                    value={admitForm.studentNumber}
                    onChange={(e) => setAdmitForm({ ...admitForm, studentNumber: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. grace@students.smartuniversity.edu"
                    value={admitForm.email}
                    onChange={(e) => setAdmitForm({ ...admitForm, email: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Degree Major</label>
                  <Input
                    value={admitForm.major}
                    onChange={(e) => setAdmitForm({ ...admitForm, major: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Initial Matriculation GPA</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={admitForm.gpa}
                    onChange={(e) => setAdmitForm({ ...admitForm, gpa: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Academic Standing</label>
                  <select
                    value={admitForm.academicStatus}
                    onChange={(e) => setAdmitForm({ ...admitForm, academicStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                  >
                    <option value="Good Standing">Good Standing</option>
                    <option value="Academic Probation">Academic Probation</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdmitModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={admitLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {admitLoading ? "Admitting..." : "Admit Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FORMAL ATTENDANCE CONDONATION DIALOG                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {condonationStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 text-amber-400">
                <ShieldCheck className="h-4 w-4" />
                Formal Attendance Condonation & Exam Clearance
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCondonationStudent(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleExecuteCondonation} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{condonationStudent.name}</span>
                  <span className="text-blue-300 font-mono">{condonationStudent.studentNumber}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Current Attendance: <strong className="text-rose-400">{condonationStudent.attendancePercentage.toFixed(1)}%</strong> ({condonationStudent.attendedClasses}/{condonationStudent.totalClasses} classes attended)
                </p>
                <p className="text-slate-400 text-[10px]">
                  Required Threshold: <strong className="text-slate-200">75.0%</strong>
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reason & Academic Justification *</label>
                <Input
                  required
                  value={condonationReason}
                  onChange={(e) => setCondonationReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verified Evidence Document</label>
                <Input
                  value={condonationEvidence}
                  onChange={(e) => setCondonationEvidence(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-bold block mb-0.5">Policy Grounding:</span>
                Examination Ordinance 12.3 permits HOD to condone attendance shortfalls up to 10% on verified medical or institutional representation grounds. This mutation produces an immutable audit record.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCondonationStudent(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={condonationLoading || !condonationReason.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl"
                >
                  {condonationLoading ? "Executing Condonation..." : "Grant Condonation & Clear Hall Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT STANDING MODAL                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-400" />
                Update Academic Standing: {editingStudent.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdateStanding} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Academic Status Lifecycle</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  <option value="Good Standing">Good Standing</option>
                  <option value="Academic Probation">Academic Probation</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Degree Major</label>
                <Input
                  value={editMajor}
                  onChange={(e) => setEditMajor(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Governance Reason for Audit Log</label>
                <Input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStudent(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {updating ? "Saving..." : "Save Standing"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* WITHDRAW STUDENT CONFIRMATION MODAL                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {withdrawingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 text-rose-400">
                <UserX className="h-4 w-4" />
                Deregister / Withdraw Student
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWithdrawingStudent(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Are you sure you want to transition <strong>{withdrawingStudent.name} ({withdrawingStudent.studentNumber})</strong> to <span className="text-rose-400 font-bold">Withdrawn</span> status?
              </p>
              <p className="text-slate-400 text-[11px]">
                In accordance with academic regulations, historical semester marks and transcripts are preserved in the permanent institutional ledger.
              </p>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reason for Withdrawal</label>
                <Input
                  required
                  placeholder="e.g. Student transfer to external institution / personal withdrawal"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWithdrawingStudent(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdrawStudent}
                  disabled={withdrawLoading || !withdrawReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl"
                >
                  {withdrawLoading ? "Processing..." : "Confirm Withdrawal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
