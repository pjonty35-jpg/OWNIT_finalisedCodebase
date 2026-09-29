/**
 * Canvas rendering of design states. The design JSON is rendered to:
 *  - preview thumbnails (cart, account, inspiration)
 *  - 3D print textures
 *  - production-ready PNG exports (per side, print-area sized)
 *
 * This module is browser-side only (uses DOM canvas).
 */

import type { DesignElement, DesignState, ImageElement, StickerElement, TemplateElement } from "./design";
import { stickerById, templateById } from "./design";

export interface RenderOptions {
  width: number; // output canvas width
  height: number; // output canvas height
  /** Where the print area sits inside the output canvas (fractions 0..1). */
  area?: { x: number; y: number; w: number; h: number };
  /** Print-area design-space size; elements are positioned within it. */
  designWidth?: number;
  designHeight?: number;
  background?: string | null;
  /** Only render elements for this side. */
  side?: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image failed to load: ${url.slice(0, 60)}`));
    img.src = url;
  });
}

function drawElement(ctx: CanvasRenderingContext2D, el: DesignElement) {
  ctx.save();
  ctx.globalAlpha = el.opacity;
  ctx.translate(el.x, el.y);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.scale(el.scale, el.scale);

  switch (el.type) {
    case "text": {
      ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "700" : "400"} ${el.fontSize}px ${el.fontFamily}`;
      ctx.fillStyle = el.color;
      ctx.textAlign = el.align as CanvasTextAlign;
      ctx.textBaseline = "top";
      if (el.letterSpacing) {
        // letterSpacing is supported in modern browsers; manual fallback not needed for launch.
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${el.letterSpacing}px`;
      }
      const lines = el.text.split("\n");
      const lineHeight = el.fontSize * 1.12;
      lines.forEach((line, i) => ctx.fillText(line, 0, i * lineHeight));
      break;
    }
    case "image": {
      // Images carry a transient _img (HTMLImageElement) on render time.
      const img = (el as ImageElement & { _img?: HTMLImageElement })._img;
      if (img) {
        const w = el.width || img.naturalWidth;
        const h = el.height || img.naturalHeight;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.strokeStyle = "#999";
        ctx.strokeRect(-30, -30, 60, 60);
      }
      break;
    }
    case "drawing": {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of el.strokes ?? []) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        stroke.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      }
      break;
    }
    case "shape": {
      ctx.fillStyle = el.color;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = Math.max(2, (el.width + el.height) / 60);
      switch (el.shape) {
        case "ellipse":
          ctx.beginPath();
          ctx.ellipse(0, 0, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
          el.strokeOnly ? ctx.stroke() : ctx.fill();
          break;
        case "triangle":
          ctx.beginPath();
          ctx.moveTo(0, -el.height / 2);
          ctx.lineTo(el.width / 2, el.height / 2);
          ctx.lineTo(-el.width / 2, el.height / 2);
          ctx.closePath();
          el.strokeOnly ? ctx.stroke() : ctx.fill();
          break;
        case "line":
          ctx.beginPath();
          ctx.moveTo(-el.width / 2, 0);
          ctx.lineTo(el.width / 2, 0);
          ctx.stroke();
          break;
        default:
          el.strokeOnly ? ctx.strokeRect(-el.width / 2, -el.height / 2, el.width, el.height)
            : ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height);
      }
      break;
    }
    case "sticker": {
      const def = stickerById((el as StickerElement).stickerId);
      if (def) {
        ctx.fillStyle = "#f5f2ea";
        ctx.strokeStyle = "#f5f2ea";
        // Render sticker SVG through an image for fidelity.
        const svgImg = (el as StickerElement & { _svg?: HTMLImageElement })._svg;
        if (svgImg) {
          ctx.drawImage(svgImg, -el.size / 2, -el.size / 2, el.size, el.size);
        } else {
          ctx.font = `${el.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("✦", 0, 0);
        }
      }
      break;
    }
    case "template": {
      const def = templateById((el as TemplateElement).templateId);
      if (def) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        let y = 0;
        for (const line of def.lines) {
          ctx.font = `${line.bold ? "700" : "400"} ${line.size}px ${def.fontFamily}`;
          ctx.fillStyle = def.color;
          ctx.fillText(line.text, 0, y, el.size * 4);
          y += line.size * 1.05;
        }
      }
      break;
    }
  }
  ctx.restore();
}

/**
 * Render a design state to a canvas. Images/sticker SVGs are preloaded first.
 */
export async function renderDesign(
  state: DesignState,
  opts: RenderOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d")!;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, opts.width, opts.height);
  }

  const area = opts.area ?? { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
  const dw = opts.designWidth ?? 1200;
  const dh = opts.designHeight ?? 1500;

  // Preload raster assets.
  const imgEls = state.elements.filter((e) => e.type === "image" && e.visible);
  await Promise.all(
    imgEls.map(async (el) => {
      try {
        (el as ImageElement & { _img?: HTMLImageElement })._img = await loadImage((el as { url: string }).url);
      } catch {
        /* keep placeholder */
      }
    })
  );

  ctx.save();
  ctx.translate(area.x * opts.width, area.y * opts.height);
  ctx.beginPath();
  ctx.rect(0, 0, area.w * opts.width, area.h * opts.height);
  ctx.clip();
  const sx = (area.w * opts.width) / dw;
  const sy = (area.h * opts.height) / dh;
  ctx.scale(sx, sy);
  const side = opts.side ?? state.activeSide;
  const els = state.elements
    .filter((e) => e.visible && e.side === side)
    .slice()
    .sort((a, b) => a.z - b.z);
  for (const el of els) drawElement(ctx, el);
  ctx.restore();

  return canvas;
}

/** Small JPEG/PNG data-URL preview for cart/account/inspiration. */
export async function makePreviewDataUrl(state: DesignState, size = 420) {
  const canvas = await renderDesign(state, {
    width: size,
    height: size,
    area: { x: 0.08, y: 0.08, w: 0.84, h: 0.84 },
    designWidth: 1200,
    designHeight: 1200,
    background: state.colorHex,
  });
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Production-ready export: high-resolution PNG per printed side, cropped to
 * the print area at the required resolution (default 300 DPI-equivalent
 * sizing passed in by the caller from the product print-area config).
 */
export async function exportProductionArtwork(
  state: DesignState,
  side: string,
  widthPx: number,
  heightPx: number
): Promise<string> {
  const canvas = await renderDesign(state, {
    width: widthPx,
    height: heightPx,
    area: { x: 0, y: 0, w: 1, h: 1 },
    designWidth: widthPx,
    designHeight: heightPx,
    side,
  });
  return canvas.toDataURL("image/png");
}

// ---------------- Client-side artwork validation ----------------

export interface ArtworkCheck {
  ok: boolean;
  level: "error" | "warning";
  message: string;
}

export function checkUploadedArtwork(file: { width: number; height: number; sizeMb: number; type: string }, minPx = 600): ArtworkCheck[] {
  const checks: ArtworkCheck[] = [];
  if (!/^image\//.test(file.type)) {
    checks.push({ ok: false, level: "error", message: "Unsupported file type. Upload PNG, JPG, WebP or SVG." });
    return checks;
  }
  if (file.sizeMb > 8) {
    checks.push({ ok: false, level: "error", message: "That file is too large (max 8 MB)." });
  }
  if (Math.max(file.width, file.height) < minPx) {
    checks.push({
      ok: false,
      level: "warning",
      message: "Your image may appear soft when printed. Try uploading a higher-resolution version.",
    });
  }
  return checks;
}
