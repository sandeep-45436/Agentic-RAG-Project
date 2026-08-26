"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FacultyRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/faculty/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-400 font-medium animate-pulse">
          Opening Faculty Portal...
        </p>
      </div>
    </div>
  );
}
