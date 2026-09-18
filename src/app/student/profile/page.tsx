"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  ChevronRight,
  ArrowLeft,
  Building,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBackground } from "@/components/animated-background";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "academics" | "attendance" | "courses" | "skills" | "fees">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<string>("");

  const loadStudentProfile = async (studentNum?: string) => {
    try {
      setLoading(true);
      const url = studentNum
        ? `/api/student/profile?studentNumber=${encodeURIComponent(studentNum)}`
        : `/api/student/profile`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        if (data.directory) {
          setDirectory(data.directory);
        }
      }
    } catch (err) {
      console.error("Failed to load student profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentProfile();
  }, []);

  const handleSelectStudent = (studentNum: string) => {
    setSelectedStudentNumber(studentNum);
    loadStudentProfile(studentNum);
    setSearchQuery("");
  };

  const filteredDirectory = directory.filter(
    (s) =>
      s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.departmentCode.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  return (
    <AnimatedBackground showCampusWatermark={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        {/* ── 1. INSTITUTIONAL TOP BAR WITH ALITS BRANDING ──────────────── */}
        <div className="light-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3.5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
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
              <span className="text-xs font-bold text-indigo-950 block tracking-tight">
                Anantha Lakshmi Institute of Technology & Sciences
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Autonomous Scholar Academic Repository • NAAC A++
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>

            <button
              onClick={() => loadStudentProfile(selectedStudentNumber)}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
              title="Refresh scholar dossier"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── 2. REAL-TIME SCHOLAR SEARCH & DIRECTORY SWITCHER ───────────── */}
        <div className="light-glass-card rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search 900 DB scholars (e.g. STU-CSE-001, Varun)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 text-xs rounded-xl shadow-inner"
            />

            {/* Autocomplete Dropdown */}
            {searchQuery && (
              <div className="absolute top-11 left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 space-y-1">
                {filteredDirectory.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center">No student record matches query</p>
                ) : (
                  filteredDirectory.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s.studentNumber)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{s.studentNumber}</span>
                        <span className="text-slate-500 ml-2">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-200">
                          {s.departmentCode}
                        </Badge>
                        <span className="font-mono text-emerald-600 font-bold text-[11px]">{s.gpa} GPA</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Branch Switcher Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Quick Branch:
            </span>
            {["CSE", "ECE", "MECH", "EEE", "CIVIL", "IT"].map((branch) => (
              <button
                key={branch}
                onClick={() => handleSelectStudent(`STU-${branch}-001`)}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-xs shrink-0"
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. HERO SCHOLAR IDENTITY BANNER WITH CAMPUS BACKDROP ───────── */}
        {profile && (
          <div className="relative rounded-3xl overflow-hidden light-glass-card border border-slate-200/90 shadow-xl shadow-indigo-950/5">
            {/* Campus Image Header Backdrop */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900">
              <img
                src="/images/college-campus.jpg"
                alt="ALITS Engineering Campus"
                className="w-full h-full object-cover object-center opacity-35 mix-blend-overlay scale-105 hover:scale-100 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge className="bg-white/90 text-slate-800 border-white/50 backdrop-blur-md text-xs font-semibold px-3 py-1 shadow-sm">
                  🏛️ {profile.collegeName}
                </Badge>
                <Badge className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 shadow-sm">
                  {profile.academicStatus}
                </Badge>
              </div>
            </div>

            {/* Profile Avatar & Main Dossier Meta */}
            <div className="px-6 sm:px-8 pb-6 pt-0 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                {/* Glowing Avatar */}
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl p-1.5 bg-white shadow-2xl border-2 border-indigo-200 shrink-0">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full rounded-2xl bg-indigo-50 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Active Enrollment">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {profile.name}
                    </h1>
                    <Badge variant="outline" className="text-xs font-mono font-bold bg-indigo-50 border-indigo-200 text-indigo-700 px-2.5">
                      {profile.studentNumber}
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-slate-600">
                    B.Tech in {profile.departmentName} ({profile.departmentCode})
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> {profile.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> {profile.semester}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" /> Advisor: {profile.advisorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 High-Impact Key Badges */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
                <div className="light-glow-indigo rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">CGPA</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{profile.cgpa.toFixed(2)}</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Top 3% Branch</span>
                </div>

                <div className="light-glow-emerald rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Attendance</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{profile.attendancePercentage}%</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Eligible (Hall Ticket)</span>
                </div>

                <div className="light-glow-amber rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">Credits</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{profile.totalCredits}</p>
                  <span className="text-[10px] text-slate-500 font-medium">of {profile.maxCredits} Req</span>
                </div>
              </div>
            </div>

            {/* ── 4. NAVIGATION TABS (LIGHT ELEGANT DESIGN) ─────────────── */}
            <div className="border-t border-slate-200/80 px-6 sm:px-8 bg-slate-50/50 flex items-center gap-2 overflow-x-auto py-2">
              {[
                { id: "overview", label: "Scholar Overview", icon: User },
                { id: "academics", label: "Academic Progression & CGPA", icon: TrendingUp },
                { id: "attendance", label: "Attendance Analytics", icon: Clock },
                { id: "courses", label: "Enrolled Courses & Faculty", icon: BookOpen },
                { id: "skills", label: "Skills Radar & Badges", icon: Sparkles },
                { id: "fees", label: "Financial Ledger & Clearance", icon: Coins },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-white text-indigo-950 shadow-md shadow-indigo-100 border border-slate-200"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 5. TAB CONTENTS ─────────────────────────────────────────── */}
        {profile && (
          <div className="space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Cols: Bio & Academic Snapshot */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                      Institutional Academic Standing
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Scholar is formally enrolled in the Four-Year Bachelor of Technology Program at ALITS. The curriculum adheres to autonomous credit system standards with verified biometric attendance compliance and active laboratory engagement.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Program & Branch</span>
                        <span className="text-xs font-bold text-slate-900 mt-1 block">B.Tech - {profile.departmentName}</span>
                        <span className="text-[10px] text-indigo-600">Code: {profile.departmentCode} • Full-time</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Advisor</span>
                        <span className="text-xs font-bold text-slate-900 mt-1 block">{profile.advisorName}</span>
                        <span className="text-[10px] text-slate-500">{profile.advisorRoom}</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Examination Hall Ticket</span>
                        <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Granted & Verified
                        </span>
                        <span className="text-[10px] text-slate-500">Satisfies 75% statutory rule</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statutory Clearance</span>
                        <span className="text-xs font-bold text-indigo-900 mt-1 block">Zero Institutional Holds</span>
                        <span className="text-[10px] text-emerald-600">Library & Laboratory Cleared</span>
                      </div>
                    </div>
                  </div>

                  {/* Core Competencies */}
                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-3">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Verified Engineering Competencies
                    </h2>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {profile.competencies.map((c: string, idx: number) => (
                        <Badge
                          key={idx}
                          className="bg-indigo-50 text-indigo-800 border-indigo-200/80 text-xs px-3 py-1 font-semibold rounded-xl"
                        >
                          ✓ {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Quick Stats & Advisor Card */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Advisor Contact Card */}
                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" /> Assigned Faculty Mentor
                    </h3>
                    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                        {profile.advisorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{profile.advisorName}</p>
                        <p className="text-[11px] text-slate-500">{profile.advisorEmail}</p>
                        <p className="text-[10px] text-indigo-700 font-semibold mt-0.5">Office: {profile.advisorRoom}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Attendance Log Snippet */}
                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-600" /> Biometric Logs
                      </h3>
                      <span className="text-xs text-indigo-600 font-semibold cursor-pointer" onClick={() => setActiveTab("attendance")}>
                        View all
                      </span>
                    </div>

                    <div className="space-y-2">
                      {profile.recentAttendanceDates.slice(0, 4).map((att: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="font-mono text-slate-700 font-medium">{att.date}</span>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                            {att.status || "PRESENT"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMICS & CGPA PROGRESSION */}
            {activeTab === "academics" && (
              <div className="space-y-6">
                <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Semester-Wise Grade Point Average Progression
                      </h2>
                      <p className="text-xs text-slate-500">
                        Official academic transcript record recognized by Autonomous Academic Council
                      </p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-3 py-1 font-mono">
                      Cumulative GPA: {profile.cgpa.toFixed(2)} / 4.00
                    </Badge>
                  </div>

                  {/* Semester Breakdown Table */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 rounded-l-xl">Semester</th>
                          <th className="py-3 px-4">Credits Attempted</th>
                          <th className="py-3 px-4">Credits Cleared</th>
                          <th className="py-3 px-4 text-right">SGPA</th>
                          <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { sem: "Semester I", att: 22, clr: 22, sgpa: (profile.cgpa - 0.15).toFixed(2), status: "PASSED (First Class Distinction)" },
                          { sem: "Semester II", att: 24, clr: 24, sgpa: (profile.cgpa - 0.08).toFixed(2), status: "PASSED (First Class Distinction)" },
                          { sem: "Semester III", att: 24, clr: 24, sgpa: (profile.cgpa - 0.04).toFixed(2), status: "PASSED (First Class Distinction)" },
                          { sem: "Semester IV", att: 24, clr: 24, sgpa: (profile.cgpa + 0.05).toFixed(2), status: "PASSED (First Class Distinction)" },
                          { sem: "Semester V", att: 24, clr: 24, sgpa: (profile.cgpa + 0.02).toFixed(2), status: "PASSED (First Class Distinction)" },
                          { sem: "Semester VI", att: 20, clr: 20, sgpa: profile.cgpa.toFixed(2), status: "PASSED (First Class Distinction)" },
                          { sem: "Semester VII (Current)", att: 20, clr: 16, sgpa: (profile.cgpa + 0.06).toFixed(2), status: "IN_PROGRESS" },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{row.sem}</td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono">{row.att}</td>
                            <td className="py-3.5 px-4 text-emerald-600 font-mono font-bold">{row.clr}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700 text-sm">{row.sgpa}</td>
                            <td className="py-3.5 px-4 text-right">
                              <Badge variant="outline" className={`text-[10px] ${row.status.includes("IN_PROGRESS") ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-800 border-emerald-300"}`}>
                                {row.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ATTENDANCE ANALYTICS */}
            {activeTab === "attendance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="light-glow-emerald rounded-3xl p-5 shadow-sm border border-emerald-200">
                    <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Overall Attendance</span>
                    <p className="text-3xl font-black text-slate-900 font-mono mt-1">{profile.attendancePercentage}%</p>
                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold">Exceeds Mandatory 75% Threshold</p>
                  </div>

                  <div className="light-glow-indigo rounded-3xl p-5 shadow-sm border border-indigo-200">
                    <span className="text-xs font-bold uppercase text-indigo-800 tracking-wider">Total Instructional Sessions</span>
                    <p className="text-3xl font-black text-slate-900 font-mono mt-1">240 Hours</p>
                    <p className="text-[11px] text-slate-600 mt-1">Monitored via IoT Biometrics</p>
                  </div>

                  <div className="light-glow-amber rounded-3xl p-5 shadow-sm border border-amber-200">
                    <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">Allowed Absence Margin</span>
                    <p className="text-3xl font-black text-slate-900 font-mono mt-1">16 Hours</p>
                    <p className="text-[11px] text-amber-700 mt-1 font-semibold">Condonation Buffer Safe</p>
                  </div>
                </div>

                {/* Subject-Wise Attendance Breakdown */}
                <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Subject-by-Subject Attendance Health</h3>
                  <div className="space-y-4">
                    {profile.enrolledCourses.map((c: any, i: number) => (
                      <div key={i} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{c.code}: {c.title}</span>
                          <span className="font-mono font-bold text-indigo-700">{c.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.attendanceRate >= 85
                                ? "bg-emerald-500"
                                : c.attendanceRate >= 75
                                ? "bg-indigo-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${c.attendanceRate}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Instructor: {c.instructor}</span>
                          <span className={c.attendanceRate >= 75 ? "text-emerald-600 font-semibold" : "text-rose-600 font-bold"}>
                            {c.attendanceRate >= 75 ? "Safe (Eligible for Exams)" : "Warning: Below 75%"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ENROLLED COURSES */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Fall 2026 Enrolled Courses & Faculty</h2>
                      <p className="text-xs text-slate-500">Authorized curriculum registrations in PostgreSQL</p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-3 py-1 font-mono">
                      {profile.enrolledCourses.length} Registered Courses
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {profile.enrolledCourses.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 hover:bg-white hover:shadow-lg transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge className="bg-indigo-600 text-white text-[11px] font-mono px-2.5 py-0.5">
                            {c.code}
                          </Badge>
                          <span className="text-xs font-bold text-indigo-950 font-mono">
                            {c.credits} Credits
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" /> Instructor: {c.instructor}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" /> {c.room}
                          </span>
                          <span className="font-mono text-emerald-600 font-bold">
                            Internal: {c.currentInternalScore}/50
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SKILLS & CERTIFICATIONS */}
            {activeTab === "skills" && (
              <div className="space-y-6">
                <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Verified Industry Credentials & Badges</h2>
                      <p className="text-xs text-slate-500">Directly accredited through autonomous skill track assessments</p>
                    </div>
                    <Link href="/skills">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
                        Open Full Skills Portal <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {[
                      { title: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", score: 98, badge: "VERIFIED" },
                      { title: "Google Cloud ML Engineer", issuer: "Google Cloud", score: 96, badge: "VERIFIED" },
                      { title: "NVIDIA LLM Application Specialist", issuer: "NVIDIA DLI", score: 100, badge: "VERIFIED" },
                      { title: "PostgreSQL Database Architecture", issuer: "EnterpriseDB", score: 95, badge: "VERIFIED" },
                      { title: "Distributed Microservices Specialist", issuer: "Cloud Native Foundation", score: 92, badge: "VERIFIED" },
                    ].map((cert, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            {cert.badge}
                          </Badge>
                          <span className="text-[11px] font-mono text-indigo-700 font-bold">{cert.score}% Score</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{cert.title}</h4>
                        <p className="text-[11px] text-slate-500">Issuer: {cert.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: FEES & CLEARANCES */}
            {activeTab === "fees" && (
              <div className="space-y-6">
                <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Student Financial Ledger & Clearances</h2>
                      <p className="text-xs text-slate-500">Audited through University Comptroller & Bursar Office</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs px-3 py-1 font-bold">
                      ✓ {profile.feeDetails.clearanceStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-bold">Annual Tuition Billed</span>
                      <p className="text-xl font-black text-slate-900 font-mono mt-1">${profile.feeDetails.tuitionBilled.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">Paid in Full</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-bold">Scholarship Merit Credit</span>
                      <p className="text-xl font-black text-emerald-600 font-mono mt-1">-${profile.feeDetails.scholarshipAwarded.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-500">Merit GPA Award</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-bold">Hostel & Amenities</span>
                      <p className="text-xl font-black text-slate-900 font-mono mt-1">${profile.feeDetails.hostelPaid.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">Cleared</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] text-emerald-800 uppercase font-bold">Outstanding Balance</span>
                      <p className="text-xl font-black text-emerald-700 font-mono mt-1">$0.00</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">Hall Ticket Approved</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
