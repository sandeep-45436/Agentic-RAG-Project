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
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans">
      {/* ── TOP EXECUTIVE BANNER & NAVIGATION ─────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 border-b border-amber-500/20 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand and University Crest */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/principal" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-white text-base">
                    Office of the Principal
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] hidden sm:inline-flex">
                    Vice-Chancellor Council
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-400/90 font-medium">
                  Smart University Institutional Governance
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
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
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
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
            >
              <span>Main Portal</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>

            <div className="h-9 px-3 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-amber-200">Dr. Arthur Pendelton</span>
              <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">| VC-01</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 p-4 space-y-2">
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
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 rounded-lg bg-white/5 text-xs text-slate-300"
              >
                Student Hub
              </Link>
              <Link
                href="/hod/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 rounded-lg bg-white/5 text-xs text-slate-300"
              >
                HOD Hub
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN EXECUTIVE BODY ───────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
