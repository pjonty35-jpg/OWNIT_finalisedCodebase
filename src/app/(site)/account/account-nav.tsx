"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const ITEMS: { id: string; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" },
  { id: "designs", label: "My Designs", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
  { id: "orders", label: "My Orders", icon: "M6 7h12l1.2 13H4.8L6 7zM9 9V6a3 3 0 016 0v3" },
  { id: "wishlist", label: "Wishlisted", icon: "M12 21s-7.5-4.9-9.7-9.2C.7 8.6 2.6 5 6.1 5c2 0 3.4 1 4 2.1h3.8c.6-1.1 2-2.1 4-2.1 3.5 0 5.4 3.6 3.8 6.8C19.5 16.1 12 21 12 21z" },
  { id: "addresses", label: "Addresses", icon: "M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
  { id: "notifications", label: "Notifications", icon: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" },
  { id: "settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h0a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55h0a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v0a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" },
];

export function AccountNav({ tab, userName, userEmail, points }: { tab: string; userName: string | null; userEmail: string; points: number }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="card-surface p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-raise text-lg font-bold">
          {(userName?.[0] ?? userEmail[0] ?? "O").toUpperCase()}
        </div>
        <p className="mt-3 text-sm font-semibold">{userName ?? "Creator"}</p>
        <p className="text-xs text-faint">@{userEmail.split("@")[0]}</p>
      </div>

      <nav aria-label="Account" className="card-surface mt-3 overflow-hidden p-2">
        {ITEMS.map((item) => (
          <Link
            key={item.id}
            href={`/account?tab=${item.id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition",
              tab === item.id ? "bg-raise text-ivory" : "text-mute hover:bg-white/5 hover:text-ivory"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={item.icon} /></svg>
            {item.label}
          </Link>
        ))}
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-mute transition hover:bg-white/5 hover:text-red-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Sign out
        </button>
      </nav>

      <div className="card-surface mt-3 p-5">
        <p className="label-caps">OWNIT Points</p>
        <p className="headline mt-1 text-2xl">
          {points.toLocaleString("en-IN")} <span className="text-base text-mute">✦</span>
        </p>
        <p className="mt-1 text-xs text-mute">Daily check-in +5 · designs +10 · ₹100 spent +1</p>
        <Link
          href="/account?tab=overview"
          className="press mt-3 block rounded-lg border border-line2 py-2 text-center text-[0.625rem] font-bold tracking-[0.16em] text-ivory transition hover:border-ivory"
        >
          VIEW REWARDS
        </Link>
      </div>
    </aside>
  );
}
