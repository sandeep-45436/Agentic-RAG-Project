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
} from "lucide-react";

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
    role: "Attendance, GPA & RAG Chat",
  },
  {
    id: "skills",
    name: "Placement Center",
    shortName: "Placement Center",
    href: "/skills",
    icon: Zap,
    badge: "Careers",
    badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    activeColor: "bg-cyan-50 border-cyan-300 ring-2 ring-cyan-200",
    role: "Skills Radar & Certifications",
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
  },
];

export function PortalSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-white/95 border border-slate-200 p-3.5 shadow-md backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between px-2 pb-2.5 mb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            ALITS Smart University Subsystem Portals
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
          Instant 1-Click Subsystem Switcher
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {portals.map((p) => {
          const isActive =
            p.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(p.href);

          const Icon = p.icon;

          return (
            <Link
              key={p.id}
              href={p.href}
              className={`relative group flex flex-col justify-between p-3 rounded-xl border transition-all duration-200 hover-lift ${
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
    </div>
  );
}
