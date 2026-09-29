"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface QuantumNexusLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export function QuantumNexusLoader({
  size = "md",
  text,
  className,
}: QuantumNexusLoaderProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const ringSizes = {
    sm: "inset-0.5",
    md: "inset-1",
    lg: "inset-1.5",
    xl: "inset-2",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative [perspective:800px] flex items-center justify-center", sizeMap[size])}>
        {/* Core Pulsing Energy Core */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 shadow-[0_0_16px_rgba(6,182,212,0.9)] animate-ping opacity-75" />
        <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />

        {/* Outer Ring A - Cyan / Electric Blue */}
        <div
          className={cn(
            "absolute rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-500/40 animate-quantum-a",
            ringSizes[size]
          )}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Middle Ring B - Indigo / Violet */}
        <div
          className={cn(
            "absolute rounded-full border-2 border-transparent border-b-indigo-400 border-l-purple-500/40 animate-quantum-b",
            ringSizes[size]
          )}
          style={{ width: "88%", height: "88%" }}
        />

        {/* Inner Ring C - Amber / Emerald Spark */}
        <div
          className={cn(
            "absolute rounded-full border-2 border-transparent border-t-pink-400 border-b-emerald-400/50 animate-quantum-c",
            ringSizes[size]
          )}
          style={{ width: "74%", height: "74%" }}
        />
      </div>

      {text && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-300 animate-pulse">
            {text}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Neural Synapse Loader ─────────────────────────────────────────────────────

export function NeuralSynapseLoader({
  text = "Synthesizing Neural Reasoning...",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 backdrop-blur-xl shadow-xl", className)}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Central Core */}
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
        
        {/* Orbital Nodes */}
        {[0, 90, 180, 270].map((deg, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-orbital-spin"
            style={{
              transformOrigin: "16px 16px",
              transform: `rotate(${deg}deg) translate(12px) rotate(-${deg}deg)`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          {text}
        </span>
        <span className="text-[10px] text-indigo-300/80 font-mono">
          Traversing vector clusters & cross-verifying grounding
        </span>
      </div>
    </div>
  );
}

// ── Holographic Laser Scanner Loader ──────────────────────────────────────────

export function CyberScanLoader({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-700/60 p-6", className)}>
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)] animate-laser-scan pointer-events-none" />
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded-md w-3/4 animate-pulse" />
        <div className="h-3 bg-white/5 rounded-md w-full animate-pulse" />
        <div className="h-3 bg-white/5 rounded-md w-5/6 animate-pulse" />
      </div>
    </div>
  );
}

// ── Soundwave Equalizer ───────────────────────────────────────────────────────

export function SoundwaveVisualizer({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-1 h-5", className)}>
      {[0.4, 0.8, 1, 0.6, 0.3].map((height, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 transition-all duration-300",
            active ? "animate-soundwave-bar" : "h-1 opacity-40"
          )}
          style={{
            height: active ? "100%" : "20%",
            animation: active ? `soundwaveBar 1.2s ease-in-out infinite` : "none",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}
