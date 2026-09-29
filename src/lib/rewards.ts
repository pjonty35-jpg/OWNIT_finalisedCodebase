/**
 * OWNIT engagement engine — points, tiers, streaks, daily check-in.
 * The habit loop for Gen-Z: come back tomorrow, keep the flame alive.
 * All state is server-authoritative; the client only renders it.
 */
import { db } from "@/lib/db";

export const TIERS = [
  { id: "sketch", name: "SKETCH", min: 0, perk: "Start creating" },
  { id: "ink", name: "INK", min: 100, perk: "Early access to drops" },
  { id: "press", name: "PRESS", min: 400, perk: "Free shipping unlock" },
  { id: "ownit", name: "OWNIT+", min: 1000, perk: "Limited collabs & secrets" },
] as const;

export type Tier = (typeof TIERS)[number];

export function tierFor(points: number): Tier {
  let current: Tier = TIERS[0];
  for (const t of TIERS) if (points >= t.min) current = t;
  return current;
}

export function nextTier(points: number): Tier | null {
  return TIERS.find((t) => t.min > points) ?? null;
}

/** Progress 0..1 toward the next tier, for rings & bars. */
export function tierProgress(points: number): { tier: Tier; next: Tier | null; pct: number; toNext: number } {
  const tier = tierFor(points);
  const next = nextTier(points);
  if (!next) return { tier, next: null, pct: 1, toNext: 0 };
  const span = next.min - tier.min;
  return { tier, next, pct: Math.min(1, (points - tier.min) / span), toNext: next.min - points };
}

export function pointsForPurchase(amountMinor: number) {
  return Math.max(1, Math.floor(amountMinor / 10000)); // 1 pt per ₹100
}

/** Streak state derived from the user's RewardTransactions (no schema change needed). */
export async function getStreak(userId: string): Promise<{ count: number; checkedInToday: boolean }> {
  const txns = await db.rewardTransaction.findMany({
    where: { userId, kind: "checkin" },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  if (txns.length === 0) return { count: 0, checkedInToday: false };

  const dayOf = (d: Date) => Math.floor(d.getTime() / 86_400_000);
  const today = dayOf(new Date());
  const days = new Set(txns.map((t) => dayOf(t.createdAt)));

  if (!days.has(today) && !days.has(today - 1)) return { count: 0, checkedInToday: false };
  let count = 0;
  while (days.has(today - count)) count++;
  return { count, checkedInToday: days.has(today) };
}

const CHECKIN_BASE = 5;

/**
 * Daily check-in: +5 points, +2 bonus per consecutive day (cap +20).
 * Returns the awarded state so the UI can celebrate.
 */
export async function dailyCheckIn(userId: string) {
  const streak = await getStreak(userId);
  if (streak.checkedInToday) {
    return { ok: false as const, reason: "already", streak: streak.count, points: 0 };
  }
  const bonus = Math.min(20, streak.count * 2); // day 0 => +5, each consecutive day adds +2
  const points = CHECKIN_BASE + bonus;
  await db.rewardTransaction.create({
    data: { userId, kind: "checkin", points, note: `Daily check-in · day ${streak.count + 1}` },
  });
  await db.rewardAccount.upsert({
    where: { userId },
    create: { userId, points },
    update: { points: { increment: points } },
  });
  return { ok: true as const, streak: streak.count + 1, points };
}

/** Full engagement snapshot for /me + dashboards. */
export async function engagementSnapshot(userId: string) {
  const [account, streak] = await Promise.all([
    db.rewardAccount.findUnique({ where: { userId } }),
    getStreak(userId),
  ]);
  const points = account?.points ?? 0;
  const progress = tierProgress(points);
  return {
    points,
    tier: progress.tier,
    nextTier: progress.next,
    tierPct: progress.pct,
    toNext: progress.toNext,
    streak: streak.count,
    checkedInToday: streak.checkedInToday,
  };
}

export type Engagement = Awaited<ReturnType<typeof engagementSnapshot>>;
