"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Scale,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UnifiedAuthGatewayPage() {
  const portals = [
    {
      id: "student",
      title: "Student Academic AI Portal",
      role: "Undergraduate / Postgraduate Students",
      desc: "Instant syllabus retrieval, course prerequisite checking, and live PDF page-range slicing downloads.",
      icon: MessageSquare,
      color: "from-indigo-600 to-cyan-600",
      border: "border-indigo-500/30 hover:border-indigo-500/60",
      bgGlow: "bg-indigo-500/10",
      badge: "Student Access",
      loginUrl: "/login",
      signupUrl: "/signup",
      bullets: [
        "Natural language Q&A across enrolled courses",
        "PDF page-range slices & citations",
        "Exam schedules & seating locations",
      ],
    },
    {
      id: "faculty",
      title: "Faculty Operations Portal",
      role: "Professors & Department Lecturers",
      desc: "Upload syllabi and exam documents, configure weekly timetable slots, and inspect anti-malpractice seating.",
      icon: GraduationCap,
      color: "from-purple-600 to-indigo-600",
      border: "border-purple-500/30 hover:border-purple-500/60",
      bgGlow: "bg-purple-500/10",
      badge: "Faculty Operations",
      loginUrl: "/faculty/login",
      signupUrl: "/faculty/login",
      bullets: [
        "Document ingestion with automatic vector RAG",
        "Weekly lecture matrix & room management",
        "Anti-malpractice 2D seating allocations",
      ],
    },
    {
      id: "hod",
      title: "HOD & Dean Governance Portal",
      role: "Department Heads & Academic Deans",
      desc: "7-Dimension department health score, AI command center, faculty workload limits, student risk radar, and action proposals.",
      icon: Scale,
      color: "from-blue-600 via-indigo-600 to-purple-600",
      border: "border-blue-500/40 hover:border-blue-500/70",
      bgGlow: "bg-blue-500/15",
      badge: "🔒 Department Scope Isolated",
      loginUrl: "/hod/login",
      signupUrl: "/hod/signup",
      bullets: [
        "7-Dimension Department Health Index & Provenance",
        "What Changed? Weekly delta drift tracker",
        "Multi-tiered action proposals with policy evidence",
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl space-y-8 z-10 py-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Smart University Institutional Authentication Gateway</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Select Your Campus Portal
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Separate, role-isolated authentication gateways ensuring strict academic boundaries between students, teaching faculty, and department heads.
          </p>
        </div>

        {/* 3 Dedicated Gateways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card
                key={portal.id}
                className={`bg-slate-900/80 border ${portal.border} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-2xl flex flex-col justify-between`}
              >
                <div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-3 rounded-2xl ${portal.bgGlow} border border-white/10`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-slate-800/80 text-slate-300 border-slate-700">
                        {portal.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-white mt-1">{portal.title}</CardTitle>
                    <p className="text-xs text-indigo-400 font-medium">{portal.role}</p>
                    <CardDescription className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {portal.desc}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs pt-0">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Key Capabilities
                      </span>
                      {portal.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{b}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-2 flex flex-col gap-2.5 border-t border-slate-800">
                  <Link
                    href={portal.loginUrl}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${portal.color} hover:opacity-95 text-white text-xs font-semibold shadow-lg transition-all`}
                  >
                    <span>Sign In to {portal.id.toUpperCase()}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {portal.signupUrl && portal.id !== "faculty" && (
                    <Link
                      href={portal.signupUrl}
                      className="w-full text-center py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      {portal.id === "hod" ? "Register New Department HOD &rarr;" : "Create Student Account &rarr;"}
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-4">
          <p>Institutional Security Notice: Session hijacking between student and governance scopes is strictly prevented.</p>
        </div>
      </div>
    </div>
  );
}
