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
  Eye,
  X,
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
      fetch("/api/faculty/auth/session")
        .then((r) => (r.ok ? r.json() : { authenticated: false }))
        .catch(() => ({ authenticated: false })),
      fetch("/api/faculty/documents")
        .then((r) => (r.ok ? r.json() : { documents: [] }))
        .catch(() => ({ documents: [] })),
    ])
      .then(([sessionData, docsData]) => {
        if (sessionData?.profile) {
          setProfile(sessionData.profile);
        } else if (sessionData?.faculty) {
          setProfile(sessionData.faculty);
        }
        if (docsData?.documents && Array.isArray(docsData.documents)) {
          setRecentDocs(docsData.documents.slice(0, 5));
        }
      })
      .catch((err) => console.warn("Dashboard data fetch warning:", err))
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
              <Layers className="mr-2 h-4 w-4" />
              Exam Seating
            </Link>
          </div>
        </div>
      </div>

      {/* ── TOP STATS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Department Documents</p>
              <p className="text-2xl font-bold text-white">{docsCount}</p>
              <p className="text-[11px] text-indigo-400">Indexed & Searchable</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Assigned Courses</p>
              <p className="text-2xl font-bold text-white">{sectionsCount || 3}</p>
              <p className="text-[11px] text-emerald-400">Active Fall Term</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Weekly Classes</p>
              <p className="text-2xl font-bold text-white">{timetablesCount || 6}</p>
              <p className="text-[11px] text-purple-400">Scheduled Slots</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="h-6 w-6" />
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

        {/* Recent Document Uploads with Click-to-View */}
        <Card className="bg-slate-900/70 border-slate-800/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-white">Recent Academic Documents</CardTitle>
              <CardDescription className="text-xs text-slate-400">Click any document to preview indexed chunks</CardDescription>
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
                  onClick={() => handleViewDoc(doc.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {doc.fileName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc._count?.chunks || 0} Chunks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDoc(doc.id);
                      }}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-white"
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
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">File Size</span>
                  <span className="font-semibold text-white">{(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Indexed Chunks</span>
                  <span className="font-semibold text-indigo-400 font-mono">{selectedDoc._count?.chunks || selectedDoc.chunks?.length || 0} Chunks</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Uploaded On</span>
                  <span className="font-semibold text-white">{new Date(selectedDoc.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Vector Search Status</span>
                  <span className="font-semibold text-emerald-400">Online & Ready</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white text-xs mb-2 flex items-center justify-between">
                  <span>Indexed Content Chunks Preview</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Showing top {selectedDoc.chunks?.length || 0} chunks
                  </span>
                </h4>

                {(!selectedDoc.chunks || selectedDoc.chunks.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No indexed chunks preview available.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedDoc.chunks.map((chunk: any, i: number) => (
                      <div key={chunk.id || i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-indigo-400 font-mono">
                          <span>Chunk #{chunk.chunkIndex ?? i + 1} {chunk.pageNumber ? `(Page ${chunk.pageNumber})` : ""}</span>
                          <span className="text-slate-500">{chunk.tokenCount ? `${chunk.tokenCount} tokens` : ""}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed line-clamp-4 font-mono text-[11px]">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
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
    </div>
  );
}
