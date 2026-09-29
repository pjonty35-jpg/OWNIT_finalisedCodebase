"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field, Input, useToast } from "@/components/ui";

function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create account");
      push("Account created — 50 OWNIT points added", "success");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card-surface p-8 sm:p-10">
        <p className="label-caps">Join OWNIT</p>
        <h1 className="headline mt-2 text-3xl">Create account</h1>
        <p className="mt-2 text-sm text-mute">Save designs, track orders, earn points.</p>

        {error ? <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2.5 text-xs text-red-200">{error}</p> : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Name">
            <Input name="name" required minLength={1} maxLength={60} placeholder="Your name" autoComplete="name" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </Field>
          <Field label="Password" hint="At least 8 characters.">
            <Input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
          </Field>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-mute">
          Already have one?{" "}
          <Link href={`/signin?next=${encodeURIComponent(next)}`} className="text-ivory underline underline-offset-4">Sign in</Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-faint">By joining you agree to our terms and copyright policy.</p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  );
}
