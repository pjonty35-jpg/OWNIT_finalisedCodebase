import Link from "next/link";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ButtonLink, Reveal, CountUp } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "OWNIT — Design It. Own It. Wear It.",
  description:
    "Your imagination, on premium apparel. Create your own designs in the studio, preview them on 3D garments, and wear something only you could make.",
  path: "/",
});

// Public landing — cached with ISR so repeat visits are instant.
export const revalidate = 60;

const CATEGORIES = [
  { slug: "t-shirts", name: "T-Shirts", note: "The classic, reimagined." },
  { slug: "hoodies", name: "Hoodies", note: "Comfort meets identity." },
  { slug: "jackets", name: "Jackets", note: "Make a statement." },
  { slug: "bags", name: "Bags", note: "Carry your story." },
  { slug: "caps", name: "Caps", note: "Small detail. Big expression." },
  { slug: "jerseys", name: "Jerseys", note: "For teams. For dreamers." },
];

const STEPS = [
  { icon: "pen", title: "Create Your Design", body: "Use our design studio. Add text, images, illustrations or draw freely." },
  { icon: "cube", title: "See It in 3D", body: "Preview your design on realistic 3D garments before you buy." },
  { icon: "shirt", title: "We Make It", body: "Premium materials. Precision printing. Crafted with care." },
  { icon: "truck", title: "You Wear It", body: "Delivered to your doorstep. Anywhere in the world." },
];

const LIFESTYLE = [
  "/img/designs/life-city-walk.svg",
  "/img/designs/life-rooftop-dusk.svg",
  "/img/designs/life-studio-session.svg",
  "/img/designs/life-campus-day.svg",
];

function StepIcon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  switch (name) {
    case "pen":
      return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
    case "cube":
      return <svg {...common}><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" /><path d="M3.3 7.5L12 12l8.7-4.5M12 22V12" /></svg>;
    case "shirt":
      return <svg {...common}><path d="M16 3l4 2.5L18.5 9 16 8v13H8V8l-2.5 1L4 5.5 8 3a4 4 0 008 0z" /></svg>;
    default:
      return <svg {...common}><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2" /><circle cx="18.5" cy="18.5" r="2" /></svg>;
  }
}

const getLandingData = unstable_cache(
  async () => {
    const [featured, inspiration] = await Promise.all([
      db.product.findMany({
        where: { featured: true, active: true, deletedAt: null },
        include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { popularity: "desc" },
        take: 4,
      }),
      db.inspirationPost.findMany({
        where: { featured: true },
        orderBy: { likes: "desc" },
        take: 5,
      }),
    ]);
    return { featured, inspiration };
  },
  ["landing-page-data"],
  { revalidate: 60, tags: ["products", "inspiration"] },
);

