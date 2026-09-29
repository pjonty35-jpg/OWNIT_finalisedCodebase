import Link from "next/link";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "pending_payment", "paid", "in_production", "shipped", "delivered", "cancelled"] as const;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const orders = await db.order.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { email: { contains: q } }] } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Fulfilment</p>
          <h1 className="headline mt-2 text-3xl">Orders</h1>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order # or email"
            className="h-10 w-64 rounded-lg border border-line bg-coal px-3 text-sm text-ivory placeholder:text-faint focus:border-mute focus:outline-none"
          />
          <button className="h-10 rounded-lg border border-line2 px-4 text-xs text-mute hover:text-ivory">Search</button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs ${
              (status ?? "all") === f ? "border-ivory bg-ivory text-ink" : "border-line2 text-mute hover:text-ivory"
            }`}
          >
            {f === "all" ? "All" : ORDER_STATUS_LABEL[f] ?? f}
          </Link>
        ))}
      </div>

      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              <th className="px-5 py-3.5 font-medium">Order</th>
              <th className="px-5 py-3.5 font-medium">Date</th>
              <th className="px-5 py-3.5 font-medium">Customer</th>
              <th className="px-5 py-3.5 font-medium">Items</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-white/[0.03]">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">#{o.number}</Link>
                </td>
                <td className="px-5 py-3.5 text-xs text-mute">{formatDate(o.createdAt)}</td>
                <td className="px-5 py-3.5 text-xs text-mute">{o.email}</td>
                <td className="px-5 py-3.5 text-xs text-mute">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="px-5 py-3.5">
                  <Badge tone={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "failed" ? "danger" : "warn"}>
                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right">{formatMoney(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-mute">No orders match.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
