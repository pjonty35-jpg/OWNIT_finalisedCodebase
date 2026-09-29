import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui";
import { Section } from "@/components/page";
import { LikeButton } from "./like-button";
import { compactNumber } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Inspiration",
  description: "Designs, styles and stories from creators around the world. Get inspired, remix, or start from scratch.",
  path: "/inspiration",
});

// Category filters arrive via searchParams (rendered per request); ISR caches the default view.
export const revalidate = 60;

const CATEGORIES = ["all", "minimal", "typography", "illustration", "anime", "streetwear", "vintage", "nature", "aesthetic", "college", "sports", "music"];

export default async function InspirationPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "all" } = await searchParams;
  const where = category !== "all" ? { category } : {};
  const [featured, trending, community] = await Promise.all([
    db.inspirationPost.findMany({ where: { ...where, featured: true }, orderBy: { likes: "desc" }, take: 5 }),
    db.inspirationPost.findMany({ where, orderBy: [{ trending: "desc" }, { likes: "desc" }], take: 5 }),
    db.inspirationPost.findMany({ where, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(55% 60% at 70% 20%, rgba(60,58,52,0.5) 0%, rgba(10,10,10,0) 70%)" }} />
        <div className="wrap relative pt-32 pb-10 lg:pt-40">
          <p className="label-caps">Real people. Bolder ideas.</p>
          <h1 className="headline mt-3 max-w-3xl text-5xl sm:text-7xl">Inspiration lives here.</h1>
          <p className="mt-5 max-w-lg text-sm text-mute">
            Explore designs, styles and stories from creators around the world. Get inspired, remix, or start from scratch — it&apos;s your canvas.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <ButtonLink href="/create">Start Creating</ButtonLink>
            <ButtonLink href="/journal" variant="outline">Read the Stories</ButtonLink>
          </div>
          <span aria-hidden className="hand-note absolute right-6 top-36 hidden rotate-2 text-2xl lg:block">Ideas · People · Places · You</span>
        </div>
      </section>

      <Section className="pt-4">
        {/* Category chips */}
        <div className="mb-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={c === "all" ? "/inspiration" : `/inspiration?category=${c}`}
              className={`press rounded-full border px-4 py-2 text-xs capitalize transition ${
                category === c ? "border-ivory bg-ivory text-ink" : "border-line2 text-mute hover:border-mute hover:text-ivory"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Featured */}
        <div className="mb-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="headline text-2xl">Featured Designs</h2>
              <p className="mt-1 text-xs text-mute">Handpicked designs to spark your next creation.</p>
            </div>
            <Link href="/inspiration" className="text-xs text-mute hover:text-ivory">View All →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {featured.map((p) => (
              <Link key={p.id} href={`/inspiration/${p.id}`} className="card-lift group overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="relative aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {p.trending ? <span className="animate-pop-in absolute left-2.5 top-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[0.625rem] text-ivory backdrop-blur">♥ Trending</span> : null}
                  <div className="absolute bottom-2.5 right-2.5">
                    <LikeButton postId={p.id} initialLikes={p.likes} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-semibold">{p.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[0.6875rem] text-faint">
                    <span>@{p.handle}</span>
                    <span className="capitalize">{p.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="mb-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="headline text-2xl">Trending Right Now</h2>
              <p className="mt-1 text-xs text-mute">What the community is creating this week.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {trending.map((p) => (
              <Link key={p.id} href={`/inspiration/${p.id}`} className="card-lift group overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="relative aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute bottom-2.5 right-2.5">
                    <LikeButton postId={p.id} initialLikes={p.likes} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-semibold">{p.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[0.6875rem] text-faint">
                    <span className="capitalize">{p.category}</span>
                    <span>{compactNumber(p.remixes)} remixes</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Community */}
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="headline text-2xl">From Our Community</h2>
              <p className="mt-1 text-xs text-mute">Every design has a story. Tag @ownit to get featured.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {community.map((p) => (
              <Link key={p.id} href={`/inspiration/${p.id}`} className="group block overflow-hidden rounded-xl border border-line">
                <div className="aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <p className="truncate p-2 text-[0.6875rem] text-faint group-hover:text-ivory">@{p.handle}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-line p-10 text-center lg:p-16" style={{ background: "radial-gradient(60% 90% at 50% 100%, rgba(58,54,46,0.6) 0%, rgba(15,15,14,1) 80%)" }}>
          <span aria-hidden className="hand-note absolute left-8 top-8 -rotate-6 text-2xl">Your next idea awaits</span>
          <h2 className="headline text-3xl sm:text-4xl">Turn inspiration into reality</h2>
          <p className="mt-3 text-sm text-mute">Create your own design now.</p>
          <ButtonLink href="/create" className="mt-7">Open the Studio</ButtonLink>
        </div>
      </Section>
    </div>
  );
}
