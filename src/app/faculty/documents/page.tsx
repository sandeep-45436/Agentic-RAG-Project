"use client";
import { AnimatedBackground } from "@/components/animated-background";

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
import { QuantumNexusLoader } from "@/components/ui/extraordinary-loader";

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
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    value: "PRIVATE",
    label: "Private (Confidential)",
    desc: "Visible only to you and Department Head (HOD)",
    icon: Lock,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "COLLEGE",
    label: "College Scope",
    desc: "Visible across engineering/allied departments in college",
    icon: Shield,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    value: "UNIVERSITY",
    label: "University-Wide",
    desc: "Visible to all university members (requires admin authorization)",
    icon: Globe,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
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

  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const fetchDocuments = async (silent?: boolean | unknown) => {
    const isSilent = silent === true;
    try {
      if (!isSilent) setLoading(true);
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
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Active polling: auto-refresh every 3s while any document is PROCESSING
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.processingStatus === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleReprocessDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setReprocessingId(docId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, processingStatus: "PROCESSING" } : d))
      );
      const res = await fetch("/api/faculty/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, action: "reprocess" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to trigger re-process");
        fetchDocuments(true);
      }
    } catch (err) {
      alert("Network error triggering re-process");
      fetchDocuments(true);
    } finally {
      setReprocessingId(null);
    }
  };

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
          <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
            <Building className="h-3 w-3 mr-1 text-indigo-600" /> Department
          </Badge>
        );
      case "PRIVATE":
        return (
          <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200">
            <Lock className="h-3 w-3 mr-1 text-purple-600" /> Private
          </Badge>
        );
      case "COLLEGE":
        return (
          <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200">
            <Shield className="h-3 w-3 mr-1 text-amber-600" /> College
          </Badge>
        );
      case "UNIVERSITY":
        return (
          <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
            <Globe className="h-3 w-3 mr-1 text-emerald-600" /> University
          </Badge>
        );
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-semibold">{vis}</Badge>;
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
    <AnimatedBackground>
      <div className="space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold shadow-2xs">
                Department Document Center
              </Badge>
              <span className="text-xs text-slate-500 font-mono font-semibold">
                {facultyContext?.facultyCode || "FAC-MEMBER"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Academic Documents & Syllabi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Department of {facultyContext?.departmentName || "Computer Science"} ({facultyContext?.departmentCode || "CSE"})
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments()}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs px-3.5 py-2 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── METRIC TILES ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="bg-white/95 backdrop-blur-xl border-slate-200/90 shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Department Documents</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{facultyContext?.totalDeptDocs ?? documents.length}</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{facultyContext?.departmentCode || "CSE"} Exclusive Scope</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-xl border-slate-200/90 shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">University-Wide Policies</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{facultyContext?.totalUnivDocs ?? 0}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Regulations & Academic Rules</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-xl border-slate-200/90 shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Indexed RAG Chunks</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {documents.reduce((acc, d) => acc + (d._count?.chunks || 0), 0)}
              </p>
              <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Vectors in Qdrant & BM25</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-2xs">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── UPLOAD ZONE & CATEGORIZATION ─────────────────────────── */}
      <Card className="bg-white/95 backdrop-blur-xl border-slate-200/90 shadow-sm rounded-2xl">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900 font-bold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-indigo-600" />
            Upload Academic Document
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs font-medium">
            Documents are automatically tagged with your authenticated department (<strong className="text-slate-900 font-bold">{facultyContext?.departmentCode || "CSE"}</strong>) and indexed for zero-hallucination RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Form Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Document Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Course Code (Optional)</Label>
              <Input
                placeholder="e.g. CS401, CS501"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                className="bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Visibility Scope</Label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
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
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50"
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
              <div className="bg-indigo-50 p-3.5 rounded-full text-indigo-600 border border-indigo-100 shadow-2xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">
                  Click to select or drag and drop document
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-sm">{file.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {category} • Scope: <span className="text-indigo-700 font-bold">{visibility}</span>
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
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploading && (
                <div className="space-y-3 py-2">
                  <QuantumNexusLoader size="sm" text="Vectorizing & Embedding Chunks..." />
                  <Progress value={progress} className="h-2 bg-slate-200" />
                  <p className="text-xs text-indigo-700 font-bold text-center animate-pulse">
                    Ingesting into Multimodal RAG Engine with Department Metadata...
                  </p>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {uploadStatus === "error" && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                {!uploading && uploadStatus !== "success" && (
                  <Button
                    onClick={handleUpload}
                    className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold h-9 shadow-sm transition-all active:scale-98"
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
                    className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs h-9 shadow-2xs"
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
      <Card className="bg-white/95 backdrop-blur-xl border-slate-200/90 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-lg text-slate-900 font-bold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              Authorized Department Document Repository
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs font-medium">
              {filteredDocs.length} Documents authorized for your role & department • Click any document to view preview
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] overflow-x-auto scrollbar-none max-w-full">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "ALL" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("DEPARTMENT")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "DEPARTMENT" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {facultyContext?.departmentCode || "Dept"} Only
              </button>
              <button
                onClick={() => setActiveTab("UNIVERSITY")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "UNIVERSITY" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                University
              </button>
              <button
                onClick={() => setActiveTab("MY_UPLOADS")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "MY_UPLOADS" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Uploads
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-xs font-medium text-slate-900 rounded-xl placeholder:text-slate-400 focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments()}
              disabled={loading}
              className="h-9 px-3 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 gap-1.5 shrink-0 shadow-2xs"
              title="Refresh document repository status"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-semibold">Loading authorized documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FolderOpen className="h-10 w-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900">No documents found in this scope</p>
              <p className="text-xs text-slate-500 font-medium">Upload your course materials above or change the filter tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 uppercase text-[11px] font-bold tracking-wider bg-slate-50/60">
                    <th className="py-3 px-3">Document Name & Department</th>
                    <th className="py-3 px-2">Visibility</th>
                    <th className="py-3 px-2">Size</th>
                    <th className="py-3 px-2">Chunks</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Uploaded</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => {
                    const isOwnDoc =
                      doc.uploadedBy === facultyContext?.id ||
                      doc.uploadedBy === facultyContext?.facultyCode;
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => handleViewDoc(doc.id)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 truncate max-w-xs">{doc.fileName}</p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                                <span className="text-indigo-700 font-bold">
                                  {doc.department?.code || doc.department?.name || (doc.visibility === "UNIVERSITY" ? "University-Wide" : "Department")}
                                </span>
                                {isOwnDoc && (
                                  <span className="text-[9px] px-2 py-0.2 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-bold">
                                    Your Upload
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          {getVisibilityBadge(doc.visibility || "DEPARTMENT")}
                        </td>
                        <td className="py-3.5 px-2 text-slate-600 font-medium">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="py-3.5 px-2 text-slate-600 font-medium">
                          <span className="font-mono text-indigo-700 font-bold">{doc._count?.chunks || 0}</span> chunks
                        </td>
                        <td className="py-3.5 px-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              doc.processingStatus === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : doc.processingStatus === "PROCESSING"
                                ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {doc.processingStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 font-medium">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {doc.processingStatus !== "COMPLETED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Re-process document extraction & vector embeddings"
                                disabled={doc.processingStatus === "PROCESSING" || reprocessingId === doc.id}
                                onClick={(e) => handleReprocessDoc(doc.id, e)}
                                className="rounded-lg h-7 px-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${doc.processingStatus === "PROCESSING" || reprocessingId === doc.id ? "animate-spin" : ""}`} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View document details & indexed chunks"
                              onClick={() => handleViewDoc(doc.id)}
                              className="rounded-lg h-7 px-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
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
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-slate-300 hover:text-slate-400 cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl popup-card-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{selectedDoc.fileName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                      {selectedDoc.department?.code || "Department Scope"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200">
                      {selectedDoc.visibility || "DEPARTMENT"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                      {selectedDoc.processingStatus || "COMPLETED"}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">File Size</span>
                  <span className="font-bold text-slate-900">{(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Indexed Chunks</span>
                  <span className="font-extrabold text-indigo-700 font-mono">{selectedDoc._count?.chunks || selectedDoc.chunks?.length || 0} Chunks</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Uploaded On</span>
                  <span className="font-bold text-slate-900">{new Date(selectedDoc.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Vector Search Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online & Ready
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                  <span>Indexed Content Chunks Preview</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Showing top {selectedDoc.chunks?.length || 0} chunks
                  </span>
                </h4>

                {(!selectedDoc.chunks || selectedDoc.chunks.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                    No indexed chunks preview available.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedDoc.chunks.map((chunk: any, i: number) => (
                      <div key={chunk.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-indigo-700 font-mono font-bold">
                          <span>Chunk #{chunk.chunkIndex ?? i + 1} {chunk.pageNumber ? `(Page ${chunk.pageNumber})` : ""}</span>
                          <span className="text-slate-500 font-normal">{chunk.tokenCount ? `${chunk.tokenCount} tokens` : ""}</span>
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
            <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
              {selectedDoc.signedUrl ? (
                <a
                  href={selectedDoc.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-sm active:scale-98"
                >
                  <Eye className="h-3.5 w-3.5" /> Open / Download File
                </a>
              ) : (
                <span className="text-xs text-slate-500 font-medium">Original file stored securely</span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AnimatedBackground>
  );
}
