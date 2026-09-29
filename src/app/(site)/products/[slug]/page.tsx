import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";
import { ProductCard } from "@/components/product-card";
import { ProductShowcase } from "./showcase";
import { formatMoney } from "@/lib/money";

// Public product/category pages — cached with ISR.
export const revalidate = 60;

async function load(slug: string) {
  // Product detail (exact product slug)…
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      printAreas: true,
      variants: { where: { active: true }, orderBy: [{ colorName: "asc" }, { size: "asc" }] },
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (product && !product.deletedAt && product.active) return { kind: "product" as const, product };

  // …or a category listing (t-shirts, hoodies, …).
  const category = await db.category.findUnique({ where: { slug } });
  if (category) {
    const products = await db.product.findMany({
      where: { categoryId: category.id, active: true, deletedAt: null },
      include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { popularity: "desc" },
    });
    return { kind: "category" as const, category, products };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return pageMetadata({ title: "Not found", description: "", noIndex: true });
  if (data.kind === "product") {
    return pageMetadata({
      title: data.product.name,
      description: data.product.description.slice(0, 150),
      path: `/products/${slug}`,
      ogImage: data.product.images[0]?.url ?? undefined,
    });
  }
  return pageMetadata({
    title: `${data.category.name} — Custom Print-Ready`,
    description: data.category.tagline ?? `Customise ${data.category.name.toLowerCase()} with your own artwork.`,
    path: `/products/${slug}`,
  });
}

const RELATED_DUMP = null;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  if (data.kind === "category") {
    return (
      <div>
        <PageHero eyebrow="Category" title={data.category.name} note={data.category.tagline ?? undefined} />
        <Section className="pt-0">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.products.map((p) => (
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

  const p = data.product;
  const materials = JSON.parse(p.materials) as string[];
  const features = JSON.parse(p.features) as string[];
  const care = JSON.parse(p.care) as string[];
  const fits = JSON.parse(p.fits) as string[];
  const colors = JSON.parse(p.colors) as { name: string; hex: string }[];
  void colors; // colours are rendered from live variants in the showcase
  const related = await db.product.findMany({
    where: { categoryId: p.categoryId, id: { not: p.id }, active: true },
    include: { images: { take: 1 }, category: true },
    take: 4,
  });
  const byColor = new Map<string, { name: string; hex: string }>();
  for (const v of p.variants) byColor.set(v.colorName, { name: v.colorName, hex: v.colorHex });
  const showcaseColors: { name: string; hex: string }[] =
    byColor.size > 0 ? [...byColor.values()] : colors;

  return (
    <div>
      <Section className="pt-28 lg:pt-36">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-faint">
          <Link href="/shop" className="hover:text-ivory">Shop</Link>
          <span className="mx-2">/</span>
          <Link href={`/products/${p.category.slug}`} className="hover:text-ivory">{p.category.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-mute">{p.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductShowcase
            silhouette={p.category.slug}
            colors={showcaseColors.map((c) => ({ ...c, variantId: null, inStock: true }))}
            productId={p.id}
            fallbackImage={p.images[0]?.url ?? "/img/hero.svg"}
            productName={p.name}
          />

          <div>
            {p.badge ? <p className="label-caps mb-2">{p.badge}</p> : null}
            <h1 className="headline text-4xl sm:text-5xl">{p.name}</h1>
            <p className="mt-2 text-sm text-mute">{p.subtitle}</p>
            <p className="mt-4 text-xl font-semibold">{formatMoney(p.basePrice)} <span className="text-xs font-normal text-faint">base price · customisation adds ₹99 first side</span></p>

            <p className="mt-2 text-xs text-faint">Available in {showcaseColors.length} colour{showcaseColors.length === 1 ? "" : "s"} · XS–XXL · full size chart in the studio.</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/create?product=${p.slug}`}
                className="sheen press inline-flex h-13 flex-1 items-center justify-center rounded-xl bg-ivory px-7 text-sm font-semibold tracking-wide text-ink transition hover:bg-white hover:shadow-[0_0_36px_rgba(245,242,234,0.22)]"
              >
                DESIGN YOURS
              </Link>
            </div>

            <div className="mt-8 grid gap-4 border-t border-line pt-6 text-sm text-mute sm:grid-cols-2">
              <div>
                <p className="label-caps mb-2">Materials</p>
                <ul className="space-y-1 text-xs">{materials.map((m) => <li key={m}>· {m}</li>)}</ul>
              </div>
              <div>
                <p className="label-caps mb-2">Features</p>
                <ul className="space-y-1 text-xs">{features.map((f) => <li key={f}>· {f}</li>)}</ul>
              </div>
              <div>
                <p className="label-caps mb-2">Care</p>
                <ul className="space-y-1 text-xs">{care.map((c) => <li key={c}>· {c}</li>)}</ul>
              </div>
              <div>
                <p className="label-caps mb-2">Printing</p>
                <ul className="space-y-1 text-xs">
                  <li>· Methods: {[...new Set(p.printAreas.map((a) => a.method))].join(", ")}</li>
                  <li>· Printable sides: {p.printAreas.map((a) => a.side).join(", ")}</li>
                  <li>· Fits: {fits.join(", ")}</li>
                </ul>
              </div>
            </div>

            <div id="buy-blank" className="mt-6 rounded-2xl border border-line bg-surface p-5 text-xs text-mute">
              <p className="label-caps mb-2">Shipping & returns</p>
              <p>Ships in 3–5 working days after production. Standard ₹99 · free over ₹2,999. Returns accepted for defects within 7 days — every piece is made one-of-one.</p>
              <div className="mt-3 flex gap-2">
                <Link href="/create" className="rounded-full border border-line2 px-3.5 py-1.5 text-[0.6875rem] tracking-wide text-ivory hover:border-mute">Customise instead →</Link>
                <Link href="/shipping" className="rounded-full border border-line2 px-3.5 py-1.5 text-[0.6875rem] tracking-wide text-ivory hover:border-mute">Shipping details</Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <p className="label-caps mb-3">The story</p>
        <p className="max-w-2xl text-lg leading-relaxed text-ivory/90">{p.description}</p>
        {p.story ? <p className="mt-3 max-w-2xl text-sm text-mute">{p.story}</p> : null}
      </Section>

      {related.length ? (
        <Section className="pt-0">
          <h2 className="headline mb-6 text-2xl">Complete the look</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                product={{
                  productId: r.id,
                  slug: r.slug, name: r.name, subtitle: r.subtitle, basePrice: r.basePrice,
                  badge: r.badge, image: r.images[0]?.url ?? null, categorySlug: r.category.slug,
                }}
              />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
