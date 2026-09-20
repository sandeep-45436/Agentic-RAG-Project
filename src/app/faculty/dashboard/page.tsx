"use client";

import { AnimatedBackground } from "@/components/animated-background";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Layers,
  UploadCloud,
  Clock,
  BookOpen,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Building,
  GraduationCap,
  Eye,
  X,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortalSwitcher } from "@/components/portal-switcher";
import { DedicatedCopilotDrawer } from "@/components/ai/DedicatedCopilotDrawer";

const DEFAULT_PROFILE = {
  id: "faculty-cse-001",
  name: "Prof. CSE 001",
  facultyCode: "FAC-CSE-001",
  title: "Professor",
  designation: "Chair of Computer Science & Engineering",
  department: { name: "Computer Science & Engineering", code: "CSE" },
  user: { name: "Prof. CSE 001", email: "fac.cse.001@university.edu" },
  sections: [
    { id: "s1", course: { code: "CSE401", title: "Advanced Agentic AI & Distributed Neural Systems" } },
    { id: "s2", course: { code: "CSE301", title: "Distributed Database Engineering" } },
    { id: "s3", course: { code: "CSE201", title: "Algorithmic Complexity & Parallelism" } },
  ],
  timetableEntries: [
    { id: "t1", courseCode: "CSE401", courseTitle: "Advanced Agentic AI & Distributed Neural Systems", room: "Turing Hall 101", dayOfWeek: "Monday", startTime: "09:00 AM", endTime: "10:30 AM" },
    { id: "t2", courseCode: "CSE301", courseTitle: "Distributed Database Engineering", room: "Turing Hall 102", dayOfWeek: "Wednesday", startTime: "11:00 AM", endTime: "12:30 PM" },
    { id: "t3", courseCode: "CSE401", courseTitle: "Neural Architectures Lab", room: "Computing Core Lab", dayOfWeek: "Thursday", startTime: "02:00 PM", endTime: "04:00 PM" },
  ],
  uploadedDocsCount: 4,
};

