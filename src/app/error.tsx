"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[ownit] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="label-caps">Something snapped</p>
      <h1 className="headline mt-4 text-4xl">An error occurred</h1>
      <p className="mt-4 max-w-sm text-sm text-mute">
        The page hit an unexpected error. Try again — your saved work is safe.
      </p>
      <Button className="mt-8" onClick={reset}>Try again</Button>
    </div>
  );
}
