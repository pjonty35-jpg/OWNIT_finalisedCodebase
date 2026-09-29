"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "./catalog-type";
import { useStudio } from "./use-studio";
import { EditorCanvas } from "./editor-canvas";
import { ProductPanel } from "./product-panel";
import { DesignPanel } from "./design-panel";
import { SaveShareBar } from "./save-share-bar";
import { Button, ButtonLink, Spinner, useToast, PointsFly } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { customizationFee } from "@/lib/money";

export interface InitialDesign {
  id: string;
  name: string;
  state: unknown;
  productId: string;
}

export function Studio({
  catalog,
  initialDesign,
  initialProductSlug,
}: {
  catalog: CatalogProduct[];
  initialDesign: InitialDesign | null;
  initialProductSlug: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const studio = useStudio({ catalog, initialDesign, initialProductSlug });
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saveReward, setSaveReward] = useState<number | null>(null);
  const savedIdRef = useRef<string | null>(initialDesign?.id ?? null);

  const product = studio.product;
  const fee = useMemo(() => customizationFee(studio.state.sides), [studio.state.sides]);
  const price = (product?.basePrice ?? 0) + (studio.hasArtwork ? fee : 0);

  const save = useCallback(
    async (silent = false): Promise<string | null> => {
      if (!product) return null;
      setSaving(true);
      try {
        const previewUrl = await studio.exportPreview();
        const state = { ...studio.state, activeSide: studio.state.activeSide };
        let designId = savedIdRef.current;
        if (designId) {
          const res = await fetch(`/api/designs/${designId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: studio.designName, state, previewUrl }),
          });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Save failed");
        } else {
          const res = await fetch("/api/designs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: studio.designName, productId: product.id, state, previewUrl }),
          });
          const data = await res.json();
          if (res.status === 401) {
            if (!silent) push("Sign in to save your design", "error");
            studio.setNeedsAuth(true);
            return null;
          }
          if (!res.ok) throw new Error(data.error ?? "Save failed");
          designId = data.design.id;
          savedIdRef.current = designId;
          // First save of this design earns points — celebrate it.
          if (!silent) {
            setSaveReward(10);
            setTimeout(() => setSaveReward(null), 1800);
          }
        }
        if (!silent) push("Design saved — it lives in your account now", "success");
        return designId;
      } catch (e) {
        if (!silent) push(e instanceof Error ? e.message : "Save failed", "error");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [product, studio, push]
  );

  async function addToCart() {
    if (!product) return;
    setAdding(true);
    try {
      const variantId = studio.currentVariantId;
      if (!variantId) {
        push("Pick a size first", "error");
        return;
      }
      const designId = studio.hasArtwork || savedIdRef.current ? await save(true) : null;
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId,
          designId: designId ?? undefined,
          designState: designId ? undefined : studio.state,
          designName: studio.designName,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        push("Sign in to add to cart", "error");
        router.push("/signin?next=/create");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not add to cart");
      window.dispatchEvent(new Event("ownit:cart"));
      push("Added to cart", "success");
      router.push("/cart");
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not add to cart", "error");
    } finally {
      setAdding(false);
    }
  }

  if (!product) return <div className="wrap pt-32"><Spinner /></div>;

  return (
    <div className="flex min-h-screen flex-col bg-ink pt-[72px] sm:pt-[84px]">
      {/* Studio top bar — static section at the top of the page; scrolls away */}
      <div className="liquid-bar border-b border-white/[0.06]">
        <div className="wrap flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/shop" aria-label="Back to shop" className="shrink-0 whitespace-nowrap text-xs text-faint hover:text-ivory">
              <span className="hidden sm:inline">← Back to Shop</span>
              <span className="sm:hidden">←</span>
            </Link>
            <label className="relative flex min-w-0 items-center">
              <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-2.5 text-faint">
                <path d="M17 3a2.8 2.8 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              <input
                value={studio.designName}
                onChange={(e) => studio.setDesignName(e.target.value)}
                aria-label="Design name"
                maxLength={60}
                className="w-28 min-w-0 rounded-lg border border-line bg-white/[0.04] py-1 pl-7 pr-2 text-sm font-semibold text-ivory placeholder:text-faint hover:border-mute focus:border-mute focus:bg-white/[0.07] focus:outline-none sm:w-56"
                placeholder="Design name"
              />
            </label>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-mute md:block">{formatMoney(price)} <span className="text-xs text-faint">incl. print fee</span></span>
            <Button variant="outline" size="sm" onClick={() => save()} disabled={saving} className="hidden sm:inline-flex">
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" onClick={addToCart} disabled={adding || !studio.currentVariantId} className="hidden sm:inline-flex">
              {adding ? "Adding…" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop 3-panel layout */}
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-0 lg:grid-cols-[300px_1fr_340px]">
        <aside className="liquid-bar hidden border-r border-white/[0.06] lg:block">
          <ProductPanel studio={studio} />
        </aside>

        <main className="relative flex min-h-[60vh] flex-col lg:min-h-[calc(100vh-8rem)]">
          {/* side switcher */}
          <div className="liquid-chip absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1 rounded-full p-1">
            {(["front", "back", "left", "right"] as const).map((side) => (
              <button
                key={side}
                onClick={() => studio.setActiveSide(side)}
                disabled={!product.printAreas.some((a) => a.side === side)}
                className={`rounded-full px-4 py-1.5 text-xs capitalize transition disabled:opacity-30 ${
                  studio.state.activeSide === side ? "bg-ivory text-ink font-semibold" : "text-mute hover:text-ivory"
                }`}
              >
                {side}
              </button>
            ))}
          </div>
          <span aria-hidden className="hand-note pointer-events-none absolute left-8 top-24 hidden -rotate-6 text-xl xl:block">
            Your imagination looks good here.
          </span>

          <div className="relative flex-1">
            <EditorCanvas studio={studio} />
          </div>

          {/* bottom bar */}
          <div className="liquid-bar flex items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-3">
            <p className="label-caps hidden md:block">Design It. Own It. Wear It.</p>
            <div className="flex flex-1 items-center justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={studio.undo} disabled={!studio.canUndo}>↶</Button>
              <Button variant="ghost" size="sm" onClick={studio.redo} disabled={!studio.canRedo}>↷</Button>
              <span className="mx-2 h-5 w-px bg-line" />
              <span className="rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-[0.625rem] tracking-[0.14em] text-faint">2D PRECISION EDITOR</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <SaveShareBar studio={studio} onShare={async () => {
                const id = await save(true);
                if (id && typeof window !== "undefined") {
                  const url = `${window.location.origin}/create?design=${id}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    push("Share link copied", "success");
                  } catch {
                    push(url, "info");
                  }
                }
              }} />
            </div>
          </div>
        </main>

        <aside className="liquid-bar hidden border-l border-white/[0.06] lg:block">
          <DesignPanel studio={studio} />
        </aside>
      </div>

      {/* Mobile: product/design tabs + sticky bar */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
          <button onClick={() => studio.setMobileSheet("product")} className="bg-surface py-3 text-xs text-mute">
            Product & Colour
          </button>
          <button onClick={() => studio.setMobileSheet("design")} className="bg-surface py-3 text-xs text-mute">
            Design Tools
          </button>
        </div>
        <div className="liquid-bar sticky bottom-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-semibold">{formatMoney(price)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => save()} disabled={saving}>{saving ? "…" : "Save"}</Button>
            <Button size="sm" onClick={addToCart} disabled={adding || !studio.currentVariantId}>
              {adding ? "Adding…" : "Add to Cart"}
            </Button>
          </div>
        </div>
        {studio.mobileSheet ? (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => studio.setMobileSheet(null)} />
            <div className="liquid absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl p-5 pb-24 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.9)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="headline text-lg">{studio.mobileSheet === "product" ? "Product" : "Design"}</p>
                <button onClick={() => studio.setMobileSheet(null)} aria-label="Close" className="text-xl text-faint">×</button>
              </div>
              {studio.mobileSheet === "product" ? <ProductPanel studio={studio} /> : <DesignPanel studio={studio} />}
            </div>
          </div>
        ) : null}
      </div>

      {saveReward !== null ? <PointsFly amount={saveReward} label="design saved" /> : null}

      {/* Auth nudge */}
      {studio.needsAuth ? (
        <div className="liquid specular fixed bottom-24 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl p-5 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.95)]">
          <p className="text-sm font-semibold">Save your work</p>
          <p className="mt-1 text-xs text-mute">Sign in to keep this design and add it to your cart.</p>
          <div className="mt-4 flex gap-2">
            <ButtonLink href="/signin?next=/create" size="sm" className="flex-1">Sign in</ButtonLink>
            <ButtonLink href="/signup?next=/create" size="sm" variant="outline" className="flex-1">Create account</ButtonLink>
          </div>
          <button onClick={() => studio.setNeedsAuth(false)} className="mt-3 w-full text-center text-xs text-faint hover:text-ivory">
            Continue without saving
          </button>
        </div>
      ) : null}
    </div>
  );
}
