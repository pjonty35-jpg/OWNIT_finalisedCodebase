import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";

const schema = z.object({ code: z.string().min(2).max(30) });

export async function POST(req: Request) {
  try {
    const { code } = schema.parse(await readJson(req));
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to apply promo codes");
    const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date())) {
      return Response.json({ ok: false, error: "That code isn't valid" }, { status: 200 });
    }
    if (coupon.maxRedemptions && coupon.timesUsed >= coupon.maxRedemptions) {
      return Response.json({ ok: false, error: "That code has been fully redeemed" }, { status: 200 });
    }
    return Response.json({
      ok: true,
      coupon: { code: coupon.code, kind: coupon.kind, value: coupon.value, minSubtotal: coupon.minSubtotal },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Enter a code" }, { status: 400 });
    return errorResponse(err);
  }
}
