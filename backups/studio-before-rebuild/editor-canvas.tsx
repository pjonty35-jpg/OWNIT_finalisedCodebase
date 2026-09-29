"use client";

import { useEffect, useRef, useState } from "react";
import { STICKERS, stickerById, templateById } from "@/lib/design";
import type { DesignElement, StickerElement } from "@/lib/design";
import type { StudioApi } from "./use-studio";
import { cn } from "@/lib/utils";
import { getSafeCanvasDimensions } from "@/lib/canvas-performance";
import { createInteractionCommitGate, createRafScheduler } from "@/lib/canvas-performance";

const CANVAS_W = 1200;
const CANVAS_H = 1500;

/**
 * Flat 2D precision editor. Mirrors the 3D preview: same design state,
 * same coordinates. Drag moves, wheel/handles scale, double-click edits text.
 */
export function EditorCanvas({ studio }: { studio: StudioApi }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const drawing = useRef<{ points: { x: number; y: number }[] } | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const images = imageCache;
  const stickerImages = stickerCache;
  const [imageVersion, setImageVersion] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setImageVersion((v) => v + 1), 300);
    const clear = setTimeout(() => clearInterval(t), 3000);
    return () => {
      clearInterval(t);
      clearTimeout(clear);
    };
  }, []);

  // Fit canvas to container
  useEffect(() => {
    function fit() {
      const container = containerRef.current;
      if (!container) return;
      const pad = 24;
      const scale = Math.min((container.clientWidth - pad * 2) / CANVAS_W, (container.clientHeight - pad * 2) / CANVAS_H);
      setView({ scale, offsetX: (container.clientWidth - CANVAS_W * scale) / 2, offsetY: (container.clientHeight - CANVAS_H * scale) / 2 });
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Render loop on state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;

    // backdrop: garment colour + print-area guide
    ctx.fillStyle = studio.state.colorHex;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const area = studio.printAreaFor(studio.activeSide) ?? { widthPx: CANVAS_W, heightPx: CANVAS_H };
    const ax = (CANVAS_W - area.widthPx) / 2;
    const ay = (CANVAS_H - area.heightPx) / 2;

    ctx.strokeStyle = "rgba(245,242,234,0.25)";
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(ax, ay, area.widthPx, area.heightPx);
    ctx.setLineDash([]);

    // elements for active side
    const els = studio.state.elements
      .filter((e) => e.visible && e.side === studio.activeSide)
      .sort((a, b) => a.z - b.z);

    for (const el of els) {
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x, el.y);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.scale(el.scale, el.scale);
      if (el.id === studio.selectedId) {
        ctx.strokeStyle = "#7dd3fc";
        ctx.lineWidth = 4 / el.scale;
      }

      switch (el.type) {
        case "text": {
          ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "700" : "400"} ${el.fontSize}px ${el.fontFamily}`;
          ctx.fillStyle = el.color;
          ctx.textAlign = el.align as CanvasTextAlign;
          ctx.textBaseline = "top";
          const metrics = ctx.measureText(el.text.split("\n")[0] || " ");
          const w = metrics.width;
          const lineH = el.fontSize * 1.15;
          const boxH = lineH * el.text.split("\n").length;
          const bx = el.align === "center" ? -w / 2 : el.align === "right" ? -w : 0;
          ctx.strokeRect(bx - 12, -8, w + 24, boxH + 16);
          el.text.split("\n").forEach((line, i) => ctx.fillText(line, 0, i * lineH));
          break;
        }
        case "image": {
          const w = el.width ?? 200;
          const h = el.height ?? 200;
          ctx.strokeStyle = "#7dd3fc";
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          const img = images.get((el as { url: string }).url);
          if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);
          else {
            ctx.fillStyle = "rgba(245,242,234,0.1)";
            ctx.fillRect(-w / 2, -h / 2, w, h);
            void loadImage((el as { url: string }).url);
          }
          break;
        }
        case "drawing": {
          ctx.lineCap = "round";
          for (const s of el.strokes ?? []) {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.beginPath();
            s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.stroke();
          }
          break;
        }
        case "shape": {
          ctx.fillStyle = el.color;
          ctx.strokeStyle = el.color;
          switch (el.shape) {
            case "ellipse":
              ctx.beginPath();
              ctx.ellipse(0, 0, (el.width ?? 100) / 2, (el.height ?? 100) / 2, 0, 0, Math.PI * 2);
              el.strokeOnly ? ctx.stroke() : ctx.fill();
              break;
            case "triangle":
              ctx.beginPath();
              ctx.moveTo(0, -(el.height ?? 100) / 2);
              ctx.lineTo((el.width ?? 100) / 2, (el.height ?? 100) / 2);
              ctx.lineTo(-(el.width ?? 100) / 2, (el.height ?? 100) / 2);
              ctx.closePath();
              el.strokeOnly ? ctx.stroke() : ctx.fill();
              break;
            case "line":
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(-(el.width ?? 100) / 2, 0);
              ctx.lineTo((el.width ?? 100) / 2, 0);
              ctx.stroke();
              break;
            default:
              el.strokeOnly ? ctx.strokeRect(-(el.width ?? 100) / 2, -(el.height ?? 100) / 2, el.width ?? 100, el.height ?? 100)
                : ctx.fillRect(-(el.width ?? 100) / 2, -(el.height ?? 100) / 2, el.width ?? 100, el.height ?? 100);
          }
          break;
        }
        case "sticker": {
          const def = stickerById((el as StickerElement).stickerId);
          const size = (el as StickerElement).size ?? 120;
          if (def) {
            const img = stickerImages.get(def.id);
            if (img) {
              ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
              ctx.fillStyle = "#f5f2ea";
              ctx.font = `${size * 0.8}px serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("✦", 0, 0);
              void loadSticker(def.id, def.svg);
            }
          }
          break;
        }
        case "template": {
          const def = templateById((el as { templateId: string }).templateId);
          if (def) {
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            let y = 0;
            for (const line of def.lines) {
              ctx.font = `${line.bold ? "700" : "400"} ${line.size}px ${def.fontFamily}`;
              ctx.fillStyle = def.color;
              ctx.fillText(line.text, 0, y);
              y += line.size * 1.08;
            }
          }
          break;
        }
      }
      ctx.restore();
    }
  }, [studio.state, studio.activeSide, studio.selectedId, imageVersion]);

  function toCanvas(e: React.PointerEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / view.scale,
      y: (e.clientY - rect.top) / view.scale,
    };
  }

  function hitTest(x: number, y: number): DesignElement | null {
    const els = studio.state.elements
      .filter((e) => e.visible && e.side === studio.activeSide)
      .sort((a, b) => b.z - a.z);
    for (const el of els) {
      const w = el.type === "text" ? 600 : el.type === "sticker" ? (el as StickerElement).size : ("width" in el ? el.width : ("size" in el ? el.size : 200));
      const h = el.type === "text" ? (el.fontSize ?? 80) * 1.3 : el.type === "sticker" ? (el as StickerElement).size : ("height" in el ? el.height : ("size" in el ? el.size : 200));
      const cx = el.type === "text" ? el.x + w / 2 : el.x;
      const cy = el.type === "text" ? el.y + h / 2 : el.y;
      const dx = x - cx;
      const dy = y - cy;
      if (Math.abs(dx) <= w / 2 + 20 && Math.abs(dy) <= h / 2 + 20) return el;
    }
    return null;
  }

  function onPointerDown(e: React.PointerEvent) {
    const { x, y } = toCanvas(e);
    if (studio.tool === "draw") {
      drawing.current = { points: [{ x, y }] };
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    const hit = hitTest(x, y);
    studio.select(hit?.id ?? null);
    if (hit) {
      dragRef.current = { id: hit.id, startX: x, startY: y, elX: hit.x, elY: hit.y };
      canvasRef.current?.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (drawing.current) {
      const { x, y } = toCanvas(e);
      drawing.current.points.push({ x, y });
      // live stroke preview
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const pts = drawing.current.points;
      if (pts.length >= 2) {
        ctx.save();
        ctx.strokeStyle = "#f5f2ea";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const drag = dragRef.current;
    if (drag) {
      const { x, y } = toCanvas(e);
      studio.updateSelected({ x: Math.round(drag.elX + (x - drag.startX)), y: Math.round(drag.elY + (y - drag.startY)) } as Partial<DesignElement>);
    }
  }

  function onPointerUp() {
    if (drawing.current) {
      studio.commitDrawing([{ points: drawing.current.points, color: "#f5f2ea", width: 6 }]);
      drawing.current = null;
      return;
    }
    dragRef.current = null;
  }

  function onDoubleClick(x: number, y: number) {
    const hit = hitTest(x, y);
    if (hit?.type === "text") studio.select(hit.id);
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: view.offsetX,
          top: view.offsetY,
          width: CANVAS_W * view.scale,
          height: CANVAS_H * view.scale,
          cursor: studio.tool === "draw" ? "crosshair" : "move",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <div className={cn("pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink/80 px-4 py-1.5 text-[0.625rem] tracking-[0.16em] text-mute backdrop-blur")}>
        {studio.tool === "draw" ? "DRAW MODE — LIFT TO COMMIT STROKE" : "DRAG TO MOVE · 2D PRECISION EDIT"}
      </div>
    </div>
  );
}

/* ---- asset caches ---- */
const imageCache = new Map<string, HTMLImageElement>();
const stickerCache = new Map<string, HTMLImageElement>();

function loadImage(url: string) {
  if (imageCache.has(url)) return imageCache.get(url)!;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => imageCache.set(url, img);
  img.src = url;
  imageCache.set(url, img);
  return img;
}

function loadSticker(id: string, svg: string) {
  if (stickerCache.has(id)) return stickerCache.get(id)!;
  const img = new Image();
  img.onload = () => stickerCache.set(id, img);
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  stickerCache.set(id, img);
  return img;
}

export { STICKERS };


// OWNIT PASS 4: safe canvas allocation helper.
// Keep the logical design size independent from the device's physical pixel density.
export function getEditorCanvasDimensions(width: number, height: number) {
  return getSafeCanvasDimensions(width, height);
}

// OWNIT PASS 8: interaction helpers. Wire these into the gesture handlers so
// pointermove only updates transient state and pointerup creates one history commit.
const OWNIT_INTERACTION_GATE = createInteractionCommitGate(() => {});
const OWNIT_POINTER_SCHEDULER = createRafScheduler<{ x: number; y: number }>(() => {});
