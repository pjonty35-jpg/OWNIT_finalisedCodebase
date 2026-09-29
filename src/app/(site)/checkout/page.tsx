import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { priceCart } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/page";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Secure checkout.",
  path: "/checkout",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/checkout");

  const [cart, profile, addresses] = await Promise.all([
    db.cart.findUnique({ where: { userId: user.id } }),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }] }),
  ]);
  const priced = cart ? await priceCart(cart.id) : null;
  if (!priced || priced.lines.length === 0) redirect("/cart");

  return (
    <div className="wrap pt-28 pb-24 lg:pt-36">
      <p className="label-caps">Almost there</p>
      <h1 className="headline mt-2 text-4xl sm:text-5xl">Checkout</h1>
      <Section className="px-0 pt-10">
        <CheckoutFlow
          user={{ name: profile?.name ?? "", email: profile?.email }}
          addresses={addresses.map((a) => ({
            id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, line1: a.line1,
            line2: a.line2, city: a.city, state: a.state, postalCode: a.postalCode, country: a.country,
          }))}
          initialTotals={{
            subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping,
            tax: priced.tax, total: priced.total, count: priced.lines.reduce((s, l) => s + l.quantity, 0),
          }}
        />
      </Section>
    </div>
  );
}
