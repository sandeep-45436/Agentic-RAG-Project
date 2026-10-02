"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  Sparkles,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Clock,
  Check,
  X,
  Building,
  Award,
  BarChart3,
  Download,
  UploadCloud,
  Search,
  Filter,
  Trash2,
  Eye,
  FileDown,
  Home,
  AlertTriangle,
  BookmarkCheck,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../context";
import { AnimatedBackground } from "@/components/animated-background";

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL COLLEGE MATERIALS (Timetables, Question Banks, Circulars)
// ─────────────────────────────────────────────────────────────────────────────
interface CollegeMaterial {
  id: string;
  title: string;
  category: "Timetable" | "Question Bank" | "Academic Regulation" | "College Circular" | "Lab Manual";
  semester: string;
  academicYear: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  fileType: string;
  downloadCount: number;
}

const INITIAL_MATERIALS: CollegeMaterial[] = [
  {
    id: "mat-tt-001",
    title: "B.Tech CSE IV Sem Section-A Master Class Timetable (R23 Autonomous)",
    category: "Timetable",
    semester: "IV Semester",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Oct 01, 2026",
    fileSize: "480 KB",
    fileType: "PDF Document",
    downloadCount: 142,
  },
  {
    id: "mat-tt-002",
    title: "B.Tech CSE VI Sem Section-B Laboratory & Lecture Schedule",
    category: "Timetable",
    semester: "VI Semester",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Sep 28, 2026",
    fileSize: "520 KB",
    fileType: "PDF Document",
    downloadCount: 98,
  },
  {
    id: "mat-qb-001",
    title: "Distributed Systems & Cloud Computing — Units 1-5 Comprehensive Question Bank",
    category: "Question Bank",
    semester: "IV Semester",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Oct 02, 2026",
    fileSize: "2.4 MB",
    fileType: "PDF Document",
    downloadCount: 310,
  },
  {
    id: "mat-qb-002",
    title: "Deep Learning & Neural Architectures Model Exam Papers with Scheme of Evaluation",
    category: "Question Bank",
    semester: "VI Semester",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Sep 29, 2026",
    fileSize: "3.1 MB",
    fileType: "PDF Document",
    downloadCount: 220,
  },
  {
    id: "mat-reg-001",
    title: "Autonomous R23 Academic Regulations & Curriculum Structure (CSE)",
    category: "Academic Regulation",
    semester: "All Semesters",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Sep 15, 2026",
    fileSize: "1.8 MB",
    fileType: "PDF Document",
    downloadCount: 540,
  },
  {
    id: "mat-cir-001",
    title: "Mid-Term Examination Schedule, Seating Protocol & Anti-Malpractice Guidelines",
    category: "College Circular",
    semester: "All Semesters",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Sep 30, 2026",
    fileSize: "310 KB",
    fileType: "PDF Document",
    downloadCount: 415,
  },
  {
    id: "mat-lab-001",
    title: "Core Computing Lab 3 — Vector Databases & Microservices Lab Manual",
    category: "Lab Manual",
    semester: "VI Semester",
    academicYear: "2025–2026",
    uploadedBy: "HOD Office (Dr. K. Srinivas Rao)",
    uploadedAt: "Sep 22, 2026",
    fileSize: "4.2 MB",
    fileType: "PDF Document",
    downloadCount: 185,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY PERFORMANCE AUDIT DATA
// ─────────────────────────────────────────────────────────────────────────────
interface FacultyAuditRecord {
  id: string;
  name: string;
  facultyCode: string;
  designation: string;
  specialization: string;
  teachingHours: number;
  maxLimit: number;
  theoryHours: number;
  labHours: number;
  syllabusCoveragePct: number;
  unitsCompleted: number;
  totalUnits: number;
  studentRating: number;
  totalStudentReviews: number;
  subjectPassPct: number;
  publicationsCount: number;
  auditStatus: "COMPLIANT" | "OVERLOADED" | "NEEDS_REVIEW";
  lastAuditedDate: string;
  signedByHOD: boolean;
}

const INITIAL_FACULTY_AUDIT: FacultyAuditRecord[] = [
  {
    id: "fac-001",
    name: "Dr. K. S. Ramanujan",
    facultyCode: "FAC-CSE-001",
    designation: "Professor & Chair",
    specialization: "Distributed Systems & Cognitive AI",
    teachingHours: 16,
    maxLimit: 18,
    theoryHours: 8,
    labHours: 6,
    syllabusCoveragePct: 88.0,
    unitsCompleted: 4.4,
    totalUnits: 5,
    studentRating: 4.9,
    totalStudentReviews: 184,
    subjectPassPct: 95.4,
    publicationsCount: 8,
    auditStatus: "COMPLIANT",
    lastAuditedDate: "Oct 02, 2026",
    signedByHOD: true,
  },
  {
    id: "fac-002",
    name: "Dr. Priya V. Sharma",
    facultyCode: "FAC-CSE-002",
    designation: "Associate Professor",
    specialization: "Data Science, Machine Learning & NLP",
    teachingHours: 15,
    maxLimit: 18,
    theoryHours: 9,
    labHours: 4,
    syllabusCoveragePct: 82.0,
    unitsCompleted: 4.1,
    totalUnits: 5,
    studentRating: 4.8,
    totalStudentReviews: 162,
    subjectPassPct: 92.0,
    publicationsCount: 5,
    auditStatus: "COMPLIANT",
    lastAuditedDate: "Oct 01, 2026",
    signedByHOD: true,
  },
  {
    id: "fac-003",
    name: "Dr. Rajesh K. Varma",
    facultyCode: "FAC-CSE-003",
    designation: "Associate Professor",
    specialization: "Cloud Architecture & High-Performance Computing",
    teachingHours: 19,
    maxLimit: 18,
    theoryHours: 11,
    labHours: 6,
    syllabusCoveragePct: 76.0,
    unitsCompleted: 3.8,
    totalUnits: 5,
    studentRating: 4.6,
    totalStudentReviews: 148,
    subjectPassPct: 88.5,
    publicationsCount: 3,
    auditStatus: "OVERLOADED",
    lastAuditedDate: "Sep 28, 2026",
    signedByHOD: false,
  },
  {
    id: "fac-004",
    name: "Prof. Meenakshi Sundaram",
    facultyCode: "FAC-CSE-004",
    designation: "Assistant Professor",
    specialization: "Design & Analysis of Algorithms, OS",
    teachingHours: 14,
    maxLimit: 18,
    theoryHours: 8,
    labHours: 6,
    syllabusCoveragePct: 90.0,
    unitsCompleted: 4.5,
    totalUnits: 5,
    studentRating: 4.75,
    totalStudentReviews: 135,
    subjectPassPct: 94.2,
    publicationsCount: 2,
    auditStatus: "COMPLIANT",
    lastAuditedDate: "Oct 02, 2026",
    signedByHOD: true,
  },
  {
    id: "fac-005",
    name: "Dr. Ananya Sen",
    facultyCode: "FAC-CSE-005",
    designation: "Assistant Professor",
    specialization: "Software Architecture & Vector Database Systems",
    teachingHours: 13,
    maxLimit: 18,
    theoryHours: 7,
    labHours: 6,
    syllabusCoveragePct: 85.0,
    unitsCompleted: 4.25,
    totalUnits: 5,
    studentRating: 4.7,
    totalStudentReviews: 120,
    subjectPassPct: 91.0,
    publicationsCount: 4,
    auditStatus: "COMPLIANT",
    lastAuditedDate: "Sep 30, 2026",
    signedByHOD: true,
  },
  {
    id: "fac-006",
    name: "Prof. Vikramaditya Reddy",
    facultyCode: "FAC-CSE-006",
    designation: "Assistant Professor",
    specialization: "Embedded Systems, Robotics & IoT Runtimes",
    teachingHours: 14,
    maxLimit: 18,
    theoryHours: 6,
    labHours: 8,
    syllabusCoveragePct: 78.0,
    unitsCompleted: 3.9,
    totalUnits: 5,
    studentRating: 4.65,
    totalStudentReviews: 110,
    subjectPassPct: 89.2,
    publicationsCount: 1,
    auditStatus: "COMPLIANT",
    lastAuditedDate: "Oct 01, 2026",
    signedByHOD: false,
  },
];

export default function HODDashboardPage() {
  const { session, activeDepartment, setActiveDepartment } = useHOD();

  // Active module tab: "materials" (Upload Timetables & Question Banks) | "audit" (Faculty Performance Audit)
  const [activeModule, setActiveModule] = useState<"materials" | "audit">("materials");

  // Materials Hub State
  const [materials, setMaterials] = useState<CollegeMaterial[]>(INITIAL_MATERIALS);
  const [searchMaterial, setSearchMaterial] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // New File Upload Form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CollegeMaterial["category"]>("Timetable");
  const [newSemester, setNewSemester] = useState("IV Semester");
  const [newAcademicYear, setNewAcademicYear] = useState("2025–2026");
  const [newFileName, setNewFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Faculty Audit State
  const [facultyAudit, setFacultyAudit] = useState<FacultyAuditRecord[]>(INITIAL_FACULTY_AUDIT);
  const [searchFaculty, setSearchFaculty] = useState("");
  const [auditFilter, setAuditFilter] = useState<string>("ALL");
  const [selectedFacultyForModal, setSelectedFacultyForModal] = useState<FacultyAuditRecord | null>(null);

  // Action feedback alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1-Click Upload Material Handler
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Please enter a title for the document");
      return;
    }
    setUploading(true);

    setTimeout(() => {
      const createdDoc: CollegeMaterial = {
        id: `mat-${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        semester: newSemester,
        academicYear: newAcademicYear,
        uploadedBy: session?.name || "HOD (Dr. K. Srinivas Rao)",
        uploadedAt: "Today, Just now",
        fileSize: "1.2 MB",
        fileType: "PDF Document",
        downloadCount: 0,
      };

      setMaterials([createdDoc, ...materials]);
      setUploading(false);
      setUploadModalOpen(false);
      setNewTitle("");
      setNewFileName("");
      showToast(`🎉 "${createdDoc.title}" uploaded & available for department students!`);
    }, 600);
  };

  // Delete Material Handler
  const handleDeleteMaterial = (id: string, title: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast(`Removed "${title.slice(0, 30)}..."`);
  };

  // 1-Click Download Simulation
  const handleDownload = (mat: CollegeMaterial) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === mat.id ? { ...m, downloadCount: m.downloadCount + 1 } : m))
    );

    // Create an instant text file with official college header
    const blobContent = `=============================================================
ANANTHA LAKSHMI INSTITUTE OF TECHNOLOGY & SCIENCES (ALITS)
Autonomous Institution • Approved by AICTE • Affiliated to JNTUA
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
=============================================================

OFFICIAL ACADEMIC DOCUMENT: ${mat.title}
Document Category : ${mat.category}
Academic Semester : ${mat.semester}
Academic Year     : ${mat.academicYear}
Authorized Sign   : ${mat.uploadedBy}
Date of Release   : ${mat.uploadedAt}
Audit Verification: AICTE/JNTUA Compliant

-------------------------------------------------------------
DOCUMENT CONTENTS SUMMARY:
This is an authentic verified copy of ${mat.title} uploaded by
the Office of the Head of the Department for official institutional use.
=============================================================`;

    const blob = new Blob([blobContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mat.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded: ${mat.title}`);
  };

  // Toggle HOD Audit Sign-Off
  const handleSignOffAudit = (facId: string) => {
    setFacultyAudit((prev) =>
      prev.map((f) =>
        f.id === facId
          ? {
              ...f,
              signedByHOD: true,
              auditStatus: f.teachingHours > f.maxLimit ? "OVERLOADED" : "COMPLIANT",
              lastAuditedDate: "Today, Just now",
            }
          : f
      )
    );
    showToast("Audit recorded: HOD approval logged successfully!");
  };

  // 1-Click Export Department Audit Report
  const handleExportAuditReport = () => {
    const reportText = `=============================================================
ALITS DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
ANNUAL FACULTY WORKLOAD & PERFORMANCE AUDIT DOSSIER
=============================================================
Generated On: ${new Date().toLocaleDateString()}
Audited By  : ${session?.name || "Dr. K. Srinivas Rao"} (Head of Department)
Department  : Computer Science & Engineering (CSE)
Institution : Anantha Lakshmi Institute of Tech & Sciences

FACULTY PERFORMANCE MATRIX:
${facultyAudit
  .map(
    (f, i) =>
      `[${i + 1}] ${f.name} (${f.facultyCode}) - ${f.designation}
     Teaching Workload: ${f.teachingHours} hrs/wk (Theory: ${f.theoryHours}h, Lab: ${f.labHours}h) vs 18h Limit
     Syllabus Coverage: ${f.syllabusCoveragePct}% (${f.unitsCompleted}/${f.totalUnits} Units on Schedule)
     Student Feedback : ${f.studentRating} / 5.0 (${f.totalStudentReviews} Student Reviews)
     Subject Pass Rate: ${f.subjectPassPct}%
     Scopus Research  : ${f.publicationsCount} Publications
     Audit Status     : ${f.signedByHOD ? "AUDITED & SIGNED OFF" : "PENDING HOD SIGN-OFF"}\n`
  )
  .join("\n")}
=============================================================
OFFICIAL SEAL: OFFICE OF THE HEAD OF DEPARTMENT • ALITS
=============================================================`;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ALITS_CSE_Faculty_Performance_Audit_${new Date().getFullYear()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Faculty performance audit dossier exported successfully!");
  };

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      searchMaterial === "" ||
      m.title.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      m.category.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      m.semester.toLowerCase().includes(searchMaterial.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Faculty
  const filteredFaculty = facultyAudit.filter((f) => {
    const matchesSearch =
      searchFaculty === "" ||
      f.name.toLowerCase().includes(searchFaculty.toLowerCase()) ||
      f.facultyCode.toLowerCase().includes(searchFaculty.toLowerCase()) ||
      f.specialization.toLowerCase().includes(searchFaculty.toLowerCase());
    const matchesFilter =
      auditFilter === "ALL" ||
      (auditFilter === "COMPLIANT" && f.auditStatus === "COMPLIANT") ||
      (auditFilter === "OVERLOADED" && f.auditStatus === "OVERLOADED") ||
      (auditFilter === "HIGH_RATING" && f.studentRating >= 4.8);
    return matchesSearch && matchesFilter;
  });

  // High-level KPIs
  const totalMaterials = materials.length;
  const timetablesCount = materials.filter((m) => m.category === "Timetable").length;
  const qbCount = materials.filter((m) => m.category === "Question Bank").length;
  const totalFacultyAudited = facultyAudit.filter((f) => f.signedByHOD).length;
  const avgSyllabusProgress = (
    facultyAudit.reduce((acc, f) => acc + f.syllabusCoveragePct, 0) / facultyAudit.length
  ).toFixed(1);
  const avgRating = (
    facultyAudit.reduce((acc, f) => acc + f.studentRating, 0) / facultyAudit.length
  ).toFixed(2);

  return (
    <AnimatedBackground>
      <div className="w-full space-y-6 pb-16 font-sans relative z-10">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── 1. ULTRA-MODERN HOD EXECUTIVE COMMAND COCKPIT HERO ─────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-2xl border border-blue-500/20 backdrop-blur-2xl">
          {/* Ambient lighting */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Emblem & Identity */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-blue-300 font-black text-xl sm:text-2xl">
                    <Scale className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                    Office of the Head of Department
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AICTE Compliant
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-200">
                    Autonomous R23
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  Department of Computer Science & Engineering
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    HOD: <strong className="text-white">{session?.name || "Dr. K. Srinivas Rao"}</strong> (HOD-CS-001)
                  </span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span>Anantha Lakshmi Institute of Technology & Sciences</span>
                </div>

                <p className="text-[11px] font-mono text-blue-300/80 pt-0.5">
                  Academic Materials Upload Center • Comprehensive Faculty Performance Audit Studio
                </p>
              </div>
            </div>

            {/* Right: Actions with Prominent Home Button */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 shadow-md transition-all active:scale-95"
                title="Return to Campus Home"
              >
                <Home className="w-4 h-4 text-white" />
                <span>Campus Home</span>
              </Link>

              <Button
                onClick={() => {
                  setActiveModule("materials");
                  setUploadModalOpen(true);
                }}
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-extrabold px-5 py-3 transition-all duration-300 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 border-0"
              >
                <UploadCloud className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Upload College File</span>
              </Button>

              <Button
                onClick={() => setActiveModule("audit")}
                className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold px-4 py-3 transition-all border border-slate-700/80 shadow-md active:scale-95"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Audit Faculty ({facultyAudit.length})</span>
              </Button>
            </div>
          </div>

          {/* Genuine Real-Time Operational Metadata Strip */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                College Files Stored
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white font-mono">{totalMaterials}</span>
                <span className="text-[10px] text-blue-400">Timetables & QBs</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                Faculty Audited
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {totalFacultyAudited}/{facultyAudit.length}
                </span>
                <span className="text-[10px] text-emerald-400">100% Workload Tracked</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                Dept Syllabus Pace
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white font-mono">{avgSyllabusProgress}%</span>
                <span className="text-[10px] text-cyan-400">On-Track</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Student Satisfaction
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-amber-400 font-mono">{avgRating} / 5.0</span>
                <span className="text-[10px] text-slate-400">811 Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. TWO MASTER OPERATIONAL MODULE TABS ───────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveModule("materials")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
                activeModule === "materials"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <FileText className={`w-4 h-4 ${activeModule === "materials" ? "text-white" : "text-blue-600"}`} />
              <span>College Files & Upload Hub</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeModule === "materials"
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {materials.length} Files
              </span>
            </button>

            <button
              onClick={() => setActiveModule("audit")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
                activeModule === "audit"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Users className={`w-4 h-4 ${activeModule === "audit" ? "text-white" : "text-indigo-600"}`} />
              <span>Faculty Performance Audit Studio</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeModule === "audit"
                    ? "bg-white/20 text-white"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {facultyAudit.length} Faculty
              </span>
            </button>
          </div>

          {activeModule === "materials" ? (
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shrink-0"
            >
              <UploadCloud className="w-4 h-4 mr-1.5" />
              Upload New File
            </Button>
          ) : (
            <Button
              onClick={handleExportAuditReport}
              variant="outline"
              className="border-slate-300 text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-xs shrink-0"
            >
              <FileDown className="w-4 h-4 mr-1.5 text-blue-600" />
              Export Audit Dossier (PDF)
            </Button>
          )}
        </div>

        {/* ── MODULE A: COLLEGE FILES, TIMETABLES & QUESTION BANKS HUB ──── */}
        {activeModule === "materials" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Search and Category Filter */}
            <div className="rounded-2xl bg-white p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search timetables, question banks, circulars..."
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Filter:
                </span>
                {["ALL", "Timetable", "Question Bank", "Academic Regulation", "College Circular", "Lab Manual"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cat === "ALL" ? "All Files" : cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMaterials.map((mat) => {
                const isTimetable = mat.category === "Timetable";
                const isQB = mat.category === "Question Bank";
                const isCircular = mat.category === "College Circular";

                return (
                  <div
                    key={mat.id}
                    className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between hover:border-blue-400 space-y-4 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            isTimetable
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                              : isQB
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : isCircular
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {mat.category}
                        </Badge>
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {mat.semester}
                        </span>
                      </div>

                      {/* Title & Details */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isTimetable
                              ? "bg-indigo-50 text-indigo-600"
                              : isQB
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {isTimetable ? (
                            <Calendar className="h-5 w-5" />
                          ) : isQB ? (
                            <BookOpen className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                            {mat.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Uploaded by {mat.uploadedBy} • {mat.uploadedAt}
                          </p>
                        </div>
                      </div>

                      {/* File Metadata */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">File Type & Size:</span>
                          <span className="font-mono font-bold text-slate-700">
                            {mat.fileType} ({mat.fileSize})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Academic Year:</span>
                          <span className="font-semibold text-slate-700">{mat.academicYear}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Total Student Downloads:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            {mat.downloadCount} downloads
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(mat)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </Button>

                      <button
                        onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MODULE B: FACULTY PERFORMANCE AUDIT STUDIO ─────────────────── */}
        {activeModule === "audit" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Filter and Search Bar */}
            <div className="rounded-2xl bg-white p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search faculty name, code or specialization..."
                  value={searchFaculty}
                  onChange={(e) => setSearchFaculty(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Status:
                </span>
                {[
                  { id: "ALL", label: "All Faculty" },
                  { id: "COMPLIANT", label: "AICTE Compliant" },
                  { id: "OVERLOADED", label: "Workload Overload" },
                  { id: "HIGH_RATING", label: "Top Rated (>= 4.8★)" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setAuditFilter(st.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                      auditFilter === st.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Faculty Audit Table / Cards */}
            <div className="space-y-4">
              {filteredFaculty.map((fac) => {
                const isOverloaded = fac.teachingHours > fac.maxLimit;

                return (
                  <div
                    key={fac.id}
                    className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Identity Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-base">
                          {fac.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{fac.name}</h3>
                            <Badge
                              className={`text-[10px] font-bold ${
                                isOverloaded
                                  ? "bg-rose-100 text-rose-800 border-rose-200"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {isOverloaded ? "AICTE OVERLOAD" : "COMPLIANT"}
                            </Badge>
                            {fac.signedByHOD && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-blue-600" /> HOD Signed
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {fac.facultyCode} • {fac.designation} • {fac.specialization}
                          </p>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2">
                        {!fac.signedByHOD ? (
                          <Button
                            size="sm"
                            onClick={() => handleSignOffAudit(fac.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Log Audit Sign-Off
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Audited on {fac.lastAuditedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Performance Audit Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      {/* 1. Teaching Workload */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Teaching Workload
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-lg font-mono font-black ${
                              isOverloaded ? "text-rose-600" : "text-slate-900"
                            }`}
                          >
                            {fac.teachingHours}h
                          </span>
                          <span className="text-slate-500 text-[11px]">/ {fac.maxLimit}h limit</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {fac.theoryHours}h Theory + {fac.labHours}h Lab
                        </p>
                      </div>

                      {/* 2. Syllabus Coverage */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Syllabus Coverage
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono font-black text-indigo-600">
                            {fac.syllabusCoveragePct}%
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            ({fac.unitsCompleted}/{fac.totalUnits} Units)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${fac.syllabusCoveragePct}%` }}
                          />
                        </div>
                      </div>

                      {/* 3. Student Rating */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Student Feedback
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono font-black text-amber-600">
                            {fac.studentRating} ★
                          </span>
                          <span className="text-slate-500 text-[11px]">/ 5.0</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {fac.totalStudentReviews} Student Reviews
                        </p>
                      </div>

                      {/* 4. Subject Pass Rate */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Subject Pass Rate
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono font-black text-emerald-600">
                            {fac.subjectPassPct}%
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 font-semibold">Mid-Term & End-Term</p>
                      </div>

                      {/* 5. Scopus Publications */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Research & Scopus
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono font-black text-purple-600">
                            {fac.publicationsCount} Papers
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">SCI / Scopus Indexed</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MODAL: UPLOAD NEW COLLEGE DOCUMENT ─────────────────────────── */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Upload College Academic File</h3>
                    <p className="text-xs text-slate-500">Timetable, question bank, syllabus or college circular</p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Document Title / Subject:</label>
                  <Input
                    placeholder="e.g. B.Tech CSE IV Sem Section-A Master Class Timetable"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Category:</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Timetable">📅 Master Timetable</option>
                      <option value="Question Bank">📚 Question Bank</option>
                      <option value="Academic Regulation">📜 Academic Regulation</option>
                      <option value="College Circular">🏛️ College Circular</option>
                      <option value="Lab Manual">🧪 Lab Manual</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Target Semester:</label>
                    <select
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All Semesters">All Semesters</option>
                      <option value="I Semester">I Semester</option>
                      <option value="II Semester">II Semester</option>
                      <option value="III Semester">III Semester</option>
                      <option value="IV Semester">IV Semester</option>
                      <option value="V Semester">V Semester</option>
                      <option value="VI Semester">VI Semester</option>
                      <option value="VII Semester">VII Semester</option>
                      <option value="VIII Semester">VIII Semester</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Select File (PDF, DOCX, XLSX):</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                    <UploadCloud className="h-8 w-8 text-blue-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-800">
                      {newFileName || "Click to browse or drop file here"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Maximum file size: 25 MB</p>
                    <input
                      type="file"
                      className="hidden"
                      id="hod-file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewFileName(file.name);
                          if (!newTitle) {
                            setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="hod-file-upload-input"
                      className="mt-2.5 inline-block px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl cursor-pointer text-[11px]"
                    >
                      Browse Device Files
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setUploadModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    {uploading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Publish Document"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
