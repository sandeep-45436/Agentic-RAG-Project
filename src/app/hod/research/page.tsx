"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Sparkles,
  DollarSign,
  FileText,
  Users,
  Award,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Building,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODResearchPage() {
  const { activeDepartment, session } = useHOD();
  const [projects, setProjects] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Project Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: "",
    leadFacultyId: "",
    grantAmount: "65000",
    abstract: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Edit Project Modal
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    grantAmount: "",
    status: "Active",
    abstract: "",
  });
  const [updating, setUpdating] = useState(false);

  const fetchResearchData = async () => {
    try {
      setLoading(true);
      const [resProjects, resFaculty] = await Promise.all([
        fetch(`/api/hod/research?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/faculty?department=${activeDepartment}`).then((r) => r.json()),
      ]);

      if (resProjects.projects) setProjects(resProjects.projects);
      if (resFaculty.faculty) setFacultyList(resFaculty.faculty);
    } catch (err) {
      console.error("Failed to load research projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchData();
  }, [activeDepartment]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const res = await fetch("/api/hod/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchResearchData();
        setAddModalOpen(false);
        setProjectForm({
          title: "",
          leadFacultyId: "",
          grantAmount: "65000",
          abstract: "",
        });
      }
    } catch (err) {
      console.error("Add project error:", err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/hod/research", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: editingProject.id,
          ...editForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchResearchData();
        setEditingProject(null);
      }
    } catch (err) {
      console.error("Update project error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleArchiveProject = async (proj: any) => {
    if (!confirm(`Archive research project ${proj.title}? Project deliverables and grants remain preserved in audit ledger.`)) return;

    try {
      const res = await fetch(
        `/api/hod/research?projectId=${proj.id}&department=${activeDepartment}&actorName=${encodeURIComponent(
          session?.name || "HOD"
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchResearchData();
      }
    } catch (err) {
      console.error("Archive project error:", err);
    }
  };

  const totalFunding = projects.reduce((sum, p) => sum + (p.grantRaw || 50000), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-blue-400" />
            Department Research & Sponsored Grants
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sponsored research projects, external funding, and academic publication tracking for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResearchData}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Research Grant
          </Button>
        </div>
      </div>

      {/* Top Grant KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Sponsored Funding</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                ${totalFunding.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">{projects.length} Active / Funded Grants</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Published Papers (2026)</p>
              <p className="text-2xl font-bold text-white mt-0.5">9 Papers</p>
              <p className="text-[10px] text-blue-400 font-medium">IEEE / ACM / Springer</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Faculty PIs Engaged</p>
              <p className="text-2xl font-bold text-purple-400 mt-0.5">
                {new Set(projects.map((p) => p.pi)).size} Investigators
              </p>
              <p className="text-[10px] text-purple-400 font-medium">100% Departmental Lead</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((proj) => (
          <Card key={proj.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-3">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-white">{proj.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        proj.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {proj.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Principal Investigator: <strong className="text-blue-300">{proj.pi}</strong> • Sponsoring Agency: {proj.agency}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-sm">{proj.grantAmount}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingProject(proj);
                      setEditForm({
                        title: proj.title,
                        grantAmount: String(proj.grantRaw || 50000),
                        status: proj.status === "ACTIVE" ? "Active" : "Completed",
                        abstract: proj.abstract || "",
                      });
                    }}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-white"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveProject(proj)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <p className="text-slate-300 text-xs">{proj.abstract}</p>

              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                <span>Timeline: {proj.progress}</span>
                <span>•</span>
                <span>Publications: {proj.papers} Verified Papers</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADD RESEARCH GRANT MODAL                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-blue-400" />
                Register Sponsored Research Project / Grant
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Project Title *</label>
                <Input
                  required
                  placeholder="e.g. Distributed Consensus in Edge AI Networks"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Principal Investigator (Faculty) *</label>
                  <select
                    required
                    value={projectForm.leadFacultyId}
                    onChange={(e) => setProjectForm({ ...projectForm, leadFacultyId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                  >
                    <option value="">Select Faculty PI...</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.facultyCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Grant Funding ($ USD)</label>
                  <Input
                    type="number"
                    value={projectForm.grantAmount}
                    onChange={(e) => setProjectForm({ ...projectForm, grantAmount: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Abstract & Scope</label>
                <Input
                  placeholder="e.g. Investigation into hybrid vector RAG and deterministic governance"
                  value={projectForm.abstract}
                  onChange={(e) => setProjectForm({ ...projectForm, abstract: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addLoading || !projectForm.leadFacultyId}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {addLoading ? "Registering..." : "Register Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT RESEARCH GRANT MODAL                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-400" />
                Edit Research Grant: {editingProject.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Grant Amount ($ USD)</label>
                <Input
                  type="number"
                  value={editForm.grantAmount}
                  onChange={(e) => setEditForm({ ...editForm, grantAmount: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending Review</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Abstract</label>
                <Input
                  value={editForm.abstract}
                  onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProject(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {updating ? "Saving..." : "Save Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
