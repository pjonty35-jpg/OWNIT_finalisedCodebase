import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { PageHero, Section } from "@/components/page";

export const metadata: Metadata = pageMetadata({
  title: "Collections",
  description: "Curated OWNIT collections — campus drops, quiet luxury and game day.",
  path: "/collections",
});

// Public listing — cached with ISR.
export const revalidate = 60;

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({
    where: { featured: true },
    include: { products: { include: { images: { take: 1 } }, take: 3 } },
  });
  return (
    <div>
      <PageHero eyebrow="Curated drops" title="Collections" note="Themes we build, seasons we love, pieces you make your own." />
      <Section className="pt-0">
        <div className="grid gap-6 md:grid-cols-3">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-1 hover:border-line2">
              <div className="grid h-44 grid-cols-3 gap-px bg-line">
                {c.products.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.images[0]?.url ?? "/img/hero.svg"} alt={p.name} className="h-full w-full object-cover" />
                ))}
              </div>
              <div className="p-5">
                <h2 className="headline text-lg">{c.name}</h2>
                <p className="mt-1 text-xs text-mute">{c.tagline}</p>
                <p className="mt-3 text-xs text-faint">{c.products.length}+ pieces · Explore →</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
