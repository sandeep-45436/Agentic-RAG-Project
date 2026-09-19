"use client";

import { AnimatedBackground } from "@/components/animated-background";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
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

      if (!res.ok || !data.success || !data.faculty) {
        throw new Error(data.error || "Invalid faculty credentials.");
      }

      if (typeof window !== "undefined" && data.faculty) {
        localStorage.setItem("faculty_user", JSON.stringify(data.faculty));
      }

      setSuccessMsg(`Welcome, ${data.faculty.title || "Professor"} ${data.faculty.name}!`);
      setTimeout(() => {
        router.replace("/faculty/dashboard");
      }, 200);
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
    <AnimatedBackground variant="subtle">
      <div className="min-h-screen w-full text-slate-100 flex flex-col justify-center items-center p-4 lg:p-8 relative overflow-hidden font-sans">
        <div className="w-full max-w-lg space-y-6 z-10">
          {/* Brand Top Header */}
          <div className="text-center space-y-2">
            <div className="flex flex-col items-center gap-2 mb-1">
              <img
                src="/images/college-logo.png"
                alt="ALITS College Logo"
                className="h-16 w-auto object-contain drop-shadow-md"
              />
              <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                Anantha Lakshmi Institute of Technology & Sciences
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Faculty Login</h1>
            <p className="text-sm text-slate-600">
              Dedicated Academic Operations, Document Uploads & Examination Management
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-indigo-100 backdrop-blur-xl shadow-2xl light-glass-card anim-fade-up-1">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-slate-900 font-semibold flex items-center justify-between">
                <span>Faculty Sign In</span>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-500/30 text-xs">
                  Unique Password Access
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs">
                Enter your assigned Faculty ID or university email with your unique password.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-xl animate-shake">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="identifier" className="text-xs font-medium text-slate-700">
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
                      className="pl-10 border-indigo-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                      Unique Faculty Password
                    </Label>
                    <span className="text-[11px] text-indigo-600">Assigned by Department</span>
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
                      className="pl-10 border-indigo-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all mt-2"
                >
                  {loading ? "Authenticating Faculty..." : "Faculty Login"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </form>

            {/* Quick Demo Login Chips */}
            <div className="p-4 mx-6 mb-4 rounded-xl border border-indigo-100/80 space-y-2.5 bg-indigo-50/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>1-Click Test Faculty Accounts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.code}
                    type="button"
                    onClick={() => handleDemoFill(acc)}
                    disabled={loading}
                    className="p-2 text-left rounded-lg bg-white/80 hover:bg-indigo-100/60 border border-indigo-100 hover:border-indigo-500/40 transition-all text-xs group"
                  >
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-700 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{acc.code}</p>
                    <Badge variant="outline" className="mt-1 text-[9px] px-1 py-0 border-indigo-100 text-slate-600">
                      {acc.dept}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <CardFooter className="flex flex-col space-y-3 pt-0 text-center border-t border-indigo-100/60 p-4">
              <div className="flex items-center justify-between w-full text-xs text-slate-600">
                <Link href="/dashboard" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Student Portal
                </Link>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Student Login &rarr;
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  );
}
