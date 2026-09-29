import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { readJson, errorResponse, rateLimit, clientIp } from "@/lib/http";

const schema = z.object({
  email: z.string().email(),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(4000),
});

export async function POST(req: Request) {
  try {
    rateLimit(`contact:${clientIp(req)}`, 5, 60_000);
    const body = schema.parse(await readJson(req));
    const user = await getSessionUser();
    await db.supportTicket.create({
      data: {
        userId: user?.id ?? null,
        email: body.email.toLowerCase().trim(),
        subject: body.subject,
        message: body.message,
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Fill in all fields (message min 10 chars)" }, { status: 400 });
    return errorResponse(err);
  }
}
