"use client";

import React from "react";

interface AnimatedBackgroundProps {
  showCampusWatermark?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedBackground({
  showCampusWatermark = true,
  className = "",
  children,
}: AnimatedBackgroundProps) {
  return (
    <div className={`relative min-h-screen w-full bg-slate-50/70 text-slate-900 overflow-x-hidden ${className}`}>
      {/* ── 1. AMBIENT ANIMATED FLOATING COLOR BLOBS ──────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Blob 1: Indigo / Blue Aurora */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-300/35 via-blue-200/30 to-purple-200/20 blur-3xl animate-blob-1" />

        {/* Blob 2: Cyan / Teal Accent */}
        <div className="absolute top-1/4 -right-28 w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-cyan-300/30 via-teal-200/25 to-sky-200/20 blur-3xl animate-blob-2" />

        {/* Blob 3: Amber / Warm Gold Horizon */}
        <div className="absolute -bottom-36 left-1/3 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-amber-200/30 via-orange-100/25 to-yellow-100/20 blur-3xl animate-blob-3" />

        {/* Blob 4: Soft Emerald Floating Node */}
        <div className="absolute top-2/3 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-r from-emerald-200/25 via-teal-100/20 to-green-100/15 blur-3xl animate-blob-2" />
      </div>

      {/* ── 2. SUBTLE ARCHITECTURAL GEOMETRIC GRID OVERLAY ─────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.12) 1px, transparent 0)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── 3. OPTIONAL CAMPUS PHOTO WATERMARK HERO BANNER ────────────── */}
      {showCampusWatermark && (
        <div
          className="fixed top-0 right-0 w-full h-[380px] pointer-events-none z-0 opacity-[0.07] bg-cover bg-center mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/college-campus.jpg')",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
          }}
        />
      )}

      {/* ── 4. FOREGROUND CONTENT WRAPPER ─────────────────────────────── */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
