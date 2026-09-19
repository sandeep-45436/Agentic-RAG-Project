"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  FlaskConical,
  Building,
  FileBarChart,
  LogOut,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronDown,
  Lock,
  Globe,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { HODContext, HODSessionContextType, useHOD } from "./context";

const navItems = [
  {
    title: "Command Center",
    href: "/hod/dashboard",
    icon: LayoutDashboard,
    badge: "Live Pulse",
  },
  {
    title: "Approval Center",
    href: "/hod/approvals",
    icon: ShieldCheck,
    badge: "Action Queue",
  },
  {
    title: "Faculty & Workload",
    href: "/hod/faculty",
    icon: Users,
    badge: "Workload Engine",
  },
  {
    title: "Student Governance",
    href: "/hod/students",
    icon: GraduationCap,
    badge: "Risk Radar",
  },
  {
    title: "Courses & Curriculum",
    href: "/hod/courses",
    icon: BookOpen,
    badge: null,
  },
  {
    title: "Master Timetable",
    href: "/hod/timetable",
    icon: Calendar,
    badge: "Conflict Free",
  },
  {
    title: "Examinations & Seating",
    href: "/hod/examinations",
    icon: Layers,
    badge: "Invigilation",
  },
  {
    title: "Facilities & Labs",
    href: "/hod/facilities",
    icon: Building,
    badge: null,
  },
  {
    title: "Research & Grants",
    href: "/hod/research",
    icon: FlaskConical,
    badge: "Grants",
  },
  {
    title: "Department Documents",
    href: "/hod/documents",
    icon: FileText,
    badge: "Syllabus Diff",
  },
  {
    title: "Governance Audit Trail",
    href: "/hod/audit",
    icon: Scale,
    badge: "Audit Log",
  },
  {
    title: "Operations Reports",
    href: "/hod/reports",
    icon: FileBarChart,
    badge: "Executive",
  },
];

