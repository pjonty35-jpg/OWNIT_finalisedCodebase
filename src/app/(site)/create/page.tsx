import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { Studio } from "./studio";
import { getSessionUser } from "@/lib/session";
import "./studio.css";

export const metadata: Metadata = pageMetadata({
  title: "Design Studio",
  description: "Your clothing, your canvas. Explore colours, text, images and artwork in OWNIT's interactive four-view 2D design studio.",
  path: "/create",
});

// searchParams (?product= / ?design=) decide the payload; the default view benefits from ISR.
export const revalidate = 60;

const SILHOUETTE_BY_CATEGORY: Record<string, string> = {
  "t-shirts": "t-shirts",
  hoodies: "hoodies",
  jackets: "jackets",
  jerseys: "jerseys",
  caps: "caps",
  bags: "bags",
};

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; design?: string }>;
}) {
  const { product: productSlug, design: designId } = await searchParams;

  const products = await db.product.findMany({
    where: { active: true, deletedAt: null },
    include: {
      category: { select: { slug: true, name: true } },
      printAreas: true,
      variants: { where: { active: true }, orderBy: [{ colorName: "asc" }, { size: "asc" }] },
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { popularity: "desc" },
  });

  const catalog = products.map((p) => {
    const colors: { name: string; hex: string; variantIdBySize: Record<string, string>; sizes: string[] }[] = [];
    const seen = new Map<string, number>();
    for (const v of p.variants) {
      const idx = seen.get(v.colorName) ?? colors.length;
      if (!seen.has(v.colorName)) {
        seen.set(v.colorName, idx);
        colors.push({ name: v.colorName, hex: v.colorHex, variantIdBySize: {}, sizes: [] });
      }
      if (!colors[idx].variantIdBySize[v.size]) colors[idx].variantIdBySize[v.size] = v.id;
      if (!colors[idx].sizes.includes(v.size)) colors[idx].sizes.push(v.size);
    }
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      categoryName: p.category.name,
      silhouette: SILHOUETTE_BY_CATEGORY[p.category.slug] ?? "t-shirts",
      basePrice: p.basePrice,
      image: p.images[0]?.url ?? null,
      printAreas: p.printAreas.map((a) => ({ side: a.side, widthPx: a.widthPx, heightPx: a.heightPx, method: a.method })),
      colors,
    };
  });

  const user = designId ? await getSessionUser() : null;
  const initial = designId && user
    ? await db.design.findFirst({
        where: { id: designId, ownerId: user.id, deletedAt: null },
        select: { id: true, name: true, state: true, productId: true },
      })
    : null;

  return (
    <Studio
      key={initial?.id ?? productSlug ?? "default-studio"}
      catalog={catalog}
      initialDesign={
        initial
          ? { id: initial.id, name: initial.name, state: JSON.parse(initial.state), productId: initial.productId }
          : null
      }
      initialProductSlug={productSlug ?? null}
    />
  );
}
