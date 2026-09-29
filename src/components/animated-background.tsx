"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  showCampusWatermark?: boolean;
  variant?: "hero" | "subtle" | "immersive";
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedBackground({
  showCampusWatermark = false,
  variant = "subtle",
  className = "",
  children,
}: AnimatedBackgroundProps) {
  return (
    <div
      className={cn(
        "relative min-h-full w-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 text-slate-900 overflow-x-hidden",
        className
      )}
    >
      {/* ── 1. COLORFUL ANIMATED AURORA ORBS & GRADIENTS ──────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Orb 1: Vibrant Indigo & Blue (Top Left) */}
        <div
          className="absolute -top-[10%] -left-[5%] w-[650px] h-[650px] rounded-full animate-float-orb-1"
          style={{
            background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.22) 0%, rgba(59, 130, 246, 0.12) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Orb 2: Radiant Fuchsia & Violet (Top Right) */}
        <div
          className="absolute top-[10%] -right-[8%] w-[580px] h-[580px] rounded-full animate-float-orb-2"
          style={{
            background: "radial-gradient(circle at center, rgba(217, 70, 239, 0.18) 0%, rgba(168, 85, 247, 0.10) 45%, transparent 70%)",
            filter: "blur(65px)",
          }}
        />

        {/* Orb 3: Sunny Rose & Amber (Bottom Right) */}
        <div
          className="absolute -bottom-[12%] right-[10%] w-[620px] h-[620px] rounded-full animate-float-orb-3"
          style={{
            background: "radial-gradient(circle at center, rgba(244, 63, 94, 0.15) 0%, rgba(249, 115, 22, 0.10) 45%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />

        {/* Orb 4: Fresh Emerald & Cyan (Bottom Left) */}
        <div
          className="absolute bottom-[5%] -left-[8%] w-[540px] h-[540px] rounded-full animate-float-orb-4"
          style={{
            background: "radial-gradient(circle at center, rgba(16, 185, 129, 0.16) 0%, rgba(6, 182, 212, 0.10) 45%, transparent 70%)",
            filter: "blur(65px)",
          }}
        />

        {/* High-tech micro-dot grid pattern for clean professional SaaS polish */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.12) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── 2. OPTIONAL SUBTLE CAMPUS EMBLEM ──────────────────────────── */}
      {showCampusWatermark && (
        <div
          className="fixed bottom-6 right-6 pointer-events-none z-0 opacity-[0.06] hidden md:block"
          style={{ width: "140px", height: "140px" }}
        >
          <img
            src="/images/college-logo.png"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>
      )}

      {/* ── 3. CONTENT WRAPPER ────────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
