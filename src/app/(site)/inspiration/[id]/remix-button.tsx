"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, useToast } from "@/components/ui";

export function RemixButton({ postId }: { postId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function remix() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspiration/${postId}/remix`, { method: "POST" });
      const data = await res.json();
      if (res.status === 401) {
        push("Sign in to remix this design", "error");
        router.push("/signin");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Remix failed");
      push("Remix created — opening the studio", "success");
      router.push(data.editUrl);
    } catch (e) {
      push(e instanceof Error ? e.message : "Remix failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={remix} disabled={loading} className="w-full sm:w-auto">
      {loading ? "Preparing remix…" : "Remix This"}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </Button>
  );
}
