import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const [revenueAgg, orderCount, pendingProd, designs, customers, newCustomers, repeatCustomers] = await Promise.all([
      db.order.aggregate({ where: { paymentStatus: "paid" }, _sum: { total: true } }),
      db.order.count({ where: { deletedAt: null } }),
      db.productionJob.count({ where: { status: { in: ["queued", "in_production"] } } }),
      db.design.count({ where: { deletedAt: null } }),
      db.user.count({ where: { role: "customer", deletedAt: null } }),
      db.user.count({ where: { role: "customer", createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      db.order.groupBy({ by: ["userId"], where: { paymentStatus: "paid" }, _count: { userId: true } }),
    ]);
    const topProducts = await db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const productIds = topProducts.map((t) => t.productId);
    const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } });
    const prodMap = Object.fromEntries(products.map((p) => [p.id, p]));

    return Response.json({
      revenue: revenueAgg._sum.total ?? 0,
      orders: orderCount,
      pendingProduction: pendingProd,
      designs,
      customers,
      newCustomers,
      repeatCustomers: repeatCustomers.filter((r) => r._count.userId > 1).length,
      topProducts: topProducts.map((t) => ({ name: prodMap[t.productId]?.name ?? "—", qty: t._sum.quantity ?? 0 })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
