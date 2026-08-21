"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Building,
  UserCheck,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyTimetablesPage() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Add Form State
  const [courseCode, setCourseCode] = useState("CS401");
  const [courseTitle, setCourseTitle] = useState("Algorithms & Data Structures");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("10:30 AM");
  const [room, setRoom] = useState("Tech Hall 101");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Bulk CSV state
  const [bulkData, setBulkData] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faculty/timetables");
      const data = await res.json();
      if (data.timetables) {
        setTimetables(data.timetables);
      }
    } catch (err) {
      console.error("Failed to fetch timetables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/faculty/timetables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode,
          courseTitle,
          dayOfWeek,
          startTime,
          endTime,
          room,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create timetable slot");
      }

      setFormSuccess("Timetable slot created successfully!");
      fetchTimetables();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Failed to add slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to remove this timetable slot?")) return;
    try {
      await fetch(`/api/faculty/timetables?id=${id}`, { method: "DELETE" });
      fetchTimetables();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleBulkImport = async () => {
    setBulkError(null);
    setBulkSuccess(null);
    try {
      // Parse CSV / lines format: CourseCode, CourseTitle, Day, StartTime, EndTime, Room
      const lines = bulkData.trim().split("\n");
      const entries: any[] = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 6) {
          entries.push({
            courseCode: parts[0],
            courseTitle: parts[1],
            dayOfWeek: parts[2],
            startTime: parts[3],
            endTime: parts[4],
            room: parts[5],
          });
        }
      }

      if (entries.length === 0) {
        throw new Error("No valid timetable rows found. Please check the comma-separated format.");
      }

      const res = await fetch("/api/faculty/timetables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, entries }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Bulk import failed");
      }

      setBulkSuccess(`Successfully imported ${entries.length} slots!`);
      fetchTimetables();
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkSuccess(null);
        setBulkData("");
      }, 1200);
    } catch (err: any) {
      setBulkError(err.message || "Bulk import failed.");
    }
  };

  const handleExportCSV = () => {
    const headers = "Course Code,Course Title,Day,Start Time,End Time,Room\n";
    const rows = timetables
      .map((t) => `"${t.courseCode}","${t.courseTitle}","${t.dayOfWeek}","${t.startTime}","${t.endTime}","${t.room}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SmartUniversity_Faculty_Timetable.csv";
    a.click();
  };

  const filteredTimetables =
    selectedDay === "ALL"
      ? timetables
      : timetables.filter((t) => t.dayOfWeek.toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-purple-400" />
            Academic Timetable Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage weekly lecture sessions, laboratory hours, and room bookings across academic departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Class Slot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkModal(true)}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
            Bulk CSV Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── DAY FILTER CHIPS ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button
          size="sm"
          variant={selectedDay === "ALL" ? "default" : "outline"}
          onClick={() => setSelectedDay("ALL")}
          className={`rounded-xl text-xs ${
            selectedDay === "ALL"
              ? "bg-purple-600 hover:bg-purple-500 text-white"
              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white"
          }`}
        >
          All Days ({timetables.length})
        </Button>
        {DAYS.map((d) => {
          const count = timetables.filter((t) => t.dayOfWeek.toLowerCase() === d.toLowerCase()).length;
          return (
            <Button
              key={d}
              size="sm"
              variant={selectedDay === d ? "default" : "outline"}
              onClick={() => setSelectedDay(d)}
              className={`rounded-xl text-xs ${
                selectedDay === d
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white"
              }`}
            >
              {d} ({count})
            </Button>
          );
        })}
      </div>

      {/* ── TIMETABLE GRID MATRIX ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs animate-pulse">
            Loading academic timetables...
          </div>
        ) : filteredTimetables.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-2">
            <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No timetable entries scheduled</p>
            <p className="text-xs text-slate-500">Click &quot;Add Class Slot&quot; to assign a lecture or lab session.</p>
          </div>
        ) : (
          filteredTimetables.map((slot) => (
            <Card
              key={slot.id}
              className="bg-slate-900/80 border-slate-800 hover:border-purple-500/40 transition-all backdrop-blur-xl group"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-mono text-xs">
                    {slot.courseCode}
                  </Badge>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {slot.dayOfWeek}
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold text-white mt-1.5 truncate">
                  {slot.courseTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <span className="flex items-center gap-1 text-indigo-300 font-medium">
                    <Building className="h-3.5 w-3.5" />
                    {slot.room}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
                    Faculty: {slot.faculty?.user?.name || "Assigned Department"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── MODAL: ADD CLASS SLOT ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg text-white font-semibold">Add Class / Lab Timetable Slot</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Assign time, room, and subject with automated conflict detection.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleAddSlot}>
              <CardContent className="space-y-3.5">
                {formError && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Course Code</Label>
                    <Input
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g. CS401"
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Day of Week</Label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Course Title</Label>
                  <Input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Algorithms & Data Structures"
                    required
                    className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Start Time</Label>
                    <Input
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="09:00 AM"
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">End Time</Label>
                    <Input
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="10:30 AM"
                      required
                      className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Assigned Room / Hall</Label>
                  <Input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Tech Hall 101 or Lab 3"
                    required
                    className="bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold py-2.5 mt-2"
                >
                  {submitting ? "Checking Conflicts & Saving..." : "Confirm & Save Timetable Slot"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* ── MODAL: BULK CSV IMPORT ────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg text-white font-semibold">Bulk Timetable Import</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Paste comma-separated rows: Code, Title, Day, StartTime, EndTime, Room
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {bulkError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}
              {bulkSuccess && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{bulkSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Sample Template & CSV Data</Label>
                <textarea
                  rows={7}
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder={`CS401, Algorithms & Data Structures, Monday, 09:00 AM, 10:30 AM, Tech Hall 101\nCS501, Machine Learning, Monday, 11:00 AM, 12:30 PM, Tech Hall 102\nMATH301, Linear Algebra, Tuesday, 09:30 AM, 11:00 AM, Science Block 201`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <Button
                onClick={handleBulkImport}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold py-2.5"
              >
                Import All Timetable Slots
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
