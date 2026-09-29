import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = pageMetadata({
  title: "All Products",
  description: "Every OWNIT blank — tees, hoodies, jackets, bags, caps and jerseys.",
  path: "/products",
});

// Public catalog — cached with ISR, re-rendered within a minute of catalog edits.
export const revalidate = 60;

export default async function ProductsPage() {
  const products = await db.product.findMany({
    where: { active: true, deletedAt: null },
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { popularity: "desc" }],
  });
  return (
    <div>
      <PageHero eyebrow="The full line-up" title="All products" note="Every blank is print-ready and made to order." />
      <Section className="pt-0">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                productId: p.id,
                slug: p.slug, name: p.name, subtitle: p.subtitle, basePrice: p.basePrice,
                badge: p.badge, image: p.images[0]?.url ?? null, categorySlug: p.category.slug,
              }}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
