"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ButtonLink, Spinner } from "@/components/ui";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = params.get("token");
    if (!token) {
      setError("Missing token");
      return;
    }
    fetch("/api/auth/magic-link/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "This link is invalid or expired");
        }
        router.push("/account");
        router.refresh();
      })
      .catch((e: Error) => setError(e.message));
  }, [params, router]);

  if (error) {
    return (
      <div className="card-surface w-full max-w-md p-10 text-center">
        <p className="headline text-2xl">Link problem</p>
        <p className="mt-3 text-sm text-mute">{error}</p>
        <ButtonLink href="/signin" className="mt-6">Back to sign in</ButtonLink>
      </div>
    );
  }
  return (
    <div className="card-surface flex w-full max-w-md flex-col items-center p-10 text-center">
      <Spinner className="h-7 w-7" />
      <p className="headline mt-6 text-2xl">Signing you in…</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
