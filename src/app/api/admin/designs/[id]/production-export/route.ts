import { db } from "@/lib/db";
import { requireAdmin, HttpError } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { sanitizeDesignState } from "@/lib/design";

/**
 * Returns the design state + per-side production manifest (print areas, method,
 * required pixel dimensions). The admin UI renders this state to a
 * production-resolution PNG via lib/artwork and downloads it.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const design = await db.design.findUnique({
      where: { id },
      include: { product: { include: { printAreas: true } } },
    });
    if (!design || design.deletedAt) throw new HttpError(404, "Design not found");
    const state = sanitizeDesignState(JSON.parse(design.state));
    return Response.json({
      design: {
        id: design.id,
        name: design.name,
        state,
        printAreas: design.product.printAreas.map((a) => ({
          side: a.side, widthPx: a.widthPx, heightPx: a.heightPx,
          safeZonePct: a.safeZonePct, method: a.method,
        })),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