export default function FacultyDashboardPage() {
  const [profile, setProfile] = useState<any>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("faculty_user");
        if (raw) {
          const user = JSON.parse(raw);
          setProfile((prev: any) => ({ ...prev, ...user }));
        }
      } catch {}
    }

    Promise.all([
      fetch("/api/faculty/auth/session")
        .then((r) => (r.ok ? r.json() : { authenticated: false }))
        .catch(() => ({ authenticated: false })),
      fetch("/api/faculty/documents")
        .then((r) => (r.ok ? r.json() : { documents: [] }))
        .catch(() => ({ documents: [] })),
    ])
      .then(([sessionData, docsData]) => {
        if (sessionData?.profile) {
          setProfile((prev: any) => ({ ...prev, ...sessionData.profile }));
        } else if (sessionData?.faculty) {
          setProfile((prev: any) => ({ ...prev, ...sessionData.faculty }));
        }
        if (docsData?.documents && Array.isArray(docsData.documents)) {
          setRecentDocs(docsData.documents.slice(0, 5));
        }
      })
      .catch((err) => console.warn("Dashboard data fetch warning:", err));
  }, []);

  const sectionsCount = profile?.sections?.length || 0;
  const timetablesCount = profile?.timetableEntries?.length || 0;
  const invigilationsCount = profile?.invigilationAssignments?.length || 0;
  const docsCount = profile?.uploadedDocsCount || recentDocs.length;

  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loadingDocDetail, setLoadingDocDetail] = useState(false);

  const handleViewDoc = async (docId: string) => {
    try {
      setLoadingDocDetail(true);
      const res = await fetch(`/api/documents/${docId}`);
      const data = await res.json();
      if (data.document) {
        setSelectedDoc(data.document);
      }
    } catch (err) {
      console.error("Failed to load document detail:", err);
    } finally {
      setLoadingDocDetail(false);
    }
  };

  return (
    <AnimatedBackground>
    <div className="space-y-6 pb-12 font-sans relative z-10">
      {/* ── FACULTY ACADEMIC OPERATIONS SUB-FEATURES HUB ────────────────── */}
      <div className="bg-white/95 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Faculty Academic Operations & Modules</h2>
              <p className="text-[11px] text-slate-500">Access your teaching periods, exam invigilations, syllabus uploads, and department dossier</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 w-fit">
            5 Faculty Sub-Features Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Link
            href="/faculty/timetables"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Schedule</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Class Timetables</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Teaching hours, periods & hall schedules</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-purple-700 group-hover:translate-x-0.5 transition-transform">
              <span>View Timetable</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/faculty/seating"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Invigilation</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Exam Seating Plans</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Student seat grid & exam hall duties</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-blue-700 group-hover:translate-x-0.5 transition-transform">
              <span>Inspect Seating Grid</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/faculty/documents"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Uploads</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Academic Docs & Notes</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload syllabi, notes & question banks</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
              <span>Manage Materials</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/faculty/assigned-faculty"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-amber-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Faculty List</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Assigned Faculty</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Department colleagues & course sections</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
              <span>View Directory</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/faculty/profile"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                <User className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">Dossier</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Faculty Dossier</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Profile credentials & research publications</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-indigo-700 group-hover:translate-x-0.5 transition-transform">
              <span>Edit Profile</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── ALITS FACULTY INSTITUTIONAL BRAND HEADER ──────────────────────── */}
      <div className="light-glass-card anim-fade-up-1 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="relative h-11 w-36 sm:w-44 flex items-center justify-start">
            <img
              src="/images/college-logo.png"
              alt="ALITS University Logo"
              className="h-10 object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-xs font-bold text-slate-900 block tracking-tight">
              Anantha Lakshmi Institute of Technology & Sciences
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Faculty Academic Administration & Research Operations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/faculty/profile"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-600/20 text-xs font-bold px-4 py-2.5 transition-all hover:scale-105"
          >
            <User className="h-4 w-4" />
            My Faculty Profile & Dossier ({profile?.facultyCode || "FAC-CSE-001"})
            <ChevronRight className="h-3.5 w-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border border-white/60 shadow-lg p-6 lg:p-8 backdrop-blur-xl anim-fade-up-1">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/40 text-xs">
                Academic Year 2026-2027 • Fall Term
              </Badge>
              <span className="text-xs text-white/90 font-mono">
                {profile?.facultyCode || "FAC-MEMBER"}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Welcome, {profile?.title} {profile?.user?.name || "Professor"}
            </h1>
            <p className="text-sm text-white/90 max-w-xl">
              {profile?.designation || profile?.title} • {profile?.department?.name || "Department"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/faculty/documents"
              className="inline-flex items-center justify-center bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-xl shadow-lg text-xs font-semibold px-4 py-2.5 transition-all"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
            <Link
              href="/faculty/seating"
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all"
            >
              <Layers className="mr-2 h-4 w-4" />
              Exam Seating
            </Link>
          </div>
        </div>
      </div>

      {/* ── TOP STATS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="light-glass-card card-3d-inner anim-fade-up-2 shimmer-effect hover-lift hover:border-indigo-300 transition-all shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">Department Documents</p>
              <p className="text-2xl font-bold text-slate-900 number-pop">{docsCount}</p>
              <p className="text-[11px] text-indigo-600 font-medium">Indexed & Searchable</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 icon-ring">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="light-glass-card card-3d-inner anim-fade-up-2 shimmer-effect hover-lift hover:border-emerald-300 transition-all shadow-md" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">Assigned Courses</p>
              <p className="text-2xl font-bold text-slate-900 number-pop">{sectionsCount || 3}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Active Fall Term</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 icon-ring">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="light-glass-card card-3d-inner anim-fade-up-2 shimmer-effect hover-lift hover:border-purple-300 transition-all shadow-md" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">Weekly Classes</p>
              <p className="text-2xl font-bold text-slate-900 number-pop">{timetablesCount || 6}</p>
              <p className="text-[11px] text-purple-600 font-medium">Scheduled Slots</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 icon-ring">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="light-glass-card card-3d-inner anim-fade-up-2 shimmer-effect hover-lift hover:border-amber-300 transition-all shadow-md" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">Invigilation Duties</p>
              <p className="text-2xl font-bold text-slate-900 number-pop">{invigilationsCount || 1}</p>
              <p className="text-[11px] text-amber-600 font-medium">Midterm Fall 2026</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 icon-ring">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── SCHEDULE & RECENT DOCUMENTS SPLIT ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 anim-fade-up-3">
        {/* Weekly Class Slots for this faculty */}
        <Card className="light-glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 text-reveal">Your Assigned Weekly Classes</CardTitle>
              <CardDescription className="text-xs text-slate-500">Class schedule for {profile?.name}</CardDescription>
            </div>
            <Link href="/faculty/timetables" className="text-xs text-indigo-600 hover:underline flex items-center">
              View All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.timetableEntries && profile.timetableEntries.length > 0 ? (
              profile.timetableEntries.slice(0, 4).map((slot: any) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-slate-200 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{slot.courseCode}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-600 bg-white">
                        {slot.room}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[220px]">{slot.courseTitle}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                      {slot.dayOfWeek}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No classes assigned yet. Add slots in Timetable Management.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Document Uploads with Click-to-View */}
        <Card className="light-glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 text-reveal">Recent Academic Documents</CardTitle>
              <CardDescription className="text-xs text-slate-500">Click any document to preview indexed chunks</CardDescription>
            </div>
            <Link href="/faculty/documents" className="text-xs text-indigo-600 hover:underline flex items-center">
              Manage <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleViewDoc(doc.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-slate-200 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 icon-ring">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                        {doc.fileName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc._count?.chunks || 0} Chunks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] badge-pulse ${
                        doc.processingStatus === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {doc.processingStatus}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDoc(doc.id);
                      }}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No documents uploaded yet. Upload syllabus or lecture notes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── DOCUMENT PREVIEW / DETAIL MODAL ───────────────────────── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{selectedDoc.fileName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                      {selectedDoc.department?.code || "Department Scope"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30">
                      {selectedDoc.visibility || "DEPARTMENT"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                      {selectedDoc.processingStatus || "COMPLETED"}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">File Size</span>
                  <span className="font-semibold text-slate-900">{(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Indexed Chunks</span>
                  <span className="font-semibold text-indigo-600 font-mono">{selectedDoc._count?.chunks || selectedDoc.chunks?.length || 0} Chunks</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Uploaded On</span>
                  <span className="font-semibold text-slate-900">{new Date(selectedDoc.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Vector Search Status</span>
                  <span className="font-semibold text-emerald-600">Online & Ready</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs mb-2 flex items-center justify-between">
                  <span>Indexed Content Chunks Preview</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Showing top {selectedDoc.chunks?.length || 0} chunks
                  </span>
                </h4>

                {(!selectedDoc.chunks || selectedDoc.chunks.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No indexed chunks preview available.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedDoc.chunks.map((chunk: any, i: number) => (
                      <div key={chunk.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-indigo-600 font-mono">
                          <span>Chunk #{chunk.chunkIndex ?? i + 1} {chunk.pageNumber ? `(Page ${chunk.pageNumber})` : ""}</span>
                          <span className="text-slate-500">{chunk.tokenCount ? `${chunk.tokenCount} tokens` : ""}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed line-clamp-4 font-mono text-[11px]">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              {selectedDoc.signedUrl ? (
                <a
                  href={selectedDoc.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                >
                  <Eye className="h-3.5 w-3.5" /> Open / Download File
                </a>
              ) : (
                <span className="text-xs text-slate-500">Original file stored securely</span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
                className="border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── FACULTY DEDICATED LANGGRAPH COPILOT DRAWER ── */}
      <DedicatedCopilotDrawer
        role="faculty"
        title="Faculty Copilot"
        subtitle="Question Paper Gen • Bloom's Taxonomy • Student Intervention"
        departmentId={profile.department?.code || "CSE"}
        quickPrompts={[
          { label: "Generate Mid-Term Exam (CSE204)", query: "Generate a 30-mark mid-term question paper for CSE204 covering Distributed Architecture with Bloom's Taxonomy rubrics." },
          { label: "Audit At-Risk Students & Attendance", query: "Evaluate student cohort attendance and internal marks to flag at-risk students below 75%." },
          { label: "Create 4-Week Remedial Plan", query: "Formulate a tailored 4-week remedial study roadmap for students with low attendance." }
        ]}
      />
    </div>
    </AnimatedBackground>
  );
}
