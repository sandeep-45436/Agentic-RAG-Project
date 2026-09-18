"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Building,
  UploadCloud,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CertificationsPortfolioPage() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [issuer, setIssuer] = useState("");
  const [title, setTitle] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [issueDate, setIssueDate] = useState("");

  const loadCerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/certifications");
      const data = await res.json();
      if (data.success) {
        setCertifications(data.certifications);
      }
    } catch (err) {
      console.error("Failed to load certifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCerts();
  }, []);

  const handleVerifyNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuer || !title || !credentialId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/skills/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuer,
          title,
          credentialId,
          issueDate: issueDate || new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCertifications((prev) => [data.certification, ...prev]);
        setShowModal(false);
        setIssuer("");
        setTitle("");
        setCredentialId("");
        setIssueDate("");
      }
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Skill Center
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Award className="h-6 w-6 text-cyan-400" />
            Industry Micro-Credentials & Certifications
          </h1>
          <p className="text-xs text-slate-400">
            Cryptographically verifiable credentials synced with university SIS and placement portal
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Submit New Credential
        </Button>
      </div>

      {/* Certifications Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="text-xs">Validating credential signatures...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 backdrop-blur flex flex-col justify-between hover:border-cyan-500/40 hover-lift shadow-xl space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Award className="h-6 w-6" />
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      cert.status === "VERIFIED"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    {cert.status === "VERIFIED" ? "Verified Signature" : "Pending Audit"}
                  </Badge>
                </div>

                <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider block">
                  {cert.issuer}
                </span>

                <h3 className="text-base font-bold text-white mt-1 leading-snug">
                  {cert.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>ID: {cert.credentialId}</span>
                  <span>•</span>
                  <span>Issued: {cert.issueDate}</span>
                </div>

                {/* Credited Skills */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Skills Credited to University Profile:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.skillsCredited?.map((sk: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-md"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Score: {cert.verificationScore}%
                </span>
                <span className="text-slate-500 text-[11px]">Authorized Credly Bridge</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-cyan-400" />
                Submit Credential Verification
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleVerifyNew} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Certification Authority / Issuer</label>
                <Input
                  placeholder="e.g. Amazon Web Services, Google Cloud, Cisco"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Certification Official Title</label>
                <Input
                  placeholder="e.g. AWS Certified Solutions Architect Associate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Credential ID / Verification Hash</label>
                <Input
                  placeholder="e.g. AWS-SAA-904128"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Issue Date</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
                  Verify & Ingest
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
