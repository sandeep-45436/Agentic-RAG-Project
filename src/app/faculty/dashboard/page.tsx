"use client";

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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FacultyDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/faculty/auth/session").then((r) => r.json()),
      fetch("/api/faculty/documents").then((r) => r.json()),
    ])
      .then(([sessionData, docsData]) => {
        if (sessionData.profile) {
          setProfile(sessionData.profile);
        }
        if (docsData.documents) {
          setRecentDocs(docsData.documents.slice(0, 5));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const sectionsCount = profile?.sections?.length || 0;
  const timetablesCount = profile?.timetableEntries?.length || 0;
  const invigilationsCount = profile?.invigilationAssignments?.length || 0;
  const docsCount = profile?.uploadedDocsCount || recentDocs.length;

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-6 lg:p-8 backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs">
                Academic Year 2026-2027 • Fall Term
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {profile?.facultyCode || "FAC-MEMBER"}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Welcome, {profile?.title} {profile?.user?.name || "Professor"}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              {profile?.designation || profile?.title} • {profile?.department?.name || "Department"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/faculty/documents"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 text-xs font-semibold px-4 py-2.5 transition-all"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
            <Link
              href="/faculty/seating"
              className="inline-flex items-center justify-center border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all"
            >
              <Layers className="mr-2 h-4 w-4 text-purple-400" />
              Exam Seating Plans
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Uploaded Documents</p>
              <p className="text-2xl font-bold text-white">{docsCount}</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Indexed for RAG
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Courses & Sections</p>
              <p className="text-2xl font-bold text-white">{sectionsCount}</p>
              <p className="text-[11px] text-indigo-300">
                {profile?.department?.code || "CS"} Active Curriculum
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Weekly Scheduled Slots</p>
              <p className="text-2xl font-bold text-white">{timetablesCount}</p>
              <p className="text-[11px] text-slate-400">Monday — Friday</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Invigilation Duties</p>
              <p className="text-2xl font-bold text-white">{invigilationsCount || 1}</p>
              <p className="text-[11px] text-amber-400">Midterm Fall 2026</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── CORE FACULTY ROLES GRID ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role 1: Document Uploads */}
        <Card className="bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/40 transition-all group flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg text-white font-semibold">1. Upload Documents</CardTitle>
            <CardDescription className="text-slate-400 text-xs leading-relaxed">
              Upload course syllabi, lecture notes, lab manuals, question banks, and academic policies.
              All files are automatically parsed and embedded into the RAG vector store for instant search.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/faculty/documents"
              className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium py-2.5 transition-all"
            >
              Open Document Center
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Role 2: Timetables */}
        <Card className="bg-slate-900/70 border-slate-800/80 hover:border-purple-500/40 transition-all group flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg text-white font-semibold">2. Timetable Management</CardTitle>
            <CardDescription className="text-slate-400 text-xs leading-relaxed">
              Create, update, and upload weekly class schedules and exam timetables. View interactive weekly
              grids, detect room collisions, and export schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/faculty/timetables"
              className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium py-2.5 transition-all"
            >
              Manage Timetables
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Role 3: Seating Arrangement */}
        <Card className="bg-slate-900/70 border-slate-800/80 hover:border-pink-500/40 transition-all group flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg text-white font-semibold">3. Exam Seating Arrangements</CardTitle>
            <CardDescription className="text-slate-400 text-xs leading-relaxed">
              Generate intelligent zig-zag alternate seating plans for academic examinations.
              Visualize hall desk matrices, assign invigilators, and print attendance notices.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/faculty/seating"
              className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-pink-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium py-2.5 transition-all"
            >
              Generate Seating Plans
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── SCHEDULE & RECENT DOCUMENTS SPLIT ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Class Slots for this faculty */}
        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-white">Your Assigned Weekly Classes</CardTitle>
              <CardDescription className="text-xs text-slate-400">Class schedule for {profile?.name}</CardDescription>
            </div>
            <Link href="/faculty/timetables" className="text-xs text-indigo-400 hover:underline flex items-center">
              View All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.timetableEntries && profile.timetableEntries.length > 0 ? (
              profile.timetableEntries.slice(0, 4).map((slot: any) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{slot.courseCode}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-300">
                        {slot.room}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-[220px]">{slot.courseTitle}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md">
                      {slot.dayOfWeek}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
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

        {/* Recent Document Uploads */}
        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-white">Recent Academic Documents</CardTitle>
              <CardDescription className="text-xs text-slate-400">Indexed in university knowledge repository</CardDescription>
            </div>
            <Link href="/faculty/documents" className="text-xs text-indigo-400 hover:underline flex items-center">
              Manage <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {doc.fileName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc._count?.chunks || 0} Chunks
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      doc.processingStatus === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {doc.processingStatus}
                  </Badge>
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
    </div>
  );
}
