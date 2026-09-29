import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { errorResponse } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in required");
    const { id } = await ctx.params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { slug: true } } } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order || (order.userId !== user.id && user.role !== "admin")) throw new HttpError(404, "Order not found");
    const shipment = await db.shipment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
    return Response.json({ order: present(order, shipment) });
  } catch (err) {
    return errorResponse(err);
  }
}

function present(order: {
  id: string; number: string; status: string; paymentStatus: string; subtotal: number; discount: number;
  shipping: number; tax: number; total: number; createdAt: Date; trackingNumber: string | null;
  shippingAddressJson: string | null; shippingMethod: string; email: string;
  items: {
    id: string; name: string; colorName: string; size: string; quantity: number; unitPrice: number;
    sides: string; previewUrl: string | null; product: { slug: string } | null;
  }[];
  events: { id: string; status: string; message: string | null; createdAt: Date }[];
}, shipment: { carrier: string | null; trackingNumber: string | null; status: string } | null) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totals: { subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, tax: order.tax, total: order.total },
    createdAt: order.createdAt,
    email: order.email,
    shippingMethod: order.shippingMethod,
    address: order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null,
    trackingNumber: order.trackingNumber ?? shipment?.trackingNumber ?? null,
    carrier: shipment?.carrier ?? null,
    shipmentStatus: shipment?.status ?? null,
    items: order.items.map((i) => ({
      id: i.id, name: i.name, colorName: i.colorName, size: i.size, quantity: i.quantity,
      unitPrice: i.unitPrice, sides: safe(i.sides), previewUrl: i.previewUrl, productSlug: i.product?.slug ?? null,
    })),
    events: order.events.map((e) => ({ id: e.id, status: e.status, message: e.message, createdAt: e.createdAt })),
  };
}

function safe(v: string | null): string[] {
  try {
    const p = JSON.parse(v || "[]");
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
