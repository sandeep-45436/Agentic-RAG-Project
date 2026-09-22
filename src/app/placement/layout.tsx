"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  TrendingUp,
  Award,
  FileText,
  Sliders,
  Target,
  Zap,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PortalSwitcher } from "@/components/portal-switcher";

const placementNav = [
  { href: "/placement?tab=drives", label: "Campus Drives", icon: Briefcase },
  { href: "/placement?tab=pipeline", label: "Pipeline & Offers", icon: TrendingUp },
  { href: "/placement?tab=ats", label: "ATS Resume Match", icon: FileText },
  { href: "/placement?tab=mock-interview", label: "Technical Viva", icon: Award },
  { href: "/placement?tab=tpo", label: "TPO Cockpit", icon: Sliders },
  { href: "/placement?tab=analytics", label: "Salary & Stats", icon: Target },
  { href: "/skills", label: "Skills Radar", icon: Zap },
];

export default function PlacementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPortalSwitcher, setShowPortalSwitcher] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ── TOP NAV HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 border-b border-slate-200/90 backdrop-blur-xl shadow-xs">
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
                    ALITS Placement Portal
                  </span>
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] font-bold">
                    Careers Hub
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Campus Recruitment & LangGraph Career Engine
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {placementNav.map((item) => {
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

          {/* Portal Switcher & Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPortalSwitcher(!showPortalSwitcher)}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Switch Portal</span>
            </button>

            <Link
              href="/dashboard"
              className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              <span>Student Hub</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Portal Switcher Dropdown Modal */}
        {showPortalSwitcher && (
          <div className="absolute top-16 right-4 sm:right-8 z-50 w-full max-w-md shadow-2xl rounded-2xl animate-in fade-in">
            <PortalSwitcher />
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-1">
            {placementNav.map((item) => {
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
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT VIEW ─────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
