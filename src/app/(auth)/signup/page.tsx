"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupAction, verifyEmailAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Mail, RefreshCw, ArrowLeft, CheckCircle2, GraduationCap, Scale } from "lucide-react";

type Step = "signup" | "verify";

const DEPARTMENTS = [
  { code: "CS", name: "Computer Science & Engineering" },
  { code: "MATH", name: "Mathematics & Computing" },
  { code: "EE", name: "Electrical & Electronics Engineering" },
];

export default function SignupPage() {
  const [step, setStep] = useState<Step>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("CS");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signupAction({
        email,
        password,
        fullName,
        departmentCode,
      });

      if (!res.success) {
        setError(res.error || "Failed to sign up");
        return;
      }

      if (res.requireVerification) {
        setStep("verify");
        return;
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await verifyEmailAction({ email, otp: code });

      if (!res.success) {
        setError(res.error || "Invalid or expired code. Please try again.");
        return;
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d?.error || "Failed to resend code.");
      } else {
        setResent(true);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md shadow-2xl border-indigo-500/20 bg-slate-950/90 backdrop-blur-xl">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="bg-blue-500/10 p-3 rounded-full">
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Check your email</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              We sent a 6-digit code to <span className="text-cyan-400 font-medium">{email}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4 text-xs">
            {error && (
              <div className="bg-destructive/15 text-destructive text-xs p-3 rounded-xl border border-destructive/30">
                {error}
              </div>
            )}
            {resent && (
              <div className="bg-emerald-500/15 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>New code sent! Please check your inbox.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-center block text-slate-300">Enter verification code</Label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="w-11 h-12 text-center text-lg font-bold border border-slate-800 bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none"
                  />
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl" disabled={loading}>
              {loading ? "Verifying..." : "Verify and Continue"}
            </Button>
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setStep("signup")}
                className="flex items-center gap-1 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Resend code"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-indigo-500/20 bg-slate-950/90 backdrop-blur-xl">
      <CardHeader className="space-y-3 items-center text-center">
        <div className="bg-gradient-to-tr from-indigo-600 to-cyan-500 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Create Student Account</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Sign up and select your academic department to access scoped syllabus and course documents
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-3.5 text-xs">
          {error && (
            <div className="bg-destructive/15 text-destructive text-xs p-3 rounded-xl border border-destructive/30">
              {error}
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="dept" className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Your Department *</span>
              <span className="text-[10px] text-cyan-400 font-mono">Scoped Documents</span>
            </Label>
            <select
              id="dept"
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              disabled={loading}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-slate-300 font-semibold">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 font-semibold">University Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@students.smartuniversity.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account & Enter Portal"}
          </Button>
          <div className="text-xs text-center text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
