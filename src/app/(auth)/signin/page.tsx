"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field, Input, useToast } from "@/components/ui";

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const { push } = useToast();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed");
      push("Welcome back", "success");
      router.push(data.user.role === "admin" ? "/admin" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitMagic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!res.ok) throw new Error("Could not send link");
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send link");
    } finally {
      setBusy(false);
    }
  }

  if (magicSent) {
    return (
      <div className="card-surface w-full max-w-md p-10 text-center">
        <p className="headline text-2xl">Check your inbox</p>
        <p className="mt-3 text-sm text-mute">
          We sent a sign-in link. It expires in 15 minutes.
          <br />
          <span className="text-xs text-faint">(Dev tip: the link is printed in the server console.)</span>
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setMagicSent(false)}>Use another method</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="card-surface p-8 sm:p-10">
        <p className="label-caps">Welcome back</p>
        <h1 className="headline mt-2 text-3xl">Sign in</h1>

        <div className="mt-6 flex rounded-xl border border-line p-1 text-xs">
          {(["password", "magic"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 transition ${mode === m ? "bg-ivory text-ink font-semibold" : "text-mute hover:text-ivory"}`}
            >
              {m === "password" ? "Password" : "Magic link"}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2.5 text-xs text-red-200">{error}</p> : null}

        {mode === "password" ? (
          <form onSubmit={submitPassword} className="mt-6 space-y-4">
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        ) : (
          <form onSubmit={submitMagic} className="mt-6 space-y-4">
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Sending…" : "Email me a link"}</Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-mute">
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-ivory underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-faint">
        Demo: jonty@ownit.test / ownit123 · Admin: admin@ownit.test / ownit-admin-1
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}
