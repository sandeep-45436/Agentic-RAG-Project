"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Zap,
  BookOpen,
  Scale,
  Landmark,
  Sparkles,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Award,
  Building2,
  DollarSign,
  Compass,
  MessageSquare,
  BookMarked,
  Layers,
  ChevronRight,
  Briefcase,
  TrendingUp,
  Sliders,
  Target,
} from "lucide-react";

interface SubFeature {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
}

interface Portal {
  id: string;
  name: string;
  shortName: string;
  href: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  activeColor: string;
  role: string;
  subFeatures: SubFeature[];
}

const portals: Portal[] = [
  {
    id: "student",
    name: "Student Portal",
    shortName: "Student Portal",
    href: "/dashboard",
    icon: BookOpen,
    badge: "Student Hub",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    activeColor: "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200",
    role: "Department Feed, GPA & RAG Chat",
    subFeatures: [
      { title: "Student Dashboard", href: "/dashboard", icon: BookOpen, description: "Dept faculty uploads & attendance" },
      { title: "AI Academic Chat", href: "/chat", icon: MessageSquare, description: "Instant RAG textbook & notes Q&A" },
      { title: "Browse Notes & Syllabi", href: "/documents", icon: FileText, description: "Department course docs & materials" },
      { title: "Knowledge Bases", href: "/knowledge-bases", icon: Layers, description: "Indexed institutional knowledge" },
      { title: "Research Workspace", href: "/research", icon: BookMarked, description: "AI literature & thesis assistance" },
    ],
  },
  {
    id: "placement",
    name: "Placement Portal",
    shortName: "Placement Hub",
    href: "/placement",
    icon: Briefcase,
    badge: "Careers",
    badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    activeColor: "bg-cyan-50 border-cyan-300 ring-2 ring-cyan-200",
    role: "Campus Drives, Pipeline & AI Viva",
    subFeatures: [
      { title: "Campus Drives", href: "/placement?tab=drives", icon: Briefcase, badge: "Live", description: "Active recruitment drives & 1-click apply" },
      { title: "Application Pipeline", href: "/placement?tab=pipeline", icon: TrendingUp, badge: "Kanban", description: "Multi-stage interview rounds & offer status" },
      { title: "AI Resume ATS Match", href: "/placement?tab=ats", icon: FileText, badge: "AI Match", description: "JD keyword matching & STAR bullet rewrite" },
      { title: "Technical Viva Arena", href: "/placement?tab=mock-interview", icon: Award, badge: "Simulate", description: "Company viva scenarios with live AI scoring" },
      { title: "TPO Command Cockpit", href: "/placement?tab=tpo", icon: Sliders, badge: "TPO Ops", description: "Deterministic candidate ranking & shortlists" },
      { title: "Placement Analytics", href: "/placement?tab=analytics", icon: Target, description: "Salary distribution & branch benchmarks" },
      { title: "Skills Radar & Roadmap", href: "/skills", icon: Zap, description: "Competency vectors & learning tracks" },
    ],
  },
  {
    id: "faculty",
    name: "Faculty Portal",
    shortName: "Faculty Portal",
    href: "/faculty/dashboard",
    icon: GraduationCap,
    badge: "Faculty Ops",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    activeColor: "bg-purple-50 border-purple-300 ring-2 ring-purple-200",
    role: "Timetables, Seating & Syllabi",
    subFeatures: [
      { title: "Faculty Cockpit", href: "/faculty/dashboard", icon: GraduationCap, description: "Course load, classes & quick actions" },
      { title: "Class Timetables", href: "/faculty/timetables", icon: Calendar, badge: "Schedule", description: "Weekly teaching schedule & periods" },
      { title: "Exam Seating", href: "/faculty/seating", icon: Users, badge: "Invigilation", description: "Exam hall allocation & seating plan" },
      { title: "Upload Course Docs", href: "/faculty/documents", icon: FileText, badge: "Uploads", description: "Upload syllabi, notes & question banks" },
      { title: "Department Faculty", href: "/faculty/assigned-faculty", icon: Building2, description: "Department colleagues & subject allocations" },
    ],
  },
  {
    id: "hod",
    name: "HOD Portal",
    shortName: "HOD Portal",
    href: "/hod/dashboard",
    icon: Scale,
    badge: "Governance",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    activeColor: "bg-blue-50 border-blue-300 ring-2 ring-blue-200",
    role: "Health Score, Workload & Risks",
    subFeatures: [
      { title: "Command Center", href: "/hod/dashboard", icon: Scale, description: "Department health score & metrics" },
      { title: "Approval Docket", href: "/hod/approvals", icon: CheckCircle2, badge: "Approvals", description: "Student leaves, OD & faculty requisitions" },
      { title: "Faculty Workload", href: "/hod/faculty", icon: Users, description: "Teaching hours & workload distribution" },
      { title: "Student Risk Radar", href: "/hod/students", icon: ShieldAlert, badge: "Alerts", description: "Attendance shortfall & academic alerts" },
      { title: "Master Timetable", href: "/hod/timetable", icon: Calendar, description: "Department-wide master class schedule" },
      { title: "Syllabi & Curriculum", href: "/hod/courses", icon: BookOpen, description: "Department course coverage & syllabus" },
      { title: "Research & Grants", href: "/hod/research", icon: Award, description: "Patents, publications & funded research" },
    ],
  },
  {
    id: "principal",
    name: "Principal Portal",
    shortName: "Principal Portal",
    href: "/principal",
    icon: Landmark,
    badge: "Executive",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    activeColor: "bg-amber-50 border-amber-300 ring-2 ring-amber-200",
    role: "All Depts, NAAC & Finance",
    subFeatures: [
      { title: "Executive Cockpit", href: "/principal", icon: Landmark, description: "Institution overview & academic KPIs" },
      { title: "9-Dept Matrix", href: "/principal/departments", icon: Building2, badge: "9 Depts", description: "Comparative department benchmarks" },
      { title: "Approvals Registry", href: "/principal/approvals", icon: CheckCircle2, description: "Institution-level approvals & escalations" },
      { title: "Budget & Finance", href: "/principal/finance", icon: DollarSign, badge: "Grants", description: "Departmental budget & research grants" },
    ],
  },
];

