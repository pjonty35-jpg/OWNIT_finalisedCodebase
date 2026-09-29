import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { readJson, errorResponse, rateLimit, clientIp } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    rateLimit(`register:${clientIp(req)}`, 10, 60_000);
    const body = schema.parse(await readJson(req));
    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return Response.json({ error: "An account with this email already exists" }, { status: 409 });

    const user = await db.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash: await bcrypt.hash(body.password, 10),
      },
    });
    await db.rewardAccount.create({ data: { userId: user.id, points: 50 } }).catch(() => {});
    await createSession(user.id);
    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(err);
  }
}
