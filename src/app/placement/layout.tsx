"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  TrendingUp,
  Award,
  FileText,
  Target,
  Zap,
  Menu,
  X,
  CheckCircle2,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/auth";

const studentPlacementNav = [
  { href: "/placement?tab=drives", label: "Campus Drives", icon: Briefcase },
  { href: "/placement?tab=pipeline", label: "My Applications", icon: TrendingUp },
  { href: "/placement?tab=ats", label: "ATS Resume Match", icon: FileText },
  { href: "/placement?tab=mock-interview", label: "Technical Viva", icon: Award },
  { href: "/placement?tab=eligibility", label: "Eligibility", icon: CheckCircle2 },
  { href: "/skills", label: "Skills Radar", icon: Zap },
];

export default function PlacementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const res = await signOutAction();
    if (res.success) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ── TOP NAV HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 backdrop-blur-xl shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Crest */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/placement" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                    ALITS Placement Center
                  </span>
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-bold">
                    Student Portal
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Campus Recruitment & AI Career Engine
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Items (Student-centric) */}
          <nav className="hidden lg:flex items-center gap-1">
            {studentPlacementNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action buttons with Sign Out */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              title="Return to Student Academic Dashboard"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Student Dashboard</span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 px-3 rounded-xl border border-rose-200/60 font-semibold transition-colors flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-1 animate-drop-in">
            {studentPlacementNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-200 flex justify-between gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold bg-slate-100 rounded-xl text-slate-700"
              >
                Student Dashboard
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex-1 text-xs text-rose-600 font-bold border border-rose-200 rounded-xl"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT VIEW — FULL SPACE FLUID EDGE-TO-EDGE ─────────── */}
      <main className="flex-1 w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 animate-page-fade-up entrance-stagger">
        {children}
      </main>
    </div>
  );
}
