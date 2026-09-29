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
        "relative min-h-full w-full bg-[#0B0F17] text-slate-100 overflow-x-hidden",
        className
      )}
    >
      {/* ── 1. AMBIENT EXECUTIVE SPOTLIGHT GRADIENTS ──────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top subtle indigo glow */}
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.05) 45%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Bottom subtle cyan accent */}
        <div
          className="absolute -bottom-[20%] right-[10%] w-[600px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(6, 182, 212, 0.07) 0%, transparent 65%)",
            filter: "blur(90px)",
          }}
        />

        {/* Micro-dot grid pattern for clean enterprise texture */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── 2. OPTIONAL SUBTLE CAMPUS EMBLEM ──────────────────────────── */}
      {showCampusWatermark && (
        <div
          className="fixed bottom-6 right-6 pointer-events-none z-0 opacity-[0.035] hidden md:block"
          style={{ width: "140px", height: "140px" }}
        >
          <img
            src="/images/college-logo.png"
            alt=""
            className="w-full h-full object-contain filter grayscale"
          />
        </div>
      )}

      {/* ── 3. CONTENT WRAPPER ────────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
