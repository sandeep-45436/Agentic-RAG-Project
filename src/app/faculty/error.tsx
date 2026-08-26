"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GraduationCap, RefreshCw, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FacultyErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Faculty Portal Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="max-w-md w-full text-center space-y-5 bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <GraduationCap className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">Faculty Session Notice</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your faculty session might be expired or required authentication credentials.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/faculty/login"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <KeyRound className="h-4 w-4" />
            Go to Faculty Sign In
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>

          <Button
            onClick={() => reset()}
            variant="outline"
            size="sm"
            className="w-full border-slate-800 bg-slate-950 text-slate-300 hover:text-white rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
