"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, LayoutDashboard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 text-foreground">
      <div className="max-w-md w-full text-center space-y-5 bg-card border border-border/60 p-8 rounded-2xl shadow-xl backdrop-blur-xl">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <LayoutDashboard className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Dashboard Loading Notice</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The dashboard encountered a temporary loading issue. You can retry or return to login.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border/80 bg-background text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Go to Login
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
