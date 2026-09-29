import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { compactNumber } from "@/lib/utils";
import { RemixButton } from "./remix-button";

// Public post — cached with ISR (like counts refresh within a minute; the button updates locally).
export const revalidate = 60;

async function load(id: string) {
  return db.inspirationPost.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      design: { include: { product: { include: { category: true } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await load(id);
  if (!post) return pageMetadata({ title: "Not found", description: "", noIndex: true });
  return pageMetadata({
    title: `${post.title} by @${post.handle}`,
    description: `Community design on OWNIT — ${post.productType}. Remix it and make it yours.`,
    path: `/inspiration/${id}`,
    ogImage: post.imageUrl,
  });
}

export default async function InspirationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await load(id);
  if (!post) notFound();

  const related = await db.inspirationPost.findMany({
    where: { id: { not: post.id }, category: post.category },
    take: 4,
    orderBy: { likes: "desc" },
  });
  void related;

  return (
    <div className="wrap pt-28 pb-24 lg:pt-36">
      <Link href="/inspiration" className="text-xs text-faint hover:text-ivory">← Back to Inspiration</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={post.title} className="w-full object-cover" />
        </div>
        <div>
          <p className="label-caps capitalize">{post.category} · {post.productType}</p>
          <h1 className="headline mt-3 text-4xl sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-mute">
            Created by <span className="text-ivory">@{post.handle}</span>
            {post.creator?.name ? ` · ${post.creator.name}` : ""}
          </p>
          <div className="mt-6 flex gap-6 border-y border-line py-4 text-sm text-mute">
            <span>♥ {compactNumber(post.likes)} likes</span>
            <span>◍ {compactNumber(post.views)} views</span>
            <span>↻ {compactNumber(post.remixes)} remixes</span>
          </div>

          <div className="mt-8">
            <RemixButton postId={post.id} />
          </div>

          {post.design?.product ? (
            <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
              <p className="label-caps mb-2">Made on</p>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/products/essential-oversized-tee.svg" alt={post.design.product.name} className="h-16 w-16 rounded-xl border border-line object-cover" />
                <div>
                  <p className="text-sm font-semibold">{post.design.product.name}</p>
                  <p className="text-xs text-mute">{post.design.product.subtitle}</p>
                  <Link href={`/create?product=${post.design.product.slug}`} className="mt-1 inline-block text-xs text-mute underline hover:text-ivory">
                    Customise this blank →
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-xs text-faint">
            Respect creator ownership: remixes credit the original design automatically.
          </p>
        </div>
      </div>

      {related.length ? (
        <div className="mt-20">
          <h2 className="headline mb-6 text-2xl">More in {post.category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} href={`/inspiration/${r.id}`} className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-1 hover:border-line2">
                <div className="aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imageUrl} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <p className="truncate p-3 text-xs">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
