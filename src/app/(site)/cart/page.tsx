import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { priceCart } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { CartLines } from "./cart-lines";

export const metadata: Metadata = pageMetadata({
  title: "Your Cart",
  description: "Review your custom pieces and continue to checkout.",
  path: "/cart",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/cart");

  const cart = await db.cart.findUnique({ where: { userId: user.id } });
  const priced = cart ? await priceCart(cart.id) : null;
  const lines = priced?.lines ?? [];
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const suggestions = await db.product.findMany({
    where: { active: true, deletedAt: null },
    include: { images: { take: 1 } },
    orderBy: { popularity: "desc" },
    take: 4,
  });

  return (
    <div>
      <PageHero
        eyebrow="Your ideas belong here"
        title="Your cart"
        note={count > 0 ? "One step closer to wearing your story." : "A blank canvas is waiting."}
      />
      <Section className="pt-0">
        {count === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <p className="headline text-2xl">Your canvas is waiting.</p>
            <p className="mt-2 text-sm text-mute">Nothing here yet — make something only you could make.</p>
            <ButtonLink href="/create" className="mt-7">START CREATING</ButtonLink>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <CartLines lines={lines} />
            <aside>
              <div className="card-surface sticky top-24 p-6">
                <h2 className="headline text-lg">Order Summary</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-mute">Subtotal ({count} {count === 1 ? "item" : "items"})</dt><dd>{formatMoney(priced!.subtotal)}</dd></div>
                  {priced!.discount > 0 ? (
                    <div className="flex justify-between text-emerald-300"><dt>Discount</dt><dd>−{formatMoney(priced!.discount)}</dd></div>
                  ) : null}
                  <div className="flex justify-between"><dt className="text-mute">Shipping</dt><dd>{priced!.shipping === 0 ? "Free" : formatMoney(priced!.shipping)}</dd></div>
                  <div className="flex justify-between"><dt className="text-mute">Tax</dt><dd>{formatMoney(priced!.tax)}</dd></div>
                  <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(priced!.total)}</dd></div>
                </dl>
                <p className="mt-1 text-right text-[0.6875rem] text-faint">Inclusive of all taxes</p>
                <ButtonLink href="/checkout" className="mt-5 w-full">
                  Proceed to Checkout
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </ButtonLink>
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center">
                  {[
                    ["Secure", "payments"],
                    ["Made", "to order"],
                    ["Tracked", "delivery"],
                  ].map(([a, b]) => (
                    <div key={a}>
                      <p className="text-xs font-semibold text-ivory">{a}</p>
                      <p className="text-[0.625rem] text-faint">{b}</p>
                    </div>
                  ))}
                </div>
                <details className="mt-4 border-t border-line pt-4">
                  <summary className="cursor-pointer list-none text-xs text-mute marker:hidden">Have a promo code?</summary>
                  <div className="mt-3 flex gap-2">
                    <input name="promo" placeholder="Enter code" className="h-10 w-full rounded-lg border border-line bg-coal px-3 text-xs text-ivory placeholder:text-faint focus:outline-none focus:border-mute" />
                    <span className="inline-flex items-center text-[0.625rem] text-faint">applied at checkout</span>
                  </div>
                </details>
                </div>
              <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
                <p className="label-caps">Premium packaging</p>
                <p className="mt-2 text-xs text-mute">Because every story deserves a good beginning.</p>
              </div>
            </aside>
          </div>
        )}

        {/* You might also like */}
        <div className="mt-16">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="headline text-xl">You Might Also Like</h2>
            <Link href="/shop" className="text-xs text-mute hover:text-ivory">See More →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {suggestions.map((p) => (
              <Link key={p.id} href={`/create?product=${p.slug}`} className="group rounded-2xl border border-line bg-surface p-4 text-center transition hover:-translate-y-1 hover:border-line2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]?.url ?? "/img/hero.svg"} alt={p.name} loading="lazy" className="mx-auto aspect-square w-full rounded-xl object-cover" />
                <p className="mt-3 text-xs font-semibold">{p.name}</p>
                <p className="mt-1 text-xs text-mute">{formatMoney(p.basePrice)}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
