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
  ChevronRight,
} from "lucide-react";

interface Portal {
  id: string;
  name: string;
  shortName: string;
  href: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  glowClass: string;
  role: string;
}

const portals: Portal[] = [
  {
    id: "student",
    name: "Student Academic Hub",
    shortName: "Student Hub",
    href: "/dashboard",
    icon: BookOpen,
    badge: "Active Scope",
    badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    glowClass: "hover:border-indigo-500/50 hover:shadow-indigo-500/20",
    role: "Undergraduate / Scholar",
  },
  {
    id: "skills",
    name: "Skill Development Portal",
    shortName: "Skills & Career",
    href: "/skills",
    icon: Zap,
    badge: "Industry Ready",
    badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    glowClass: "hover:border-cyan-500/50 hover:shadow-cyan-500/20",
    role: "Micro-credentials & Radar",
  },
  {
    id: "faculty",
    name: "Faculty Portal",
    shortName: "Faculty Ops",
    href: "/faculty/dashboard",
    icon: GraduationCap,
    badge: "Instructor Mode",
    badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    glowClass: "hover:border-purple-500/50 hover:shadow-purple-500/20",
    role: "Timetables & Seating",
  },
  {
    id: "hod",
    name: "HOD Department Hub",
    shortName: "HOD Operations",
    href: "/hod/dashboard",
    icon: Scale,
    badge: "Governance",
    badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    glowClass: "hover:border-blue-500/50 hover:shadow-blue-500/20",
    role: "Workload & Risk Approvals",
  },
  {
    id: "principal",
    name: "Principal Executive Command",
    shortName: "Principal Command",
    href: "/principal",
    icon: Landmark,
    badge: "Macro Authority",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    glowClass: "hover:border-amber-500/50 hover:shadow-amber-500/20",
    role: "All Colleges & NIRF/NAAC",
  },
];

export function PortalSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-3 shadow-xl backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Smart University Operations Matrix
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Seamless multi-subsystem portal switching
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
                  ? "bg-white/[0.08] border-white/30 shadow-lg shadow-black/40 ring-1 ring-white/20"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] " + p.glowClass
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isActive ? "bg-white text-slate-950 shadow-sm" : "bg-white/5 text-white group-hover:bg-white/10"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>

              <div>
                <p className={`text-xs font-bold tracking-tight truncate ${isActive ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                  {p.shortName}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {p.role}
                </p>
              </div>

              {isActive && (
                <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
