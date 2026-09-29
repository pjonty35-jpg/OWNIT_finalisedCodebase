"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui";

export function DesignActions({ designId, name }: { designId: string; name: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    setBusy(true);
    setMenu(false);
    try {
      const res = await fetch(`/api/designs/${designId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Copy failed");
      push("Duplicated", "success");
      router.refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : "Copy failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setBusy(true);
    setMenu(false);
    try {
      const res = await fetch(`/api/designs/${designId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      push("Design deleted", "success");
      router.refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mt-2 border-t border-line pt-2">
      <button
        onClick={() => setMenu((m) => !m)}
        aria-label={`Actions for ${name}`}
        aria-expanded={menu}
        className="flex h-7 w-full items-center justify-center rounded-md text-mute hover:bg-white/5 hover:text-ivory"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
      </button>
      {menu ? (
        <div className="absolute bottom-8 right-0 z-10 w-36 overflow-hidden rounded-xl border border-line2 bg-raise shadow-xl">
          <a href={`/create?design=${designId}`} className="block px-4 py-2.5 text-xs text-ivory hover:bg-white/5">Edit</a>
          <button onClick={duplicate} disabled={busy} className="block w-full px-4 py-2.5 text-left text-xs text-ivory hover:bg-white/5 disabled:opacity-40">Duplicate</button>
          <button onClick={remove} disabled={busy} className="block w-full px-4 py-2.5 text-left text-xs text-red-300 hover:bg-white/5 disabled:opacity-40">Delete</button>
        </div>
      ) : null}
    </div>
  );
}
