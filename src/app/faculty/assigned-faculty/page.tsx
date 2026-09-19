"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  KeyRound,
  ShieldCheck,
  Building,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Edit2,
  Lock,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/animated-background";

export default function AssignedFacultyPage() {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);

  // Edit Form state
  const [facultyCode, setFacultyCode] = useState("");
  const [assignedPassword, setAssignedPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faculty/auth/assign-password");
      const data = await res.json();
      if (data.faculty) {
        setFacultyList(data.faculty);
      }
    } catch (err) {
      console.error("Failed to load faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditClick = (fac: any) => {
    setEditingFaculty(fac);
    setFacultyCode(fac.facultyCode || `FAC-${fac.id.slice(0, 6).toUpperCase()}`);
    setAssignedPassword(fac.assignedPassword || "Faculty@2026!");
    setDesignation(fac.designation || fac.title);
    setSpecialization(fac.specialization || "");
    setStatusMessage(null);
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let gen = "Faculty@";
    for (let i = 0; i < 6; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    gen += "2026!";
    setAssignedPassword(gen);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setUpdating(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/faculty/auth/assign-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: editingFaculty.id,
          facultyCode,
          assignedPassword,
          designation,
          specialization,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update credentials");
      }

      setStatusMessage({ type: "success", text: "Faculty credentials updated successfully!" });
      fetchFaculty();
      setTimeout(() => {
        setEditingFaculty(null);
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Update failed." });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5 text-reveal">
              <Users className="h-6 w-6 text-indigo-500" />
              Assigned Faculty Directory & Unique Passwords
            </h1>
            <p className="text-sm text-slate-500">
              Manage assigned faculty credentials, unique login passwords, department roles, and portal authorizations.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFaculty}
            className="border-slate-200 bg-white text-slate-500 hover:bg-slate-50 rounded-xl text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-rose-50 text-rose-600 border-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ── FACULTY ROSTER TABLE ─────────────────────────────────── */}
        <Card className="bg-white/80 border-slate-200 backdrop-blur-sm light-glass-card card-3d-inner anim-fade-up-1">
          <CardHeader className="pb-4 light-glass-card anim-fade-up-1">
            <CardTitle className="text-lg text-slate-800 font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Authorized Faculty Members ({facultyList.length})
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Each assigned faculty member holds a unique password required to authenticate to the Faculty Portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
                Loading faculty accounts...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-semibold">Faculty Member</th>
                      <th className="pb-3 font-semibold">Faculty ID</th>
                      <th className="pb-3 font-semibold">Department</th>
                      <th className="pb-3 font-semibold">Assigned Password</th>
                      <th className="pb-3 font-semibold">Designation</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {facultyList.map((fac) => (
                      <tr key={fac.id} className="hover:bg-indigo-50 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500 font-bold icon-ring">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {fac.title} {fac.user?.name || "Professor"}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {fac.user?.email || "faculty@smartuniversity.edu"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <Badge
                            variant="outline"
                            className="bg-indigo-50 text-indigo-600 border-indigo-200 font-mono text-[11px]"
                          >
                            {fac.facultyCode || "FAC-UNASSIGNED"}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-slate-700">
                          {fac.department?.name || "General"} ({fac.department?.code})
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                              {showPasswords[fac.id]
                                ? fac.assignedPassword || "••••••••"
                                : "••••••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(fac.id)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              {showPasswords[fac.id] ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {fac.designation || fac.title}
                        </td>
                        <td className="py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(fac)}
                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs h-7 px-2.5"
                          >
                            <Edit2 className="mr-1 h-3 w-3" />
                            Update Credentials
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── EDIT CREDENTIALS MODAL ───────────────────────────────── */}
        {editingFaculty && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white border-slate-200 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-800 font-semibold flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-500" />
                  Assign Credentials: {editingFaculty.user?.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Update unique password and Faculty ID for {editingFaculty.department?.name}.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveCredentials}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-700">Faculty ID / Code</Label>
                    <Input
                      value={facultyCode}
                      onChange={(e) => setFacultyCode(e.target.value)}
                      placeholder="e.g. FAC-CS-001"
                      required
                      className="bg-white border-slate-200 text-xs text-slate-800 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-700">Unique Faculty Password</Label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Auto-Generate Secure Password
                      </button>
                    </div>
                    <Input
                      value={assignedPassword}
                      onChange={(e) => setAssignedPassword(e.target.value)}
                      placeholder="e.g. Faculty@CS2026!"
                      required
                      className="bg-white border-slate-200 text-xs text-slate-800 rounded-xl font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-700">Designation</Label>
                      <Input
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Head of Department"
                        className="bg-white border-slate-200 text-xs text-slate-800 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-700">Specialization</Label>
                      <Input
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Artificial Intelligence"
                        className="bg-white border-slate-200 text-xs text-slate-800 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold py-2.5"
                    >
                      {updating ? "Saving..." : "Save Assigned Credentials"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingFaculty(null)}
                      className="border-slate-200 text-slate-700 rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
