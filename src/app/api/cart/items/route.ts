import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";
import { priceCart } from "@/lib/pricing";
import { sanitizeDesignState } from "@/lib/design";

async function cartFor(user: { id: string } | null, create = true) {
  if (!user) return null;
  if (!create) return db.cart.findUnique({ where: { userId: user.id } });
  return db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
}

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  colorName: z.string().max(40).optional(),
  size: z.string().max(10).optional(),
  designId: z.string().optional(),
  designState: z.unknown().optional(),
  designName: z.string().max(80).optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  sides: z.array(z.enum(["front", "back", "left", "right"])).max(4).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = addSchema.parse(await readJson(req));

    const product = await db.product.findUnique({ where: { id: body.productId } });
    if (!product || !product.active) throw new HttpError(404, "Product not found");
    let variant = body.variantId
      ? await db.productVariant.findUnique({ where: { id: body.variantId } })
      : null;
    if (body.variantId && (!variant || variant.productId !== product.id || !variant.active)) {
      throw new HttpError(400, "Invalid variant");
    }
    // Resolve colour/size client hints server-side.
    if (!variant && body.colorName) {
      const candidates = await db.productVariant.findMany({
        where: { productId: product.id, active: true, colorName: body.colorName },
      });
      variant =
        candidates.find((v) => (body.size ? v.size === body.size : v.stock > 0)) ??
        candidates.find((v) => v.stock > 0) ??
        candidates[0] ??
        null;
    }
    if (!variant) {
      // Fall back to any in-stock variant so a blank add always works.
      variant = (await db.productVariant.findFirst({
        where: { productId: product.id, active: true, stock: { gt: 0 } },
        orderBy: { size: "asc" },
      })) ?? null;
    }
    if (!variant || variant.productId !== product.id || !variant.active) throw new HttpError(400, "Invalid variant");
    if (variant.stock < body.quantity) throw new HttpError(409, "Not enough stock available");

    let designId: string | undefined;
    let sides: string[] = body.sides ?? [];
    if (body.designId) {
      const design = await db.design.findUnique({ where: { id: body.designId } });
      if (!design || design.deletedAt) throw new HttpError(404, "Design not found");
      if (design.ownerId && design.ownerId !== user?.id) throw new HttpError(403, "Not your design");
      designId = design.id;
      try {
        const st = JSON.parse(design.state);
        sides = Array.isArray(st.sides) && st.sides.length ? st.sides : ["front"];
      } catch { sides = ["front"]; }
    } else if (body.designState) {
      // Persist a fresh design for one-off customisations created without saving first.
      const state = sanitizeDesignState(body.designState);
      const design = await db.design.create({
        data: {
          ownerId: user?.id ?? null,
          productId: product.id,
          name: body.designName ?? "Quick Custom",
          state: JSON.stringify(state),
          versions: { create: { version: 1, state: JSON.stringify(state) } },
        },
      });
      designId = design.id;
      sides = state.sides;
    }

    const cart = await cartFor(user);
    if (!cart) throw new HttpError(401, "Sign in to use your cart");

    // Merge identical line items (same variant + same design).
    const existing = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id, variantId: variant.id, designId: designId ?? null },
    });
    const item = existing
      ? await db.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(10, existing.quantity + body.quantity) } })
      : await db.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            variantId: variant.id,
            designId: designId ?? null,
            quantity: body.quantity,
            sides: JSON.stringify(sides),
          },
        });

    const priced = await priceCart(cart.id);
    return Response.json({
      ok: true,
      itemId: item.id,
      count: priced.lines.reduce((s, l) => s + l.quantity, 0),
      total: priced.total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid cart payload" }, { status: 400 });
    return errorResponse(err);
  }
}

const patchSchema = z.object({ itemId: z.string(), quantity: z.number().int().min(1).max(10).optional(), savedForLater: z.boolean().optional() });

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    const body = patchSchema.parse(await readJson(req));
    const item = await db.cartItem.findUnique({ where: { id: body.itemId }, include: { cart: true } });
    if (!item) throw new HttpError(404, "Item not found");
    if (!item.cart.userId || item.cart.userId !== user?.id) throw new HttpError(403, "Not your cart");

    const data: Record<string, unknown> = {};
    if (body.quantity !== undefined) data.quantity = body.quantity;
    if (body.savedForLater !== undefined) data.savedForLater = body.savedForLater;
    await db.cartItem.update({ where: { id: item.id }, data });
    const cart = await cartFor(user, false);
    const priced = cart ? await priceCart(cart.id) : null;
    return Response.json({ ok: true, count: priced ? priced.lines.reduce((s, l) => s + l.quantity, 0) : 0 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid update" }, { status: 400 });
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) throw new HttpError(400, "Missing itemId");
    const item = await db.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item) throw new HttpError(404, "Item not found");
    if (!item.cart.userId || item.cart.userId !== user?.id) throw new HttpError(403, "Not your cart");
    await db.cartItem.delete({ where: { id: item.id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
