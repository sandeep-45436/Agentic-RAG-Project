"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalSwitcher } from "@/components/portal-switcher";

const navLinks = [
  { href: "/principal", label: "Executive Command", icon: LayoutDashboard },
  { href: "/principal/departments", label: "Department Matrix", icon: Building2 },
  { href: "/principal/approvals", label: "Executive Approvals", icon: ShieldCheck },
  { href: "/principal/finance", label: "Budget & Research", icon: Coins },
];

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 flex flex-col font-sans">
      {/* ── TOP EXECUTIVE BANNER & NAVIGATION ─────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-amber-200/60 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand and University Crest */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-amber-50"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/principal" className="flex items-center gap-3 group">
              <img
                src="/images/college-logo.png"
                alt="ALITS"
                className="h-11 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-slate-900 text-base">
                    Office of the Principal
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300/60 text-[10px] hidden sm:inline-flex">
                    ALITS Executive
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-700 font-medium">
                  Anantha Lakshmi Institute of Technology & Sciences
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-100 text-amber-800 border border-amber-300/60 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-amber-50/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Portal Switcher Shortcuts */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
            >
              <span>Student Portal</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>

            <div className="h-9 px-3 rounded-full bg-amber-50 border border-amber-200/60 flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-amber-900">Dr. Arthur Pendelton</span>
              <span className="text-[10px] text-amber-700 font-mono hidden sm:inline">| VC-01</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 p-4 space-y-2">
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

      {/* ── MAIN EXECUTIVE BODY ───────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ── Subsystem Portals Navigator & Quick Jump ── */}
        <PortalSwitcher />

        {children}
      </main>
    </div>
  );
}
