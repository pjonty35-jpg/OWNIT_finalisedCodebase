import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, requireUser, HttpError } from "@/lib/session";
import { readJson, errorResponse, rateLimit, clientIp } from "@/lib/http";
import { sanitizeDesignState } from "@/lib/design";
import { customizationFee } from "@/lib/money";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ designs: [] });
    const designs = await db.design.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return Response.json({
      designs: designs.map((d) => ({
        id: d.id,
        name: d.name,
        previewUrl: d.previewUrl,
        productId: d.productId,
        updatedAt: d.updatedAt,
        currentVersion: d.currentVersion,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  productId: z.string().min(1),
  state: z.unknown(),
  previewUrl: z.string().max(300000).optional(), // data-URL preview (bounded)
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to save designs");
    rateLimit(`designs:${user.id}`, 30, 60_000);

    const body = createSchema.parse(await readJson(req));
    const product = await db.product.findUnique({ where: { id: body.productId } });
    if (!product || !product.active) throw new HttpError(404, "Product not found");

    const state = sanitizeDesignState(body.state);
    const sides = state.sides;
    const data = {
      name: (body.name ?? "Untitled Design").slice(0, 80),
      productId: product.id,
      state: JSON.stringify(state),
      previewUrl: body.previewUrl ?? null,
    };

    const design = await db.design.create({
      data: {
        ...data,
        ownerId: user.id,
        versions: { create: { version: 1, state: JSON.stringify(state) } },
      },
    });
    await db.rewardTransaction.create({ data: { userId: user.id, kind: "design_created", points: 10, note: "Created a design" } }).catch(() => {});
    await db.rewardAccount.upsert({ where: { userId: user.id }, create: { userId: user.id, points: 10 }, update: { points: { increment: 10 } } }).catch(() => {});

    return Response.json({
      design: {
        id: design.id,
        name: design.name,
        previewUrl: design.previewUrl,
        sides,
        customizationFee: customizationFee(sides),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid design payload" }, { status: 400 });
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
