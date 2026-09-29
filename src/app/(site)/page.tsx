import Link from "next/link";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ButtonLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Design It. Own It. Wear It.",
  description: "Your imagination, on premium apparel. Choose your canvas, make it personal in the design studio, and wear something only you could make.",
  path: "/",
});
export const revalidate = 60;

const CATEGORIES = [
  { slug: "t-shirts", name: "T-Shirts", image: "essential-oversized-tee", note: "Everyday. Anything but ordinary." },
  { slug: "hoodies", name: "Hoodies", image: "studio-hoodie", note: "Comfort with character." },
  { slug: "jackets", name: "Jackets", image: "coach-jacket", note: "Your statement layer." },
  { slug: "bags", name: "Bags", image: "canvas-tote", note: "Carry a little of you." },
  { slug: "caps", name: "Caps", image: "classic-cap", note: "The finishing touch." },
  { slug: "jerseys", name: "Jerseys", image: "number-07-jersey", note: "Made for your team." },
];
const STEPS = [
  { title: "Find your canvas.", body: "Pick a piece, a colour and a fit that feels like you.", icon: "shirt" },
  { title: "Make your mark.", body: "Add your own text, images, stickers or a freehand idea.", icon: "pen" },
  { title: "Get it just right.", body: "Preview the placement. Save your design. Make it yours.", icon: "preview" },
  { title: "Wear your idea.", body: "Order your finished design and take it into the real world.", icon: "arrow" },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} /></svg>;
}
function StepIcon({ name }: { name: string }) {
  return <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {name === "shirt" ? <path d="m8 3-5 3 3 5 2-1v11h8V10l2 1 3-5-5-3a4 4 0 0 1-8 0Z" /> : name === "pen" ? <><path d="m15 4 5 5M4 20l4-1L21 6a2.8 2.8 0 0 0-4-4L4 15v5ZM12 21h9" /></> : name === "preview" ? <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="m8 12 3 3 5-6" /></> : <><path d="M4 12h16m-6-6 6 6-6 6" /><path d="M4 5v14" /></>}
  </svg>;
}

const getLandingData = unstable_cache(async () => {
  const [featured, inspiration] = await Promise.all([
    db.product.findMany({ where: { featured: true, active: true, deletedAt: null }, include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } }, orderBy: { popularity: "desc" }, take: 4 }),
    db.inspirationPost.findMany({ where: { featured: true }, orderBy: { likes: "desc" }, take: 3 }),
  ]);
  return { featured, inspiration };
}, ["landing-page-data-v2"], { revalidate: 60, tags: ["products", "inspiration"] });

