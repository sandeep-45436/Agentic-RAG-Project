"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedBackgroundProps {
  showCampusWatermark?: boolean;
  variant?: "hero" | "subtle" | "immersive";
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedBackground({
  showCampusWatermark = true,
  variant = "hero",
  className = "",
  children,
}: AnimatedBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 text-slate-900 overflow-x-hidden ${className}`}
    >
      {/* ── 1. CAMPUS PHOTO HERO BANNER WITH PARALLAX ──────────────────── */}
      {showCampusWatermark && (
        <div className="fixed top-0 left-0 right-0 h-[480px] pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat campus-parallax"
            style={{
              backgroundImage: "url('/images/college-campus.jpg')",
              transform: `translateY(${scrollY * 0.3}px)`,
              opacity: variant === "immersive" ? 0.5 : 0.4,
              filter: "saturate(1.2) contrast(1.05)",
            }}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/60 to-white" />
          {/* Side gradient fades */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/40 via-transparent to-blue-50/40" />
        </div>
      )}

      {/* ── 2. ANIMATED FLOATING COLOR BLOBS (Large, Vivid) ────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        {/* Blob 1: Large Indigo/Purple Aurora - Top Left */}
        <div
          className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Blob 2: Cyan/Teal Accent - Top Right */}
        <div
          className="absolute top-[15%] -right-16 w-[550px] h-[550px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, rgba(56,189,248,0.12) 40%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />

        {/* Blob 3: Warm Gold/Amber - Bottom Center */}
        <div
          className="absolute -bottom-24 left-[25%] w-[700px] h-[700px] rounded-full animate-blob-3"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(251,191,36,0.1) 40%, transparent 70%)",
            filter: "blur(65px)",
          }}
        />

        {/* Blob 4: Emerald Floating Node - Mid Left */}
        <div
          className="absolute top-[55%] -left-12 w-[500px] h-[500px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.1) 40%, transparent 70%)",
            filter: "blur(50px)",
            animationDelay: "3s",
          }}
        />

        {/* Blob 5: Rose/Pink accent - Bottom Right */}
        <div
          className="absolute bottom-[10%] right-[5%] w-[450px] h-[450px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, rgba(244,63,94,0.12) 0%, rgba(251,113,133,0.08) 40%, transparent 70%)",
            filter: "blur(50px)",
            animationDelay: "6s",
          }}
        />
      </div>

      {/* ── 3. ANIMATED PARTICLE DOTS GRID ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-[1] particle-field" />

      {/* ── 4. DIAGONAL LIGHT STREAKS ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="light-streak light-streak-1" />
        <div className="light-streak light-streak-2" />
        <div className="light-streak light-streak-3" />
      </div>

      {/* ── 5. GEOMETRIC GRID OVERLAY ─────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── 6. COLLEGE LOGO WATERMARK (subtle, bottom-right) ──────────── */}
      <div
        className="fixed bottom-8 right-8 pointer-events-none z-[2] opacity-[0.06] animate-float"
        style={{ width: "180px", height: "180px" }}
      >
        <img
          src="/images/college-logo.png"
          alt=""
          className="w-full h-full object-contain"
          style={{ filter: "grayscale(0.3)" }}
        />
      </div>

      {/* ── 7. FOREGROUND CONTENT WRAPPER ─────────────────────────────── */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
