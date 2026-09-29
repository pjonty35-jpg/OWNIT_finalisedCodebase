import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { pageMetadata } from "@/lib/seo";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/utils";
import { ButtonLink } from "@/components/ui";
import { AccountNav } from "./account-nav";
import { ProfileForm } from "./profile-form";
import { DesignActions } from "./design-actions";
import { RewardsPanel } from "./rewards-panel";
import { engagementSnapshot } from "@/lib/rewards";

export const metadata: Metadata = pageMetadata({ title: "Account", description: "Your OWNIT dashboard.", noIndex: true });

export const dynamic = "force-dynamic";

const TABS = ["overview", "designs", "orders", "wishlist", "addresses", "notifications", "settings"] as const;
type Tab = (typeof TABS)[number];

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/account");
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes((tabParam ?? "overview") as Tab) ? ((tabParam ?? "overview") as Tab) : "overview";

  const [designs, orders, wishlist, addressList, notifications, rewards, engagement] = await Promise.all([
    db.design.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: { product: { select: { name: true, slug: true } } },
      take: 12,
    }),
    db.order.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 10,
    }),
    db.wishlist.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: { select: { slug: true, name: true, basePrice: true, images: { take: 1 } } }, design: { select: { name: true, previewUrl: true } } },
        },
      },
    }),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }] }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.rewardAccount.findUnique({ where: { userId: user.id } }),
    engagementSnapshot(user.id),
  ]);

  const wishItems = wishlist?.items ?? [];

  return (
    <div className="wrap pt-24 pb-24 lg:pt-28">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <AccountNav tab={tab} userName={user.name} userEmail={user.email} points={rewards?.points ?? 0} />

        <div>
          {tab === "overview" ? (
            <div className="space-y-8">
              <div className="relative overflow-hidden rounded-2xl border border-line p-8" style={{ background: "radial-gradient(80% 100% at 80% 0%, rgba(58,54,46,0.5) 0%, rgba(15,15,14,1) 70%)" }}>
                <p className="label-caps">Welcome back,</p>
                <h1 className="headline mt-2 text-4xl">{user.name ?? "Creator"}.</h1>
                <p className="mt-2 text-sm text-mute">Keep creating. The world looks better in your designs.</p>
                <ButtonLink href="/create" className="mt-6">Create Something New</ButtonLink>
                <span aria-hidden className="hand-note absolute right-8 top-8 hidden rotate-2 text-2xl md:block">Your ideas belong here</span>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { value: designs.length, label: "Designs Created", note: "Keep going", href: "/account?tab=designs" },
                  { value: orders.length, label: "Orders Placed", note: "Thanks for being here", href: "/account?tab=orders" },
                  { value: wishItems.length, label: "Items Wishlisted", note: "Great taste", href: "/account?tab=wishlist" },
                  { value: rewards?.points ?? 0, label: "OWNIT Points", note: "Unlock rewards", href: "/account?tab=overview" },
                ].map((s) => (
                  <Link key={s.label} href={s.href} className="card-surface card-lift p-5">
                    <p className="headline text-3xl">{s.value}</p>
                    <p className="mt-1 text-xs font-semibold">{s.label}</p>
                    <p className="text-[0.625rem] text-faint">{s.note}</p>
                  </Link>
                ))}
              </div>

              <RewardsPanel initial={engagement} />

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="headline text-xl">My Designs</h2>
                  <div className="flex gap-3 text-xs">
                    <Link href="/account?tab=designs" className="text-mute hover:text-ivory">View All →</Link>
                    <ButtonLink href="/create" size="sm">+ Create New Design</ButtonLink>
                  </div>
                </div>
                {designs.length === 0 ? (
                  <EmptyMini title="Nothing here yet." note="Your next idea could change that." cta="CREATE SOMETHING" href="/create" />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {designs.slice(0, 5).map((d) => (
                      <div key={d.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                        <Link href={`/create?design=${d.id}`}>
                          <div className="aspect-square bg-coal">
                            {d.previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={d.previewUrl} alt={d.name} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                        </Link>
                        <div className="p-3">
                          <p className="truncate text-xs font-semibold">{d.name}</p>
                          <p className="text-[0.625rem] text-faint">Edited {timeAgo(d.updatedAt)}</p>
                        </div>
                        <DesignActions designId={d.id} name={d.name} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="headline text-xl">My Orders</h2>
                  <Link href="/account?tab=orders" className="text-xs text-mute hover:text-ivory">View All →</Link>
                </div>
                <div className="space-y-2">
                  {orders.slice(0, 4).map((o) => (
                    <Link key={o.id} href={`/orders/${o.number}`} className="card-surface flex items-center gap-4 p-4 transition hover:border-line2">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-coal">
                        {o.items[0]?.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.items[0].previewUrl!} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">#{o.number}</p>
                        <p className="text-xs text-faint">{o.items.reduce((s, i) => s + i.quantity, 0)} items · {formatDate(o.createdAt)}</p>
                      </div>
                      <span className="hidden rounded-full border border-line2 px-3 py-1 text-[0.625rem] text-mute sm:block">
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <span className="text-sm">{formatMoney(o.total)}</span>
                    </Link>
                  ))}
                  {orders.length === 0 ? <p className="text-sm text-mute">No orders yet — your first design is waiting.</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "designs" ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="headline text-2xl">My Designs</h1>
                <ButtonLink href="/create" size="sm">+ Create New Design</ButtonLink>
              </div>
              {designs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line py-16 text-center">
                  <p className="headline text-xl">Nothing here yet.</p>
                  <p className="mt-2 text-sm text-mute">Your next idea could change that.</p>
                  <ButtonLink href="/create" size="sm" className="mt-6">CREATE SOMETHING</ButtonLink>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {designs.map((d) => (
                    <div key={d.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                      <Link href={`/create?design=${d.id}`} className="block aspect-square bg-coal">
                        {d.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.previewUrl} alt={d.name} className="h-full w-full object-cover" />
                        ) : null}
                      </Link>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold">{d.name}</p>
                        <p className="text-[0.625rem] text-faint">{d.product.name} · {timeAgo(d.updatedAt)}</p>
                        <DesignActions designId={d.id} name={d.name} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "orders" ? (
            <div>
              <h1 className="headline mb-6 text-2xl">My Orders</h1>
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line py-16 text-center">
                    <p className="headline text-xl">No orders yet.</p>
                    <ButtonLink href="/create" size="sm" className="mt-6">START CREATING</ButtonLink>
                  </div>
                ) : (
                  orders.map((o) => (
                    <Link key={o.id} href={`/orders/${o.number}`} className="card-surface flex flex-wrap items-center gap-4 p-5 transition hover:border-line2">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-coal">
                        {o.items[0]?.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.items[0].previewUrl!} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-32 flex-1">
                        <p className="text-sm font-semibold">#{o.number}</p>
                        <p className="text-xs text-faint">{o.items.reduce((s, i) => s + i.quantity, 0)} items · {formatDate(o.createdAt)}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[0.625rem] ${
                        o.status === "delivered" ? "border-emerald-900 text-emerald-300"
                        : o.status === "cancelled" ? "border-red-900 text-red-300"
                        : "border-line2 text-mute"}`}>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <span className="w-20 text-right text-sm">{formatMoney(o.total)}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {tab === "wishlist" ? (
            <div>
              <h1 className="headline mb-6 text-2xl">Wishlist</h1>
              {wishItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line py-16 text-center">
                  <p className="headline text-xl">Nothing saved yet.</p>
                  <p className="mt-2 text-sm text-mute">Tap the heart on any product or design.</p>
                  <ButtonLink href="/shop" size="sm" className="mt-6">Browse products</ButtonLink>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {wishItems.map((w) => (
                    <Link key={w.id} href={w.product ? `/products/${w.product.slug}` : "/inspiration"} className="overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-line2">
                      <div className="aspect-square bg-coal">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.product?.images[0]?.url ?? w.design?.previewUrl ?? "/img/hero.svg"} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold">{w.product?.name ?? w.design?.name ?? "Saved item"}</p>
                        {w.product ? <p className="text-[0.625rem] text-mute">{formatMoney(w.product.basePrice)}</p> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === "addresses" ? <AddressesPanel addresses={addressList} /> : null}
          {tab === "notifications" ? (
            <div>
              <h1 className="headline mb-6 text-2xl">Notifications</h1>
              {notifications.length === 0 ? (
                <p className="text-sm text-mute">You&apos;re all caught up.</p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id} className={`card-surface p-4 ${n.readAt ? "opacity-60" : ""}`}>
                      <p className="text-sm font-semibold">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-xs text-mute">{n.body}</p> : null}
                      <p className="mt-1 text-[0.625rem] text-faint">{timeAgo(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === "settings" ? (
            <div className="max-w-lg">
              <h1 className="headline mb-6 text-2xl">Settings</h1>
              <ProfileForm initialName={user.name ?? ""} email={user.email} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyMini({ title, note, cta, href }: { title: string; note?: string; cta: string; href: string }) {
  return (
    <div className="grain relative overflow-hidden rounded-2xl border border-dashed border-line py-12 text-center">
      <span aria-hidden className="pointer-events-none absolute -right-4 -top-8 select-none font-display text-[6rem] font-black leading-none text-line/40">✦</span>
      <p className="headline relative text-lg">{title}</p>
      {note ? <p className="relative mt-1 text-sm text-mute">{note}</p> : null}
      <ButtonLink href={href} size="sm" className="relative mt-5">{cta}</ButtonLink>
    </div>
  );
}

interface AccountAddress {
  id: string; label: string | null; fullName: string; line1: string; line2: string | null;
  city: string; state: string; postalCode: string; country: string; phone: string; isDefault: boolean;
}

function AddressesPanel({ addresses }: { addresses: AccountAddress[] }) {
  return (
    <div>
      <h1 className="headline mb-6 text-2xl">Addresses</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="card-surface p-5 text-sm">
            <p className="text-xs text-faint">{a.label}{a.isDefault ? " · Default" : ""}</p>
            <p className="mt-2 font-semibold">{a.fullName}</p>
            <p className="mt-1 text-xs text-mute">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
            <p className="text-xs text-mute">{a.city}, {a.state} {a.postalCode}, {a.country}</p>
            <p className="mt-1 text-xs text-mute">{a.phone}</p>
          </div>
        ))}
        {addresses.length === 0 ? <p className="text-sm text-mute">No saved addresses yet — add one at checkout.</p> : null}
      </div>
    </div>
  );
}
