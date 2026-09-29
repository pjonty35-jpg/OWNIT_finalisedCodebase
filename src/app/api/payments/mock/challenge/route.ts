import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/session";
import { errorResponse } from "@/lib/http";

/**
 * Dev-only helper: signs a mock payment ref so the browser can complete the
 * test-mode approval. Disabled unless PAYMENT_PROVIDER=mock — with a real
 * provider this endpoint returns 404 and production uses provider redirects.
 */
export async function GET(req: Request) {
  try {
    if (process.env.PAYMENT_PROVIDER !== "mock") throw new HttpError(404, "Not available");
    const ref = new URL(req.url).searchParams.get("ref");
    if (!ref) throw new HttpError(400, "Missing ref");
    const payment = await db.payment.findFirst({ where: { providerRef: ref }, select: { id: true } });
    if (!payment) throw new HttpError(404, "Payment not found");
    const signature = createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET || "ownit_dev_payment_secret")
      .update(ref)
      .digest("hex");
    return Response.json({ signature });
  } catch (err) {
    return errorResponse(err);
  }
}
