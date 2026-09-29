import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ orders: [] });
    const orders = await db.order.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 50,
    });
    return Response.json({
      orders: orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        createdAt: o.createdAt,
        trackingNumber: o.trackingNumber,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        previewUrl: o.items[0]?.previewUrl ?? null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
