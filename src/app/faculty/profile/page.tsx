"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedBackground } from "@/components/animated-background";

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "research" | "teaching" | "publications" | "mentorship">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacultyCode, setSelectedFacultyCode] = useState<string>("");

  const loadFacultyProfile = async (code?: string) => {
    try {
      setLoading(true);
      const url = code
        ? `/api/faculty/profile?facultyCode=${encodeURIComponent(code)}`
        : `/api/faculty/profile`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        if (data.directory) {
          setDirectory(data.directory);
        }
      }
    } catch (err) {
      console.error("Failed to load faculty profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyProfile();
  }, []);

  const handleSelectFaculty = (code: string) => {
    setSelectedFacultyCode(code);
    loadFacultyProfile(code);
    setSearchQuery("");
  };

  const filteredDirectory = directory.filter(
    (f) =>
      f.facultyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.departmentCode.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  return (
    <AnimatedBackground showCampusWatermark={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        {/* ── 1. INSTITUTIONAL TOP BAR WITH ALITS BRANDING ──────────────── */}
        <div className="light-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3.5">
            <Link href="/faculty/dashboard" className="flex items-center gap-3 group">
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
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                University Faculty Academic Council & Professorial Dossier
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/faculty/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Faculty Dashboard
            </Link>

            <button
              onClick={() => loadFacultyProfile(selectedFacultyCode)}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
              title="Refresh faculty dossier"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── 2. REAL-TIME PROFESSORIAL DIRECTORY SWITCHER ───────────────── */}
        <div className="light-glass-card rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search 90 DB faculty members (e.g. FAC-CSE-001, Prof)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 text-xs rounded-xl shadow-inner"
            />

            {/* Autocomplete Dropdown */}
            {searchQuery && (
              <div className="absolute top-11 left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 space-y-1">
                {filteredDirectory.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center">No faculty member found</p>
                ) : (
                  filteredDirectory.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFaculty(f.facultyCode)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{f.facultyCode}</span>
                        <span className="text-slate-600 ml-2">{f.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-200">
                        {f.departmentCode}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Department Faculty Switches */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Chairs by Dept:
            </span>
            {["CSE", "ECE", "MECH", "EEE", "CIVIL", "IT", "MATH", "EE"].map((branch) => (
              <button
                key={branch}
                onClick={() => handleSelectFaculty(`FAC-${branch}-001`)}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-xs shrink-0"
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. HERO FACULTY BANNER WITH CAMPUS BACKDROP ────────────────── */}
        {profile && (
          <div className="relative rounded-3xl overflow-hidden light-glass-card border border-slate-200/90 shadow-xl shadow-indigo-950/5">
            {/* Campus Image Header Backdrop */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900">
              <img
                src="/images/college-campus.jpg"
                alt="ALITS Engineering Campus"
                className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay scale-105 hover:scale-100 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge className="bg-white/90 text-slate-800 border-white/50 backdrop-blur-md text-xs font-semibold px-3 py-1 shadow-sm">
                  🏛️ {profile.collegeName}
                </Badge>
                <Badge className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 shadow-sm">
                  {profile.tenureStatus}
                </Badge>
              </div>
            </div>

            {/* Profile Avatar & Details */}
            <div className="px-6 sm:px-8 pb-6 pt-0 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                {/* Avatar */}
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl p-1.5 bg-white shadow-2xl border-2 border-indigo-200 shrink-0">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full rounded-2xl bg-indigo-50 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white" title="Professor Tenured">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {profile.title} {profile.name}
                    </h1>
                    <Badge variant="outline" className="text-xs font-mono font-bold bg-indigo-50 border-indigo-200 text-indigo-700 px-2.5">
                      {profile.facultyCode}
                    </Badge>
                  </div>

                  <p className="text-sm font-bold text-slate-700">
                    {profile.designation} • Department of {profile.departmentName}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> {profile.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {profile.officeRoom}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" /> Advisees: {profile.adviseesCount} Scholars
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 High-Impact Key Badges */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
                <div className="light-glow-cyan rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-cyan-800 tracking-wider block">Grants Total</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">${(profile.researchGrantsTotal / 1_000_000).toFixed(1)}M</p>
                  <span className="text-[10px] text-cyan-700 font-bold">Sponsored Grants</span>
                </div>

                <div className="light-glow-indigo rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block">Publications</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{profile.publicationsCount}</p>
                  <span className="text-[10px] text-indigo-700 font-semibold">IEEE / ACM Journals</span>
                </div>

                <div className="light-glow-emerald rounded-2xl p-3.5 text-center min-w-[95px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">h-Index</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{profile.hIndex}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold">i10-Index: {profile.i10Index}</span>
                </div>
              </div>
            </div>

            {/* ── 4. TABS HEADER ───────────────────────────────────────── */}
            <div className="border-t border-slate-200/80 px-6 sm:px-8 bg-slate-50/50 flex items-center gap-2 overflow-x-auto py-2">
              {[
                { id: "overview", label: "Dossier & Credentials", icon: User },
                { id: "research", label: "Sponsored Research & Grants", icon: FlaskConical },
                { id: "teaching", label: "Teaching & Class Sections", icon: BookOpen },
                { id: "publications", label: "Scholarly Publications", icon: FileText },
                { id: "mentorship", label: "Mentorship & Office Hours", icon: Users },
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

        {/* ── 5. TAB CONTENT PANELS ───────────────────────────────────── */}
        {profile && (
          <div className="space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                      Academic Qualifications & Credentials
                    </h2>
                    <ul className="space-y-2.5">
                      {profile.qualifications.map((q: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <span className="font-semibold text-slate-800">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Research Focus & Specialization
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Leading multi-disciplinary investigations in {profile.specialization}. Supervises post-graduate theses, sponsored engineering grants, and coordinates autonomous ABET & NAAC departmental accreditation.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" /> Office Hours & Availability
                    </h3>
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1.5">
                      <p className="font-bold text-emerald-950">{profile.officeHours}</p>
                      <p className="text-emerald-800 font-medium">Location: {profile.officeRoom}</p>
                      <p className="text-[10px] text-slate-500 pt-1">Scholars may walk in during office hours or book via portal.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RESEARCH GRANTS */}
            {activeTab === "research" && (
              <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Sponsored Research Portfolio & Active Grants</h2>
                    <p className="text-xs text-slate-500">Funded through federal agencies and enterprise consortia in PostgreSQL</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-mono font-bold">
                    ${(profile.researchGrantsTotal / 1_000_000).toFixed(1)}M Total Escrow
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {profile.researchProjects.map((proj: any) => (
                    <div
                      key={proj.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                          {proj.status}
                        </Badge>
                        <span className="text-sm font-mono font-bold text-emerald-600">
                          ${proj.grantAmount.toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{proj.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{proj.abstract}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TEACHING */}
            {activeTab === "teaching" && (
              <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Assigned Instructional Sections & Classrooms</h2>
                    <p className="text-xs text-slate-500">Live lecture schedules across department course offerings</p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-mono">
                    {profile.teachingSections.length} Sections
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {profile.teachingSections.map((sec: any) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[11px]">
                          {sec.courseCode} ({sec.sectionNumber})
                        </Badge>
                        <span className="text-xs font-mono font-bold text-slate-600">{sec.credits} Credits</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{sec.courseTitle}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {sec.room} • {sec.term}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PUBLICATIONS */}
            {activeTab === "publications" && (
              <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                <h2 className="text-base font-bold text-slate-900">Featured Scholarly Publications & Journal Papers</h2>
                <div className="space-y-3 pt-1">
                  {[
                    { title: "Autonomous Agent Reasoning Graphs in Real-Time Distributed Information Retrieval", journal: "IEEE Transactions on Knowledge and Data Engineering (TKDE)", year: 2026, citations: 48 },
                    { title: "High-Throughput Vector Sharding and Context Window Optimization in Large-Scale SIS", journal: "ACM Transactions on Computer Systems (TOCS)", year: 2025, citations: 64 },
                    { title: "Zero-Collision Seating Arrangements via Bipartite Graph Matching in University Operations", journal: "Journal of Systems & Software (Elsevier)", year: 2024, citations: 39 },
                  ].map((pub, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 font-mono">{pub.year} • Peer Reviewed</span>
                        <span className="text-[11px] font-mono text-slate-500">{pub.citations} Citations</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{pub.title}</h4>
                      <p className="text-[11px] text-slate-500">{pub.journal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: MENTORSHIP */}
            {activeTab === "mentorship" && (
              <div className="light-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4">
                <h2 className="text-base font-bold text-slate-900">Undergraduate & Doctoral Scholar Advisory Cohort</h2>
                <p className="text-xs text-slate-500">Currently advising {profile.adviseesCount} scholars across research and academic tracks</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-700">Total Advisees</span>
                    <p className="text-2xl font-black text-indigo-950 font-mono mt-1">{profile.adviseesCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Average Advisee GPA</span>
                    <p className="text-2xl font-black text-emerald-950 font-mono mt-1">3.78</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Capstone Projects</span>
                    <p className="text-2xl font-black text-amber-950 font-mono mt-1">6 Active</p>
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
