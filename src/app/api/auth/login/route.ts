import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { readJson, errorResponse, rateLimit, clientIp } from "@/lib/http";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    rateLimit(`login:${clientIp(req)}`, 12, 60_000);
    const body = schema.parse(await readJson(req));
    const user = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
    if (!user || !user.passwordHash || user.deletedAt) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return Response.json({ error: "Invalid email or password" }, { status: 401 });
    await createSession(user.id);
    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid input" }, { status: 400 });
    return errorResponse(err);
  }
}
