"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/insforge/client";
import { syncUserToDatabase } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, GraduationCap, Scale } from "lucide-react";

import { loginAction } from "@/server/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginAction({ email, password });

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
    <Card className="w-full max-w-md shadow-lg border-primary/10">
      <CardHeader className="space-y-3 items-center text-center">
        <div className="bg-primary/10 p-3 rounded-full">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="pt-2 border-t border-border/60 w-full flex items-center justify-between text-xs text-muted-foreground">
            <Link href="/faculty/login" className="hover:text-primary transition-colors flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
              Faculty Portal
            </Link>
            <Link href="/hod/login" className="hover:text-primary transition-colors flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-blue-400" />
              HOD Portal &rarr;
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