export default async function LandingPage() {
  const { featured, inspiration } = await getLandingData();

  return (
    <div className="relative bg-ink">
      {/* Brand backdrop — concrete-hall artwork, dissolving before the footer */}
      <div aria-hidden className="landing-bg" />

      {/* ---------------- HERO ---------------- */}
      <section className="grain relative overflow-hidden pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 66% 40%, rgba(70,66,58,0.55) 0%, rgba(10,10,10,0) 70%), radial-gradient(40% 34% at 20% 78%, rgba(38,36,32,0.5) 0%, rgba(10,10,10,0) 70%)",
          }}
        />
        <div className="wrap relative grid items-center gap-10 pb-16 pt-12 lg:grid-cols-2 lg:pt-20">
          <Reveal>
            <p className="label-caps">More Than Clothing</p>
            <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl">
              <span className="block" style={{ animation: "riseIn .7s var(--ease-out-soft) 0s both" }}>Design it.</span>
              <span className="block text-stroke-ivory" style={{ animation: "riseIn .7s var(--ease-out-soft) .12s both" }}>Own it.</span>
              <span className="block" style={{ animation: "riseIn .7s var(--ease-out-soft) .24s both" }}>Wear it.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-mute">
              Your imagination, on premium apparel. Create, customise and wear what&apos;s truly yours.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/create" size="lg">
                Start Creating
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </ButtonLink>
              <Link href="/how-it-works" className="group inline-flex items-center gap-3 text-sm text-mute transition hover:text-ivory">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line2 transition group-hover:border-ivory">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                </span>
                Watch the Story
              </Link>
            </div>
            <div className="mt-12 grid max-w-md grid-cols-3 divide-x divide-line border-y border-line py-5">
              {[
                ["100%", "Your Design"],
                ["Premium", "Quality"],
                ["Worldwide", "Delivery"],
              ].map(([big, small]) => (
                <div key={big} className="px-4 first:pl-0">
                  <p className="text-base font-semibold text-ivory">{big}</p>
                  <p className="mt-0.5 text-xs text-mute">{small}</p>
                </div>
              ))}
            </div>
            <p className="liquid-chip press mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-mute">
              <span aria-hidden className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              The studio is open — 12 blanks ready for your ideas
            </p>
          </Reveal>

          <Reveal delay={0.15} className="relative">
            <div className="relative mx-auto aspect-square w-full max-w-[560px]">
              {/* soft halo to lift the collage off the backdrop */}
              <div
                aria-hidden
                className="absolute inset-[8%] rounded-full"
                style={{ background: "radial-gradient(closest-side, rgba(240,236,226,0.09), transparent 70%)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/hero-bg.webp"
                alt="OWNIT collage — design it, own it, wear it"
                width={1374}
                height={1145}
                fetchPriority="high"
                className="relative h-full w-full object-contain"
              />
              <span aria-hidden className="hand-note absolute -left-2 bottom-14 hidden -rotate-6 text-2xl lg:block">Turn ideas into reality</span>
              <span aria-hidden className="hand-note absolute -top-2 right-6 hidden rotate-3 text-2xl lg:block">Your canvas ↴</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CATEGORY GRID ---------------- */}
      <section className="wrap relative py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.05}>
              <Link
                href={`/products/${c.slug}`}
                className="group card-lift block rounded-2xl border border-line bg-surface p-4"
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-coal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/img/products/${c.slug === "t-shirts" ? "essential-oversized-tee" : c.slug === "hoodies" ? "studio-hoodie" : c.slug === "jackets" ? "coach-jacket" : c.slug === "bags" ? "canvas-tote" : c.slug === "caps" ? "classic-cap" : "number-07-jersey"}.svg`}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-faint">{c.note}</p>
                  </div>
                  <span aria-hidden className="press inline-flex text-mute transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- BLANK CANVAS / PROCESS ---------------- */}
      <section className="wrap relative grid gap-12 py-16 lg:grid-cols-[1.1fr_1.6fr] lg:py-24">
        <Reveal>
          <h2 className="headline text-4xl sm:text-5xl">
            A blank canvas
            <br />
            for a brighter you
          </h2>
          <p className="mt-5 max-w-sm text-sm text-mute">
            OWNIT gives you the freedom to create apparel that reflects who you are. No limits. No rules. Just you.
          </p>
          <ButtonLink href="/how-it-works" variant="outline" size="md" className="mt-7">
            How It Works
          </ButtonLink>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.07}>
              <div className="card-surface card-lift group relative h-full overflow-hidden p-6">
                <span aria-hidden className="absolute -right-3 -top-5 select-none font-display text-6xl font-black text-line/50 transition-colors duration-300 group-hover:text-line2">
                  0{i + 1}
                </span>
                <span className="text-ivory"><StepIcon name={s.icon} /></span>
                <p className="mt-4 text-sm font-semibold">{s.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-mute">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURED PRODUCTS ---------------- */}
      <section className="wrap relative py-8 defer-render">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="label-caps">Fresh Canvases</p>
            <h2 className="headline mt-2 text-3xl">Start from a premium blank</h2>
          </div>
          <ButtonLink href="/shop" variant="ghost" size="sm">View all →</ButtonLink>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {featured.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-1 hover:border-line2">
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]?.url ?? "/img/hero.svg"} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-faint">{p.category.name}</p>
                </div>
                <span className="text-xs text-mute">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.basePrice / 100)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- COMMUNITY ---------------- */}
      <section className="wrap relative grid items-center gap-10 py-16 lg:grid-cols-[1.6fr_1fr] lg:py-24 defer-render">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LIFESTYLE.map((src, i) => (
            <Reveal key={src} delay={i * 0.06}>
              <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Community creators wearing OWNIT" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <span className="hand-note -rotate-3 text-2xl">Real people, real creativity ↗</span>
          <h2 className="headline mt-4 text-3xl sm:text-4xl">A global community of creators</h2>
          <p className="mt-4 max-w-sm text-sm text-mute">
            From campus to the world — OWNIT is for everyone who dares to be different.
          </p>
          <div className="mt-7 grid max-w-xs grid-cols-3 gap-4">
            {[
              { value: 12, label: "Blanks" },
              { value: 12, label: "Drops" },
              { value: 340, label: "Designs" },
            ].map((s) => (
              <div key={s.label}>
                <p className="headline text-2xl">
                  <CountUp value={s.value} />+
                </p>
                <p className="text-[0.625rem] uppercase tracking-[0.18em] text-faint">{s.label}</p>
              </div>
            ))}
          </div>
          <ButtonLink href="/inspiration" className="press mt-7">Explore Creations</ButtonLink>
        </Reveal>
      </section>

      {/* ---------------- COMMUNITY STRIP ---------------- */}
      <section className="wrap relative pb-16 defer-render">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {inspiration.slice(0, 5).map((p) => (
            <Link key={p.id} href={`/inspiration/${p.id}`} className="group card-lift block overflow-hidden rounded-2xl border border-line">
              <div className="aspect-[3/4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="p-2.5 text-xs text-mute group-hover:text-ivory">{p.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="relative overflow-hidden border-t border-line">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(72% 80% at 50% 32%, rgba(80,76,66,0.5) 0%, rgba(10,10,10,0) 70%), linear-gradient(rgba(10,10,10,0.86), rgba(10,10,10,0.86))",
          }}
        />
        <div className="wrap specular relative py-24 text-center lg:py-32">
          <p className="label-caps">Ready to make it yours?</p>
          <h2 className="headline mx-auto mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">Open the studio</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-mute">Your ideas deserve to be worn.</p>
          <ButtonLink href="/create" size="lg" className="mt-9">
            OPEN THE STUDIO
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </ButtonLink>
          <div className="mt-16 hidden justify-center gap-4 sm:flex">
            {["DESIGN", "PREVIEW", "PRINT", "WEAR"].map((w, i) => (
              <span key={w} className={`headline text-2xl ${i === 3 ? "text-ivory" : "text-stroke"}`} style={{ opacity: 1 - i * 0.12 }}>{w}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
