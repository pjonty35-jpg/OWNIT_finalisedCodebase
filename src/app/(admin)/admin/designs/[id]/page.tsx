import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sanitizeDesignState } from "@/lib/design";
import { Badge } from "@/components/ui";
import { ProductionExport } from "./production-export";

export const dynamic = "force-dynamic";

export default async function AdminDesignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await db.design.findUnique({
    where: { id },
    include: { product: { include: { printAreas: true, category: true } }, owner: { select: { name: true, email: true } } },
  });
  if (!design) notFound();
  const state = sanitizeDesignState(JSON.parse(design.state));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Design · v{design.currentVersion}</p>
          <h1 className="headline mt-2 text-3xl">{design.name}</h1>
          <p className="mt-1 text-sm text-mute">
            {design.owner?.name ?? "Guest"} · {design.product.name} ({design.product.category.name}) · {state.colorName} · size {state.size}
          </p>
        </div>
        <Badge>{state.sides.join(" + ")}</Badge>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="card-surface p-5">
          <p className="label-caps mb-3">Preview</p>
          <div className="overflow-hidden rounded-xl border border-line bg-coal">
            {design.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.previewUrl} alt={design.name} className="w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-sm text-faint">No preview</div>
            )}
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="label-caps mb-3">Production artwork</p>
          <p className="mb-4 text-xs text-mute">
            Exports render at each print area&apos;s configured resolution ({design.product.printAreas[0]?.widthPx}×{design.product.printAreas[0]?.heightPx}px for {design.product.printAreas[0]?.side}). Print method: {design.product.printAreas[0]?.method}.
          </p>
          <ProductionExport designId={design.id} state={state} sides={design.product.printAreas.map((a) => ({ side: a.side, widthPx: a.widthPx, heightPx: a.heightPx }))} />
        </div>
      </div>

      <section className="card-surface mt-6 p-5">
        <p className="label-caps mb-3">Layers ({state.elements.length})</p>
        <ul className="divide-y divide-line text-sm">
          {state.elements.map((el) => (
            <li key={el.id} className="flex items-center justify-between py-2.5">
              <span>{el.type === "text" ? `"${"text" in el ? el.text : ""}"` : el.type}</span>
              <span className="text-xs text-faint">{el.side} · z{el.z} · {Math.round(el.opacity * 100)}%</span>
            </li>
          ))}
          {state.elements.length === 0 ? <li className="py-4 text-center text-xs text-faint">Blank design</li> : null}
        </ul>
      </section>
    </div>
  );
}
