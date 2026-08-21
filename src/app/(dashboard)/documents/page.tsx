"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, Upload, Filter, MoreHorizontal, ChevronLeft, ChevronRight,
  FileText, Loader2, CheckCircle2, AlertCircle, Clock, Trash2,
  X, ExternalLink, Eye,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  processingStatus: string;
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
    return { bg: "bg-gray-500/15", text: "text-gray-400", label: "MD" };
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> Processed
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/15 text-blue-400">
          <Clock className="w-3 h-3 animate-spin" /> Processing
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-500/15 text-red-400">
          <AlertCircle className="w-3 h-3" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-500/15 text-gray-400">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#141720] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
            onClick={() => ref.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragging ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20"}`}
          >
            <div className="p-4 bg-indigo-500/10 rounded-full"><Upload className="w-7 h-7 text-indigo-400" /></div>
            <p className="text-sm font-medium text-white">Click or drag PDF here</p>
            <p className="text-xs text-gray-500">Max 10 MB • PDF only</p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) pick(e.target.files[0]); }} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <FileIcon name={file.name} type={file.type} />
              <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{file.name}</p><p className="text-xs text-gray-400">{fmtBytes(file.size)}</p></div>
              {!uploading && !done && <button onClick={() => setFile(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-gray-400 text-center animate-pulse">Uploading...</p>
              </div>
            )}
            {done && <p className="text-xs text-emerald-400 text-center flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded successfully!</p>}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {!uploading && !done && (
              <button onClick={upload} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">Upload</button>
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
    <aside className="w-72 shrink-0 bg-[#141720] border-l border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          {detail && <FileIcon name={detail.fileName} type={detail.fileType} />}
          <p className="text-xs font-medium text-white truncate">{detail?.fileName ?? "Loading..."}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white shrink-0 ml-2"><X className="w-4 h-4" /></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-4">
        {(["Details", "Chunks"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${tab === t ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
      ) : !detail ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500">Failed to load</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tab === "Details" && (
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Document Info</h3>
              {[
                { label: "File Type", value: detail.fileType.includes("pdf") ? "PDF" : detail.fileName.split(".").pop()?.toUpperCase() ?? "—" },
                { label: "Size", value: fmtBytes(detail.fileSize) },
                { label: "Chunks", value: detail._count.chunks.toLocaleString() },
                { label: "Uploaded By", value: detail.uploadedBy ?? "—" },
                { label: "Uploaded At", value: new Date(detail.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) },
                { label: "Status", value: detail.processingStatus },
                ...(detail.knowledgeBase ? [{ label: "Knowledge Base", value: detail.knowledgeBase.name }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-400 shrink-0">{label}</span>
                  {label === "Status" ? (
                    <StatusBadge status={value as string} />
                  ) : (
                    <span className="text-xs text-white text-right">{value}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "Chunks" && (
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-400">{detail._count.chunks} total chunks — showing first 5</p>
              {detail.chunks.map((c) => (
                <div key={c.id} className="bg-[#1a1f2e] rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-indigo-400 font-medium mb-1">Chunk {c.chunkIndex + 1} · {c.tokenCount} tokens</p>
                  <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-4">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer CTA */}
      {detail?.signedUrl && (
        <div className="p-4 border-t border-white/5">
          <a href={detail.signedUrl} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            <Eye className="w-4 h-4" /> View Full Document <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
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

  const load = useCallback((p = 1, s = search, t = tab) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: "10" });
    const st = TAB_STATUS[t];
    if (st) params.set("status", st);
    if (s) params.set("search", s);
    fetch(`/api/documents?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDocs(d.documents ?? []);
        setPagination(d.pagination ?? { page: 1, pageSize: 10, total: 0, pages: 1 });
        setTotalStorage(d.totalStorageBytes ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, tab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1, search, tab); }, [tab]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, search, tab), 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Poll processing docs
  useEffect(() => {
    const iv = setInterval(() => {
      if (docs.some((d) => d.processingStatus === "PROCESSING")) load(pagination.page);
    }, 8000);
    return () => clearInterval(iv);
  }, [docs, pagination.page]);

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
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#0f1117] text-white overflow-hidden -m-6 md:-m-10">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">University Documents</h1>
            <p className="text-xs text-gray-400 mt-0.5">Explore institutional and course documents. Academic documents are managed via the Faculty Portal.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 w-52"
              />
            </div>
            <a
              href="/faculty/documents"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs text-purple-300 transition-colors"
            >
              🎓 Go to Faculty Portal
            </a>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-6 border-b border-white/5 shrink-0">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-gray-500 pb-3 whitespace-nowrap">
            {pagination.total.toLocaleString()} documents · {fmtBytes(totalStorage)} used
          </span>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0f1117] border-b border-white/5 z-10">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Chunks</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Uploaded At</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-500 mx-auto" /></td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-500">No documents found.</td></tr>
              ) : docs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => setSelectedId(selectedId === doc.id ? null : doc.id)}
                  className={`border-b border-white/5 cursor-pointer transition-colors ${selectedId === doc.id ? "bg-indigo-600/10" : "hover:bg-white/5"}`}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon name={doc.fileName} type={doc.fileType} />
                      <span className="text-white font-medium truncate max-w-[180px] md:max-w-xs">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={doc.processingStatus} /></td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {doc.processingStatus === "COMPLETED" ? doc._count.chunks.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{fmtBytes(doc.fileSize)}</td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{timeAgo(doc.createdAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={() => setMenuOpenId(menuOpenId === doc.id ? null : doc.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menuOpenId === doc.id && (
                        <div className="absolute right-0 top-8 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl z-20 w-36 overflow-hidden">
                          <button onClick={() => { setSelectedId(doc.id); setMenuOpenId(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-gray-300 hover:bg-white/10 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View details
                          </button>
                          <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-400 hover:bg-white/10 transition-colors">
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
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 shrink-0">
          <span className="text-xs text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total.toLocaleString()} results
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => load(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pagination.page === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                  {p}
                </button>
              );
            })}
            {pagination.pages > 5 && <span className="text-gray-500 px-1">...</span>}
            {pagination.pages > 5 && (
              <button onClick={() => load(pagination.pages)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pagination.page === pagination.pages ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                {pagination.pages}
              </button>
            )}
            <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
  );
}
