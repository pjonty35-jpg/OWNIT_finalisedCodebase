import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticRoutes = [
    "", "/shop", "/products", "/collections", "/inspiration", "/how-it-works", "/quality",
    "/about", "/journal", "/faq", "/contact", "/help", "/shipping", "/returns",
    "/copyright", "/terms", "/privacy", "/create", "/cart",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  try {
    const [products, collections, posts, articles] = await Promise.all([
      db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
      db.collection.findMany({ select: { slug: true } }),
      db.inspirationPost.findMany({ select: { id: true } }),
      db.journalPost.findMany({ where: { published: true }, select: { slug: true, publishedAt: true } }),
    ]);
    return [
      ...staticRoutes,
      ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt })),
      ...collections.map((c) => ({ url: `${base}/collections/${c.slug}` })),
      ...posts.map((p) => ({ url: `${base}/inspiration/${p.id}` })),
      ...articles.map((a) => ({ url: `${base}/journal/${a.slug}`, lastModified: a.publishedAt })),
    ];
  } catch {
    return staticRoutes;
  }
}
