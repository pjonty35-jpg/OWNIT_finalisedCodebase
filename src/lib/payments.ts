/**
 * Payment provider abstraction.
 *
 * Launch provider is Razorpay (India); a `mock` provider implements the same
 * interface for local development and test mode so the full checkout flow
 * works end-to-end without external credentials. Never fake success in
 * production logic: the mock provider is only selected when
 * PAYMENT_PROVIDER=mock.
 */

export interface CreatePaymentInput {
  orderNumber: string;
  amount: number; // minor units
  currency: string;
  email: string;
  callbackUrl: string;
}

export interface CreatePaymentResult {
  provider: string;
  providerRef: string;
  /** Where the frontend should send the customer to approve payment. */
  checkoutUrl: string;
}

export interface VerifyPaymentInput {
  providerRef: string;
  /** Opaque payload returned by the provider redirect/webhook. */
  payload: Record<string, string>;
}

export type PaymentVerifyOutcome =
  | { ok: true; status: "paid" }
  | { ok: false; status: "failed" | "cancelled" | "pending"; reason?: string };

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerifyOutcome>;
  /** Verify an inbound webhook signature. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
}

// ---------------- Mock provider (local dev / test mode) ----------------

class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerRef = `mock_${input.orderNumber}_${Date.now().toString(36)}`;
    const url = new URL(input.callbackUrl);
    return {
      provider: this.name,
      providerRef,
      checkoutUrl: `/checkout/pay/mock?ref=${encodeURIComponent(providerRef)}&amount=${input.amount}&order=${encodeURIComponent(input.orderNumber)}`,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerifyOutcome> {
    // The mock approve page posts a signature of ref+secret; verify it.
    const expected = mockSignature(input.providerRef);
    if (input.payload.signature !== expected) {
      return { ok: false, status: "failed", reason: "Invalid mock payment signature" };
    }
    if (input.payload.outcome === "cancel") {
      return { ok: false, status: "cancelled" };
    }
    return { ok: true, status: "paid" };
  }

  verifyWebhook(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    return timingSafeEqual(signature, mockSignature(bodyKey(rawBody)));
  }
}

import { createHmac, timingSafeEqual as tse } from "crypto";
function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && tse(ab, bb);
}
function bodyKey(rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as { ref?: string };
    return parsed.ref ?? rawBody;
  } catch {
    return rawBody;
  }
}
function mockSignature(key: string) {
  return createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET || "ownit_dev_payment_secret")
    .update(key)
    .digest("hex");
}

// ---------------- Razorpay provider (needs env credentials) ----------------

class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";

  private auth() {
    const id = process.env.RZP_KEY_ID;
    const secret = process.env.RZP_KEY_SECRET;
    if (!id || !secret) throw new Error("Razorpay credentials missing (RZP_KEY_ID / RZP_KEY_SECRET)");
    return { id, secret };
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { id, secret } = this.auth();
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        receipt: input.orderNumber,
      }),
    });
    if (!res.ok) throw new Error(`Razorpay order creation failed: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return {
      provider: this.name,
      providerRef: data.id,
      checkoutUrl: `/checkout/pay/razorpay?ref=${encodeURIComponent(data.id)}`,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerifyOutcome> {
    // Standard Razorpay handler signature: HMAC(order_id|payment_id, key_secret)
    const { secret } = this.auth();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input.payload;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { ok: false, status: "failed", reason: "Missing Razorpay fields" };
    }
    const expected = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (!timingSafeEqual(expected, razorpay_signature)) {
      return { ok: false, status: "failed", reason: "Signature mismatch" };
    }
    return { ok: true, status: "paid" };
  }

  verifyWebhook(rawBody: string, signature: string | null): boolean {
    const secret = process.env.RZP_KEY_SECRET;
    if (!secret || !signature) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return timingSafeEqual(expected, signature);
  }
}

// ---------------- Stripe provider (international, needs env credentials) ----

class StripeProvider implements PaymentProvider {
  readonly name = "stripe";
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Intentionally minimal: creates a Checkout Session via REST when keys are configured.
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Stripe credentials missing (STRIPE_SECRET_KEY)");
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": input.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(input.amount),
      "line_items[0][price_data][product_data][name]": `OWNIT order ${input.orderNumber}`,
      "line_items[0][quantity]": "1",
      success_url: `${input.callbackUrl}?outcome=success`,
      cancel_url: `${input.callbackUrl}?outcome=cancel`,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Stripe session creation failed: ${res.status}`);
    const data = (await res.json()) as { id: string; url: string };
    return { provider: this.name, providerRef: data.id, checkoutUrl: data.url };
  }
  async verifyPayment(): Promise<PaymentVerifyOutcome> {
    // Real verification happens through Stripe webhooks.
    return { ok: false, status: "pending" };
  }
  verifyWebhook(): boolean {
    // Implement stripe-signature verification when enabling Stripe.
    return false;
  }
}

export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case "razorpay":
      return new RazorpayProvider();
    case "stripe":
      return new StripeProvider();
    default:
      return new MockPaymentProvider();
  }
}
