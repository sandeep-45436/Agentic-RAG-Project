"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  Shield,
  Lock,
  Globe,
  Building,
  RefreshCw,
  FolderOpen,
  Eye,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DOCUMENT_CATEGORIES = [
  "Course Syllabus",
  "Lecture Notes & Slides",
  "Question Bank & Model Papers",
  "Academic & Examination Regulation",
  "Lab Manual & Experiment Guide",
  "Department Circular & Notification",
];

const VISIBILITY_OPTIONS = [
  {
    value: "DEPARTMENT",
    label: "Department Scope (Default)",
    desc: "Visible to faculty & authorized students in your department",
    icon: Building,
    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  },
  {
    value: "PRIVATE",
    label: "Private (Confidential)",
    desc: "Visible only to you and Department Head (HOD)",
    icon: Lock,
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  },
  {
    value: "COLLEGE",
    label: "College Scope",
    desc: "Visible across engineering/allied departments in college",
    icon: Shield,
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  {
    value: "UNIVERSITY",
    label: "University-Wide",
    desc: "Visible to all university members (requires admin authorization)",
    icon: Globe,
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
];

export default function FacultyDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [facultyContext, setFacultyContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "DEPARTMENT" | "UNIVERSITY" | "MY_UPLOADS">("ALL");

  // Document Detail Preview Modal State
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loadingDocDetail, setLoadingDocDetail] = useState(false);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [courseCode, setCourseCode] = useState("");
  const [visibility, setVisibility] = useState<string>("DEPARTMENT");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faculty/documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
      if (data.facultyContext) {
        setFacultyContext(data.facultyContext);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSelectFile = (selected: File) => {
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setUploadStatus("error");
      setErrorMessage("Only PDF, DOCX, and TXT files are supported.");
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setUploadStatus("error");
      setErrorMessage("File exceeds 25 MB size limit.");
      return;
    }
    setFile(selected);
    setUploadStatus("idle");
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadStatus("idle");
    setProgress(15);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("courseCode", courseCode);
    formData.append("visibility", visibility);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 85 : prev + 15));
      }, 400);

      const res = await fetch("/api/faculty/documents", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) {
        setUploadStatus("error");
        setErrorMessage(data.error || "Failed to upload document.");
      } else {
        setUploadStatus("success");
        setSuccessMessage(data.message || "Document uploaded and indexed successfully!");
        setFile(null);
        setCourseCode("");
        fetchDocuments();
      }
    } catch (err: any) {
      setUploadStatus("error");
      setErrorMessage(err?.message || "Upload network failure.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document from the knowledge base?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (selectedDoc?.id === docId) setSelectedDoc(null);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete document");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

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

  const getVisibilityBadge = (vis: string) => {
    switch (vis) {
      case "DEPARTMENT":
        return (
          <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
            <Building className="h-3 w-3 mr-1" /> Department
          </Badge>
        );
      case "PRIVATE":
        return (
          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30">
            <Lock className="h-3 w-3 mr-1" /> Private
          </Badge>
        );
      case "COLLEGE":
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
            <Shield className="h-3 w-3 mr-1" /> College
          </Badge>
        );
      case "UNIVERSITY":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            <Globe className="h-3 w-3 mr-1" /> University
          </Badge>
        );
      default:
        return <Badge variant="outline">{vis}</Badge>;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (activeTab === "DEPARTMENT" && doc.visibility !== "DEPARTMENT") return false;
    if (activeTab === "UNIVERSITY" && doc.visibility !== "UNIVERSITY") return false;
    if (activeTab === "MY_UPLOADS") {
      const isMine =
        doc.uploadedBy === facultyContext?.id ||
        doc.uploadedBy === facultyContext?.facultyCode;
      if (!isMine) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.fileName?.toLowerCase().includes(q);
      const matchDept = doc.department?.name?.toLowerCase().includes(q) || doc.department?.code?.toLowerCase().includes(q);
      if (!matchName && !matchDept) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs">
                Department Document Center
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {facultyContext?.facultyCode || "FAC-MEMBER"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Academic Documents & Syllabi
            </h1>
            <p className="text-xs text-slate-300">
              Department of {facultyContext?.departmentName || "Computer Science"} ({facultyContext?.departmentCode || "CSE"})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── METRIC TILES ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Department Documents</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{facultyContext?.totalDeptDocs ?? documents.length}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{facultyContext?.departmentCode} Exclusive Scope</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">University-Wide Policies</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{facultyContext?.totalUnivDocs ?? 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Regulations & Academic Rules</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Indexed RAG Chunks</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {documents.reduce((acc, d) => acc + (d._count?.chunks || 0), 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Vectors in Qdrant & BM25</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── UPLOAD ZONE & CATEGORIZATION ─────────────────────────── */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-indigo-400" />
            Upload Academic Document
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Documents are automatically tagged with your authenticated department (<strong className="text-slate-300">{facultyContext?.departmentCode || "CSE"}</strong>) and indexed for zero-hallucination RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Document Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Course Code (Optional)</Label>
              <Input
                placeholder="e.g. CS401, CS501"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Visibility Scope</Label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag and drop box */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center space-y-3 cursor-pointer transition-all ${
                dragging
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-800 hover:border-indigo-500/40 bg-slate-950/50 hover:bg-slate-950/80"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files?.[0]) handleSelectFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-200">
                  Click to select or drag and drop document
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  PDF, DOCX, or TXT formats (Max: 25 MB)
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
                }}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-sm">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {category} • Scope: <span className="text-indigo-400 font-semibold">{visibility}</span>
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setUploadStatus("idle");
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploading && (
                <div className="space-y-1.5">
                  <Progress value={progress} className="h-2 bg-slate-800" />
                  <p className="text-xs text-indigo-300 text-center animate-pulse">
                    Ingesting into Multimodal RAG Engine with Department Metadata...
                  </p>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {uploadStatus === "error" && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-300 text-xs border border-rose-500/30">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                {!uploading && uploadStatus !== "success" && (
                  <Button
                    onClick={handleUpload}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold h-9"
                  >
                    Confirm & Ingest to {facultyContext?.departmentCode || "Department"} Repository
                  </Button>
                )}
                {uploadStatus === "success" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setUploadStatus("idle");
                    }}
                    className="w-full border-slate-700 text-slate-300 rounded-xl text-xs h-9"
                  >
                    Upload Another Document
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── DOCUMENT DIRECTORY TABLE ─────────────────────────────── */}
      <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-400" />
              Authorized Department Document Repository
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {filteredDocs.length} Documents authorized for your role & department • Click any document to view preview
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Filter Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto scrollbar-none max-w-full">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "ALL" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("DEPARTMENT")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "DEPARTMENT" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {facultyContext?.departmentCode || "Dept"} Only
              </button>
              <button
                onClick={() => setActiveTab("UNIVERSITY")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "UNIVERSITY" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                University
              </button>
              <button
                onClick={() => setActiveTab("MY_UPLOADS")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "MY_UPLOADS" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                My Uploads
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-xs text-white rounded-xl placeholder:text-slate-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading authorized documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FolderOpen className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No documents found in this scope</p>
              <p className="text-xs text-slate-500">Upload your course materials above or change the filter tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Document Name & Department</th>
                    <th className="pb-3 font-semibold">Visibility</th>
                    <th className="pb-3 font-semibold">Size</th>
                    <th className="pb-3 font-semibold">Chunks</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Uploaded</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDocs.map((doc) => {
                    const isOwnDoc =
                      doc.uploadedBy === facultyContext?.id ||
                      doc.uploadedBy === facultyContext?.facultyCode;
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => handleViewDoc(doc.id)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-white truncate max-w-xs">{doc.fileName}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span className="text-indigo-300 font-medium">
                                  {doc.department?.code || doc.department?.name || (doc.visibility === "UNIVERSITY" ? "University-Wide" : "Department")}
                                </span>
                                {isOwnDoc && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                                    Your Upload
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          {getVisibilityBadge(doc.visibility || "DEPARTMENT")}
                        </td>
                        <td className="py-3.5 text-slate-300">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="py-3.5 text-slate-300">
                          <span className="font-mono text-indigo-300">{doc._count?.chunks || 0}</span> chunks
                        </td>
                        <td className="py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              doc.processingStatus === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : doc.processingStatus === "PROCESSING"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {doc.processingStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View document details & indexed chunks"
                              onClick={() => handleViewDoc(doc.id)}
                              className="rounded-lg h-7 px-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={isOwnDoc ? "Delete document" : "Only uploader / HOD can delete"}
                              onClick={() => handleDelete(doc.id)}
                              className={`rounded-lg h-7 px-2 ${
                                isOwnDoc
                                  ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                  : "text-slate-600 hover:text-slate-500 cursor-pointer"
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
