import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { ProductionControls } from "./production-controls";

export const dynamic = "force-dynamic";

const COLUMNS = ["queued", "in_production", "quality_check", "packed", "shipped"] as const;

export default async function ProductionBoard() {
  const jobs = await db.productionJob.findMany({
    include: { order: { include: { items: { include: { design: { select: { name: true, previewUrl: true } } } } } } },
    orderBy: { createdAt: "asc" },
    take: 120,
  });

  return (
    <div className="mx-auto max-w-7xl">
      <p className="label-caps">Print floor</p>
      <h1 className="headline mt-2 text-3xl">Production</h1>
      <p className="mt-2 text-sm text-mute">Every paid order becomes a job. Drag-free board: update status inline.</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col);
          return (
            <section key={col} className="rounded-2xl border border-line bg-coal/60 p-3">
              <h2 className="label-caps mb-3 px-1 capitalize">{col.replace(/_/g, " ")} ({colJobs.length})</h2>
              <div className="space-y-2">
                {colJobs.map((j) => {
                  const item = j.order.items[0];
                  return (
                    <div key={j.id} className="rounded-xl border border-line bg-surface p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-coal">
                          {item?.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/orders/${j.orderId}`} className="block truncate text-xs font-semibold hover:underline">
                            #{j.order.number}
                          </Link>
                          <p className="truncate text-[0.625rem] text-faint">{j.method} · {j.order.items.length} item(s)</p>
                        </div>
                      </div>
                      <ProductionControls jobId={j.id} status={j.status} />
                    </div>
                  );
                })}
                {colJobs.length === 0 ? <p className="px-1 py-4 text-center text-xs text-faint">Empty</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
