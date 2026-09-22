"use client";
import { AnimatedBackground } from "@/components/animated-background";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Award,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Code2,
  Cpu,
  Database,
  Shield,
  Layers,
  Star,
  Flame,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { DedicatedCopilotDrawer } from "@/components/ai/DedicatedCopilotDrawer";

export default function SkillDevelopmentPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load skills portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tracks = data?.tracks || [];
  const profile = data?.profile || {
    overallSkillScore: 84,
    completedCertificationsCount: 5,
    hoursLearned: 142,
    rankingPercentile: 94,
    radarData: [],
    recentBadges: [],
  };
  const roadmap = data?.roadmap;

  const filteredTracks =
    activeCategory === "ALL"
      ? tracks
      : tracks.filter((t: any) => t.category.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <AnimatedBackground>
      <div className="space-y-6 pb-12 font-sans">
      {/* ── TOP CALLOUT BANNER TO NEW ADVANCED PLACEMENT PORTAL ── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 border border-cyan-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">Campus Placement Command Center is Live!</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                8 Active Drives
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Explore corporate recruitment drives (Amazon, Google, Microsoft), live application Kanban pipeline, AI ATS resume optimizer, and technical viva arena.
            </p>
          </div>
        </div>
        <Link
          href="/placement"
          className="shrink-0 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Launch Placement Hub</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── PLACEMENT CENTER CAREER LAUNCHPAD SUB-FEATURES HUB ───────── */}
      <div className="bg-white/95 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shadow-xs">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Placement Center • Career Modules Hub</h2>
              <p className="text-[11px] text-slate-500">Industry competency tracking, live coding tests, verified certifications, and interview preparation</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 w-fit">
            4 Career Sub-Features Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/placement"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-cyan-300 bg-cyan-50/50 hover:bg-white hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700 group-hover:scale-105 transition-transform">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">Live Hub</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">Placement Command Hub</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Corporate drives, application pipeline & ATS match</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-cyan-700">
              <span>Open Placement Portal</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/skills/assessment"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                <Award className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Assessments</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Skill Assessment Arena</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Live technical challenges & mock interview tests</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-emerald-700">
              <span>Enter Arena</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/skills/certifications"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">Credentials</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Industry Certifications</p>
              <p className="text-[11px] text-slate-500 mt-0.5">AWS, Google Cloud, Cisco & Microsoft verified badges</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-indigo-700">
              <span>Inspect Badges</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/student/profile"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Profile</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Candidate Profile & Resume</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified skill dossier, GitHub projects & academic record</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center text-[10px] font-semibold text-purple-700">
              <span>View Dossier</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── 1. ALITS INSTITUTIONAL SKILLS HEADER ──────────────────────── */}
      <div className="light-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="relative h-11 w-36 sm:w-44 flex items-center justify-start">
            <img
              src="/images/college-logo.png"
              alt="ALITS University Logo"
              className="h-10 object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-xs font-bold text-slate-900 block tracking-tight">
              Anantha Lakshmi Institute of Technology & Sciences
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Career Competency Accelerator & Skills Radar System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/profile"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-3.5 py-2 rounded-xl transition-colors"
          >
            My Student Profile →
          </Link>
        </div>
      </div>

      {/* ── 2. HERO BANNER WITH ADVANCED NEON GLOW ───────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border border-cyan-500/30 p-6 lg:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/40 text-xs font-semibold px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 mr-1" /> Next-Gen Technical Upskilling
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                Top {100 - profile.rankingPercentile}% University Cohort
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                Candidate: <strong className="text-white">{profile.studentName}</strong> ({profile.studentCode})
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Placement Center & Career Launchpad
            </h1>

            <p className="text-sm text-slate-700 max-w-2xl leading-relaxed">
              Synthesize industry micro-credentials, take adaptive algorithmic challenges, track multi-dimensional skill radars, and unlock elite tech placement tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/skills/assessment"
              className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 text-xs px-4 py-3 transition-all hover:scale-105 gap-2"
            >
              <Zap className="h-4 w-4 fill-current" />
              Launch Assessment Arena
            </Link>

            <Link
              href="/skills/certifications"
              className="inline-flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold px-4 py-3 transition-all gap-2"
            >
              <Award className="h-4 w-4 text-cyan-400" />
              Credentials Portfolio ({profile.completedCertificationsCount})
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 border border-slate-200 rounded-xl transition-colors"
              title="Refresh skills state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. FOUR ANIMATED METRIC CARDS ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-5 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Overall Skill Score</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{profile.overallSkillScore}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <p className="text-[11px] text-cyan-300 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% improvement this semester
            </p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-5 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Verified Credentials</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{profile.completedCertificationsCount}</span>
              <span className="text-xs text-slate-500">Badges</span>
            </div>
            <p className="text-[11px] text-indigo-300 mt-1">
              AWS, GCP, NVIDIA & Cisco Validated
            </p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-5 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Focused Learning Time</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{profile.hoursLearned}</span>
              <span className="text-xs text-slate-500">Hours</span>
            </div>
            <p className="text-[11px] text-emerald-300 mt-1">
              42 Lab exercises completed
            </p>
          </div>
        </div>

        <div className="light-glass-card card-3d-inner shimmer-effect rounded-2xl p-5 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Placement Readiness</span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{roadmap?.overallReadiness || 86}%</span>
              <span className="text-xs text-slate-500">Index</span>
            </div>
            <p className="text-[11px] text-amber-300 mt-1 truncate">
              {roadmap?.projectedPlacementTier || "Super Dream Tier"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. TWO-COLUMN: SKILL RADAR & AI CAREER ROADMAP ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Multi-Dimensional Skill Radar */}
        <div className="lg:col-span-5 rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200 p-6 backdrop-blur space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Cognitive Competency Radar
                </h3>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]">
                Adaptive Assessment
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time vector score compared with Top 10% university benchmark
            </p>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {profile.radarData && profile.radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={profile.radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                  <Radar
                    name="Your Score"
                    dataKey="currentScore"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.45}
                  />
                  <Radar
                    name="Class Benchmark"
                    dataKey="benchmarkAverage"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.15}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">Loading Radar...</div>
            )}
          </div>

          {/* Badges Gallery */}
          <div className="border-t border-slate-200/80 pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Earned Distinction Badges
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {profile.recentBadges?.map((b: any, i: number) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center hover:border-cyan-500/40 transition-colors">
                  <div className="mx-auto w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1">
                    <Star className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-bold text-white truncate">{b.name}</p>
                  <span className="text-[9px] text-cyan-300/80 font-mono">{b.rarity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: AI Career Roadmap & Milestone Milestones */}
        <div className="lg:col-span-7 rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200 p-6 backdrop-blur space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Target Career Trajectory & Readiness
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Role: <strong className="text-indigo-300">{roadmap?.targetRole}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                {roadmap?.salaryBand}
              </span>
            </div>
          </div>

          {/* Timeline Stages */}
          <div className="space-y-3">
            {roadmap?.stages?.map((st: any) => (
              <div
                key={st.stepNumber}
                className={`p-3.5 rounded-2xl border transition-all ${
                  st.status === "COMPLETED"
                    ? "bg-emerald-950/10 border-emerald-500/30"
                    : st.status === "IN_PROGRESS"
                    ? "bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200/80 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        st.status === "COMPLETED"
                          ? "bg-emerald-500 text-slate-950"
                          : st.status === "IN_PROGRESS"
                          ? "bg-indigo-500 text-white animate-pulse"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {st.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-white">{st.title}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      st.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : st.status === "IN_PROGRESS"
                        ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                        : "bg-slate-800 text-slate-500 border-slate-200"
                    }`}
                  >
                    {st.status === "IN_PROGRESS" ? `In Progress (${st.estimatedWeeks}w remaining)` : st.status}
                  </Badge>
                </div>

                <div className="space-y-1 pl-7">
                  <p className="text-[11px] text-slate-500">Target Level: <span className="text-slate-200">{st.roleTarget}</span></p>
                  <ul className="text-[11px] text-slate-700 space-y-0.5">
                    {st.recommendations?.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-cyan-400 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Missing Competencies Alert */}
          {roadmap?.missingCompetencies && (
            <div className="p-3.5 rounded-2xl bg-amber-950/15 border border-amber-500/30 space-y-1.5">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Flame className="h-4 w-4" /> Recommended Next Competency Focus:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roadmap.missingCompetencies.map((comp: string, i: number) => (
                  <span key={i} className="text-[10px] bg-amber-500/10 text-amber-200 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. INDUSTRY LEARNING TRACKS CATALOG ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              Accredited Engineering Specialization Tracks
            </h2>
            <p className="text-xs text-slate-500">
              Interactive curriculums aligned with Tier-1 industry hiring expectations
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["ALL", "Artificial Intelligence", "Cloud Architecture", "Software Development", "Cybersecurity"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    activeCategory === cat
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat === "ALL" ? "All Tracks" : cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTracks.map((tr: any) => (
            <div
              key={tr.id}
              className="group rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200 p-5 backdrop-blur flex flex-col justify-between hover:border-cyan-500/40 hover-lift shadow-xl space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${tr.color} text-white shadow-md`}>
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
                      Demand: {tr.marketDemandIndex}%
                    </Badge>
                    <span className="text-[10px] text-slate-500 mt-0.5">{tr.level} Level</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {tr.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {tr.description}
                </p>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Track Completion</span>
                    <span className="text-cyan-400 font-bold font-mono">{tr.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${tr.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Current Active Module */}
                <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Current Milestone:</span>
                  <p className="text-[11px] text-slate-700 font-medium truncate mt-0.5">
                    {tr.currentModule}
                  </p>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {tr.skillsAcquired?.slice(0, 3).map((sk: string, i: number) => (
                    <span key={i} className="text-[10px] bg-white/5 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80">
                      {sk}
                    </span>
                  ))}
                  {tr.skillsAcquired?.length > 3 && (
                    <span className="text-[10px] text-slate-500 px-1 py-0.5">+{tr.skillsAcquired.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {tr.completedModules}/{tr.totalModules} Modules • {tr.estimatedHours}h
                </span>

                <Link
                  href="/skills/assessment"
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-1 transition-transform"
                >
                  Continue Track <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PLACEMENT ORCHESTRATOR DEDICATED LANGGRAPH COPILOT DRAWER ── */}
      <DedicatedCopilotDrawer
        role="placement"
        title="Placement Orchestrator"
        subtitle="JD Parsing • Deterministic Eligibility & Ranking • Mock Viva"
        quickPrompts={[
          { label: "Configure Campus Drive (Amazon AWS)", query: "We are recruiting for Amazon Web Services Cloud Associate. Minimum CGPA 7.5, zero active backlogs, skills: Python, AWS, SQL. Shortlist eligible candidates and generate technical viva questionnaire." },
          { label: "Filter Eligible Candidates for Top Tech", query: "Run deterministic eligibility check on candidate cohort with cutoff CGPA >= 8.0 and no backlogs." },
          { label: "Generate Technical Viva & Coding Challenge", query: "Synthesize 5-question technical interview questionnaire and algorithmic challenge for Distributed Systems & Cloud." }
        ]}
      />
    </div>
    </AnimatedBackground>
  );
}
