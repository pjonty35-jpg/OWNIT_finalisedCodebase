"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, useToast } from "@/components/ui";

export function OrderStatusControls({
  orderId,
  currentStatus,
  paymentStatus,
  trackingNumber,
  flow,
}: {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  flow: string[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [payment, setPayment] = useState(paymentStatus);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status !== currentStatus ? status : undefined,
          paymentStatus: payment !== paymentStatus ? payment : undefined,
          trackingNumber: tracking !== (trackingNumber ?? "") ? tracking : undefined,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      push("Order updated", "success");
      router.refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const label = (s: string) => s.replace(/_/g, " ");

  return (
    <section className="card-surface p-6">
      <h2 className="headline text-lg">Update</h2>
      <div className="mt-4 space-y-4">
        <label className="block space-y-1.5">
          <span className="label-caps">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-coal px-3 text-sm text-ivory">
            {flow.map((s) => (
              <option key={s} value={s}>{label(s)}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Payment</span>
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-coal px-3 text-sm text-ivory">
            {["pending", "paid", "failed", "refunded", "partially_refunded"].map((s) => (
              <option key={s} value={s}>{label(s)}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Tracking number</span>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-coal px-3 text-sm text-ivory" placeholder="OWNIT1234" />
        </label>
        <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving…" : "Save changes"}</Button>
      </div>
    </section>
  );
}
