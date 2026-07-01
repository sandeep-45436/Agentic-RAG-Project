"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-destructive">Something went wrong!</h2>
        <p className="text-muted-foreground text-sm">
          An unexpected error has occurred. Our team has been notified.
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
          <Button onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
