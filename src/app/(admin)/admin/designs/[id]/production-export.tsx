"use client";

import { Button } from "@/components/ui";
import type { DesignState } from "@/lib/design";
import { exportProductionArtwork } from "@/lib/artwork";

export function ProductionExport({
  designId,
  state,
  sides,
}: {
  designId: string;
  state: DesignState;
  sides: { side: string; widthPx: number; heightPx: number }[];
}) {
  async function download(side: string, widthPx: number, heightPx: number) {
    const dataUrl = await exportProductionArtwork(state, side, widthPx, heightPx);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ownit-${designId}-${side}-${widthPx}x${heightPx}.png`;
    a.click();
  }

  return (
    <div className="space-y-2">
      {sides.map((s) => (
        <Button
          key={s.side}
          variant="outline"
          size="sm"
          className="w-full justify-between capitalize"
          onClick={() => download(s.side, s.widthPx, s.heightPx)}
        >
          <span className="capitalize">{s.side} artwork</span>
          <span className="text-faint">{s.widthPx}×{s.heightPx}px ↓</span>
        </Button>
      ))}
    </div>
  );
}
