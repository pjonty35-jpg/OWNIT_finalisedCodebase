"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Viewer3D } from "@/components/three/Viewer3D";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ShowcaseColor {
  name: string;
  hex: string;
  variantId: string | null;
  inStock: boolean;
}

const SILHOUETTES: Record<string, string> = {
  "t-shirts": "t-shirts",
  hoodies: "hoodies",
  jackets: "jackets",
  bags: "bags",
  caps: "caps",
  jerseys: "jerseys",
};

/**
 * Interactive product hero: real 3D garment, live colour switching,
 * and a working add-blank-to-cart action.
 */
export function ProductShowcase({
  silhouette,
  colors,
  productId,
  fallbackImage,
  productName,
}: {
  silhouette: string;
  colors: ShowcaseColor[];
  productId: string;
  fallbackImage: string;
  productName: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [colorName, setColorName] = useState(colors[0]?.name ?? "Black");
  const [size, setSize] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const active = colors.find((c) => c.name === colorName) ?? colors[0];

  const sizes = useMemo(() => {
    // Sizes are per-product; the API validates the final variant.
    return ["XS", "S", "M", "L", "XL", "XXL"];
  }, []);

  async function addBlank() {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          colorName: active?.name,
          size: size ?? undefined,
          quantity: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        push("Sign in to add to cart", "error");
        router.push("/signin?next=/cart");
        return;
      }
      if (!res.ok) {
        push(data.error ?? "Pick a size first", "error");
        return;
      }
      window.dispatchEvent(new Event("ownit:cart"));
      push("Added to cart", "success");
      router.push("/cart");
    } catch {
      push("Could not add to cart — try again", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grain relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface">
        <Viewer3D
          silhouette={SILHOUETTES[silhouette] ?? "t-shirts"}
          color={active?.hex ?? "#111111"}
          autoRotate
          interactive
          className="h-full w-full"
          fallbackImage={fallbackImage}
        />
        <span aria-hidden className="hand-note pointer-events-none absolute bottom-4 left-5 -rotate-3 text-xl text-mute">
          Drag it. It&apos;s yours already.
        </span>
        <span className="liquid-chip absolute right-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.625rem] tracking-[0.18em] text-mute">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M21 12a9 9 0 11-3-6.7" />
            <path d="M21 3v6h-6" />
          </svg>
          360°
        </span>
      </div>

      {/* Colour + size + add-to-cart (blank) */}
      <div className="liquid specular rounded-2xl space-y-4 p-5">
        <div>
          <p className="label-caps mb-2">Colour — {active?.name}</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setColorName(c.name)}
                aria-label={c.name}
                aria-pressed={colorName === c.name}
                title={c.name}
                className={cn(
                  "press h-8 w-8 rounded-full border-2 transition",
                  colorName === c.name ? "border-ivory scale-110" : "border-line2 hover:border-mute"
                )}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="label-caps mb-2">Size {size ? `— ${size}` : ""}</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={cn(
                  "press rounded-lg border px-3.5 py-2 text-xs transition",
                  size === s ? "border-ivory bg-ivory text-ink font-semibold" : "border-line2 text-mute hover:border-mute hover:text-ivory"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={addBlank}
          disabled={adding}
          className="press sheen h-11 w-full rounded-xl border border-line2 text-xs font-bold tracking-[0.16em] text-ivory transition hover:border-ivory hover:bg-ivory hover:text-ink disabled:opacity-50"
        >
          {adding ? "ADDING…" : "ADD TO CART (BLANK)"}
        </button>
        <p className="text-center text-[0.625rem] text-faint">
          Or skip the blank — <span className="text-mute">design it yourself in the studio ↓</span>
        </p>
      </div>
    </div>
  );
}
