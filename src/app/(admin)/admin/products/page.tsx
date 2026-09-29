import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await db.product.findMany({
    include: {
      category: true,
      variants: true,
      images: { take: 1 },
    },
    orderBy: { popularity: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <p className="label-caps">Catalog</p>
      <h1 className="headline mt-2 text-3xl">Products</h1>

      <div className="card-surface mt-8 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              <th className="px-5 py-3.5 font-medium">Product</th>
              <th className="px-5 py-3.5 font-medium">Category</th>
              <th className="px-5 py-3.5 font-medium">Variants</th>
              <th className="px-5 py-3.5 font-medium">Stock</th>
              <th className="px-5 py-3.5 font-medium">Print methods</th>
              <th className="px-5 py-3.5 font-medium text-right">Base price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-line bg-coal">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images[0]?.url ?? "/img/hero.svg"} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <Link href={`/products/${p.slug}`} className="font-semibold hover:underline">{p.name}</Link>
                        {p.badge ? <Badge>{p.badge}</Badge> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-mute">{p.category.name}</td>
                  <td className="px-5 py-3.5 text-xs text-mute">{p.variants.length}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={stock > 30 ? "success" : stock > 10 ? "warn" : "danger"}>{stock} units</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-mute">
                    {[...new Set(p.variants.map(() => "DTG"))].join(", ")}
                  </td>
                  <td className="px-5 py-3.5 text-right">{formatMoney(p.basePrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
