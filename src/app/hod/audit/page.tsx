"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Search,
  Filter,
  RefreshCw,
  FileText,
  User,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODAuditTrailPage() {
  const { activeDepartment } = useHOD();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/audit?department=${activeDepartment}&limit=60`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeDepartment]);

  const entityTypes = [
    { id: "ALL", label: "All Audit Events" },
    { id: "STUDENT", label: "Student Changes" },
    { id: "FACULTY", label: "Faculty Appointments" },
    { id: "CONDONATION", label: "Attendance Condonations" },
    { id: "COURSE", label: "Curriculum Diffs" },
    { id: "EXAMINATION", label: "Exam Governance" },
    { id: "TIMETABLE", label: "Timetable Slots" },
  ];

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      (log.entityName && log.entityName.toLowerCase().includes(search.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === "ALL" || log.entityType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-400" />
            Departmental Governance & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable, cryptographically verifiable ledger of all departmental decisions, condonations, appointments, and curriculum mutations for {activeDepartment}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </Button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {entityTypes.map((t) => {
            const count = t.id === "ALL" ? logs.length : logs.filter((l) => l.entityType === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedType === t.id
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            placeholder="Search action, actor, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-800 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-slate-500 mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-white">No Audit Events Found</h3>
            <p className="text-xs text-slate-400 mt-1">No matching mutation or governance records logged in this filter scope.</p>
          </Card>
        ) : (
          filtered.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <Card
                key={log.id}
                className="bg-slate-900/80 border-slate-800 backdrop-blur hover:border-slate-700 transition-all text-xs"
              >
                <CardHeader
                  className="p-4 cursor-pointer select-none"
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-300 border-blue-500/30"
                        >
                          {log.entityType}
                        </Badge>
                        <span className="font-bold text-white text-sm">{log.action.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-slate-400 text-xs">
                        Target: <strong className="text-slate-200">{log.entityName}</strong> • Actor:{" "}
                        <span className="text-blue-300 font-semibold">{log.actorName}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-blue-400 flex items-center gap-0.5 justify-end mt-1">
                        {isExpanded ? "Hide Details" : "View State Diff"}{" "}
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-4 pt-0 border-t border-slate-800/60 mt-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* Previous State */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Previous State Snapshot</span>
                        <pre className="text-[11px] text-amber-300/90 font-mono overflow-x-auto whitespace-pre-wrap">
                          {log.previousState ? JSON.stringify(log.previousState, null, 2) : "None (Initial Creation)"}
                        </pre>
                      </div>

                      {/* New State */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">New Mutated State Snapshot</span>
                        <pre className="text-[11px] text-emerald-300/90 font-mono overflow-x-auto whitespace-pre-wrap">
                          {log.newState ? JSON.stringify(log.newState, null, 2) : "State Preserved"}
                        </pre>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1 text-[11px]">
                      <p className="text-slate-300">
                        <strong className="text-slate-400">Documented Reason:</strong> {log.reason}
                      </p>
                      {log.policyCitation && (
                        <p className="text-slate-300 font-mono text-[10px]">
                          <strong className="text-slate-400">Policy Reference:</strong> {log.policyCitation}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
