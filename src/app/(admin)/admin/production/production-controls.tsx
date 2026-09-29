"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui";

const NEXT: Record<string, string | null> = {
  queued: "in_production",
  in_production: "quality_check",
  quality_check: "packed",
  packed: "shipped",
  shipped: null,
};

export function ProductionControls({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const next = NEXT[status];

  async function advance() {
    if (!next) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/production", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!next) return null;
  return (
    <button
      onClick={advance}
      disabled={busy}
      className="mt-2.5 w-full rounded-lg border border-line2 py-1.5 text-[0.625rem] tracking-wide text-mute transition hover:border-ivory hover:text-ivory disabled:opacity-40"
    >
      {busy ? "…" : `MOVE TO ${next.replace(/_/g, " ").toUpperCase()}`}
    </button>
  );
}
