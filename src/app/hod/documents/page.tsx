"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Lock,
  Building,
  Globe,
  Shield,
  Sparkles,
  GitCompare,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODDocumentsPage() {
  const { activeDepartment } = useHOD();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Syllabus Comparison State
  const [comparing, setComparing] = useState(false);
  const [compareDiff, setCompareDiff] = useState<any | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/documents?department=${activeDepartment}&visibility=${activeScope}`);
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeDepartment, activeScope]);

  const handleCompareSyllabus = async () => {
    setComparing(true);
    setDiffLoading(true);
    try {
      const res = await fetch(`/api/hod/compare-syllabus?courseCode=CS401&department=${activeDepartment}`);
      const data = await res.json();
      if (data.diff) {
        setCompareDiff(data.diff);
      }
    } catch (err) {
      console.error("Syllabus comparison error:", err);
    } finally {
      setDiffLoading(false);
    }
  };

  const filtered = documents.filter((d) => d.fileName.toLowerCase().includes(search.toLowerCase()));

  const scopes = [
    { id: "ALL", label: "All Scopes" },
    { id: "DEPARTMENT", label: "🏢 Department Scope" },
    { id: "FACULTY", label: "👥 Faculty Only" },
    { id: "PRIVATE", label: "🔒 Private / Confidential" },
    { id: "COLLEGE", label: "🏛️ College Scope" },
    { id: "UNIVERSITY", label: "🌐 University-Wide" },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-400" />
            Department Knowledge Repository & Syllabus Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-scope document governance, vector RAG indexing, and comparative syllabus diffs for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleCompareSyllabus}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-semibold shadow-lg shadow-indigo-600/20"
          >
            <GitCompare className="mr-1.5 h-4 w-4" />
            Compare Syllabi Diffs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocs}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── SYLLABUS COMPARISON ENGINE PREVIEW ─────────────────────── */}
      {comparing && (
        <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-indigo-500/40 backdrop-blur-xl shadow-2xl animate-in fade-in duration-300">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <GitCompare className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <span>Syllabus Comparative Diff & Provenance</span>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px]">
                      CS401 Algorithm Curriculum
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Comparing 2025 Syllabus vs 2026 Modernized Curriculum with page-level citations
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComparing(false)}
                className="text-slate-400 hover:text-white"
              >
                Close Diff
              </Button>
            </div>
          </CardHeader>

          {diffLoading ? (
            <CardContent className="p-8 text-center text-slate-400 space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400" />
              <p className="text-xs">Computing RAG semantic vector and structural diffs...</p>
            </CardContent>
          ) : compareDiff ? (
            <CardContent className="p-5 space-y-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-indigo-300 block text-[11px] uppercase">Summary of Changes</span>
                <p className="text-slate-200 mt-1 leading-relaxed">{compareDiff.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Added Modules */}
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Added Course Units (+2 Modules)
                  </h4>
                  {compareDiff.addedModules?.map((mod: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{mod.title}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Page {mod.pageNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{mod.description}</p>
                    </div>
                  ))}
                </div>

                {/* Removed Modules */}
                <div className="space-y-2">
                  <h4 className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4" /> Deprecated & Removed Modules
                  </h4>
                  {compareDiff.removedModules?.map((mod: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{mod.title}</span>
                        <span className="text-[10px] text-rose-400 font-mono">Page {mod.pageNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{mod.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modified Credits & Requirements */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block text-xs">Credit & Prerequisite Adjustments</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {compareDiff.modifiedCredits?.map((cr: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                      <span className="font-bold text-white block">{cr.item}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-rose-400 line-through">{cr.previous}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="text-emerald-400 font-bold">{cr.current}</span>
                      </div>
                      <p className="text-slate-500 text-[10px] italic">{cr.citation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          ) : null}
        </Card>
      )}

      {/* Scope Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {scopes.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScope(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeScope === s.id ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search documents by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-1.5 bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <Card key={doc.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-3">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-xs font-bold text-white truncate max-w-[180px]">
                    {doc.fileName}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 ${
                    doc.visibility === "PRIVATE"
                      ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                      : doc.visibility === "UNIVERSITY"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                  }`}
                >
                  {doc.visibility}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px]">
                <span>Indexed RAG Chunks:</span>
                <span className="font-mono font-bold text-blue-400">{doc.chunksCount || 12} Chunks</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px]">
                <span>Knowledge Base:</span>
                <span className="text-slate-300 font-semibold truncate max-w-[120px]">{doc.knowledgeBaseName}</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                RAG Online
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
