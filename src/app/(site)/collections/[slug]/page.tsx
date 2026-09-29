import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui";

// Public collection — cached with ISR.
export const revalidate = 60;

async function load(slug: string) {
  return db.collection.findUnique({
    where: { slug },
    include: { products: { include: { category: true, images: { take: 1 } }, where: { active: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) return pageMetadata({ title: "Not found", description: "", noIndex: true });
  return pageMetadata({ title: c.name, description: c.tagline ?? c.description ?? "", path: `/collections/${slug}` });
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) notFound();
  return (
    <div>
      <PageHero eyebrow="Collection" title={c.name} note={c.tagline ?? c.description ?? undefined} />
      <Section className="pt-0">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {c.products.map((p) => (
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
        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-12 text-center">
          <p className="hand-note -rotate-2 text-2xl">Your next idea awaits →</p>
          <ButtonLink href="/create">Create Your Own</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
