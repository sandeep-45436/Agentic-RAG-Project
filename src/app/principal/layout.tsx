"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Landmark,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Coins,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  GraduationCap,
  Scale,
  Zap,
  Users,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/auth";

const navLinks = [
  { href: "/principal", label: "Executive Command", icon: LayoutDashboard },
  { href: "/principal/departments", label: "Department Matrix", icon: Building2 },
  { href: "/principal/approvals", label: "Executive Approvals", icon: ShieldCheck },
  { href: "/principal/finance", label: "Budget & Research", icon: Coins },
];

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const res = await signOutAction();
    if (res.success) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 flex flex-col font-sans">
      {/* ── TOP EXECUTIVE BANNER & NAVIGATION ─────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-amber-200/60 backdrop-blur-xl shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand and University Crest */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-amber-50"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/principal" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
              <img
                src="/images/college-logo.png"
                alt="ALITS"
                className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base truncate">
                    Office of the Principal
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300/60 text-[10px] hidden sm:inline-flex shrink-0">
                    ALITS Executive
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-700 font-medium hidden xl:block truncate">
                  Anantha Lakshmi Institute of Technology & Sciences
                </p>
                <p className="text-[11px] text-amber-700 font-medium xl:hidden truncate">
                  ALITS Executive Desk
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map((tab) => {
              const isActive =
                tab.href === "/principal"
                  ? pathname === "/principal"
                  : pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-100 text-amber-800 border border-amber-300/60 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-amber-50/60"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Portal Switcher Shortcuts */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 transition-colors shrink-0"
              title="Switch to Student Portal"
            >
              <Users className="h-3.5 w-3.5 text-amber-700" />
              <span className="hidden sm:inline">Student Portal</span>
            </Link>

            <div className="h-9 px-2.5 sm:px-3 rounded-full bg-amber-50 border border-amber-200/60 flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-amber-900 truncate max-w-[100px] sm:max-w-none">
                Dr. Arthur Pendelton
              </span>
              <span className="text-[10px] text-amber-700 font-mono hidden sm:inline">| VC-01</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 rounded-xl border border-rose-200/60 font-semibold transition-colors flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 p-4 space-y-2 animate-drop-in">
            {navLinks.map((tab) => {
              const isActive =
                tab.href === "/principal"
                  ? pathname === "/principal"
                  : pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-amber-100 text-amber-800 border border-amber-300/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-amber-50/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-200 flex gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 rounded-lg bg-slate-100 text-xs text-slate-600"
              >
                Student Hub
              </Link>
              <Link
                href="/hod/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 rounded-lg bg-slate-100 text-xs text-slate-600"
              >
                HOD Hub
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN EXECUTIVE BODY — FULL SPACE FLUID LAYOUT ───────────────── */}
      <main className="flex-1 w-full p-3 sm:p-5 lg:p-6 space-y-6 max-w-none animate-page-fade-up entrance-stagger">
        {children}
      </main>
    </div>
  );
}
