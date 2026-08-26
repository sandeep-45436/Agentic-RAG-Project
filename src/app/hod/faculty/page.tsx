"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Search,
  Plus,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODFacultyPage() {
  const { activeDepartment } = useHOD();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Credential Edit Modal
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/faculty?department=${activeDepartment}`);
      const data = await res.json();
      if (data.faculty) {
        setFaculty(data.faculty);
      }
    } catch (err) {
      console.error("Failed to fetch faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [activeDepartment]);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setUpdating(true);
    setUpdateMsg(null);

    try {
      const res = await fetch("/api/hod/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: editingFaculty.id,
          assignedPassword: newPassword || undefined,
          designation: newDesignation || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateMsg("Faculty credentials updated successfully.");
        fetchFaculty();
        setTimeout(() => {
          setEditingFaculty(null);
          setUpdateMsg(null);
        }, 800);
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.facultyCode.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            Department Faculty & Workload Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Workload optimization, section allocation, conflict radar, and credential management for {activeDepartment}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchFaculty}
          disabled={loading}
          className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Roster
        </Button>
      </div>

      {/* Top Workload Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Department Faculty</p>
              <p className="text-2xl font-bold text-white mt-0.5">{faculty.length}</p>
              <p className="text-[10px] text-blue-400 font-medium">Full-Time & Tenured</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Overloaded Faculty</p>
              <p className="text-2xl font-bold text-rose-400 mt-0.5">
                {faculty.filter((f) => f.workload?.status === "OVERLOADED" || f.workload?.status === "HIGH").length}
              </p>
              <p className="text-[10px] text-rose-400 font-medium">&gt;15 Contact Hours/Week</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Spare Contact Capacity</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">14.5 Hrs</p>
              <p className="text-[10px] text-emerald-400 font-medium">Available in Junior Faculty</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search faculty by name, code (FAC-CS-001), or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Faculty Table Grid */}
      <div className="space-y-3">
        {filtered.map((fac) => (
          <Card key={fac.id} className="bg-slate-900/80 border-slate-800 backdrop-blur">
            <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Details */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-base">{fac.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-300 border-blue-500/30 font-mono">
                    {fac.facultyCode}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300 border-slate-700">
                    {fac.title}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      fac.workload?.status === "OVERLOADED"
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        : fac.workload?.status === "HIGH"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {fac.workload?.status || "OPTIMAL"} WORKLOAD
                  </Badge>
                </div>

                <p className="text-xs text-slate-400">
                  {fac.designation} • {fac.email} • {fac.officeRoom || "Tech Hall"}
                </p>

                {/* Assigned Courses Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Sections:</span>
                  {fac.sections?.length > 0 ? (
                    fac.sections.map((s: any) => (
                      <span
                        key={s.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                      >
                        {s.course?.code || "Course"} ({s.sectionCode})
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No assigned sections</span>
                  )}
                </div>
              </div>

              {/* Middle Column: Workload Metrics */}
              <div className="flex items-center gap-6 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800 shrink-0">
                <div className="text-center">
                  <span className="text-slate-500 block text-[10px]">Teaching Hrs</span>
                  <span className="font-bold text-white">{fac.workload?.teachingHours || 12}h/wk</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[10px]">Students</span>
                  <span className="font-bold text-blue-400">{fac.workload?.enrolledStudents || 90}</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[10px]">Invigilations</span>
                  <span className="font-bold text-purple-400">{fac.workload?.invigilationDuties || 2} Slots</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block text-[10px]">Index Score</span>
                  <span className="font-bold text-amber-400">{fac.workload?.score || 45}/100</span>
                </div>
              </div>

              {/* Right Column: Credential & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                  <KeyRound className="h-3 w-3 text-blue-400" />
                  <span className="font-mono text-slate-300 text-[11px]">
                    {showPasswords[fac.id] ? fac.assignedPassword : "••••••••••••"}
                  </span>
                  <button
                    onClick={() => togglePasswordVisibility(fac.id)}
                    className="text-slate-500 hover:text-white ml-1"
                  >
                    {showPasswords[fac.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingFaculty(fac);
                    setNewDesignation(fac.designation || "");
                    setNewPassword(fac.assignedPassword || "");
                  }}
                  className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs rounded-lg h-8"
                >
                  Edit / Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Manage Faculty Credentials</h3>
                <p className="text-xs text-slate-400">{editingFaculty.name} ({editingFaculty.facultyCode})</p>
              </div>
              <button
                onClick={() => setEditingFaculty(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {updateMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>{updateMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateFaculty} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Designation / Role Title</label>
                <Input
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  placeholder="e.g. Associate Professor & Lab Director"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Assigned Unique Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(`Faculty@${activeDepartment}2026!`)}
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs font-mono rounded-xl"
                  placeholder="e.g. Faculty@CS2026!"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingFaculty(null)}
                  className="border-slate-700 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-semibold"
                >
                  {updating ? "Saving..." : "Save Credentials"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
