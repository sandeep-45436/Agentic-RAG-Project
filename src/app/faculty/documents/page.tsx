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
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadStatus("success");
      setSuccessMessage(data.message || "Document successfully ingested and indexed!");
      fetchDocuments();
    } catch (err: any) {
      setUploadStatus("error");
      setErrorMessage(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? Deletion rules enforce that faculty can only delete their own uploads.")) return;
    try {
      const res = await fetch(`/api/faculty/documents?id=${docId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete document.");
        return;
      }
      fetchDocuments();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "DEPARTMENT") {
      return doc.departmentId === facultyContext?.departmentId;
    }
    if (activeTab === "UNIVERSITY") {
      return doc.visibility === "UNIVERSITY";
    }
    if (activeTab === "MY_UPLOADS") {
      return doc.uploadedBy === facultyContext?.facultyCode || doc.uploadedBy === facultyContext?.id;
    }

    return true;
  });

  const getVisibilityBadge = (vis: string) => {
    const opt = VISIBILITY_OPTIONS.find((v) => v.value === vis) || VISIBILITY_OPTIONS[0];
    const Icon = opt.icon;
    return (
      <Badge variant="outline" className={`text-[10px] flex items-center gap-1 font-medium ${opt.badgeClass}`}>
        <Icon className="h-3 w-3" />
        {vis}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── DEPARTMENT ACCESS BOUNDARY BANNER ────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-950 border border-indigo-500/20 p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Department Access Boundary
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Pre-Retrieval RBAC Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🏫 {facultyContext?.departmentName || "Academic Department"} ({facultyContext?.departmentCode || "DEPT"})
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Documents uploaded here are bound to the <strong className="text-slate-200">{facultyContext?.departmentCode || "Department"}</strong> boundary. The Cognitive Kernel applies pre-retrieval filters across Qdrant vectors, PostgreSQL BM25, and Neo4j graph nodes to prevent cross-department data leaks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-right">
              <p className="text-[11px] text-slate-400">Authenticated Faculty</p>
              <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                <span>{facultyContext?.facultyName || "Faculty Member"}</span>
                <span className="text-[10px] font-mono text-indigo-400">({facultyContext?.facultyCode || "FAC"})</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl h-10 px-3"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
              {filteredDocs.length} Documents authorized for your role & department
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Filter Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
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
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
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
                        <td className="py-3.5 text-right">
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
    </div>
  );
}
