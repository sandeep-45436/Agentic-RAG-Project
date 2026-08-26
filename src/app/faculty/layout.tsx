"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  LogOut,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface FacultySession {
  id: string;
  name: string;
  email: string;
  facultyCode: string;
  title: string;
  designation?: string;
  departmentCode: string;
  departmentName: string;
}

const navItems = [
  {
    title: "Faculty Dashboard",
    href: "/faculty/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Academic Documents",
    href: "/faculty/documents",
    icon: FileText,
    badge: "Upload",
  },
  {
    title: "Timetable Management",
    href: "/faculty/timetables",
    icon: Calendar,
    badge: "Weekly",
  },
  {
    title: "Exam Seating Plans",
    href: "/faculty/seating",
    icon: Layers,
    badge: "Smart Grid",
  },
  {
    title: "Assigned Faculty",
    href: "/faculty/assigned-faculty",
    icon: Users,
    badge: "Credentials",
  },
];

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [faculty, setFaculty] = useState<FacultySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on login page, render children directly without dashboard chrome
  const isLoginPage = pathname === "/faculty/login" || pathname?.startsWith("/faculty/login");

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // 1. Instant hydration from localStorage
    let storedUser: any = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("faculty_user");
        if (raw) {
          storedUser = JSON.parse(raw);
          setFaculty(storedUser);
          setLoading(false);
        }
      } catch {}
    }

    // 2. Background verification with session API
    let active = true;
    fetch("/api/faculty/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.authenticated && data.faculty) {
          setFaculty(data.faculty);
          setLoading(false);
          try {
            localStorage.setItem("faculty_user", JSON.stringify(data.faculty));
          } catch {}
        } else if (!storedUser) {
          window.location.href = "/faculty/login";
        }
      })
      .catch((err) => {
        console.warn("Faculty session check:", err);
        if (!storedUser && active) {
          window.location.href = "/faculty/login";
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
        localStorage.removeItem("faculty_user");
      }
      await fetch("/api/faculty/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/faculty/login";
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading && !faculty) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400 font-medium animate-pulse">
            Opening Faculty Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-slate-400">Redirecting to Faculty Sign In...</p>
        </div>
      </div>
    );
  }

  const sidebarNavContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/faculty/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">Faculty Portal</span>
            </div>
            <p className="text-xs text-indigo-400 font-medium">Smart University Academic</p>
          </div>
        </Link>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Active Faculty Card */}
      {faculty && (
        <div className="p-4 mx-3 mt-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-indigo-500/30 ring-2 ring-indigo-500/20">
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                {faculty.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2) || "FC"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{faculty.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-500/40 text-indigo-300 bg-indigo-500/10">
                  {faculty.facultyCode}
                </Badge>
                <span className="text-[11px] text-slate-400 truncate">{faculty.departmentCode}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Verified Faculty
            </span>
            <span className="text-slate-300 truncate max-w-[90px]">{faculty.departmentName}</span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Academic Operations
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive
                      ? "bg-indigo-500/30 text-indigo-200"
                      : "bg-slate-800 text-slate-400"
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
      <div className="p-3 border-t border-slate-800/80 space-y-2 mt-auto">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            Switch to Main Portal
          </span>
          <ExternalLink className="h-3 w-3 text-slate-500" />
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 h-auto rounded-lg"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Faculty Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ── DESKTOP FACULTY SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl">
        {sidebarNavContent}
      </aside>

      {/* ── MOBILE SLIDING DRAWER ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl flex flex-col bg-slate-900 animate-in slide-in-from-left duration-200">
            {sidebarNavContent}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 shrink-0 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Open Faculty Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate">
              Faculty Subsystem
            </span>
            <Badge variant="outline" className="hidden lg:inline-flex bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs shrink-0">
              Live ETR & RAG Synchronized
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {faculty && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs bg-slate-800/80 border border-slate-700/60 px-2.5 sm:px-3 py-1.5 rounded-full text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-200 truncate max-w-[100px] sm:max-w-none">
                  {faculty.title} {faculty.name}
                </span>
                <span className="text-slate-500 hidden sm:inline">|</span>
                <span className="text-indigo-400 font-mono hidden sm:inline">{faculty.facultyCode}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
