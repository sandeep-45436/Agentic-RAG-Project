"use client";

import { AnimatedBackground } from "@/components/animated-background";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, Upload, Filter, MoreHorizontal, ChevronLeft, ChevronRight,
  FileText, Loader2, CheckCircle2, AlertCircle, Clock, Trash2,
  X, ExternalLink, Eye, Building,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  processingStatus: string;
  visibility?: string;
  departmentId?: string | null;
  department?: { id: string; code: string; name: string } | null;
  createdAt: string;
  uploadedBy: string | null;
  knowledgeBase: { name: string } | null;
  _count: { chunks: number };
}

interface DocDetail extends Doc {
  signedUrl: string | null;
  chunks: { id: string; content: string; chunkIndex: number; tokenCount: number }[];
}

interface Pagination {
  page: number; pageSize: number; total: number; pages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
  if (b >= 1e3) return (b / 1e3).toFixed(1) + " KB";
  return b + " B";
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fileIcon(name: string, type: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || type.includes("pdf"))
    return { bg: "bg-red-500/15", text: "text-red-400", label: "PDF" };
  if (["doc","docx"].includes(ext))
    return { bg: "bg-blue-500/15", text: "text-blue-400", label: "W" };
  if (["xls","xlsx","csv"].includes(ext))
    return { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "XL" };
  if (["ppt","pptx"].includes(ext))
    return { bg: "bg-orange-500/15", text: "text-orange-400", label: "PP" };
  if (["md","txt"].includes(ext))
    return { bg: "bg-gray-500/15", text: "text-slate-500", label: "MD" };
  return { bg: "bg-indigo-500/15", text: "text-indigo-400", label: ext.toUpperCase() || "FILE" };
}

const TABS = ["All Documents", "Processed", "Processing", "Failed", "Trash"] as const;
type Tab = typeof TABS[number];

const TAB_STATUS: Record<Tab, string | null> = {
  "All Documents": null,
  "Processed": "COMPLETED",
  "Processing": "PROCESSING",
  "Failed": "FAILED",
  "Trash": "DELETED",
};

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Processed
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
          <Clock className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Processing
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

// ── File Icon ─────────────────────────────────────────────────────────────────

