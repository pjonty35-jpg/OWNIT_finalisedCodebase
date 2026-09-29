import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = pageMetadata({ title: "Order", description: "Order details and tracking.", noIndex: true });

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ order: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const user = await getSessionUser();
  const { order: numberOrId } = await params;
  const { paid } = await searchParams;

  const order = await db.order.findFirst({
    where: {
      OR: [{ number: numberOrId }, { id: numberOrId }],
    },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || (order.userId !== user?.id && user?.role !== "admin")) {
    if (!user) redirect(`/signin?next=/orders/${numberOrId}`);
    notFound();
  }

  const shipment = await db.shipment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
  const address = order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null;
  const flowIndex = (ORDER_FLOW as readonly string[]).indexOf(order.status as (typeof ORDER_FLOW)[number]);
  const justPaid = paid === "1";

  return (
    <div className="wrap max-w-4xl pt-28 pb-24 lg:pt-36">
      {justPaid ? (
        <div className="mb-8 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-6 text-center">
          <p className="headline text-2xl text-emerald-100">Order confirmed.</p>
          <p className="mt-2 text-sm text-emerald-200/80">
            Your ideas are going into production. We&apos;ll email you at every step.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Order</p>
          <h1 className="headline mt-2 text-4xl">{order.number}</h1>
          <p className="mt-2 text-sm text-mute">Placed {formatDate(order.createdAt)} · {order.email}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "failed" ? "danger" : "warn"}>
            {order.paymentStatus}
          </Badge>
          <Badge>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-surface mt-8 p-7">
        <h2 className="headline text-lg">Progress</h2>
        {order.status === "cancelled" || order.status === "refunded" ? (
          <p className="mt-3 text-sm text-mute">This order was {order.status}.</p>
        ) : (
          <div className="mt-6">
            <div className="relative h-1 rounded bg-line">
              <div
                className="absolute inset-y-0 left-0 rounded bg-emerald-400 transition-all"
                style={{ width: `${Math.max(4, (Math.max(0, flowIndex) / (ORDER_FLOW.length - 1)) * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-[0.625rem] tracking-wide text-faint">
              {["Placed", "Paid", "Artwork", "Production", "QC", "Packed", "Shipped", "Delivered"].map((label, i) => (
                <span key={label} className={i <= Math.max(0, flowIndex) ? "text-emerald-300" : ""}>{label}</span>
              ))}
            </div>
          </div>
        )}
        <ul className="mt-7 space-y-3 border-t border-line pt-5">
          {order.events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mute" />
              <span className="flex-1">
                <span className="text-ivory">{ORDER_STATUS_LABEL[e.status] ?? e.status}</span>
                {e.message ? <span className="text-mute"> — {e.message}</span> : null}
              </span>
              <span className="text-xs text-faint">{formatDate(e.createdAt)}</span>
            </li>
          ))}
        </ul>
        {shipment ? (
          <div className="mt-5 rounded-xl border border-line bg-coal px-4 py-3 text-xs text-mute">
            {shipment.carrier ?? "Courier"} · {shipment.trackingNumber ?? "tracking pending"} · <span className="capitalize">{shipment.status.replace(/_/g, " ")}</span>
          </div>
        ) : null}
      </div>

      {/* Items */}
      <div className="card-surface mt-6 p-7">
        <h2 className="headline text-lg">Items</h2>
        <ul className="mt-5 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-coal">
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-mute">{item.colorName} · {item.size} · ×{item.quantity}</p>
              </div>
              <p className="text-sm">{formatMoney(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatMoney(order.subtotal)}</dd></div>
          {order.discount > 0 ? <div className="flex justify-between text-emerald-300"><dt>Discount</dt><dd>−{formatMoney(order.discount)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-mute">Shipping ({order.shippingMethod})</dt><dd>{order.shipping === 0 ? "Free" : formatMoney(order.shipping)}</dd></div>
          <div className="flex justify-between"><dt className="text-mute">Tax</dt><dd>{formatMoney(order.tax)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd>{formatMoney(order.total)}</dd></div>
        </dl>
        {address ? (
          <div className="mt-5 rounded-xl border border-line bg-coal p-4 text-xs text-mute">
            <p className="label-caps mb-1">Shipping to</p>
            <p>{address.fullName}, {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}, {address.country}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex gap-3">
        <ButtonLink href="/account" variant="outline" size="sm">← All orders</ButtonLink>
        <ButtonLink href="/create" size="sm">Create something new</ButtonLink>
      </div>
      <p className="mt-6 text-xs text-faint">
        Questions about this order? <Link href="/contact" className="underline underline-offset-4 hover:text-ivory">Contact support</Link>
      </p>
    </div>
  );
}
