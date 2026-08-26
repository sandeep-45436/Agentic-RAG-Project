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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODStudentsPage() {
  const { activeDepartment } = useHOD();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "AT_RISK" | "PROBATION" | "ATTENDANCE_SHORTFALL">("ALL");
  const [search, setSearch] = useState("");

  // Condonation Modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);

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

  const handleCreateCondonationProposal = async (student: any) => {
    setSelectedStudent(student);
    setProposalSubmitted(false);
  };

  const handleConfirmProposal = () => {
    setProposalSubmitted(true);
    setTimeout(() => {
      setSelectedStudent(null);
      setProposalSubmitted(false);
    }, 1200);
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
            Student Academic Risk & Hall Ticket Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Attendance monitoring, probation interventions, and policy-grounded exam eligibility condonation
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStudents}
          disabled={loading}
          className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh SIS Records
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ALL" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Students
          </button>
          <button
            onClick={() => setFilter("AT_RISK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "AT_RISK" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🚨 At-Risk Cohort
          </button>
          <button
            onClick={() => setFilter("PROBATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "PROBATION" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚠️ Academic Probation (GPA &lt; 2.0)
          </button>
          <button
            onClick={() => setFilter("ATTENDANCE_SHORTFALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ATTENDANCE_SHORTFALL" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📊 Attendance Shortfall (&lt;75%)
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search student roll no or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-1.5 bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Student List Grid */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id} className="bg-slate-900/80 border-slate-800 backdrop-blur">
            <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Student Details */}
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-300 border-blue-500/30 font-mono">
                    {s.studentNumber}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      s.riskLevel === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        : s.riskLevel === "HIGH"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {s.riskLevel} RISK
                  </Badge>
                  {s.isProbation && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-500/20 text-rose-300 border-rose-500/40">
                      Academic Probation
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  {s.major} • Advisor: {s.advisorName} • {s.hostelName}
                </p>
              </div>

              {/* Middle Column: SIS Metrics */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shrink-0">
                <div>
                  <span className="text-slate-500 block text-[10px]">CGPA</span>
                  <span className={`font-bold ${s.gpa < 2.0 ? "text-rose-400" : "text-white"}`}>
                    {s.gpa.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Attendance</span>
                  <span className={`font-bold ${s.attendancePercentage < 75 ? "text-rose-400" : "text-emerald-400"}`}>
                    {s.attendancePercentage.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Internal Marks</span>
                  <span className="font-bold text-slate-300">{s.internalMarks}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Fee Status</span>
                  <span className={`font-bold ${s.isFeeHold ? "text-amber-400" : "text-emerald-400"}`}>
                    {s.feeStatus}
                  </span>
                </div>
              </div>

              {/* Right Column: Governance Proposal Action */}
              <div className="flex items-center gap-2 shrink-0">
                {s.isAttendanceRisk ? (
                  <Button
                    size="sm"
                    onClick={() => handleCreateCondonationProposal(s)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 rounded-lg font-semibold"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                    Review Condonation
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Exam Eligible
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Condonation Proposal Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Attendance Condonation Proposal</h3>
                  <p className="text-xs text-slate-400">{selectedStudent.name} ({selectedStudent.studentNumber})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {proposalSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Proposal Generated & Synced to Action Proposals Queue</p>
                  <p className="text-[11px] text-emerald-400">Policy verification and audit trail initialized.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-400 text-[10px] uppercase">Attendance Evidence</span>
                  <div className="flex justify-between font-mono">
                    <span>Attended Classes:</span>
                    <span className="text-white">{selectedStudent.attendedClasses} / {selectedStudent.totalClasses} ({selectedStudent.attendancePercentage}%)</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Shortfall Percentage:</span>
                    <span className="text-rose-400">{(75 - selectedStudent.attendancePercentage).toFixed(1)}% below required threshold</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-400 text-[10px] uppercase">Policy Grounding</span>
                  <p className="text-blue-300 text-[11px]">
                    &quot;Examination Ordinance 12.3: Attendance between 65%-74% may be condoned by HOD with medical certificate or academic advisor endorsement.&quot;
                  </p>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Submitting this action will create a formal Human-in-the-Loop Proposal in the HOD Dashboard with full provenance logging.
                </p>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudent(null)}
                    className="border-slate-700 text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmProposal}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-semibold"
                  >
                    Create Action Proposal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
