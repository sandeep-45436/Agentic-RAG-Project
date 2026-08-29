"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building,
  UserCheck,
  Download,
  Plus,
  Edit,
  Trash2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function HODTimetablePage() {
  const { activeDepartment, session } = useHOD();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("ALL");

  // Add Slot Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({
    courseCode: "CS401",
    courseTitle: "Algorithms & Data Structures",
    dayOfWeek: "Monday",
    startTime: "09:00 AM",
    endTime: "10:30 AM",
    room: "Tech Hall 101",
    facultyId: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Edit Slot Modal
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    room: "",
    facultyId: "",
  });
  const [updatingSlot, setUpdatingSlot] = useState(false);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const [ttRes, facRes] = await Promise.all([
        fetch(`/api/hod/timetables?department=${activeDepartment}`).then((r) => r.json()),
        fetch(`/api/hod/faculty?department=${activeDepartment}`).then((r) => r.json()),
      ]);

      if (ttRes.timetables) setTimetables(ttRes.timetables);
      if (facRes.faculty) setFacultyList(facRes.faculty);
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [activeDepartment]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setWarningMsg(null);

    try {
      const res = await fetch("/api/hod/timetables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...slotForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTimetables();
        if (data.warning) {
          setWarningMsg(data.warning);
        } else {
          setAddModalOpen(false);
        }
      }
    } catch (err) {
      console.error("Add slot error:", err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    setUpdatingSlot(true);

    try {
      const res = await fetch("/api/hod/timetables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: editingSlot.id,
          ...editForm,
          departmentCode: activeDepartment,
          actorName: session?.name || "HOD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTimetables();
        setEditingSlot(null);
      }
    } catch (err) {
      console.error("Update slot error:", err);
    } finally {
      setUpdatingSlot(false);
    }
  };

  const handleDeleteSlot = async (slot: any) => {
    if (!confirm(`Remove ${slot.courseCode} slot on ${slot.dayOfWeek} ${slot.startTime}?`)) return;

    try {
      const res = await fetch(
        `/api/hod/timetables?slotId=${slot.id}&department=${activeDepartment}&actorName=${encodeURIComponent(
          session?.name || "HOD"
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        fetchTimetables();
      }
    } catch (err) {
      console.error("Delete slot error:", err);
    }
  };

  const filtered = selectedDay === "ALL" ? timetables : timetables.filter((t) => t.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            Master Departmental Timetable Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Room collision detection, weekly lecture orchestration, and cross-faculty schedules for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTimetables}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Schedule
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setWarningMsg(null);
              setAddModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Lecture Slot
          </Button>
        </div>
      </div>

      {/* Day Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedDay("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDay === "ALL" ? "bg-blue-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400"
          }`}
        >
          All Days ({timetables.length})
        </button>
        {DAYS.map((d) => {
          const count = timetables.filter((t) => t.dayOfWeek === d).length;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedDay === d ? "bg-blue-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400"
              }`}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <Card key={t.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-2.5">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{t.courseCode}</span>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
                      {t.dayOfWeek}
                    </Badge>
                  </div>
                  <CardTitle className="text-xs font-semibold text-slate-300 mt-0.5">{t.courseTitle}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSlot(t);
                      setEditForm({
                        dayOfWeek: t.dayOfWeek,
                        startTime: t.startTime,
                        endTime: t.endTime,
                        room: t.room,
                        facultyId: t.facultyId || "",
                      });
                    }}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-white"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlot(t)}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="text-emerald-400 font-bold">{t.startTime} - {t.endTime}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Assigned Room:</span>
                  <span className="text-white">{t.room}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Instructor:</span>
                  <span className="text-blue-300">{t.faculty?.user?.name || "Unassigned"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADD SLOT MODAL                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-400" />
                Add Master Timetable Lecture Slot
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

            {warningMsg && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Room Collision Warning:</strong>
                  <span>{warningMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Course Code *</label>
                  <Input
                    required
                    placeholder="e.g. CS401"
                    value={slotForm.courseCode}
                    onChange={(e) => setSlotForm({ ...slotForm, courseCode: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Course Title</label>
                  <Input
                    placeholder="e.g. Algorithms & Distributed Systems"
                    value={slotForm.courseTitle}
                    onChange={(e) => setSlotForm({ ...slotForm, courseTitle: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Day of Week</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Start Time</label>
                  <Input
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">End Time</label>
                  <Input
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lecture Hall / Room</label>
                  <Input
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Instructor</label>
                  <select
                    value={slotForm.facultyId}
                    onChange={(e) => setSlotForm({ ...slotForm, facultyId: e.target.value })}
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
                  disabled={addLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {addLoading ? "Adding..." : "Add Lecture Slot"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT SLOT MODAL                                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-400" />
                Edit Timetable Slot: {editingSlot.courseCode}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-white h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdateSlot} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Day of Week</label>
                <select
                  value={editForm.dayOfWeek}
                  onChange={(e) => setEditForm({ ...editForm, dayOfWeek: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Start Time</label>
                  <Input
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">End Time</label>
                  <Input
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Room / Hall</label>
                <Input
                  value={editForm.room}
                  onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Instructor</label>
                <select
                  value={editForm.facultyId}
                  onChange={(e) => setEditForm({ ...editForm, facultyId: e.target.value })}
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSlot(null)}
                  className="border-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingSlot}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
                >
                  {updatingSlot ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