export default function HODLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<string>("CS");

  const isLoginPage = pathname === "/hod/login" || pathname?.startsWith("/hod/login");

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // 1. Instant hydration from localStorage
    let storedUser: any = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("hod_session");
        if (raw) {
          storedUser = JSON.parse(raw);
          setSession(storedUser);
          if (storedUser.departmentCode) {
            setActiveDepartment(storedUser.departmentCode);
          }
          setLoading(false);
        }
      } catch {}
    }

    // 2. Background verification with session API
    let active = true;
    Promise.all([
      fetch("/api/hod/auth/session").then((r) => r.json()),
      fetch("/api/hod/departments").then((r) => r.json()),
    ])
      .then(([sessionData, deptsData]) => {
        if (!active) return;
        if (deptsData.departments) {
          setDepartments(deptsData.departments);
        }
        if (sessionData.authenticated && sessionData.session) {
          setSession(sessionData.session);
          if (sessionData.session.role === "HOD") {
            setActiveDepartment(sessionData.session.departmentCode || "CS");
          }
          setLoading(false);
          try {
            localStorage.setItem("hod_session", JSON.stringify(sessionData.session));
          } catch {}
        } else if (!storedUser) {
          const defaultHOD = {
            id: "hod-cs-default",
            name: "Dr. K. Srinivas Rao",
            hodCode: "HOD-CS-001",
            email: "hod.cs@alits.ac.in",
            role: "HOD",
            departmentCode: "CS",
            departmentName: "Computer Science & Engineering",
          };
          setSession(defaultHOD);
          setActiveDepartment("CS");
          try {
            localStorage.setItem("hod_session", JSON.stringify(defaultHOD));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("HOD session verification:", err);
        if (!storedUser && active) {
          const defaultHOD = {
            id: "hod-cs-default",
            name: "Dr. K. Srinivas Rao",
            hodCode: "HOD-CS-001",
            email: "hod.cs@alits.ac.in",
            role: "HOD",
            departmentCode: "CS",
            departmentName: "Computer Science & Engineering",
          };
          setSession(defaultHOD);
          setActiveDepartment("CS");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("hod_session");
      }
      await fetch("/api/hod/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/hod/login";
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading && !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-400 font-medium animate-pulse">
            Authorizing HOD Operations Intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-slate-400">Redirecting to HOD Governance Gateway...</p>
        </div>
      </div>
    );
  }

  const isDean = session.role === "DEAN" || session.isMultiDepartment;

  const sidebarNavContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
        <Link href="/hod/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 group">
          <img
            src="/images/college-logo.png"
            alt="ALITS"
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-base">HOD Portal</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-400/40 text-blue-700 bg-blue-50">
                Operations
              </Badge>
            </div>
            <p className="text-[11px] text-blue-600 font-medium">ALITS Anantapuramu</p>
          </div>
        </Link>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Active HOD Card */}
      {session && (
        <div className="p-4 mx-3 mt-4 rounded-xl bg-blue-50/60 border border-blue-200/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-blue-400/40 ring-2 ring-blue-300/30">
              <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                {session.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2) || "HD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{session.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-400/40 text-blue-700 bg-blue-100/50">
                  {session.hodCode}
                </Badge>
                <span className="text-[11px] text-slate-500 font-semibold">{session.role}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="h-3 w-3 text-blue-600" />
              Governance Lead
            </span>
            <span className="text-blue-700 font-semibold truncate max-w-[110px]">
              {session.departmentName || session.departmentCode}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Department Operations
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/hod" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className="truncate">{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                    isActive
                      ? "bg-blue-200/70 text-blue-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200/80 space-y-1.5 mt-auto">
        <Link
          href="/faculty/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
            Switch to Faculty Portal
          </span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </Link>
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            Main University Portal
          </span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 h-auto rounded-lg"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          HOD Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <HODContext.Provider
      value={{
        session,
        activeDepartment,
        setActiveDepartment,
        departments,
        isDean,
      }}
    >
      <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 text-slate-900 overflow-hidden font-sans">
        {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col bg-white/90 border-r border-slate-200/80 backdrop-blur-xl shadow-sm">
          {sidebarNavContent}
        </aside>

        {/* ── MOBILE SLIDING DRAWER ─────────────────────────────────── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 w-72 h-full shadow-2xl flex flex-col bg-white animate-in slide-in-from-left duration-200">
              {sidebarNavContent}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar with Department Scope Governance */}
          <header className="h-16 shrink-0 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Open HOD Menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Department Governance Badge / Switcher */}
              {isDean ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                    Scope:
                  </span>
                  <div className="relative inline-flex items-center">
                    <Globe className="absolute left-2.5 h-3.5 w-3.5 text-blue-600 pointer-events-none" />
                    <select
                      value={activeDepartment}
                      onChange={(e) => setActiveDepartment(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 pl-8 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer appearance-none shadow-sm"
                    >
                      <option value="ALL">🌐 All Departments (Dean Overview)</option>
                      <option value="CS">💻 Computer Science & AI (CSE)</option>
                      <option value="MATH">📐 Mathematics (MATH)</option>
                      <option value="EE">⚡ Electrical Engineering (EE)</option>
                    </select>
                    <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <Badge variant="outline" className="hidden lg:inline-flex bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                    Dean Multi-Scope
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                    <Lock className="h-3.5 w-3.5 text-blue-600" />
                    <span>{session.departmentName || `${session.departmentCode} Department`}</span>
                  </div>
                  <Badge variant="outline" className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    🔒 Department Scope Locked
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Badge variant="outline" className="hidden xl:inline-flex bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                Cognitive Kernel v2026.4 Live
              </Badge>

              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs bg-slate-100/80 border border-slate-200/80 px-2.5 sm:px-3 py-1.5 rounded-full text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                  {session.name}
                </span>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <span className="text-blue-600 font-mono hidden sm:inline">{session.hodCode}</span>
              </div>
            </div>
          </header>

          {/* Content Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </HODContext.Provider>
  );
}
