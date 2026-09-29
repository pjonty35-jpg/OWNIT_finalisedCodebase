import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { z } from "zod";
import { readJson } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const jobs = await db.productionJob.findMany({
      include: {
        order: { include: { items: { include: { design: { select: { name: true, previewUrl: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        orderNumber: j.order.number,
        status: j.status,
        method: j.method,
        partner: j.partner,
        artworkUrl: j.artworkUrl ?? j.order.items.find((i) => i.design)?.design?.previewUrl ?? null,
        items: j.order.items.map((i) => ({
          name: i.name, colorName: i.colorName, size: i.size, quantity: i.quantity,
          previewUrl: i.previewUrl ?? i.design?.previewUrl ?? null,
        })),
        createdAt: j.createdAt,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({ jobId: z.string(), status: z.string().max(20) });

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await readJson(req));
    await db.productionJob.update({ where: { id: body.jobId }, data: { status: body.status } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid payload" }, { status: 400 });
    return errorResponse(err);
  }
}
