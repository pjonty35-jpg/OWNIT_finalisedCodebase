import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";
import { ORDER_STATUS_LABEL } from "@/lib/orders";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { name: true, slug: true } }, design: { select: { id: true, name: true, previewUrl: true, state: true } } } },
        events: { orderBy: { createdAt: "asc" } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    const shipment = await db.shipment.findFirst({ where: { orderId: order.id } });
    const jobs = await db.productionJob.findMany({ where: { orderId: order.id } });
    return Response.json({
      order: {
        id: order.id, number: order.number, status: order.status, paymentStatus: order.paymentStatus,
        total: order.total, subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, tax: order.tax,
        createdAt: order.createdAt, email: order.email, address: order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null,
        trackingNumber: order.trackingNumber, shippingMethod: order.shippingMethod,
        customer: order.user ? { email: order.user.email, name: order.user.name } : null,
        items: order.items.map((i) => ({
          id: i.id, name: i.name, colorName: i.colorName, size: i.size, quantity: i.quantity, unitPrice: i.unitPrice,
          previewUrl: i.previewUrl ?? i.design?.previewUrl ?? null,
          designId: i.designId, designName: i.design?.name ?? null,
          designState: i.design?.state ? JSON.parse(i.design.state) : null,
        })),
        events: order.events,
        shipment, productionJobs: jobs,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const patchSchema = z.object({
  status: z.string().max(30).optional(),
  paymentStatus: z.string().max(30).optional(),
  trackingNumber: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await readJson(req));
    const order = await db.order.findUnique({ where: { id } });
    if (!order) throw new HttpError(404, "Order not found");

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
    if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber;

    const updated = await db.order.update({ where: { id }, data });

    if (body.status && body.status !== order.status) {
      await db.orderEvent.create({
        data: { orderId: id, status: body.status, message: body.note ?? `Status set to ${ORDER_STATUS_LABEL[body.status] ?? body.status}` },
      });
      // Keep production jobs roughly in sync with order status.
      const jobMap: Record<string, string> = {
        production_queued: "queued", in_production: "in_production", quality_check: "quality_check",
        packed: "packed", shipped: "shipped",
      };
      if (jobMap[body.status]) {
        await db.productionJob.updateMany({
          where: { orderId: id, status: { not: "shipped" } },
          data: { status: jobMap[body.status] },
        });
      }
      if (body.status === "shipped" && !updated.trackingNumber) {
        await db.order.update({ where: { id }, data: { trackingNumber: `OWNIT${Math.floor(1000 + Math.random() * 9000)}` } });
      }
      await db.notification.create({
        data: { userId: order.userId ?? "", kind: "order", title: `Order ${order.number} updated`, body: ORDER_STATUS_LABEL[body.status] ?? body.status },
      }).catch(() => {});
    }

    await db.auditLog.create({
      data: { userId: admin.id, action: "order.update", entity: "order", entityId: order.number, meta: JSON.stringify(body) },
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "Invalid update" }, { status: 400 });
    return errorResponse(err);
  }
}
