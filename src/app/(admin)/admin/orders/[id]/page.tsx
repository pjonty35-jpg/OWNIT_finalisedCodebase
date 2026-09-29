import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { OrderStatusControls } from "./order-status-controls";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { design: { select: { id: true, name: true, previewUrl: true, state: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!order) notFound();
  const jobs = await db.productionJob.findMany({ where: { orderId: order.id } });
  const shipment = await db.shipment.findFirst({ where: { orderId: order.id } });
  const address = order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/orders" className="text-xs text-faint hover:text-ivory">← All orders</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Order</p>
          <h1 className="headline mt-2 text-3xl">#{order.number}</h1>
          <p className="mt-1 text-sm text-mute">
            {order.user?.name ?? "Guest"} · {order.email} · {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={order.paymentStatus === "paid" ? "success" : "warn"}>{order.paymentStatus}</Badge>
          <Badge>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card-surface p-6">
            <h2 className="headline text-lg">Items & artwork</h2>
            <ul className="mt-4 space-y-4">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 rounded-xl border border-line p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-coal">
                    {i.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.previewUrl} alt={i.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">{i.name}</p>
                    <p className="mt-0.5 text-xs text-mute">{i.colorName} · {i.size} · ×{i.quantity} · {formatMoney(i.unitPrice)}/unit</p>
                    {i.design ? (
                      <p className="mt-1 text-xs text-mute">
                        Design: <Link href={`/admin/designs/${i.design.id}`} className="text-ivory underline underline-offset-4">{i.design.name}</Link>
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-faint">Blank — no customisation</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatMoney(order.subtotal)}</dd></div>
              {order.discount > 0 ? <div className="flex justify-between text-emerald-300"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{formatMoney(order.discount)}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-mute">Shipping ({order.shippingMethod})</dt><dd>{formatMoney(order.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-mute">Tax</dt><dd>{formatMoney(order.tax)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div>
            </dl>
          </section>

          <section className="card-surface p-6">
            <h2 className="headline text-lg">Timeline</h2>
            <ul className="mt-4 space-y-3">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mute" />
                  <span className="flex-1">
                    <span className="text-ivory">{ORDER_STATUS_LABEL[e.status] ?? e.status}</span>
                    {e.message ? <span className="text-mute"> — {e.message}</span> : null}
                  </span>
                  <span className="text-xs text-faint">{formatDate(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <OrderStatusControls
            orderId={order.id}
            currentStatus={order.status}
            paymentStatus={order.paymentStatus}
            trackingNumber={order.trackingNumber}
            flow={[...ORDER_FLOW, "cancelled", "refunded"] as string[]}
          />

          <section className="card-surface p-6">
            <h2 className="headline text-lg">Production</h2>
            {jobs.length === 0 ? (
              <p className="mt-3 text-sm text-mute">No production job yet — created after payment.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {jobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between rounded-lg border border-line px-3.5 py-2.5">
                    <span className="text-xs">{j.method} · {j.partner}</span>
                    <Badge tone={j.status === "shipped" ? "success" : "warn"}>{j.status.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {shipment ? (
              <p className="mt-4 rounded-lg border border-line bg-coal px-3.5 py-2.5 text-xs text-mute">
                {shipment.carrier} · {shipment.trackingNumber} · <span className="capitalize">{shipment.status.replace(/_/g, " ")}</span>
              </p>
            ) : null}
          </section>

          {address ? (
            <section className="card-surface p-6 text-sm">
              <h2 className="headline text-lg">Shipping to</h2>
              <p className="mt-3 text-mute">{address.fullName}</p>
              <p className="text-xs text-mute">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
              <p className="text-xs text-mute">{address.city}, {address.state} {address.postalCode}, {address.country}</p>
              <p className="mt-1 text-xs text-mute">{address.phone}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
