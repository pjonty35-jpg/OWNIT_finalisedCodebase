import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return Response.json({ notifications });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({ id: z.string().optional(), all: z.boolean().optional() });

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(req));
    await db.notification.updateMany({
      where: body.all ? { userId: user.id, readAt: null } : { userId: user.id, id: body.id ?? "" },
      data: { readAt: new Date() },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
