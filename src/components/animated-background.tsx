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
      className={`relative min-h-screen w-full bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30 text-slate-900 overflow-x-hidden ${className}`}
    >
      {/* ── 1. CAMPUS PHOTO BACKDROP — OUT OF FOCUS / BOKEH BLUR (NOT CLEAR/SHARP) ──── */}
      {showCampusWatermark && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -inset-6 bg-cover bg-center bg-no-repeat campus-ambient-drift"
            style={{
              backgroundImage: "url('/images/college-campus.jpg')",
              transform: `translateY(${scrollY * 0.12}px) scale(1.12)`,
              opacity: variant === "immersive" ? 0.32 : 0.22,
              filter: "blur(14px) saturate(1.15) brightness(1.03)",
              transition: "transform 0.2s ease-out",
            }}
          />
          {/* Frosted diffuse wash to keep all text razor-sharp while background stays dreamy & soft */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-slate-50/90 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 via-transparent to-blue-50/30" />
        </div>
      )}

      {/* ── 2. ANIMATED FLOATING COLOR BLOBS — HEAVILY BLURRED / DIFFUSED (NO SHARP EDGES) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        {/* Blob 1: Large Indigo/Purple Aurora - Top Left */}
        <div
          className="absolute -top-28 -left-28 w-[680px] h-[680px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.10) 45%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />

        {/* Blob 2: Cyan/Teal Accent - Top Right */}
        <div
          className="absolute top-[12%] -right-24 w-[620px] h-[620px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(56,189,248,0.08) 45%, transparent 70%)",
            filter: "blur(85px)",
          }}
        />

        {/* Blob 3: Warm Gold/Amber - Bottom Center */}
        <div
          className="absolute -bottom-32 left-[22%] w-[780px] h-[780px] rounded-full animate-blob-3"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.14) 0%, rgba(251,191,36,0.07) 45%, transparent 70%)",
            filter: "blur(95px)",
          }}
        />

        {/* Blob 4: Emerald Floating Node - Mid Left */}
        <div
          className="absolute top-[50%] -left-20 w-[560px] h-[560px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.13) 0%, rgba(52,211,153,0.06) 45%, transparent 70%)",
            filter: "blur(85px)",
            animationDelay: "3s",
          }}
        />

        {/* Blob 5: Rose/Pink accent - Bottom Right */}
        <div
          className="absolute bottom-[8%] right-[4%] w-[520px] h-[520px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, rgba(244,63,94,0.09) 0%, rgba(251,113,133,0.05) 45%, transparent 70%)",
            filter: "blur(85px)",
            animationDelay: "6s",
          }}
        />
      </div>

      {/* ── 3. SOFT PARTICLE DUST MOTES (Diffused, not sharp) ──────────── */}
      <div className="fixed inset-0 pointer-events-none z-[1] particle-field opacity-60" />

      {/* ── 4. SOFT AMBIENT LIGHT SHAFTS (Blurred ray effect) ──────────── */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="light-streak light-streak-1" />
        <div className="light-streak light-streak-2" />
        <div className="light-streak light-streak-3" />
      </div>

      {/* ── 5. SUBTLE AMBIENT MESH (Low opacity, non-intrusive) ────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-15"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.12) 1px, transparent 0)
          `,
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── 6. COLLEGE LOGO WATERMARK (Gentle, soft depth) ─────────────── */}
      <div
        className="fixed bottom-8 right-8 pointer-events-none z-[2] opacity-[0.045] animate-float"
        style={{ width: "170px", height: "170px", filter: "blur(0.5px)" }}
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
