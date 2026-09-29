"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PointsFly } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Engagement } from "@/lib/rewards";

const EARN = [
  { action: "Daily check-in", pts: "+5 ✦", note: "+2 more each streak day" },
  { action: "Save a design", pts: "+10 ✦", note: "Every idea counts" },
  { action: "Every ₹100 spent", pts: "+1 ✦", note: "Stacked automatically" },
  { action: "Remix a design", pts: "+5 ✦", note: "Steal like an artist" },
];

const TIERS = [
  { name: "SKETCH", min: 0 },
  { name: "INK", min: 100 },
  { name: "PRESS", min: 400 },
  { name: "OWNIT+", min: 1000 },
];

export function RewardsPanel({ initial }: { initial: Engagement }) {
  const router = useRouter();
  const [eng, setEng] = useState(initial);
  const [fly, setFly] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkIn() {
    if (busy || eng.checkedInToday) return;
    setBusy(true);
    try {
      const res = await fetch("/api/rewards/checkin", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setEng(data.engagement);
        setFly(data.points);
        setTimeout(() => setFly(null), 1800);
      } else if (data.engagement) {
        setEng(data.engagement);
      }
    } catch {
      /* offline */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-surface relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 90% at 100% 0%, rgba(70,66,58,0.45) 0%, rgba(15,15,14,0) 65%)" }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-caps">Your status</p>
            <p className="headline mt-1 text-3xl">
              {eng.tier.name} <span className="text-line2">/</span> <Count value={eng.points} />
              <span className="ml-1 text-base text-mute">✦</span>
            </p>
          </div>
          <button
            onClick={checkIn}
            disabled={eng.checkedInToday || busy}
            className={cn(
              "press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition",
              eng.checkedInToday
                ? "cursor-default border-line text-faint"
                : "border-ivory bg-ivory text-ink hover:shadow-[0_0_24px_rgba(245,242,234,0.3)]"
            )}
          >
            <span aria-hidden>🔥</span>
            {eng.checkedInToday ? `${eng.streak}-day streak · safe` : busy ? "Checking in…" : `Check in · day ${eng.streak + 1}`}
          </button>
        </div>

        {/* Tier progress */}
        <div className="mt-5">
          <div className="flex justify-between text-[0.625rem] uppercase tracking-[0.18em] text-faint">
            {TIERS.map((t) => (
              <span key={t.name} className={eng.points >= t.min ? "text-ivory" : undefined}>
                {t.name}
              </span>
            ))}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ivory transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${Math.round(eng.tierPct * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-mute">
            {eng.nextTier
              ? `${eng.toNext} ✦ to ${eng.nextTier.name} — ${eng.nextTier.perk}`
              : "Top tier. You ARE the brand now."}
          </p>
        </div>

        {/* How to earn */}
        <div className="mt-6 grid grid-cols-2 gap-2 border-t border-line pt-5">
          {EARN.map((e) => (
            <div key={e.action} className="rounded-xl border border-line bg-coal/60 px-3.5 py-3">
              <p className="text-xs font-semibold text-ivory">{e.action}</p>
              <p className="mt-0.5 text-sm font-bold text-ivory/90">{e.pts}</p>
              <p className="text-[0.625rem] text-faint">{e.note}</p>
            </div>
          ))}
        </div>
      </div>

      {fly !== null ? <PointsFly amount={fly} label={`day ${eng.streak} streak`} /> : null}
      {/* keep router import used for future navigation actions */}
      <span className="hidden">{typeof router}</span>
    </div>
  );
}

function Count({ value }: { value: number }) {
  return <span>{value.toLocaleString("en-IN")}</span>;
}
