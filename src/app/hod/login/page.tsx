"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  KeyRound,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Compass,
  GraduationCap,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HODLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const demoAccounts = [
    {
      name: "Prof. John Smith",
      code: "HOD-CS-001",
      pass: "HOD@CS2026!",
      dept: "Computer Science & AI",
      role: "Department Chair",
      badge: "🔒 CS Locked",
    },
    {
      name: "Prof. Sarah Jones",
      code: "HOD-MATH-002",
      pass: "HOD@MATH2026!",
      dept: "Mathematics",
      role: "Department Chair",
      badge: "🔒 MATH Locked",
    },
    {
      name: "Prof. David Lee",
      code: "HOD-EE-003",
      pass: "HOD@EE2026!",
      dept: "Electrical Engineering",
      role: "Lead HOD",
      badge: "🔒 EE Locked",
    },
    {
      name: "Dr. Arthur Vance",
      code: "HOD-ALL-000",
      pass: "HOD@Admin2026!",
      dept: "All Departments",
      role: "Dean of Academic Affairs",
      badge: "🌐 Multi-Dept Switcher",
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
      const res = await fetch("/api/hod/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (typeof window !== "undefined" && data.session) {
        localStorage.setItem("hod_session", JSON.stringify(data.session));
      }

      setSuccessMsg(`Welcome, ${data.session.title || data.session.name}!`);
      setTimeout(() => {
        window.location.href = "/hod/dashboard";
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 lg:p-8 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 z-10">
        {/* Brand Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/25 mb-1">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Smart University HOD Portal</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Executive Department Operations, Cognitive Intelligence, Risk Orchestration & Policy Governance
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white font-semibold flex items-center justify-between">
              <span>HOD & Academic Governance Sign In</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                Department Isolated
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Enter your assigned HOD Identifier or department credentials to access operations governance.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
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
                  HOD ID / University Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="e.g. HOD-CS-001 or hod.cs@smartuniversity.edu"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                    Unique Governance Password
                  </Label>
                  <span className="text-[11px] text-blue-400">Policy Authorized</span>
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
                    className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all mt-2"
              >
                {loading ? "Authorizing HOD Access..." : "Sign In to HOD Portal"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </form>

          {/* Quick Demo Login Chips */}
          <div className="p-4 mx-6 mb-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>1-Click Test HOD Accounts</span>
              </div>
              <span className="text-[10px] text-slate-500">Department Governance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.code}
                  type="button"
                  onClick={() => handleDemoFill(acc)}
                  disabled={loading}
                  className="p-2.5 text-left rounded-lg bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-200 group-hover:text-blue-300 truncate">{acc.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {acc.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{acc.role} • {acc.dept}</p>
                  <Badge variant="outline" className="mt-1.5 text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-300 bg-blue-500/10">
                    {acc.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <CardFooter className="flex flex-col space-y-3 pt-0 text-center border-t border-slate-800/60 p-4">
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <Link href="/faculty/login" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Faculty Portal &rarr;
              </Link>
              <Link href="/dashboard" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Main Portal &rarr;
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
