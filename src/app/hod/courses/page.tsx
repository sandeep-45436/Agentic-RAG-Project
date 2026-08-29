"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
  Layers,
  FileText,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Archive,
  X,
  Building,
  Clock,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODCoursesPage() {
  const { activeDepartment, session } = useHOD();
  const [courses, setCourses] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Course Modal
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    credits: "3",
    description: "",
  });
  const [courseLoading, setCourseLoading] = useState(false);

  // Add Section Modal
  const [selectedCourseForSection, setSelectedCourseForSection] = useState<any | null>(null);
  const [sectionForm, setSectionForm] = useState({
    sectionCode: "Sec 01",
    term: "Fall 2026",
    room: "Tech Hall 101",
    scheduleText: "Mon/Wed 10:00 AM - 11:30 AM",
    capacity: "35",
    facultyId: "",
  });
  const [sectionLoading, setSectionLoading] = useState(false);

  // Edit Section Modal
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [editSectionForm, setEditSectionForm] = useState({
    room: "",
    scheduleText: "",
    capacity: "",
    facultyId: "",
    reason: "Curriculum section schedule and instructor adjustment",
  });
  const [updatingSection, setUpdatingSection] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [courseRes, facRes] = await Promise.all([
        fetch(`/api/hod/courses?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/faculty?department=${activeDepartment}`).then((r) => r.json()),
      ]);

      if (courseRes.courses) setCourses(courseRes.courses);
      if (facRes.faculty) setFacultyList(facRes.faculty);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [activeDepartment]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseLoading(true);
    try {
      const res = await fetch("/api/hod/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_COURSE",
          ...courseForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCourses();
        setAddCourseModalOpen(false);
        setCourseForm({ code: "", title: "", credits: "3", description: "" });
      }
    } catch (err) {
      console.error("Create course error:", err);
    } finally {
      setCourseLoading(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForSection) return;
    setSectionLoading(true);

    try {
      const res = await fetch("/api/hod/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SECTION",
          courseId: selectedCourseForSection.id,
          ...sectionForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCourses();
        setSelectedCourseForSection(null);
      }
    } catch (err) {
      console.error("Create section error:", err);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setUpdatingSection(true);

    try {
      const res = await fetch("/api/hod/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: editingSection.id,
          ...editSectionForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCourses();
        setEditingSection(null);
      }
    } catch (err) {
      console.error("Update section error:", err);
    } finally {
      setUpdatingSection(false);
    }
  };

  const handleArchiveCourse = async (course: any) => {
    if (!confirm(`Are you sure you want to archive course ${course.code}? Course history will be preserved.`)) return;

    try {
      const res = await fetch(
        `/api/hod/courses?courseId=${course.id}&reason=${encodeURIComponent(
          "Curriculum committee syllabus archival"
        )}&department=${activeDepartment}&actorName=${encodeURIComponent(session?.name || "HOD")}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchCourses();
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  const handleCloseSection = async (section: any) => {
    if (!confirm(`Close section ${section.sectionCode}? Historical enrolments remain preserved.`)) return;

    try {
      const res = await fetch(
        `/api/hod/courses?sectionId=${section.id}&reason=${encodeURIComponent(
          "Section capacity consolidation"
        )}&department=${activeDepartment}&actorName=${encodeURIComponent(session?.name || "HOD")}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchCourses();
      }
    } catch (err) {
      console.error("Close section error:", err);
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-400" />
            Curriculum & Course Section Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Syllabus compliance, section allocations, instructor assignments, and RAG vector index for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCourses}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Courses
          </Button>

          <Button
            size="sm"
            onClick={() => setAddCourseModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search course code (e.g. CS401) or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs rounded-xl"
        />
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-3">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{c.code}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-300 border-blue-500/30 font-mono">
                      {c.credits} Credits
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-200 mt-1">{c.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    RAG Indexed
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveCourse(c)}
                    className="text-slate-500 hover:text-rose-400 h-7 w-7 p-0 rounded-lg"
                    title="Archive Course"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-400 text-xs line-clamp-2">{c.description}</p>

              {/* Sections List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-400 text-[11px] uppercase">Active Term Sections</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedCourseForSection(c);
                      setSectionForm({
                        sectionCode: `Sec 0${(c.sections?.length || 0) + 1}`,
                        term: "Fall 2026",
                        room: "Tech Hall 101",
                        scheduleText: "Mon/Wed 10:00 AM",
                        capacity: "35",
                        facultyId: facultyList[0]?.id || "",
                      });
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 h-6 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Section
                  </Button>
                </div>

                {c.sections?.length > 0 ? (
                  c.sections.map((sec: any) => (
                    <div
                      key={sec.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{sec.sectionCode}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({sec.room})</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{sec.scheduleText || "Mon/Wed 09:00 AM"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-semibold text-blue-300 block">{sec.facultyName}</span>
                          <p className="text-[10px] text-slate-500">{sec.enrolledCount} / {sec.capacity} Enrolled</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSection(sec);
                            setEditSectionForm({
                              room: sec.room || "",
                              scheduleText: sec.scheduleText || "",
                              capacity: String(sec.capacity || 30),
                              facultyId: sec.facultyId || "",
                              reason: "Section instructor and room reallocation",
                            });
                          }}
                          className="h-6 w-6 p-0 text-slate-500 hover:text-white"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCloseSection(sec)}
                          className="h-6 w-6 p-0 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs italic">No sections created for this term.</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Department: {c.departmentName}</span>
              <Link
                href={`/hod/documents?courseCode=${c.code}`}
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                Inspect Syllabus RAG <ChevronRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADD COURSE MODAL                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {addCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                Add New Curriculum Course
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddCourseModalOpen(false)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Course Code *</label>
                  <Input
                    required
                    placeholder="e.g. CS601"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Credits *</label>
                  <Input
                    required
                    type="number"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Course Title *</label>
                <Input
                  required
                  placeholder="e.g. Advanced Deep Learning & Generative Architectures"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Syllabus Overview & Description</label>
                <Input
                  placeholder="e.g. Transformers, attention mechanisms, diffusion models, and evaluation"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddCourseModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={courseLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {courseLoading ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADD SECTION MODAL                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedCourseForSection && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-400" />
                Add Section to {selectedCourseForSection.code}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCourseForSection(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Section Code *</label>
                  <Input
                    required
                    value={sectionForm.sectionCode}
                    onChange={(e) => setSectionForm({ ...sectionForm, sectionCode: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Capacity</label>
                  <Input
                    type="number"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assign Faculty Instructor</label>
                <select
                  value={sectionForm.facultyId}
                  onChange={(e) => setSectionForm({ ...sectionForm, facultyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  <option value="">Unassigned</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.facultyCode}) — {f.workload?.status || "Normal"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Room / Hall</label>
                  <Input
                    value={sectionForm.room}
                    onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Schedule Slot</label>
                  <Input
                    value={sectionForm.scheduleText}
                    onChange={(e) => setSectionForm({ ...sectionForm, scheduleText: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCourseForSection(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sectionLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {sectionLoading ? "Adding..." : "Add Section"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT SECTION MODAL                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-400" />
                Edit Section: {editingSection.sectionCode}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdateSection} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assign Faculty Instructor</label>
                <select
                  value={editSectionForm.facultyId}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, facultyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  <option value="">Unassigned</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.facultyCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Room / Hall</label>
                  <Input
                    value={editSectionForm.room}
                    onChange={(e) => setEditSectionForm({ ...editSectionForm, room: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Capacity</label>
                  <Input
                    type="number"
                    value={editSectionForm.capacity}
                    onChange={(e) => setEditSectionForm({ ...editSectionForm, capacity: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Schedule Text</label>
                <Input
                  value={editSectionForm.scheduleText}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, scheduleText: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reason for Audit Log</label>
                <Input
                  value={editSectionForm.reason}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, reason: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSection(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingSection}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {updatingSection ? "Saving..." : "Save Section"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
