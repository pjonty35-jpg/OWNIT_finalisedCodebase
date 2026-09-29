"use client";

import { use, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { Button, Spinner } from "@/components/ui";

export default function PayPage({ params }: { params: Promise<{ order: string }> }) {
  const { order } = use(params);
  return (
    <div className="wrap flex min-h-[70vh] items-center justify-center py-24">
      <Suspense fallback={<Spinner className="h-7 w-7" />}>
        <PayGateway order={order} />
      </Suspense>
    </div>
  );
}

function PayGateway({ order }: { order: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref");
  const amount = params.get("amount");
  const outcomeParam = params.get("status");
  const [busy, setBusy] = useState<"success" | "cancel" | null>(null);

  async function complete(outcome: "success" | "cancel") {
    setBusy(outcome);
    try {
      // Dev-mode: fetch the HMAC challenge for this ref, then confirm.
      let signature = "";
      if (outcome === "success" && ref) {
        const challenge = await fetch(`/api/payments/mock/challenge?ref=${encodeURIComponent(ref)}`);
        if (challenge.ok) {
          signature = ((await challenge.json()) as { signature: string }).signature;
        }
      }
      const res = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, outcome, signature }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        router.push(`/orders/${data.orderNumber}?paid=1`);
      } else {
        router.push(`/checkout/pay/${order}?status=${data.status === "cancelled" ? "cancelled" : "failed"}`);
      }
    } catch {
      router.push(`/checkout/pay/${order}?status=failed`);
    }
  }

  if (!ref) {
    return (
      <div className="card-surface w-full max-w-md p-8 text-center">
        <p className="headline text-xl">Payment session missing</p>
        <p className="mt-3 text-sm text-mute">Start checkout again to create a payment.</p>
        <Button className="mt-6" onClick={() => router.push("/cart")}>Back to cart</Button>
      </div>
    );
  }

  if (outcomeParam === "failed" || outcomeParam === "cancelled") {
    return (
      <div className="card-surface w-full max-w-md p-8 text-center">
        <p className="headline text-xl">{outcomeParam === "failed" ? "Payment didn't go through" : "Payment cancelled"}</p>
        <p className="mt-3 text-sm text-mute">
          {outcomeParam === "failed"
            ? "No money was taken. You can retry payment or choose a different method."
            : "Your order is saved — resume whenever you're ready."}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => complete("success")} disabled={busy !== null}>Try again</Button>
          <Button variant="ghost" onClick={() => router.push("/account")}>Go to my orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface w-full max-w-md p-8 text-center">
      <p className="label-caps">Test payment</p>
      <h1 className="headline mt-2 text-2xl">Mock gateway</h1>
      <p className="mt-3 text-sm text-mute">
        Order <span className="text-ivory">{order}</span>
        {amount ? <> · {formatMoney(Number(amount))}</> : null}
      </p>
      <div className="mt-7 flex flex-col gap-3">
        <Button onClick={() => complete("success")} disabled={busy !== null}>
          {busy === "success" ? "Processing…" : "Approve payment (test)"}
        </Button>
        <Button variant="outline" onClick={() => complete("cancel")} disabled={busy !== null}>
          Cancel payment
        </Button>
      </div>
      <p className="mt-5 text-xs text-faint">
        Local development gateway. With Razorpay credentials configured, customers see Razorpay Checkout here.
      </p>
    </div>
  );
}
