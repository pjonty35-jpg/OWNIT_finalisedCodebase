import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { rewardAccount: true },
    });
    if (!user) throw new HttpError(404, "Account not found");
    return Response.json({
      profile: {
        id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl,
        points: user.rewardAccount?.points ?? 0,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({ name: z.string().min(1).max(60).optional(), avatarUrl: z.string().max(300000).optional() });

export async function PATCH(req: Request) {
  try {
    const session = await requireUser();
    const body = schema.parse(await readJson(req));
    const user = await db.user.update({
      where: { id: session.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      },
    });
    return Response.json({ profile: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid profile data" }, { status: 400 });
    return errorResponse(err);
  }
}