function FileIcon({ name, type }: { name: string; type: string }) {
  const { bg, text, label } = fileIcon(name, type);
  return (
    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
      <span className={`text-[10px] font-bold ${text}`}>{label}</span>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const pick = (f: File) => {
    if (!f.type.includes("pdf")) { setError("Only PDF files are supported."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File exceeds 10 MB."); return; }
    setFile(f); setError("");
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true); setProgress(10);
    const fd = new FormData(); fd.append("file", file);
    const iv = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 500);
    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      clearInterval(iv); setProgress(100);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDone(true); setTimeout(() => { onDone(); onClose(); }, 1200);
    } catch (e: any) { clearInterval(iv); setError(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Upload Document</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
            onClick={() => ref.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragging ? "border-indigo-500 bg-indigo-50/60" : "border-slate-300 hover:border-indigo-500/60 bg-slate-50/60"}`}
          >
            <div className="p-4 bg-indigo-50 rounded-full border border-indigo-100"><Upload className="w-7 h-7 text-indigo-600" /></div>
            <p className="text-sm font-bold text-slate-900">Click or drag PDF here</p>
            <p className="text-xs text-slate-500 font-medium">Max 10 MB • PDF only</p>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) pick(e.target.files[0]); }} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <FileIcon name={file.name} type={file.type} />
              <div className="flex-1 min-w-0"><p className="text-sm text-slate-900 font-bold truncate">{file.name}</p><p className="text-xs text-slate-500">{fmtBytes(file.size)}</p></div>
              {!uploading && !done && <button onClick={() => setFile(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>}
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-indigo-700 font-semibold text-center animate-pulse">Uploading and analyzing...</p>
              </div>
            )}
            {done && <p className="text-xs text-emerald-700 font-bold text-center flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Uploaded successfully!</p>}
            {error && <p className="text-xs text-rose-600 font-semibold text-center">{error}</p>}
            {!uploading && !done && (
              <button onClick={upload} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-sm transition-all active:scale-98">Upload</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"Details" | "Chunks">("Details");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/documents/${docId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d.document); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 lg:relative lg:w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-2xl lg:shadow-none animate-slide-up-fade">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 min-w-0">
            {detail && <FileIcon name={detail.fileName} type={detail.fileType} />}
            <p className="text-xs font-bold text-slate-900 truncate">{detail?.fileName ?? "Loading..."}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 bg-slate-50/30">
          {(["Details", "Chunks"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-medium">Failed to load</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {tab === "Details" && (
              <div className="p-4 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Document Overview</h3>
                <div className="space-y-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  {[
                    { label: "File Type", value: detail.fileType.includes("pdf") ? "PDF" : detail.fileName.split(".").pop()?.toUpperCase() ?? "—" },
                    { label: "Size", value: fmtBytes(detail.fileSize) },
                    { label: "Chunks", value: detail._count.chunks.toLocaleString() },
                    { label: "Uploaded By", value: detail.uploadedBy ?? "—" },
                    { label: "Uploaded At", value: new Date(detail.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) },
                    { label: "Status", value: detail.processingStatus },
                    ...(detail.knowledgeBase ? [{ label: "Knowledge Base", value: detail.knowledgeBase.name }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2 last:border-b-0 last:pb-0">
                      <span className="text-xs text-slate-500 font-medium shrink-0">{label}</span>
                      {label === "Status" ? (
                        <StatusBadge status={value as string} />
                      ) : (
                        <span className="text-xs text-slate-900 text-right font-bold">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Chunks" && (
              <div className="p-4 space-y-2.5">
                <p className="text-xs text-slate-500 font-semibold">{detail._count.chunks} total chunks — showing first 5</p>
                {detail.chunks.map((c) => (
                  <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <p className="text-[10px] text-indigo-700 font-bold mb-1">Chunk {c.chunkIndex + 1} · {c.tokenCount} tokens</p>
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-4 font-normal">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        {detail?.signedUrl && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <a href={detail.signedUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-sm active:scale-98">
              <Eye className="w-4 h-4" /> View Full Document <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, pages: 1 });
  const [totalStorage, setTotalStorage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All Documents");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback((p = 1, s = search, t = tab, deptId = selectedDeptId) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: "10" });
    const st = TAB_STATUS[t];
    if (st) params.set("status", st);
    if (s) params.set("search", s);
    if (deptId && deptId !== "ALL") params.set("departmentId", deptId);
    if (deptId === "ALL") params.set("departmentId", "ALL");

    fetch(`/api/documents?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDocs(d.documents ?? []);
        if (d.departments && d.departments.length > 0) {
          setDepartments(d.departments);
        }
        setPagination(d.pagination ?? { page: 1, pageSize: 10, total: 0, pages: 1 });
        setTotalStorage(d.totalStorageBytes ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, tab, selectedDeptId]);

  // Initial load and tab change
  useEffect(() => { load(1, search, tab, selectedDeptId); }, [tab, selectedDeptId]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, search, tab, selectedDeptId), 400);
  }, [search]);

  // Live auto-polling every 5 seconds for instant sync when faculty uploads documents
  useEffect(() => {
    const iv = setInterval(() => {
      load(pagination.page, search, tab, selectedDeptId);
    }, 5000);
    return () => clearInterval(iv);
  }, [load, pagination.page, search, tab, selectedDeptId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDeletingId(null);
    setMenuOpenId(null);
  };

  return (
    <AnimatedBackground>
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl flex flex-col min-h-[calc(100vh-8rem)] overflow-hidden shadow-sm">
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* ── Top bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/90 bg-slate-50/50 shrink-0 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">University Documents & Notes</h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Synced
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">Explore institutional and departmental course materials. Academic documents uploaded by faculty appear here in real time.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Department Scope Selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">Scope:</span>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-indigo-700 border-none outline-none focus:ring-0 cursor-pointer pr-1"
                >
                  <option value="ALL" className="bg-white text-slate-900 font-semibold">
                    All Departments & University
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-white text-slate-900 font-medium">
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                />
              </div>

              <a
                href="/faculty/documents"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs text-purple-700 font-bold transition-all shadow-2xs shrink-0"
              >
                🎓 <span className="hidden xs:inline">Faculty</span> Portal
              </a>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-slate-200/90 bg-slate-50/30 shrink-0 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-900 font-medium"}`}>
                {t}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-slate-500 font-semibold pb-3 whitespace-nowrap pl-4 hidden md:inline">
              {pagination.total.toLocaleString()} documents · {fmtBytes(totalStorage)} used
            </span>
          </div>

          {/* ── Table ── */}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[650px] text-xs">
              <thead className="sticky top-0 bg-slate-50/95 border-b border-slate-200 z-10">
                <tr>
                  <th className="text-left px-6 py-3.5 text-slate-700 font-bold uppercase tracking-wider text-[11px]">Name</th>
                  <th className="text-left px-4 py-3.5 text-slate-700 font-bold uppercase tracking-wider text-[11px]">Scope</th>
                  <th className="text-left px-4 py-3.5 text-slate-700 font-bold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-left px-4 py-3.5 text-slate-700 font-bold uppercase tracking-wider text-[11px] hidden md:table-cell">Chunks</th>
                  <th className="text-left px-4 py-3.5 text-slate-700 font-bold uppercase tracking-wider text-[11px] hidden md:table-cell">Size</th>
                  <th className="text-left px-4 py-3.5 text-slate-700 font-bold uppercase tracking-wider text-[11px] hidden lg:table-cell">Uploaded At</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" /></td></tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-9 h-9 text-slate-400 mb-1" />
                        <p className="font-bold text-slate-900 text-sm">No documents found in selected scope</p>
                        <p className="text-xs text-slate-500 max-w-sm font-medium">
                          Select "All Departments & University" or switch to another department to view course materials uploaded by faculty.
                        </p>
                        {selectedDeptId !== "ALL" && (
                          <button
                            onClick={() => setSelectedDeptId("ALL")}
                            className="mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs transition-all"
                          >
                            View All Departments
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : docs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedId(selectedId === doc.id ? null : doc.id)}
                    className={`cursor-pointer transition-colors ${selectedId === doc.id ? "bg-indigo-50/80" : "hover:bg-indigo-50/40"}`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileIcon name={doc.fileName} type={doc.fileType} />
                        <span className="text-slate-900 font-bold truncate max-w-[180px] md:max-w-xs">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        doc.visibility === "UNIVERSITY"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}>
                        {doc.department?.code || (doc.visibility === "UNIVERSITY" ? "UNIV-WIDE" : "DEPT")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={doc.processingStatus} /></td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium hidden md:table-cell">
                      {doc.processingStatus === "COMPLETED" ? doc._count.chunks.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium hidden md:table-cell">{fmtBytes(doc.fileSize)}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium hidden lg:table-cell">{timeAgo(doc.createdAt)}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setMenuOpenId(menuOpenId === doc.id ? null : doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpenId === doc.id && (
                          <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-36 overflow-hidden">
                            <button onClick={() => { setSelectedId(doc.id); setMenuOpenId(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-slate-700 font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                              <Eye className="w-3.5 h-3.5 text-indigo-600" /> View details
                            </button>
                            <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-rose-600 font-semibold hover:bg-rose-50 transition-colors">
                              {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 shrink-0">
            <span className="text-xs text-slate-600 font-medium">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total.toLocaleString()} results
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => load(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${pagination.page === p ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"}`}>
                    {p}
                  </button>
                );
              })}
              {pagination.pages > 5 && <span className="text-slate-400 px-1 font-bold">...</span>}
              {pagination.pages > 5 && (
                <button onClick={() => load(pagination.pages)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${pagination.page === pagination.pages ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"}`}>
                  {pagination.pages}
                </button>
              )}
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selectedId && <DetailPanel docId={selectedId} onClose={() => setSelectedId(null)} />}

        {/* ── Upload Modal ── */}
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => load(1)} />}

        {/* Close menus on outside click */}
        {menuOpenId && (
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
        )}
      </div>
    </AnimatedBackground>
  );
}
