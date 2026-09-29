import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";
import { priceCart } from "@/lib/pricing";

async function getOrCreateCart() {
  const user = await getSessionUser();
  if (user) {
    return db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  }
  return null; // guest carts are not persisted server-side at launch
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ lines: [], savedForLater: [], subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, count: 0 });
    const cart = await getOrCreateCart();
    if (!cart) return Response.json({ lines: [], count: 0 });
    const priced = await priceCart(cart.id);
    return Response.json({
      ...priced,
      count: priced.lines.reduce((s, l) => s + l.quantity, 0),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const mergeSchema = z.object({ items: z.array(z.object({ cartItemId: z.string(), quantity: z.number().int().min(1).max(10) })).max(30) });

/** Merge a client-side guest cart into the user cart on sign-in. */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ ok: false }, { status: 401 });
    const body = mergeSchema.parse(await readJson(req));
    const cart = await db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
    for (const item of body.items) {
      const guestItem = await db.cartItem.findUnique({
        where: { id: item.cartItemId },
        include: { cart: true },
      });
      // Only merge items from carts that are not attached to any user.
      if (!guestItem || guestItem.cart.userId !== null) continue;
      await db.cartItem.update({
        where: { id: guestItem.id },
        data: { cartId: cart.id, quantity: item.quantity },
      });
    }
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid merge payload" }, { status: 400 });
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
