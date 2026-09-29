import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const { token } = await readJson<{ token?: string }>(req);
    if (!token) return Response.json({ error: "Missing token" }, { status: 400 });
    const record = await db.magicLoginToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return Response.json({ error: "This link is invalid or has expired" }, { status: 400 });
    }
    await db.magicLoginToken.update({ where: { token }, data: { usedAt: new Date() } });

    let userId = record.userId;
    if (!userId) {
      const user = await db.user.upsert({
        where: { email: record.email },
        create: { email: record.email, provider: "magic" },
        update: {},
      });
      userId = user.id;
    }
    await createSession(userId);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
