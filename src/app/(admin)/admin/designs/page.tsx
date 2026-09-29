import Link from "next/link";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDesigns() {
  const designs = await db.design.findMany({
    where: { deletedAt: null },
    include: {
      owner: { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <p className="label-caps">Studio output</p>
      <h1 className="headline mt-2 text-3xl">Designs</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {designs.map((d) => (
          <div key={d.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="aspect-square bg-coal">
              {d.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.previewUrl} alt={d.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-semibold">{d.name}</p>
              <p className="truncate text-[0.625rem] text-faint">{d.owner?.name ?? "Guest"} · {d.product.name}</p>
              <p className="mt-0.5 text-[0.625rem] text-faint">{timeAgo(d.updatedAt)}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge tone={d.published ? "success" : "default"}>{d.published ? "published" : `v${d.currentVersion}`}</Badge>
                <Link href={`/admin/designs/${d.id}`} className="text-[0.625rem] text-mute underline underline-offset-4 hover:text-ivory">
                  Production
                </Link>
              </div>
            </div>
          </div>
        ))}
        {designs.length === 0 ? <p className="col-span-full py-10 text-center text-sm text-mute">No designs yet.</p> : null}
      </div>
    </div>
  );
}
