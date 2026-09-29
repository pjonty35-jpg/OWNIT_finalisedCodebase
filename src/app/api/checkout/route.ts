import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { readJson, errorResponse, rateLimit, clientIp } from "@/lib/http";
import { priceCart } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { generateOrderNumber } from "@/lib/orders";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  line1: z.string().min(4).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  postalCode: z.string().min(4).max(10),
  country: z.string().min(2).max(2).default("IN"),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  couponCode: z.string().max(30).optional().nullable(),
  saveAddress: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    rateLimit(`checkout:${clientIp(req)}`, 10, 60_000);
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to check out");

    const body = schema.parse(await readJson(req));
    const cart = await db.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
    if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) {
      throw new HttpError(400, "Your cart is empty");
    }

    // Authoritative server-side pricing.
    const priced = await priceCart(cart.id, {
      shippingMethod: body.shippingMethod,
      couponCode: body.couponCode ?? null,
    });
    if (!priced.lines.length) throw new HttpError(400, "Your cart is empty");

    const addressJson = JSON.stringify({
      fullName: body.fullName, phone: body.phone, line1: body.line1, line2: body.line2 ?? null,
      city: body.city, state: body.state, postalCode: body.postalCode, country: body.country,
    });

    const order = await db.order.create({
      data: {
        number: generateOrderNumber(),
        userId: user.id,
        email: body.email,
        status: "pending_payment",
        subtotal: priced.subtotal,
        discount: priced.discount,
        shipping: priced.shipping,
        tax: priced.tax,
        total: priced.total,
        couponCode: priced.couponCode,
        shippingAddressJson: addressJson,
        shippingMethod: body.shippingMethod,
        items: {
          create: priced.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            name: l.productName,
            colorName: l.colorName,
            size: l.size,
            sides: JSON.stringify(l.sides),
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            previewUrl: l.previewUrl ?? undefined,
          })),
        },
        events: { create: { status: "pending_payment", message: "Order created" } },
      },
    });

    if (body.couponCode && priced.discount > 0) {
      await db.coupon.update({ where: { code: body.couponCode.toUpperCase() }, data: { timesUsed: { increment: 1 } } }).catch(() => {});
    }

    const provider = getPaymentProvider();
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const payment = await provider.createPayment({
      orderNumber: order.number,
      amount: priced.total,
      currency: "INR",
      email: body.email,
      callbackUrl: `${base}/checkout/pay/${order.number}`,
    });

    await db.payment.create({
      data: {
        orderId: order.id,
        provider: payment.provider,
        providerRef: payment.providerRef,
        amount: priced.total,
        status: "created",
      },
    });

    if (body.saveAddress) {
      await db.address.create({
        data: {
          userId: user.id, label: "Checkout", fullName: body.fullName, phone: body.phone,
          line1: body.line1, line2: body.line2 ?? null, city: body.city, state: body.state,
          postalCode: body.postalCode, country: body.country,
        },
      }).catch(() => {});
    }

    return Response.json({
      orderNumber: order.number,
      total: priced.total,
      payment: { provider: payment.provider, checkoutUrl: payment.checkoutUrl, providerRef: payment.providerRef },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0]?.message ?? "Invalid details" }, { status: 400 });
    }
    return errorResponse(err);
  }
}
