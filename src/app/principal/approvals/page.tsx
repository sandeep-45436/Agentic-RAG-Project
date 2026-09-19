"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Coins,
  GraduationCap,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/animated-background";

export default function PrincipalApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/principal/approvals");
      const data = await res.json();
      if (data.success && data.approvals) {
        setApprovals(data.approvals);
      }
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT" | "HOLD") => {
    try {
      const res = await fetch("/api/principal/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: id, action }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        setApprovals((prev) => prev.filter((a) => a.id !== id));
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  const filtered =
    selectedCategory === "ALL"
      ? approvals
      : approvals.filter((a) => a.category === selectedCategory);

  return (
    <AnimatedBackground>
      <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/principal"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Principal Command
            </Link>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
              Executive University Approvals & Statutory Registry
            </h1>
            <p className="text-xs text-slate-500">
              Authoritative decisions on institutional budgets, faculty tenure, curriculum modifications, and student policy dispensations
            </p>
          </div>

          <button
            onClick={loadApprovals}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white/80 border border-slate-200 rounded-xl transition-colors backdrop-blur-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Action Notification Alert */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "All Council Matters" },
            { id: "BUDGET_ALLOCATION", label: "Budget & CapEx" },
            { id: "FACULTY_TENURE", label: "Faculty Tenure" },
            { id: "CURRICULUM_REVISION", label: "Curriculum Revisions" },
            { id: "POLICY_CONDONATION", label: "Policy Dispensations" },
            { id: "INFRASTRUCTURE", label: "Infrastructure" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
                selectedCategory === tab.id
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-white/80 text-slate-500 hover:text-slate-800 border border-slate-200 backdrop-blur-sm"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Approvals Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
              <span>Loading executive docket...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/80 border border-slate-200 text-slate-500 space-y-2 backdrop-blur-sm light-glass-card">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Council Docket Clear</h3>
              <p className="text-xs">No pending items requiring Principal sign-off in this category.</p>
            </div>
          ) : (
            filtered.map((app, index) => (
              <div
                key={app.id}
                className={`rounded-3xl bg-white/80 border border-slate-200 p-6 backdrop-blur-sm shadow-lg space-y-4 hover:border-amber-500/40 transition-colors light-glass-card card-3d-inner anim-fade-up-${Math.min(index + 1, 5)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                        {app.category.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 font-mono">
                        {app.departmentCode} • {app.collegeName}
                      </Badge>
                      {app.financialImpactUsd && (
                        <span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded number-pop">
                          Impact: ${app.financialImpactUsd.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-800 pt-1 text-reveal">
                      {app.title}
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans max-w-3xl">
                      {app.justification}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 font-mono block">Submitted: {app.submittedDate}</span>
                    <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Sponsor: {app.submittedBy}</span>
                  </div>
                </div>

                {/* AI Risk Scan Assessment */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-700">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 text-[11px] uppercase tracking-wider font-bold">
                      Autonomous Governance Intelligence Insight:
                    </strong>
                    <p className="text-slate-700 text-xs mt-0.5">{app.aiRiskAssessment}</p>
                  </div>
                </div>

                {/* Resolution Buttons */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Authority: Plenary Vice-Chancellor Discretion
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(app.id, "HOLD")}
                      className="border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs rounded-xl"
                    >
                      Hold for Senate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(app.id, "REJECT")}
                      className="text-xs rounded-xl"
                    >
                      Reject Docket
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction(app.id, "APPROVE")}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
                    >
                      Seal & Ratify
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
