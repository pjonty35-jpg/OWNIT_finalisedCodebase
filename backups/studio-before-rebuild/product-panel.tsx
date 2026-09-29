"use client";

import type { StudioApi } from "./use-studio";
import { cn } from "@/lib/utils";

export function ProductPanel({ studio }: { studio: StudioApi }) {
  const product = studio.product;
  if (!product) return null;
  const activeColor = product.colors.find((c) => c.name === studio.colorName) ?? product.colors[0];
  const sizes = activeColor?.sizes ?? [];

  return (
    <div className="space-y-7 p-6">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="label-caps">1 · Choose product</h2>
          <span className="text-xs text-mute">{product.name}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {studio.catalog.map((p) => (
            <button
              key={p.slug}
              onClick={() => studio.setProductSlug(p.slug)}
              title={p.name}
              className={cn(
                "group rounded-xl border p-2 transition",
                p.slug === product.slug ? "border-ivory bg-white/5" : "border-line hover:border-mute"
              )}
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-coal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image ?? "/img/hero.svg"} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <p className="mt-1.5 truncate text-[0.625rem] text-mute group-hover:text-ivory">{shortName(p.name)}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-3">2 · Colour — <span className="text-ivory">{activeColor?.name}</span></h2>
        <div className="flex flex-wrap gap-2.5">
          {product.colors.map((c) => (
            <button
              key={c.name}
              title={c.name}
              aria-label={`Colour ${c.name}`}
              aria-pressed={c.name === activeColor?.name}
              onClick={() => studio.setColor(c.name)}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition",
                c.name === activeColor?.name ? "border-ivory scale-110" : "border-line2 hover:border-mute"
              )}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="label-caps mb-3">3 · Choose size</h2>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => studio.setSize(s)}
              className={cn(
                "h-10 min-w-11 rounded-lg border px-3 text-xs transition",
                s === studio.state.size ? "border-ivory bg-ivory text-ink font-semibold" : "border-line2 text-mute hover:border-mute hover:text-ivory"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[0.625rem] text-faint">
          Print method: {product.printAreas[0]?.method ?? "DTG"} · Sides: {product.printAreas.map((a) => a.side).join(", ")}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-coal p-4">
        <p className="label-caps mb-1">Print areas</p>
        <p className="text-xs text-mute">
          {product.printAreas.map((a) => `${a.side}: ${a.widthPx}×${a.heightPx}px`).join(" · ")}
        </p>
      </section>
    </div>
  );
}

function shortName(name: string) {
  return name.replace(/ (Tee|Hoodie|Jacket|Cap|Bag|Jersey|Beanie|Sling|Tote|Shacket)$/i, "").split(" ").slice(-1)[0];
}
