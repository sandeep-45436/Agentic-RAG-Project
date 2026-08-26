"use client";

import React from "react";
import {
  FlaskConical,
  Sparkles,
  DollarSign,
  FileText,
  Users,
  Award,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODResearchPage() {
  const { activeDepartment } = useHOD();

  const projects = [
    {
      id: "res_001",
      title: "Agentic Cognitive Architectures for Multimodal University RAG",
      pi: "Prof. John Smith",
      grantAmount: "$85,000",
      agency: "National Science & AI Foundation",
      status: "ACTIVE",
      progress: "Year 2 of 3",
      papers: 3,
    },
    {
      id: "res_002",
      title: "Distributed Fault-Tolerant Raft Consensus in Low-Latency Clouds",
      pi: "Prof. David Lee",
      grantAmount: "$55,000",
      agency: "Industrial Research Council",
      status: "ACTIVE",
      progress: "Year 1 of 2",
      papers: 2,
    },
    {
      id: "res_003",
      title: "Numerical Optimization in Sparse Graph Embeddings",
      pi: "Prof. Sarah Jones",
      grantAmount: "$40,000",
      agency: "Mathematical Sciences Grant",
      status: "COMPLETED",
      progress: "Completed 2026",
      papers: 4,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-blue-400" />
            Department Research & Sponsored Grants
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sponsored research projects, external funding, and academic publication tracking for {activeDepartment}
          </p>
        </div>
      </div>

      {/* Top Grant KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Sponsored Funding</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">$180,000</p>
              <p className="text-[10px] text-emerald-400 font-medium">3 Active / Funded Grants</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Published Papers (2026)</p>
              <p className="text-2xl font-bold text-white mt-0.5">9 Papers</p>
              <p className="text-[10px] text-blue-400 font-medium">IEEE / ACM / Springer</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Faculty PIs Engaged</p>
              <p className="text-2xl font-bold text-purple-400 mt-0.5">3 Investigators</p>
              <p className="text-[10px] text-purple-400 font-medium">100% Department Engagement</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {projects.map((proj) => (
          <Card key={proj.id} className="bg-slate-900/80 border-slate-800 backdrop-blur">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm">{proj.title}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-mono">
                    {proj.grantAmount}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 ${
                      proj.status === "ACTIVE"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {proj.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Lead PI: <span className="text-slate-200 font-semibold">{proj.pi}</span> • Agency: {proj.agency}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shrink-0">
                <div>
                  <span className="text-slate-500 block text-[10px]">Timeline</span>
                  <span className="text-white font-bold">{proj.progress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Publications</span>
                  <span className="text-blue-400 font-bold">{proj.papers} Papers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
