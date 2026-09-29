import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ items: [] });
    const wishlist = await db.wishlist.findFirst({ where: { userId: user.id } });
    if (!wishlist) return Response.json({ items: [] });
    const items = await db.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: { select: { slug: true, name: true, basePrice: true, subtitle: true } },
        design: { select: { id: true, name: true, previewUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ items });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({
  productId: z.string().optional(),
  designId: z.string().optional(),
  inspirationPostId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to save favourites");
    const body = schema.parse(await readJson(req));
    if (!body.productId && !body.designId && !body.inspirationPostId) {
      throw new HttpError(400, "Nothing to save");
    }
    const wishlist = await db.wishlist.findFirst({ where: { userId: user.id } });
    const ensured = wishlist ?? (await db.wishlist.create({ data: { userId: user.id } }));
    const item = await db.wishlistItem.create({
      data: {
        wishlistId: ensured.id,
        productId: body.productId ?? null,
        designId: body.designId ?? null,
        inspirationPostId: body.inspirationPostId ?? null,
      },
    });
    return Response.json({ ok: true, itemId: item.id });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid payload" }, { status: 400 });
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in first");
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) throw new HttpError(400, "Missing itemId");
    const item = await db.wishlistItem.findUnique({ where: { id: itemId }, include: { wishlist: true } });
    if (!item || item.wishlist.userId !== user.id) throw new HttpError(404, "Not found");
    await db.wishlistItem.delete({ where: { id: itemId } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
