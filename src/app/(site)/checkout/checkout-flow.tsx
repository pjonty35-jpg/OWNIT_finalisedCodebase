"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatMoney, shippingFor, taxFor } from "@/lib/money";
import { Button, Field, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AddressOpt {
  id: string; label: string | null; fullName: string; phone: string; line1: string;
  line2: string | null; city: string; state: string; postalCode: string; country: string;
}

const STEPS = ["Customer", "Shipping", "Delivery", "Payment", "Review"] as const;

export function CheckoutFlow({
  user,
  addresses,
  initialTotals,
}: {
  user: { name: string; email?: string | null };
  addresses: AddressOpt[];
  initialTotals: { subtotal: number; discount: number; shipping: number; tax: number; total: number; count: number };
}) {
  const router = useRouter();
  const { push } = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [form, setForm] = useState({
    fullName: user.name ?? "",
    email: user.email ?? "",
    phone: "",
    line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN",
    saveAddress: true,
  });
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(initialTotals.discount);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // Mirror of server pricing rules — display only; the server recalculates on submit.
  const totals = useMemo(() => {
    const afterDiscount = Math.max(0, initialTotals.subtotal - discount);
    const shipping = shippingFor(afterDiscount, method);
    const tax = taxFor(afterDiscount);
    return { ...initialTotals, discount, shipping, tax, total: afterDiscount + shipping + tax };
  }, [initialTotals, discount, method]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function applyPromo() {
    if (!promo.trim()) return;
    try {
      const res = await fetch("/api/cart/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promo }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Invalid code");
      // Percent: estimate display discount; server applies authoritative math on submit.
      const est = data.coupon.kind === "percent"
        ? Math.round((initialTotals.subtotal * Math.min(100, data.coupon.value)) / 100)
        : Math.min(initialTotals.subtotal, data.coupon.value);
      if (initialTotals.subtotal < data.coupon.minSubtotal) {
        throw new Error(`Code needs a minimum order of ${formatMoney(data.coupon.minSubtotal)}`);
      }
      setDiscount(est);
      setCouponCode(data.coupon.code);
      push(`Code ${data.coupon.code} applied`, "success");
    } catch (e) {
      setDiscount(0);
      setCouponCode(null);
      push(e instanceof Error ? e.message : "Invalid code", "error");
    }
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.fullName.trim() || form.fullName.trim().length < 2) return "Enter your full name";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return "Enter a valid email";
      if (form.phone.trim().length < 6) return "Enter a valid phone number";
    }
    if (step === 1) {
      if (form.line1.trim().length < 4) return "Enter your street address";
      if (!form.city.trim() || !form.state.trim()) return "Enter your city and state";
      if (form.postalCode.trim().length < 4) return "Enter a valid postal code";
    }
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, shippingMethod: method, couponCode }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/signin?next=/checkout");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      push("Order created — redirecting to payment", "success");
      if (data.payment?.checkoutUrl) {
        router.push(data.payment.checkoutUrl);
      } else {
        router.push(`/checkout/pay/${data.orderNumber}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        {/* Step indicator */}
        <ol className="mb-8 flex flex-wrap gap-2 text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[0.6875rem]",
                  i === step ? "border-ivory bg-ivory text-ink font-bold" : i < step ? "border-emerald-700 text-emerald-300" : "border-line2 text-faint"
                )}
              >
                {i + 1}
              </span>
              <span className={i === step ? "text-ivory" : "text-faint"}>{s}</span>
              {i < STEPS.length - 1 ? <span className="mx-1 text-line2">—</span> : null}
            </li>
          ))}
        </ol>

        {error ? <p className="mb-5 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2.5 text-xs text-red-200">{error}</p> : null}

        <div className="card-surface p-7">
          {step === 0 ? (
            <div className="space-y-4">
              <h2 className="headline text-lg">Customer information</h2>
              <Field label="Full name"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your name" /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98XXX XXXXX" /></Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="headline text-lg">Shipping address</h2>
              {addresses.length ? (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() =>
                        setForm((f) => ({ ...f, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, postalCode: a.postalCode }))
                      }
                      className="w-full rounded-xl border border-line px-4 py-3 text-left text-xs text-mute transition hover:border-mute"
                    >
                      <span className="text-ivory">{a.label ?? "Address"}:</span> {a.fullName}, {a.line1}, {a.city} {a.postalCode}
                    </button>
                  ))}
                </div>
              ) : null}
              <Field label="Address line 1"><Input value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Street, building" /></Field>
              <Field label="Address line 2 (optional)"><Input value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Apartment, landmark" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
                <Field label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
                <Field label="Postal code"><Input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></Field>
                <Field label="Country">
                  <select value={form.country} onChange={(e) => set("country", e.target.value)} className="h-11 w-full rounded-xl border border-line bg-coal px-3 text-sm text-ivory">
                    <option value="IN">India</option>
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-mute">
                <input type="checkbox" checked={form.saveAddress} onChange={(e) => set("saveAddress", e.target.checked)} className="accent-white" />
                Save this address for next time
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <h2 className="headline text-lg">Delivery method</h2>
              {([
                ["standard", "Standard", "3–7 days after production", shippingFor(initialTotals.subtotal - discount, "standard")],
                ["express", "Express", "Priority handling, fastest courier", shippingFor(initialTotals.subtotal - discount, "express")],
              ] as const).map(([id, title, note, cost]) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition",
                    method === id ? "border-ivory bg-white/5" : "border-line hover:border-mute"
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="text-xs text-mute">{note}</span>
                  </span>
                  <span className="text-sm">{cost === 0 ? "Free" : formatMoney(cost)}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="headline text-lg">Payment</h2>
              <p className="rounded-xl border border-line bg-coal px-4 py-3 text-xs text-mute">
                Test mode is active: payment runs through the built-in mock provider.
                No real money moves. A real provider (Razorpay) activates with credentials.
              </p>
              <div className="rounded-xl border border-line2 px-5 py-4 text-sm">
                <p className="font-semibold">{formatMoney(totals.total)}</p>
                <p className="text-xs text-mute">Charged once your order is confirmed.</p>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4 text-sm">
              <h2 className="headline text-lg">Review your order</h2>
              <div className="rounded-xl border border-line p-4 text-xs text-mute">
                <p><span className="text-ivory">{form.fullName}</span> · {form.email} · {form.phone}</p>
                <p className="mt-1">{form.line1}{form.line2 ? `, ${form.line2}` : ""}, {form.city}, {form.state} {form.postalCode}, {form.country}</p>
                <p className="mt-1 capitalize">{method} delivery</p>
              </div>
              <p className="text-xs text-mute">
                By placing this order you confirm you have the rights to the artwork in your designs.
              </p>
              <Button size="lg" className="w-full" onClick={placeOrder} disabled={busy}>
                {busy ? "Placing order…" : `Pay ${formatMoney(totals.total)} →`}
              </Button>
            </div>
          ) : null}

          {step < 4 ? (
            <div className="mt-7 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                ← Back
              </Button>
              <Button onClick={next}>Continue</Button>
            </div>
          ) : (
            <div className="mt-5">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>← Back to payment</Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary rail */}
      <aside>
        <div className="card-surface sticky top-24 p-6">
          <h2 className="headline text-lg">Order Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-mute">Subtotal ({totals.count} items)</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
            {totals.discount > 0 ? <div className="flex justify-between text-emerald-300"><dt>Discount {couponCode ? `(${couponCode})` : ""}</dt><dd>−{formatMoney(totals.discount)}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-mute">Shipping</dt><dd>{totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Tax</dt><dd>{formatMoney(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(totals.total)}</dd></div>
          </dl>
          <div className="mt-5 flex gap-2 border-t border-line pt-5">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="Promo code"
              className="h-10 w-full rounded-lg border border-line bg-coal px-3 text-xs text-ivory placeholder:text-faint focus:border-mute focus:outline-none"
            />
            <Button size="sm" variant="outline" onClick={applyPromo}>Apply</Button>
          </div>
          <p className="mt-3 text-[0.625rem] text-faint">Try FIRSTOWN for 10% off.</p>
        </div>
      </aside>
    </div>
  );
}
