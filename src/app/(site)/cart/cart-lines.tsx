"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import type { PricedLine } from "@/lib/pricing";
import { useToast } from "@/components/ui";

export function CartLines({ lines }: { lines: PricedLine[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [busyItem, setBusyItem] = useState<string | null>(null);

  async function call(method: "PATCH" | "DELETE", body?: Record<string, unknown>, query = "") {
    setBusyItem((body?.itemId as string) ?? "x");
    try {
      const res = await fetch(`/api/cart/items${query}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Update failed");
      }
      window.dispatchEvent(new Event("ownit:cart"));
      startTransition(() => router.refresh());
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="card-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="headline text-lg">
          {lines.reduce((s, l) => s + l.quantity, 0)} item{lines.reduce((s, l) => s + l.quantity, 0) === 1 ? "" : "s"} in your cart
        </h2>
      </div>
      <ul className="mt-5 divide-y divide-line">
        {lines.map((l) => (
          <li key={l.cartItemId} className={`flex gap-4 py-5 transition-opacity ${busyItem === l.cartItemId || pending ? "opacity-50" : ""}`}>
            <Link href="/cart" className="shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-xl border border-line bg-coal">
                {l.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.previewUrl} alt={l.designName ?? l.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-faint">Blank</div>
                )}
              </div>
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{l.productName}</p>
                  <p className="text-xs text-mute">{l.designName ?? "Blank — no design yet"}</p>
                </div>
                <p className="text-sm font-semibold">{formatMoney(l.lineTotal)}</p>
              </div>
              <p className="mt-1.5 text-xs text-faint">
                Colour: {l.colorName} · Size: {l.size} · Print: {l.sides.length ? l.sides.map(capitalize).join(" & ") : "—"}
              </p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-lg border border-line2">
                  <button
                    aria-label="Decrease quantity"
                    disabled={l.quantity <= 1}
                    onClick={() => call("PATCH", { itemId: l.cartItemId, quantity: l.quantity - 1 })}
                    className="flex h-8 w-8 items-center justify-center text-mute hover:text-ivory disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs">{l.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    disabled={l.quantity >= 10}
                    onClick={() => call("PATCH", { itemId: l.cartItemId, quantity: l.quantity + 1 })}
                    className="flex h-8 w-8 items-center justify-center text-mute hover:text-ivory disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <button onClick={() => call("PATCH", { itemId: l.cartItemId, savedForLater: true })} className="text-mute underline underline-offset-4 hover:text-ivory">
                    Save for later
                  </button>
                  <button
                    aria-label={`Remove ${l.productName}`}
                    onClick={() => call("DELETE", undefined, `?itemId=${l.cartItemId}`)}
                    className="text-mute hover:text-red-300"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}
