"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

interface AnimatedBackgroundProps {
  showCampusWatermark?: boolean;
  variant?: "hero" | "subtle" | "immersive";
  className?: string;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  baseAlpha: number;
}

export function AnimatedBackground({
  showCampusWatermark = true,
  variant = "hero",
  className = "",
  children,
}: AnimatedBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track cursor movement for interactive fluid constellation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // ── High-Performance Interactive Constellation Canvas ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle Palette
    const colors = [
      "rgba(99, 102, 241,", // Indigo
      "rgba(6, 182, 212,",  // Cyan
      "rgba(168, 85, 247,", // Purple
      "rgba(16, 185, 129,", // Emerald
      "rgba(244, 63, 94,",  // Rose
    ];

    // Initialize particles based on screen density
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.45 + 0.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: Math.random() * 0.02 + 0.008,
      });
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      const mouse = mousePosRef.current;
      const connectionDist = Math.min(width, height) > 768 ? 140 : 100;

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gentle oscillation
        p.x += p.vx;
        p.y += p.vy;

        // Bounce from boundaries
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        else if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > height) { p.y = height; p.vy *= -1; }

        // Pulse alpha
        p.alpha = p.baseAlpha + Math.sin(time + i) * 0.15;

        // Interactive cursor repulsion
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxRepel = 160;
          if (dist < maxRepel && dist > 0) {
            const force = (1 - dist / maxRepel) * 1.5;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
          }
        }

        // Draw particle node with soft outer halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${Math.max(0.1, p.alpha)})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.color} 0.6)`;
        ctx.fill();

        // Draw connecting filaments to neighboring nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-full w-full bg-slate-950 text-foreground overflow-x-hidden selection:bg-indigo-500/30 ${className}`}
    >
      {/* ── 1. CAMPUS PHOTO BACKDROP — CINEMATIC OUT-OF-FOCUS BLUR ──────── */}
      {showCampusWatermark && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -inset-8 bg-cover bg-center bg-no-repeat transition-transform duration-300 ease-out"
            style={{
              backgroundImage: "url('/images/college-campus.jpg')",
              transform: `translateY(${scrollY * 0.08}px) scale(1.1)`,
              opacity: variant === "immersive" ? 0.16 : 0.10,
              filter: "blur(20px) saturate(1.2) brightness(0.7)",
            }}
          />
          {/* Deep cyber dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/90 to-slate-950/98 backdrop-blur-[3px]" />
        </div>
      )}

      {/* ── 2. VOLUMETRIC MULTI-LAYER AURORA ENERGY ORBS (SLOW MOTION) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        {/* Blob 1: Cosmic Indigo/Electric Purple - Top Left */}
        <div
          className="absolute -top-36 -left-36 w-[720px] h-[720px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)",
            filter: "blur(100px)",
            animationDuration: "24s",
          }}
        />

        {/* Blob 2: Bioluminescent Cyan/Teal - Top Right */}
        <div
          className="absolute top-[8%] -right-32 w-[680px] h-[680px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(56,189,248,0.09) 45%, transparent 70%)",
            filter: "blur(95px)",
            animationDuration: "28s",
          }}
        />

        {/* Blob 3: Solar Plasma Amber - Center Bottom */}
        <div
          className="absolute -bottom-40 left-[20%] w-[840px] h-[840px] rounded-full animate-blob-3"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.13) 0%, rgba(217,119,6,0.06) 45%, transparent 70%)",
            filter: "blur(110px)",
            animationDuration: "30s",
          }}
        />

        {/* Blob 4: Emerald Energy Node - Mid Left */}
        <div
          className="absolute top-[45%] -left-28 w-[580px] h-[580px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(52,211,153,0.06) 45%, transparent 70%)",
            filter: "blur(90px)",
            animationDelay: "4s",
            animationDuration: "22s",
          }}
        />

        {/* Blob 5: Celestial Magenta - Bottom Right */}
        <div
          className="absolute bottom-[10%] right-[3%] w-[580px] h-[580px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.06) 45%, transparent 70%)",
            filter: "blur(95px)",
            animationDelay: "8s",
            animationDuration: "26s",
          }}
        />
      </div>

      {/* ── 3. INTERACTIVE CONSTELLATION CANVAS ───────────────────────── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[2] opacity-80"
      />

      {/* ── 4. CYBER MATRIX PERSPECTIVE GRID ──────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)",
        }}
      />

      {/* ── 5. AMBIENT LIGHT SHAFTS ──────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden opacity-40">
        <div className="light-streak light-streak-1" />
        <div className="light-streak light-streak-2" />
        <div className="light-streak light-streak-3" />
      </div>

      {/* ── 6. CAMPUS EMBLEM WATERMARK (ETHEREAL DEPTH) ──────────────── */}
      <div
        className="fixed bottom-8 right-8 pointer-events-none z-[2] opacity-[0.05] animate-subtle-float"
        style={{ width: "160px", height: "160px" }}
      >
        <img
          src="/images/college-logo.png"
          alt=""
          className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]"
        />
      </div>

      {/* ── 7. FOREGROUND CONTENT ────────────────────────────────────── */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
