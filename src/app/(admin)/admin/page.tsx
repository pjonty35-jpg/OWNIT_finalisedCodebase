import Link from "next/link";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [revenueAgg, paidOrders, pendingPayment, production, recentOrders, customers, designCount, topProducts] =
    await Promise.all([
      db.order.aggregate({ where: { paymentStatus: "paid" }, _sum: { total: true } }),
      db.order.count({ where: { paymentStatus: "paid" } }),
      db.order.count({ where: { paymentStatus: "pending" } }),
      db.productionJob.findMany({
        where: { status: { in: ["queued", "in_production", "quality_check"] } },
        include: { order: { include: { items: true } } },
        orderBy: { createdAt: "asc" },
        take: 6,
      }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
      db.user.count({ where: { role: "customer" } }),
      db.design.count({ where: { deletedAt: null } }),
      db.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    ]);

  const prodNames = await db.product.findMany({
    where: { id: { in: topProducts.map((t) => t.productId) } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(prodNames.map((p) => [p.id, p.name]));

  const cards = [
    { label: "Revenue (paid)", value: formatMoney(revenueAgg._sum.total ?? 0) },
    { label: "Paid orders", value: String(paidOrders) },
    { label: "Awaiting payment", value: String(pendingPayment) },
    { label: "Customers", value: String(customers) },
    { label: "Designs created", value: String(designCount) },
    { label: "In production", value: String(production.length) },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <p className="label-caps">Overview</p>
      <h1 className="headline mt-2 text-3xl">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <p className="headline text-2xl">{c.value}</p>
            <p className="mt-1 text-[0.6875rem] text-mute">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="headline text-lg">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-mute hover:text-ivory">All orders →</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between py-3 text-sm hover:text-ivory">
                  <span>
                    <span className="font-semibold">#{o.number}</span>
                    <span className="ml-3 text-xs text-faint">{formatDate(o.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "pending" ? "warn" : "danger"}>
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                    <span>{formatMoney(o.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="headline text-lg">Production queue</h2>
            <Link href="/admin/production" className="text-xs text-mute hover:text-ivory">Manage →</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {production.length === 0 ? <li className="py-4 text-sm text-mute">Queue is clear.</li> : null}
            {production.map((j) => (
              <li key={j.id} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/admin/orders/${j.orderId}`} className="font-semibold hover:text-ivory">#{j.order.number}</Link>
                <span className="text-xs text-mute">{j.order.items.length} item(s)</span>
                <Badge tone={j.status === "in_production" ? "warn" : "default"}>{j.status.replace(/_/g, " ")}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6 lg:col-span-2">
          <h2 className="headline text-lg">Top products</h2>
          <ul className="mt-4 space-y-2">
            {topProducts.map((t, i) => (
              <li key={t.productId} className="flex items-center gap-4 text-sm">
                <span className="headline w-6 text-line2">{i + 1}</span>
                <span className="flex-1">{nameMap[t.productId] ?? "—"}</span>
                <span className="text-mute">{t._sum.quantity ?? 0} sold</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
