import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, requireUser, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";
import { sanitizeDesignState } from "@/lib/design";

type Ctx = { params: Promise<{ id: string }> };

async function loadDesign(id: string, userId: string, isAdmin: boolean) {
  const design = await db.design.findUnique({ where: { id }, include: { product: { select: { slug: true, name: true, basePrice: true } } } });
  if (!design || design.deletedAt) throw new HttpError(404, "Design not found");
  if (design.ownerId !== userId && !isAdmin) throw new HttpError(403, "Not your design");
  return design;
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in required");
    const { id } = await ctx.params;
    const design = await loadDesign(id, user.id, user.role === "admin");
    return Response.json({
      design: {
        id: design.id,
        name: design.name,
        productId: design.productId,
        productSlug: design.product.slug,
        productName: design.product.name,
        state: JSON.parse(design.state),
        previewUrl: design.previewUrl,
        currentVersion: design.currentVersion,
        updatedAt: design.updatedAt,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  state: z.unknown().optional(),
  previewUrl: z.string().max(300000).optional(),
});

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const design = await loadDesign(id, user.id, user.role === "admin");
    const body = updateSchema.parse(await readJson(req));

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.slice(0, 80);
    if (body.state !== undefined) {
      const state = sanitizeDesignState(body.state);
      data.state = JSON.stringify(state);
      data.currentVersion = design.currentVersion + 1;
      data.versions = { create: { version: design.currentVersion + 1, state: JSON.stringify(state) } };
    }
    if (body.previewUrl !== undefined) data.previewUrl = body.previewUrl;

    const updated = await db.design.update({ where: { id: design.id }, data });
    return Response.json({
      design: { id: updated.id, name: updated.name, previewUrl: updated.previewUrl, currentVersion: updated.currentVersion },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid design payload" }, { status: 400 });
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const design = await loadDesign(id, user.id, user.role === "admin");
    await db.design.update({ where: { id: design.id }, data: { deletedAt: new Date() } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Duplicate (remix your own design) via POST
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const design = await loadDesign(id, user.id, user.role === "admin");
    const copy = await db.design.create({
      data: {
        ownerId: user.id,
        productId: design.productId,
        name: `${design.name} (Copy)`.slice(0, 80),
        state: design.state,
        previewUrl: design.previewUrl,
        currentVersion: 1,
        versions: { create: { version: 1, state: design.state } },
      },
    });
    return Response.json({ design: { id: copy.id, name: copy.name } });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
