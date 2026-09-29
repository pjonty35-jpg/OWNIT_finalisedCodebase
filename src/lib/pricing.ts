import { db } from "./db";
import { customizationFee, shippingFor, taxFor, applyCoupon } from "./money";

export interface PricedLine {
  cartItemId?: string;
  productId: string;
  variantId: string;
  productName: string;
  designName: string | null;
  colorName: string;
  size: string;
  sides: string[];
  quantity: number;
  unitBase: number; // variant price incl. delta
  unitCustomization: number;
  unitPrice: number;
  lineTotal: number;
  previewUrl: string | null;
}

export interface PricedCart {
  lines: PricedLine[];
  savedForLater: PricedLine[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingMethod: string;
  shipping: number;
  tax: number;
  total: number;
}

/**
 * Compute the authoritative price of a cart. Catalog prices are loaded from
 * the database; nothing here reads amounts from the client.
 */
export async function priceCart(
  cartId: string,
  opts: { shippingMethod?: string; couponCode?: string | null } = {}
): Promise<PricedCart> {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
          design: { select: { name: true, previewUrl: true } },
        },
      },
    },
  });
  if (!cart) {
    return {
      lines: [], savedForLater: [], subtotal: 0, discount: 0, couponCode: null,
      shippingMethod: "standard", shipping: 0, tax: 0, total: 0,
    };
  }

  const active = cart.items.filter((i) => !i.savedForLater);
  const saved = cart.items.filter((i) => i.savedForLater);

  const mapLine = (i: (typeof cart.items)[number]): PricedLine => {
    const sides = safeJsonArray(i.sides);
    const unitBase = i.product.basePrice + i.variant.priceDelta;
    const unitCustomization = i.designId ? customizationFee(sides) : 0;
    const unitPrice = unitBase + unitCustomization;
    return {
      cartItemId: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.product.name,
      designName: i.design?.name ?? null,
      colorName: i.variant.colorName,
      size: i.variant.size,
      sides,
      quantity: i.quantity,
      unitBase,
      unitCustomization,
      unitPrice,
      lineTotal: unitPrice * i.quantity,
      previewUrl: i.design?.previewUrl ?? null,
    };
  };

  const lines = active.map(mapLine);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingMethod = opts.shippingMethod ?? "standard";

  let coupon: { kind: string; value: number; minSubtotal: number } | null = null;
  let couponCode: string | null = null;
  if (opts.couponCode) {
    const c = await db.coupon.findUnique({ where: { code: opts.couponCode.toUpperCase() } });
    if (c && c.active && (!c.expiresAt || c.expiresAt > new Date()) &&
        (!c.maxRedemptions || c.timesUsed < c.maxRedemptions)) {
      coupon = { kind: c.kind, value: c.value, minSubtotal: c.minSubtotal };
      couponCode = c.code;
    }
  }
  const discount = applyCoupon(subtotal, coupon);
  const shipping = shippingFor(subtotal - discount, shippingMethod);
  const tax = taxFor(subtotal - discount);

  return {
    lines,
    savedForLater: saved.map(mapLine),
    subtotal,
    discount,
    couponCode,
    shippingMethod,
    shipping,
    tax,
    total: subtotal - discount + shipping + tax,
  };
}

function safeJsonArray(v: string | null): string[] {
  try {
    const parsed = JSON.parse(v || "[]");
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 4) : [];
  } catch {
    return [];
  }
}
