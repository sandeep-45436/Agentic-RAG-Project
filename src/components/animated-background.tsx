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
      {/* ── 1. CLEAN INSTITUTIONAL CALM BACKGROUND (No revolving or spinning animations) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft, gentle static ambient illumination */}
        <div
          className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div
          className="absolute top-[20%] -right-[8%] w-[500px] h-[500px] rounded-full opacity-50"
          style={{
            background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Clean, subtle micro-dot texture */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.08) 1px, transparent 0)",
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
