import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Provider webhook receiver. Verifies the provider signature over the RAW body
 * before parsing, then reconciles payment state. Provider-agnostic.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature =
    req.headers.get("x-razorpay-signature") ||
    req.headers.get("stripe-signature") ||
    req.headers.get("x-ownit-signature");

  const provider = getPaymentProvider();
  if (!provider.verifyWebhook(raw, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(raw) as {
      ref?: string;
      providerRef?: string;
      event?: string;
      status?: string;
    };
    const ref = event.providerRef ?? event.ref;
    if (!ref) return Response.json({ ok: true, ignored: true });

    const payment = await db.payment.findFirst({ where: { providerRef: ref }, include: { order: true } });
    if (!payment) return Response.json({ ok: true, ignored: true });

    const status = (event.status ?? event.event ?? "").toLowerCase();
    if (status.includes("refund")) {
      const refunded = payment.status === "paid" ? "partially_refunded" : "refunded";
      await db.payment.update({ where: { id: payment.id }, data: { status: refunded } });
      await db.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: refunded, status: refunded === "refunded" ? "refunded" : payment.order.status },
      });
      await db.orderEvent.create({ data: { orderId: payment.orderId, status: "refunded", message: "Refund processed by provider" } });
    } else if (status.includes("fail") || status.includes("cancel")) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
      await db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "failed" } });
    } else if (status.includes("paid") || status.includes("captured")) {
      if (payment.status !== "paid") {
        await db.payment.update({ where: { id: payment.id }, data: { status: "paid" } });
        await db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "paid", status: "artwork_processing" } });
        await db.orderEvent.create({ data: { orderId: payment.orderId, status: "paid", message: "Payment confirmed via webhook" } });
      }
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
}
