import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = pageMetadata({
  title: "Shop Premium Blanks",
  description: "Premium heavyweight blanks waiting for your ideas: tees, hoodies, jackets, bags, caps and jerseys.",
  path: "/shop",
});

// Catalog content is public and changes rarely — ISR keeps visits fast
// (admin product edits re-render within a minute; see also revalidate in admin actions).
export const revalidate = 60;

const FILTERS = [
  { slug: "", label: "All" },
  { slug: "t-shirts", label: "T-Shirts" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "jackets", label: "Jackets" },
  { slug: "bags", label: "Bags" },
  { slug: "caps", label: "Caps" },
  { slug: "jerseys", label: "Jerseys" },
];

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const products = await db.product.findMany({
    where: {
      active: true,
      deletedAt: null,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { popularity: "desc" },
  });

  return (
    <div>
      <PageHero
        eyebrow="Premium blanks, zero ego"
        title="Shop the canvas"
        note="Heavyweight fabrics, considered fits, print-ready surfaces. Every piece is a starting point."
      />
      <Section className="pt-0">
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.slug}
              href={f.slug ? `/shop?category=${f.slug}` : "/shop"}
              className={`rounded-full border px-4 py-2 text-xs tracking-wide transition ${
                (category ?? "") === f.slug
                  ? "border-ivory bg-ivory text-ink"
                  : "border-line2 text-mute hover:border-mute hover:text-ivory"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-mute">Nothing in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  productId: p.id,
                  slug: p.slug,
                  name: p.name,
                  subtitle: p.subtitle,
                  basePrice: p.basePrice,
                  badge: p.badge,
                  image: p.images[0]?.url ?? null,
                  categorySlug: p.category.slug,
                }}
              />
            ))}
          </div>
        )}
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-12 text-center">
          <p className="headline text-2xl">Not clicking?</p>
          <p className="max-w-sm text-sm text-mute">Skip the catalogue. Start with a blank idea and pick the garment after.</p>
          <ButtonLink href="/create" className="mt-2">Create Your Own</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
