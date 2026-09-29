/** Canonical order lifecycle. Kept in one place for API, admin and UI timelines. */
export const ORDER_FLOW = [
  "draft",
  "pending_payment",
  "paid",
  "artwork_processing",
  "production_queued",
  "in_production",
  "quality_check",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_FLOW)[number] | "cancelled" | "refunded" | "returned";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_payment: "Pending payment",
  paid: "Paid",
  artwork_processing: "Artwork processing",
  production_queued: "Queued for production",
  in_production: "In production",
  quality_check: "Quality check",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  returned: "Returned",
};

/** Order statuses that imply payment has succeeded. */
export const PAID_STATUSES = new Set([
  "paid",
  "artwork_processing",
  "production_queued",
  "in_production",
  "quality_check",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
]);

export function orderProgress(status: string): number {
  const idx = (ORDER_FLOW as readonly string[]).indexOf(status);
  if (status === "cancelled" || status === "refunded" || status === "returned") return 0;
  if (idx < 0) return 0;
  return Math.round((idx / (ORDER_FLOW.length - 1)) * 100);
}

export function generateOrderNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(10 + Math.random() * 90);
  return `OD${n}${suffix}`;
}