export function PortalSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  const activePortal =
    portals.find((p) => {
      if (p.id === "student") {
        return (
          pathname === "/dashboard" ||
          pathname.startsWith("/chat") ||
          pathname.startsWith("/documents") ||
          pathname.startsWith("/knowledge-bases") ||
          pathname.startsWith("/research")
        );
      }
      if (p.id === "placement") {
        return pathname.startsWith("/placement") || pathname.startsWith("/skills");
      }
      return pathname.startsWith(p.href);
    }) || portals[0];

  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-white/95 border border-slate-200 p-3.5 shadow-md backdrop-blur-xl ${className}`}>
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 pb-2.5 mb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            ALITS Smart University Subsystem Portals
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
            Active: <span className="font-bold text-slate-800">{activePortal.name}</span>
          </span>
        </div>
      </div>

      {/* ── 5 Primary Portals ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 mb-3">
        {portals.map((p) => {
          const isActive = activePortal.id === p.id;
          const Icon = p.icon;

          return (
            <Link
              key={p.id}
              href={p.href}
              className={`relative group flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 hover-lift last:col-span-2 sm:last:col-span-1 lg:last:col-span-1 ${
                isActive
                  ? p.activeColor + " shadow-md"
                  : "bg-slate-50/80 hover:bg-white border-slate-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isActive ? "bg-white text-indigo-600 shadow-sm" : "bg-white text-slate-700 group-hover:text-indigo-600 shadow-xs"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>

              <div>
                <p className={`text-xs font-bold tracking-tight truncate ${isActive ? "text-slate-900" : "text-slate-800 group-hover:text-indigo-600"}`}>
                  {p.shortName}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {p.role}
                </p>
              </div>

              {isActive && (
                <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Active Portal Subsystem Feature Ribbon ───────────────── */}
      <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/90">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>{activePortal.name} Features & Operations:</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            Direct Jump to Subsystem Modules
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activePortal.subFeatures.map((sub) => {
            const isSubActive = pathname === sub.href;
            const SubIcon = sub.icon;

            return (
              <Link
                key={sub.href}
                href={sub.href}
                title={sub.description}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                  isSubActive
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                    : "bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-white" : "text-slate-500"}`} />
                <span>{sub.title}</span>
                {sub.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSubActive
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {sub.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
