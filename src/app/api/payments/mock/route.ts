import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";
import { getPaymentProvider } from "@/lib/payments";
import { PAID_STATUSES } from "@/lib/orders";

/**
 * Mock payment confirmation. Only available when PAYMENT_PROVIDER=mock.
 * The client posts the providerRef + outcome; the signature is HMAC(ref, secret)
 * which the mock provider verifies. In production this endpoint is inert.
 */
const schema = z.object({
  ref: z.string().min(4),
  outcome: z.enum(["success", "cancel"]).default("success"),
  signature: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    if (process.env.PAYMENT_PROVIDER !== "mock") {
      throw new HttpError(404, "Not available");
    }
    const body = schema.parse(await readJson(req));
    const provider = getPaymentProvider();
    const result = await provider.verifyPayment({
      providerRef: body.ref,
      payload: { signature: body.signature, outcome: body.outcome },
    });

    const payment = await db.payment.findFirst({ where: { providerRef: body.ref }, include: { order: true } });
    if (!payment) throw new HttpError(404, "Payment not found");

    if (!result.ok) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: result.status === "cancelled" ? "cancelled" : "failed" },
      });
      if (result.status !== "pending") {
        await db.order.update({
          where: { id: payment.orderId },
          data: { status: "pending_payment", paymentStatus: "failed" },
        });
        await db.orderEvent.create({
          data: { orderId: payment.orderId, status: "pending_payment", message: result.reason ?? "Payment not completed" },
        });
      }
      return Response.json({ ok: false, status: result.status, reason: result.reason }, { status: 402 });
    }

    // Success — but never trust the frontend blindly: verify signature above
    // and reconcile by providerRef (single use).
    if (payment.status === "paid") {
      return Response.json({ ok: true, orderNumber: payment.order.number });
    }
    await db.payment.update({ where: { id: payment.id }, data: { status: "paid" } });
    await db.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "paid", status: "artwork_processing" },
    });
    await db.orderEvent.create({
      data: { orderId: payment.orderId, status: "paid", message: "Payment confirmed (test mode)" },
    });
    await db.orderEvent.create({
      data: { orderId: payment.orderId, status: "artwork_processing", message: "Artwork queued for production" },
    });
    await db.productionJob.create({
      data: { orderId: payment.orderId, status: "queued", method: "DTG", partner: "in-house" },
    });

    // Decrement stock and empty the cart.
    const items = await db.orderItem.findMany({ where: { orderId: payment.orderId } });
    for (const item of items) {
      if (item.variantId) {
        await db.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } }).catch(() => {});
      }
    }
    if (payment.order.userId) {
      await db.cartItem.deleteMany({
        where: { cart: { userId: payment.order.userId }, savedForLater: false },
      });
    }
    await db.rewardTransaction.create({
      data: { userId: payment.order.userId!, kind: "purchase", points: Math.floor(payment.amount / 10000), note: `Order ${payment.order.number}` },
    }).catch(() => {});
    await db.rewardAccount.upsert({
      where: { userId: payment.order.userId! },
      create: { userId: payment.order.userId!, points: Math.floor(payment.amount / 10000) },
      update: { points: { increment: Math.floor(payment.amount / 10000) } },
    }).catch(() => {});

    return Response.json({ ok: true, orderNumber: payment.order.number });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid payment payload" }, { status: 400 });
    return errorResponse(err);
  }
}
