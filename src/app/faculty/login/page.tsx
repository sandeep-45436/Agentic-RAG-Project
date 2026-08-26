"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  KeyRound,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FacultyLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const demoAccounts = [
    {
      name: "Prof. John Smith",
      code: "FAC-CS-001",
      pass: "Faculty@CS2026!",
      dept: "Computer Science",
      role: "Professor & Chair",
    },
    {
      name: "Prof. Sarah Jones",
      code: "FAC-MATH-002",
      pass: "Faculty@MATH2026!",
      dept: "Mathematics",
      role: "Associate Professor",
    },
    {
      name: "Prof. David Lee",
      code: "FAC-EE-003",
      pass: "Faculty@EE2026!",
      dept: "Electrical Eng.",
      role: "Lead Lecturer",
    },
  ];

  const handleLogin = async (e?: React.FormEvent, customIdent?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const loginId = customIdent || identifier;
    const loginPass = customPass || password;

    try {
      const res = await fetch("/api/faculty/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPass }),
      });

      const data = await res.json();

      if (typeof window !== "undefined" && data.faculty) {
        localStorage.setItem("faculty_user", JSON.stringify(data.faculty));
      }

      setSuccessMsg(`Welcome, ${data.faculty.title || "Professor"} ${data.faculty.name}!`);
      setTimeout(() => {
        window.location.href = "/faculty/dashboard";
      }, 350);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (acc: typeof demoAccounts[0]) => {
    setIdentifier(acc.code);
    setPassword(acc.pass);
    handleLogin(undefined, acc.code, acc.pass);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 z-10">
        {/* Brand Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/25 mb-1">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Smart University Faculty Portal</h1>
          <p className="text-sm text-slate-400">
            Dedicated Academic Operations, Document Uploads & Examination Management
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white font-semibold flex items-center justify-between">
              <span>Faculty Sign In</span>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs">
                Unique Password Access
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Enter your assigned Faculty ID or university email with your unique password.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-medium text-slate-300">
                  Faculty ID or University Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="e.g. FAC-CS-001 or prof.smith@smartuniversity.edu"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                    Unique Faculty Password
                  </Label>
                  <span className="text-[11px] text-indigo-400">Assigned by Department</span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all mt-2"
              >
                {loading ? "Authenticating Faculty..." : "Sign In to Faculty Portal"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </form>

          {/* Quick Demo Login Chips */}
          <div className="p-4 mx-6 mb-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>1-Click Test Faculty Accounts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.code}
                  type="button"
                  onClick={() => handleDemoFill(acc)}
                  disabled={loading}
                  className="p-2 text-left rounded-lg bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
                >
                  <p className="font-semibold text-slate-200 group-hover:text-indigo-300 truncate">{acc.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{acc.code}</p>
                  <Badge variant="outline" className="mt-1 text-[9px] px-1 py-0 border-slate-700 text-slate-400">
                    {acc.dept}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <CardFooter className="flex flex-col space-y-3 pt-0 text-center border-t border-slate-800/60 p-4">
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <Link href="/dashboard" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Main University Portal
              </Link>
              <Link href="/login" className="hover:text-indigo-400 transition-colors">
                Admin / General Login &rarr;
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
