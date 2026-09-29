import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { readJson, errorResponse, rateLimit, clientIp } from "@/lib/http";
import { sendEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    rateLimit(`magic:${clientIp(req)}`, 6, 60_000);
    const { email: rawEmail } = schema.parse(await readJson(req));
    const email = rawEmail.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email } });

    const token = randomBytes(24).toString("hex");
    await db.magicLoginToken.create({
      data: {
        token,
        email,
        userId: user?.id ?? null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/signin/verify?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Your OWNIT sign-in link",
      text: `Tap to sign in (valid 15 minutes): ${url}`,
      html: `<p>Tap to sign in:</p><p><a href="${url}">${url}</a></p><p>Valid for 15 minutes.</p>`,
    });
    // Always respond ok — never reveal whether the email exists.
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Enter a valid email" }, { status: 400 });
    return errorResponse(err);
  }
}
