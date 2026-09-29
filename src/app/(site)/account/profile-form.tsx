"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, useToast } from "@/components/ui";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Could not save");
      push("Profile updated", "success");
      router.refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card-surface space-y-5 p-7">
      <Field label="Display name">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </Field>
      <Field label="Email" hint="Contact support to change your email.">
        <Input value={email} disabled />
      </Field>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
