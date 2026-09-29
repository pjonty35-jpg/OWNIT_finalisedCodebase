import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import type { DesignSide } from "@/lib/design";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const products = await db.product.findMany({
      where: slug ? { slug, active: true, deletedAt: null } : { active: true, deletedAt: null },
      include: {
        category: true,
        printAreas: true,
        variants: { where: { active: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { popularity: "desc" },
    });

    return Response.json({
      products: products.map((p) => {
        const colors: { name: string; hex: string; variantIdBySize: Record<string, string>; sizes: string[]; fits: string[] }[] = [];
        const seen = new Map<string, number>();
        for (const v of p.variants) {
          const idx = seen.get(v.colorName) ?? colors.length;
          if (!seen.has(v.colorName)) {
            seen.set(v.colorName, idx);
            colors.push({ name: v.colorName, hex: v.colorHex, variantIdBySize: {}, sizes: [], fits: [v.fit] });
          }
          if (!colors[idx].variantIdBySize[v.size]) colors[idx].variantIdBySize[v.size] = v.id;
          if (!colors[idx].sizes.includes(v.size)) colors[idx].sizes.push(v.size);
        }
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          category: p.category.slug,
          categoryName: p.category.name,
          basePrice: p.basePrice,
          image: p.images[0]?.url ?? null,
          silhouette: p.category.slug,
          printAreas: p.printAreas.map((a) => ({
            side: a.side as DesignSide, widthPx: a.widthPx, heightPx: a.heightPx,
            safeZonePct: a.safeZonePct, method: a.method,
          })),
          colors,
        };
      }),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
