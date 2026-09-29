/**
 * OWNIT money helpers. All amounts are integer minor units (paise for INR).
 * Prices NEVER come from the client: the server loads catalog prices and
 * computes authoritative totals here.
 */

export const CURRENCY = "INR";

/** Customization fees (minor units) per printed side. */
export const FIRST_SIDE_FEE = 9900; // ₹99 for the first printed side
export const EXTRA_SIDE_FEE = 4900; // ₹49 for each additional side

/** Flat shipping (minor units). A region model can replace this later. */
export const SHIPPING_STANDARD = 9900; // ₹99
export const SHIPPING_EXPRESS = 24900; // ₹249
export const FREE_SHIPPING_THRESHOLD = 299900; // ₹2,999

/** GST-inclusive display, computed on the subtotal. Configurable per region later. */
export const TAX_RATE_PCT = 5;

export function formatMoney(minor: number, currency = CURRENCY) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function customizationFee(sides: string[]) {
  if (!sides.length) return 0;
  return FIRST_SIDE_FEE + Math.max(0, sides.length - 1) * EXTRA_SIDE_FEE;
}

export function shippingFor(subtotal: number, method: string) {
  if (method === "express") return SHIPPING_EXPRESS;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_STANDARD;
}

export function taxFor(subtotal: number) {
  return Math.round((subtotal * TAX_RATE_PCT) / 100);
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export function applyCoupon(subtotal: number, coupon: { kind: string; value: number; minSubtotal: number } | null): number {
  if (!coupon) return 0;
  if (subtotal < coupon.minSubtotal) return 0;
  if (coupon.kind === "percent") return Math.round((subtotal * Math.min(100, coupon.value)) / 100);
  return Math.min(subtotal, coupon.value);
}
