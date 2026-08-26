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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODCoursesPage() {
  const { activeDepartment } = useHOD();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/courses?department=${activeDepartment}`);
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [activeDepartment]);

  const filtered = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-400" />
            Curriculum & Course Section Allocations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Course syllabus compliance, credit allocations, and instructor section management for {activeDepartment}
          </p>
        </div>

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
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  RAG Indexed
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-slate-400 text-[11px] uppercase">Active Term Sections</p>
                {c.sections?.length > 0 ? (
                  c.sections.map((sec: any) => (
                    <div
                      key={sec.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{sec.sectionCode}</span>
                        <p className="text-[11px] text-slate-400">{sec.scheduleText || "Mon/Wed 09:00 AM"}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-blue-300">{sec.facultyName}</span>
                        <p className="text-[10px] text-slate-500">{sec.enrolledCount} / {sec.capacity} Enrolled</p>
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
    </div>
  );
}
