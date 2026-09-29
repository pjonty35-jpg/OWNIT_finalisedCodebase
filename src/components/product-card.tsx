"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { useToast } from "./ui";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  productId: string;
  slug: string;
  name: string;
  subtitle: string | null;
  basePrice: number;
  badge: string | null;
  image: string | null;
  categorySlug: string;
}

export function ProductCard({ product, compact }: { product: ProductCardData; compact?: boolean }) {
  const { push } = useToast();
  const [itemId, setItemId] = useState<string | null>(null);
  const [heartBeat, setHeartBeat] = useState(false);
  const saved = itemId !== null;

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      setItemId(null);
      try {
        await fetch(`/api/wishlist?itemId=${itemId}`, { method: "DELETE" });
      } catch {
        /* offline */
      }
      push("Removed from wishlist");
      return;
    }
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId }),
      });
      if (res.status === 401) {
        push("Sign in to save favourites", "error");
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setItemId(data.itemId);
        setHeartBeat(true);
        setTimeout(() => setHeartBeat(false), 600);
        push("Saved to your wishlist", "success");
      }
    } catch {
      /* offline */
    }
  }

  return (
    <div className="card-lift group relative overflow-hidden rounded-2xl border border-line bg-surface">
      <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
        <div className={cn("relative overflow-hidden", compact ? "aspect-square" : "aspect-[4/5]")}>
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="h-full w-full bg-raise" />
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ivory">{product.name}</h3>
              {product.subtitle ? <p className="mt-0.5 truncate text-xs text-mute">{product.subtitle}</p> : null}
            </div>
            <span className="liquid-chip shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-ivory">
              {formatMoney(product.basePrice)}
            </span>
          </div>
        </div>
      </Link>

      {/* hover overlay — sibling of the card link, not nested inside it */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100" style={{ top: compact ? "25%" : "32%" }}>
        <Link
          href={`/create?product=${product.slug}`}
          className="sheen flex h-10 w-[80%] items-center justify-center rounded-xl bg-ivory text-xs font-bold tracking-[0.16em] text-ink shadow-lg"
        >
          CUSTOMIZE
        </Link>
      </div>

      {product.badge ? (
        <span className="liquid-chip animate-pop-in absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.625rem] font-medium tracking-wide text-ivory">
          {product.badge}
        </span>
      ) : null}

      <button
        onClick={toggleSave}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        className={cn(
          "liquid-chip press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          saved ? "text-ivory" : "text-mute hover:text-ivory"
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className={heartBeat ? "animate-heartbeat" : undefined}
        >
          <path d="M12 21s-7.5-4.9-9.7-9.2C.7 8.6 2.6 5 6.1 5c2 0 3.4 1 4 2.1h3.8c.6-1.1 2-2.1 4-2.1 3.5 0 5.4 3.6 3.8 6.8C19.5 16.1 12 21 12 21z" />
        </svg>
      </button>
    </div>
  );
}
