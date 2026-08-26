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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function HODTimetablePage() {
  const { activeDepartment } = useHOD();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("ALL");

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/timetables?department=${activeDepartment}`);
      const data = await res.json();
      if (data.timetables) {
        setTimetables(data.timetables);
      }
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [activeDepartment]);

  const filtered = selectedDay === "ALL" ? timetables : timetables.filter((t) => t.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6 font-sans">
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
        </div>
      </div>

      {/* Day Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedDay("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDay === "ALL" ? "bg-blue-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
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
                selectedDay === d ? "bg-blue-600 text-white shadow" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((slot) => (
          <Card key={slot.id} className="bg-slate-900/80 border-slate-800 backdrop-blur space-y-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs font-bold">
                  {slot.courseCode}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                  {slot.dayOfWeek}
                </Badge>
              </div>
              <CardTitle className="text-sm font-semibold text-white mt-1.5">{slot.courseTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  Time:
                </span>
                <span className="font-mono font-semibold text-white">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Building className="h-3.5 w-3.5 text-purple-400" />
                  Lecture Hall / Room:
                </span>
                <span className="font-semibold text-white">{slot.room}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Assigned Instructor:
                </span>
                <span className="font-semibold text-blue-300">
                  {slot.faculty?.user?.name || slot.faculty?.facultyCode || "Prof. Assigned"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