export default async function LandingPage() {
  const { featured, inspiration } = await getLandingData();
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  return (
    <div className="ownit-home">
      <section className="campaign-hero" aria-labelledby="campaign-title">
        <div className="wrap campaign-grid">
          <div className="campaign-copy">
            <h1 id="campaign-title">DESIGN IT.<br /><span>OWN IT.</span><br />WEAR IT.</h1>
            <p className="campaign-description">Your imagination. Your signature.<br />Premium apparel, with you written all over it.</p>
            <div className="campaign-actions">
              <ButtonLink href="/create" size="lg" className="brand-pill">Start creating <Arrow /></ButtonLink>
              <Link href="/how-it-works" className="quiet-link"><span className="circle-icon"><Arrow diagonal /></span> How it works</Link>
            </div>
            <div className="campaign-details" aria-label="Design studio features">
              <div><strong>Your canvas</strong><span>Six ways to start</span></div>
              <div><strong>Your design</strong><span>Every detail, your call</span></div>
              <div><strong>Your pace</strong><span>Save. Refine. Repeat.</span></div>
            </div>
          </div>
          <div className="campaign-art">
            {/* Optimised version of the supplied OWNIT_HeroBG artwork. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/hero-bg.webp" alt="Cream OWNIT graphic T-shirt with custom colour, text and illustration tools" width={1374} height={1145} fetchPriority="high" />
            <span className="art-note" aria-hidden="true">A little less ordinary.</span>
          </div>
        </div>
      </section>

      <section className="wrap canvas-section" id="choose-canvas" aria-labelledby="canvas-title">
        <div className="section-heading"><div><p className="campaign-eyebrow">01 / The starting point</p><h2 id="canvas-title">Good things start blank.</h2></div><Link href="/shop" className="text-link">Explore all pieces <Arrow /></Link></div>
        <div className="canvas-grid">
          {CATEGORIES.map((c, i) => <Link key={c.slug} href={`/shop?category=${c.slug}`} className="canvas-card">
            <div className="canvas-card-top"><span>0{i + 1}</span><Arrow diagonal /></div>
            <span className={`canvas-card-art canvas-card-art-${i + 1}`} aria-hidden="true" />
            <div className="canvas-card-copy"><h3>{c.name}</h3><p>{c.note}</p></div>
          </Link>)}
        </div>
      </section>

      <section className="wrap process-section" aria-labelledby="process-title">
        <div className="process-intro"><p className="campaign-eyebrow">02 / From a thought to a thing</p><h2 id="process-title">Turn an idea into<br /><span>something you&apos;ll wear.</span></h2><p>Choose a piece, make it personal, preview every detail, and order when it feels right.</p><Link href="/how-it-works" className="text-link">See how it works <Arrow /></Link></div>
        <div className="process-grid">{STEPS.map((step, i) => <div className="process-step" key={step.title}><div className="process-step-top"><StepIcon name={step.icon} /><span>0{i + 1}</span></div><h3>{step.title}</h3><p>{step.body}</p></div>)}</div>
      </section>

      {featured.length > 0 && <section className="wrap featured-section" aria-labelledby="featured-title">
        <div className="section-heading"><div><p className="campaign-eyebrow">Considered essentials. Unlimited possibilities.</p><h2 id="featured-title">Meet your next favourite.</h2></div><Link href="/shop" className="text-link">Shop the collection <Arrow /></Link></div>
        <div className="featured-grid">{featured.map(p => <Link key={p.id} href={`/products/${p.slug}`} className="featured-card"><div className="featured-image"><span className="product-chip">Your design goes here</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images[0]?.url ?? "/img/hero.svg"} alt={p.name} width={800} height={600} loading="lazy" decoding="async" /><span className="product-arrow"><Arrow diagonal /></span></div><div className="featured-info"><div><span>{p.category.name}</span><h3>{p.name}</h3></div><p>From <strong>{currency.format(p.basePrice / 100)}</strong></p></div></Link>)}</div>
      </section>}

      <section className="wrap return-section" aria-labelledby="return-title">
        <div className="return-intro"><p className="campaign-eyebrow">03 / Stay in your creative flow</p><h2 id="return-title">Not just a piece.<br /><span>A piece of you.</span></h2><p>Find a spark. Make it your own. Come back to the ideas you haven&apos;t quite finished yet.</p></div>
        <Link href="/account?tab=designs" className="return-card saved-card"><span className="return-icon"><svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg></span><span className="campaign-eyebrow">A space for your ideas</span><h3>Pick up where<br />you left off.</h3><p>Your saved designs, ready for their next chapter.</p><span className="return-link">My design library <Arrow /></span></Link>
        <Link href="/inspiration" className="return-card inspiration-card"><span className="return-icon"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" /></svg></span><span className="campaign-eyebrow">A different point of view</span><h3>A little inspiration.<br />A lot of possibility.</h3><p>Explore the gallery and find your next starting point.</p><span className="return-link">Explore inspiration <Arrow /></span></Link>
      </section>

      {inspiration.length > 0 && <section className="wrap inspiration-section" aria-labelledby="inspiration-title"><div className="section-heading"><div><p className="campaign-eyebrow">Out of the ordinary</p><h2 id="inspiration-title">Ideas worth making yours.</h2></div><span className="hand-note">Different looks. Same freedom.</span></div><div className="inspiration-grid">{inspiration.map(p => <Link href={`/inspiration/${p.id}`} className="inspiration-tile" key={p.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} alt={p.title} width={600} height={600} loading="lazy" decoding="async" /><div><h3>{p.title}</h3><Arrow diagonal /></div></Link>)}</div></section>}

    </div>
  );
}
