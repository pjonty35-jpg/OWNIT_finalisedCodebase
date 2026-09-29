"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { compactNumber } from "@/lib/utils";

/** Instant like with optimistic UI; prompts sign-in gently when needed. */
export function LikeButton({
  postId,
  initialLikes,
  size = "sm",
}: {
  postId: string;
  initialLikes: number;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const { push } = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [beat, setBeat] = useState(false);

  async function like(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (liked) return;
    // Optimistic
    setLikes((n) => n + 1);
    setLiked(true);
    setBeat(true);
    setTimeout(() => setBeat(false), 600);
    try {
      const res = await fetch(`/api/inspiration/${postId}/like`, { method: "POST" });
      if (res.status === 401) {
        // Roll back and invite them in
        setLikes((n) => n - 1);
        setLiked(false);
        push("Sign in to like designs", "error");
        router.push("/signin?next=/inspiration");
      }
    } catch {
      setLikes((n) => n - 1);
      setLiked(false);
    }
  }

  return (
    <button
      onClick={like}
      aria-pressed={liked}
      aria-label={liked ? "Liked" : "Like this design"}
      className={cn(
        "liquid-chip press inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] transition-colors",
        liked ? "text-ivory" : "text-mute hover:text-ivory"
      )}
    >
      <svg
        width={size === "lg" ? 14 : 12}
        height={size === "lg" ? 14 : 12}
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        className={beat ? "animate-heartbeat" : undefined}
      >
        <path d="M12 21s-7.5-4.9-9.7-9.2C.7 8.6 2.6 5 6.1 5c2 0 3.4 1 4 2.1h3.8c.6-1.1 2-2.1 4-2.1 3.5 0 5.4 3.6 3.8 6.8C19.5 16.1 12 21 12 21z" />
      </svg>
      {compactNumber(likes)}
    </button>
  );
}
