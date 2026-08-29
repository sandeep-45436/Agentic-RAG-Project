"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, GraduationCap, Scale, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { loginAction } from "@/server/actions/auth";

const DEPARTMENTS = [
  { code: "CS", name: "Computer Science & Engineering" },
  { code: "MATH", name: "Mathematics & Computing" },
  { code: "EE", name: "Electrical & Electronics Engineering" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentCode, setDepartmentCode] = useState("CS");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginAction({ email, password, departmentCode });

      if (!res.success) {
        setError(res.error || "Failed to sign in");
        return;
      }

      // Hard redirect so proxy and middleware read fresh session cookies
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-indigo-500/20 bg-slate-950/90 backdrop-blur-xl">
      <CardHeader className="space-y-3 items-center text-center">
        <div className="bg-gradient-to-tr from-indigo-600 to-cyan-500 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Student Academic Portal</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Sign in to access your department syllabus, course documents, and AI assistant
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 text-xs">
          {error && (
            <div className="bg-destructive/15 text-destructive text-xs p-3 rounded-xl border border-destructive/30">
              {error}
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="dept" className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Select Your Department *</span>
              <span className="text-[10px] text-cyan-400 font-mono">Scoped Documents</span>
            </Label>
            <div className="relative">
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 font-semibold">Email Address</Label>
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
            {loading ? "Signing in..." : "Sign in to Dashboard"}
          </Button>
          <div className="text-xs text-center text-slate-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-cyan-400 hover:underline font-semibold">
              Sign up with Department
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-xs text-slate-400">
            <Link href="/faculty/login" className="hover:text-purple-300 transition-colors flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
              Faculty Portal
            </Link>
            <Link href="/hod/login" className="hover:text-blue-300 transition-colors flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-blue-400" />
              HOD Portal &rarr;
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
