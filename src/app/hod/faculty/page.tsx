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
  UserPlus,
  Edit,
  UserX,
  Send,
  Building,
  Briefcase,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODFacultyPage() {
  const { activeDepartment, session } = useHOD();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Appoint Modal
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [appointForm, setAppointForm] = useState({
    name: "",
    email: "",
    facultyCode: "",
    title: "Assistant Professor",
    designation: "Faculty Instructor",
    specialization: "Artificial Intelligence & Distributed Systems",
    officeRoom: "Tech Hall 301",
    tenureStatus: "Tenure-Track",
  });
  const [appointLoading, setAppointLoading] = useState(false);
  const [invitationResult, setInvitationResult] = useState<{ token: string; url: string; name: string } | null>(null);

  // Edit Profile Modal
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    title: "",
    designation: "",
    specialization: "",
    officeRoom: "",
    lifecycleStatus: "ACTIVE",
    reason: "Departmental workload & profile adjustment",
  });
  const [updating, setUpdating] = useState(false);

  // Relieve Modal
  const [relievingFaculty, setRelievingFaculty] = useState<any | null>(null);
  const [relieveReason, setRelieveReason] = useState("");
  const [relieveLoading, setRelieveLoading] = useState(false);

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

  const handleAppointFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppointLoading(true);
    try {
      const res = await fetch("/api/hod/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...appointForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInvitationResult({
          token: data.invitationToken,
          url: data.invitationUrl,
          name: appointForm.name,
        });
        fetchFaculty();
      }
    } catch (err) {
      console.error("Appoint error:", err);
    } finally {
      setAppointLoading(false);
    }
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/hod/faculty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: editingFaculty.id,
          ...editForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFaculty();
        setEditingFaculty(null);
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRelieveFaculty = async () => {
    if (!relievingFaculty) return;
    setRelieveLoading(true);

    try {
      const res = await fetch(
        `/api/hod/faculty?facultyId=${relievingFaculty.id}&reason=${encodeURIComponent(
          relieveReason || "HOD administrative relieving"
        )}&department=${activeDepartment}&actorName=${encodeURIComponent(session?.name || "HOD")}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchFaculty();
        setRelievingFaculty(null);
        setRelieveReason("");
      }
    } catch (err) {
      console.error("Relieve error:", err);
    } finally {
      setRelieveLoading(false);
    }
  };

  const filtered = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.facultyCode && f.facultyCode.toLowerCase().includes(search.toLowerCase())) ||
      f.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            Faculty Roster & Workload Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Secure faculty appointments, activation token distribution, and workload optimization for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            size="sm"
            onClick={() => {
              setInvitationResult(null);
              setAppointModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Appoint Faculty
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search by faculty name, code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs rounded-xl"
        />
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => {
          const isRelieved = f.lifecycleStatus === "RELIEVED";
          const isOnLeave = f.lifecycleStatus === "ON_LEAVE";
          const isOverloaded = f.workload?.status === "OVERLOADED";

          return (
            <Card
              key={f.id}
              className={`border backdrop-blur space-y-3 transition-all ${
                isRelieved
                  ? "bg-slate-950/40 border-slate-800/40 opacity-70"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-white">{f.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          isRelieved
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            : isOnLeave
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {f.lifecycleStatus}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      {f.title} • {f.designation}
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border-blue-500/30 shrink-0">
                    {f.facultyCode}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Details */}
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px]">
                  <p className="text-slate-300">
                    <strong className="text-slate-400">Specialization:</strong> {f.specialization}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-slate-400">Office Room:</strong> {f.officeRoom}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-slate-400">Email:</strong> {f.email}
                  </p>
                </div>

                {/* Workload Indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Workload Engine Load</span>
                    <span
                      className={`font-mono font-bold ${
                        isOverloaded ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {f.workload?.teachingHours || 12} hrs/week ({f.workload?.status || "NORMAL"})
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isOverloaded ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, ((f.workload?.teachingHours || 12) / 18) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Sections */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Active Course Sections</span>
                  {f.sections?.length > 0 ? (
                    <div className="space-y-1">
                      {f.sections.map((sec: any) => (
                        <div key={sec.id} className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex justify-between">
                          <span className="font-semibold text-white">{sec.course?.code || "Course"} {sec.sectionCode}</span>
                          <span className="text-slate-400">{sec.scheduleText || "Mon/Wed"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] italic">No active teaching sections assigned.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingFaculty(f);
                      setEditForm({
                        name: f.name,
                        title: f.title || "Professor",
                        designation: f.designation || "Faculty Instructor",
                        specialization: f.specialization || "",
                        officeRoom: f.officeRoom || "",
                        lifecycleStatus: f.lifecycleStatus || "ACTIVE",
                        reason: "Departmental governance review",
                      });
                    }}
                    className="flex-1 border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs rounded-xl"
                  >
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Edit Profile
                  </Button>

                  {!isRelieved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRelievingFaculty(f)}
                      className="border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs rounded-xl px-2.5"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* APPOINT FACULTY MODAL                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {appointModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-400" />
                Appoint New Faculty Member
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppointModalOpen(false)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {invitationResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">Faculty Member Appointed</h4>
                  <p className="text-slate-300">
                    <strong>{invitationResult.name}</strong> has been enrolled on the departmental roster. A secure activation token has been generated.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Secure Activation Token</span>
                  <div className="font-mono text-blue-300 bg-slate-900 p-2 rounded-lg border border-slate-800 select-all text-xs">
                    {invitationResult.token}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    The faculty member can set their own credentials via this activation token without credentials being exposed to HOD.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setAppointModalOpen(false);
                      setInvitationResult(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAppointFaculty} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. Dr. Alan Turing"
                      value={appointForm.name}
                      onChange={(e) => setAppointForm({ ...appointForm, name: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">University Email *</label>
                    <Input
                      required
                      type="email"
                      placeholder="e.g. alan.turing@smartuniversity.edu"
                      value={appointForm.email}
                      onChange={(e) => setAppointForm({ ...appointForm, email: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Academic Title</label>
                    <Input
                      placeholder="e.g. Associate Professor"
                      value={appointForm.title}
                      onChange={(e) => setAppointForm({ ...appointForm, title: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Departmental Designation</label>
                    <Input
                      placeholder="e.g. Senior Faculty - AI & Systems"
                      value={appointForm.designation}
                      onChange={(e) => setAppointForm({ ...appointForm, designation: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Specialization</label>
                    <Input
                      placeholder="e.g. Distributed Consensus & RAG"
                      value={appointForm.specialization}
                      onChange={(e) => setAppointForm({ ...appointForm, specialization: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Office Room</label>
                    <Input
                      placeholder="e.g. Tech Hall 304"
                      value={appointForm.officeRoom}
                      onChange={(e) => setAppointForm({ ...appointForm, officeRoom: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400 inline mr-1" />
                  Appointment automatically generates a secure invitation token and logs an immutable audit event.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAppointModalOpen(false)}
                    className="border-slate-800 text-slate-400 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={appointLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                  >
                    {appointLoading ? "Appointing..." : "Confirm Appointment"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT PROFILE MODAL                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-400" />
                Edit Faculty Profile: {editingFaculty.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingFaculty(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdateFaculty} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Academic Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Designation</label>
                  <Input
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Specialization</label>
                  <Input
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Office Room</label>
                  <Input
                    value={editForm.officeRoom}
                    onChange={(e) => setEditForm({ ...editForm, officeRoom: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lifecycle Status</label>
                <select
                  value={editForm.lifecycleStatus}
                  onChange={(e) => setEditForm({ ...editForm, lifecycleStatus: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  <option value="ACTIVE">ACTIVE (Full Teaching Duties)</option>
                  <option value="ON_LEAVE">ON_LEAVE (Sabbatical / Medical)</option>
                  <option value="RELIEVED">RELIEVED (Separated / Handover Completed)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Governance Reason for Audit Log</label>
                <Input
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingFaculty(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RELIEVE FACULTY CONFIRMATION MODAL                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {relievingFaculty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 text-rose-400">
                <UserX className="h-4 w-4" />
                Relieve Faculty Member
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRelievingFaculty(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Are you sure you want to transition <strong>{relievingFaculty.name} ({relievingFaculty.facultyCode})</strong> to <span className="text-rose-400 font-bold">RELIEVED</span> status?
              </p>
              <p className="text-slate-400 text-[11px]">
                To preserve academic auditability, records are not destroyed; teaching history, invigilation duties, and syllabi remain preserved in the institutional ledger.
              </p>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mandatory Relieving Reason</label>
                <Input
                  required
                  placeholder="e.g. End of contract tenure / Transfer to other institution"
                  value={relieveReason}
                  onChange={(e) => setRelieveReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRelievingFaculty(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRelieveFaculty}
                  disabled={relieveLoading || !relieveReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl"
                >
                  {relieveLoading ? "Processing..." : "Confirm Relieving"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
