"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Filter,
  RefreshCw,
  FileText,
  User,
  Sparkles,
  ExternalLink,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHOD } from "../layout";

export default function HODApprovalCenterPage() {
  const { activeDepartment, session } = useHOD();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; text: string; type: "success" | "info" | "error" } | null>(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hod/proposals?department=${activeDepartment}`);
      const data = await res.json();
      if (data.proposals) {
        setProposals(data.proposals);
      }
    } catch (err) {
      console.error("Failed to load approval proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [activeDepartment]);

  const handleAction = async (proposalId: string, action: "APPROVE" | "REJECT" | "ESCALATE") => {
    try {
      setProcessingId(proposalId);
      const res = await fetch("/api/hod/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          action,
          confirmedBy: session?.name || "HOD Admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          id: proposalId,
          text: data.message || `Action ${action} executed successfully.`,
          type: action === "APPROVE" ? "success" : action === "REJECT" ? "error" : "info",
        });
        fetchProposals();
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to resolve action proposal:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const categories = [
    { id: "ALL", label: "All Items" },
    { id: "ATTENDANCE_CONDONATION", label: "Attendance Condonations" },
    { id: "SECTION_REDISTRIBUTION", label: "Faculty Reallocations" },
    { id: "EXAM_POLICY_EXCEPTION", label: "Hall Ticket Exceptions" },
    { id: "REMEDIAL_PROGRAM", label: "Remedial Program" },
  ];

  const filtered = selectedCategory === "ALL" ? proposals : proposals.filter((p) => p.category === selectedCategory);

  const pendingCount = proposals.filter((p) => p.status === "PENDING_HOD_CONFIRMATION").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-400" />
            Executive Department Approval Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Policy-grounded Human-in-the-Loop decision governance, attendance condonations, and workload exceptions for {activeDepartment}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs px-2.5 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {pendingCount} Pending Decision{pendingCount === 1 ? "" : "s"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProposals}
            disabled={loading}
            className="border-slate-700 bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : feedbackMsg.type === "error"
              ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
              : "bg-blue-500/10 text-blue-300 border-blue-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : feedbackMsg.type === "error" ? (
              <XCircle className="h-4 w-4 text-rose-400" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-blue-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <span className="text-[10px] text-slate-400">Audit record updated</span>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const count = cat.id === "ALL" ? proposals.length : proposals.filter((p) => p.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-800 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-white">All Governance Actions Resolved</h3>
            <p className="text-xs text-slate-400 mt-1">No pending action proposals requiring HOD sign-off in this category.</p>
          </Card>
        ) : (
          filtered.map((prop) => {
            const isPending = prop.status === "PENDING_HOD_CONFIRMATION";
            const isApproved = prop.status === "APPROVED";
            const isRejected = prop.status === "REJECTED";
            const isEscalated = prop.status.includes("ESCALATED");

            return (
              <Card
                key={prop.id}
                className={`border backdrop-blur transition-all ${
                  isPending
                    ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                    : isApproved
                    ? "bg-emerald-950/20 border-emerald-800/40"
                    : isRejected
                    ? "bg-rose-950/20 border-rose-800/40"
                    : "bg-purple-950/20 border-purple-800/40"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-mono ${
                            prop.category === "ATTENDANCE_CONDONATION"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : prop.category === "SECTION_REDISTRIBUTION"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                              : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          }`}
                        >
                          {prop.category.replace(/_/g, " ")}
                        </Badge>

                        <Badge
                          className={`text-[10px] ${
                            isPending
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : isRejected
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          }`}
                        >
                          {prop.status.replace(/_/g, " ")}
                        </Badge>

                        <span className="text-[11px] text-slate-500 font-mono">ID: {prop.id}</span>
                      </div>

                      <CardTitle className="text-base font-bold text-white">{prop.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-300">{prop.summary}</CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-[11px] font-medium text-slate-300">
                        AI Confidence: <strong className="text-white font-mono">{Math.round((prop.confidenceScore || 0.95) * 100)}%</strong>
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs border-t border-slate-800/80 pt-3">
                  {/* Evidence List */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-blue-400" />
                      Audited Evidence & Operational Facts:
                    </p>
                    <ul className="space-y-1 pl-1">
                      {prop.evidence?.map((ev: string, i: number) => (
                        <li key={i} className="text-slate-300 flex items-start gap-1.5 text-[11px]">
                          <span className="text-blue-400">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Policy References */}
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      Policy Grounding & Regulation Citations:
                    </p>
                    {prop.policyReferences?.map((pol: string, i: number) => (
                      <p key={i} className="text-[11px] text-slate-300 font-mono">
                        {pol}
                      </p>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
                  <div className="text-[11px] text-slate-400">
                    Required Authority: <strong className="text-slate-200">{prop.requiredAuthority}</strong> • Proposed by{" "}
                    <span className="text-blue-300 font-medium">{prop.proposedBy}</span>
                  </div>

                  {isPending ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleAction(prop.id, "APPROVE")}
                        disabled={processingId === prop.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex-1 sm:flex-none"
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Approve & Execute
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(prop.id, "REJECT")}
                        disabled={processingId === prop.id}
                        className="border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs rounded-xl flex-1 sm:flex-none"
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(prop.id, "ESCALATE")}
                        disabled={processingId === prop.id}
                        className="border-purple-800/60 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 text-xs rounded-xl flex-1 sm:flex-none"
                      >
                        <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                        Escalate to Dean
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Decision confirmed by {prop.confirmedBy || "HOD"} on {new Date(prop.confirmedAt || Date.now()).toLocaleString()}
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
