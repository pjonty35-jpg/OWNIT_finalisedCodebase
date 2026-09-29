import type { DesignElement, DesignSide, DesignState } from "@/lib/design";
import { emptyDesignState, sidesFromElements } from "@/lib/design";

export const STUDIO_DRAFT_KEY = "ownit.studio.draft.v1";
export const STUDIO_DRAFT_MAX_BYTES = 5 * 1024 * 1024;
const SIDES: DesignSide[] = ["front", "back", "left", "right"];
const number = (v: unknown, fallback: number, min = -10000, max = 10000) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const string = (v: unknown, fallback: string, max = 400) => typeof v === "string" ? v.slice(0, max) : fallback;
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" ? v as Record<string, unknown> : {};
export const validHex = (v: unknown): v is string => typeof v === "string" && /^#[\da-f]{6}$/i.test(v);
const color = (v: unknown, fallback: string) => validHex(v) ? v : fallback;

/** Local drafts need full image data URLs; the server's short-string sanitizer is not suitable. */
export function restoreStudioState(input: unknown, fallback: DesignState = emptyDesignState({ name: "Off White", hex: "#eae5da" })): DesignState {
  const raw = record(input);
  const ids = new Set<string>();
  const elements: DesignElement[] = [];
  for (const [index, value] of (Array.isArray(raw.elements) ? raw.elements.slice(0, 200) : []).entries()) {
    const el = record(value);
    let id = string(el.id, `restored-${index}`, 80);
    if (ids.has(id)) id = `${id}-${index}`;
    ids.add(id);
    const base = { id, side: SIDES.includes(el.side as DesignSide) ? el.side as DesignSide : "front" as DesignSide,
      x: number(el.x, 600), y: number(el.y, 650), scale: number(el.scale, 1, .05, 8),
      rotation: number(el.rotation, 0, -360, 360), opacity: number(el.opacity, 1, 0, 1),
      z: number(el.z, index, 0, 10000), locked: el.locked === true, visible: el.visible !== false };
    switch (el.type) {
      case "text": elements.push({ ...base, type: "text", text: string(el.text, "YOUR TEXT", 4000),
        fontFamily: string(el.fontFamily, "var(--font-archivo), sans-serif", 200), fontSize: number(el.fontSize, 100, 8, 800),
        color: color(el.color, "#171717"), bold: el.bold === true, italic: el.italic === true, underline: el.underline === true,
        align: el.align === "left" || el.align === "right" ? el.align : "center", letterSpacing: number(el.letterSpacing, 0, -20, 60) }); break;
      case "image": {
        const url = string(el.url, "", STUDIO_DRAFT_MAX_BYTES);
        if (!/^data:image\/(png|jpeg|webp);base64,/i.test(url) && !/^\/(?!\/)/.test(url)) break;
        elements.push({ ...base, type: "image", url, width: number(el.width, 400, 1, 5000), height: number(el.height, 400, 1, 5000) });
        break;
      }
      case "shape": elements.push({ ...base, type: "shape",
        shape: el.shape === "ellipse" || el.shape === "triangle" || el.shape === "line" ? el.shape : "rect",
        color: color(el.color, "#171717"), width: number(el.width, 300, 1, 5000), height: number(el.height, 300, 1, 5000), strokeOnly: el.strokeOnly === true }); break;
      case "sticker": elements.push({ ...base, type: "sticker", stickerId: string(el.stickerId, "star", 80), size: number(el.size, 260, 10, 3000) }); break;
      case "template": elements.push({ ...base, type: "template", templateId: string(el.templateId, "tt-make-it-yours", 80), size: number(el.size, 600, 10, 3000) }); break;
      case "drawing": {
        const strokes = (Array.isArray(el.strokes) ? el.strokes.slice(0, 400) : []).map(value => {
          const stroke = record(value);
          return { color: color(stroke.color, "#171717"), width: number(stroke.width, 8, 1, 100),
            points: (Array.isArray(stroke.points) ? stroke.points.slice(0, 5000) : []).map(value => {
              const point = record(value); return { x: number(point.x, 0), y: number(point.y, 0) };
            }) };
        }).filter(stroke => stroke.points.length > 0);
        if (strokes.length) elements.push({ ...base, type: "drawing", strokes, width: number(el.width, 100, 1, 10000), height: number(el.height, 100, 1, 10000) });
        break;
      }
    }
  }
  return { ...fallback, colorName: string(raw.colorName, fallback.colorName, 40), colorHex: color(raw.colorHex, fallback.colorHex),
    size: string(raw.size, fallback.size, 12), fit: raw.fit === "oversized" ? "oversized" : "regular",
    activeSide: SIDES.includes(raw.activeSide as DesignSide) ? raw.activeSide as DesignSide : "front",
    zoom: 1, elements, sides: sidesFromElements(elements) };
}

export interface StudioDraft { version: 1; productSlug: string | null; name: string; savedAt: string; state: DesignState }

export function parseStudioDraft(json: string): StudioDraft | null {
  if (json.length * 2 > STUDIO_DRAFT_MAX_BYTES) return null;
  try {
    const raw = record(JSON.parse(json));
    if (raw.version !== 1 || typeof raw.productSlug !== "string" || !raw.state || !Array.isArray(record(raw.state).elements)) return null;
    return { version: 1, productSlug: raw.productSlug, name: string(raw.name, "My original", 60),
      savedAt: string(raw.savedAt, "", 40), state: restoreStudioState(raw.state) };
  } catch { return null; }
}

/** Use a conservative UTF-16 estimate because browser storage quotas vary. */
export function serializeStudioDraft(draft: StudioDraft): string | null {
  const json = JSON.stringify(draft);
  if (json.length * 2 > STUDIO_DRAFT_MAX_BYTES || draft.state.elements.some(el => el.type === "image" && el.url.startsWith("blob:"))) return null;
  return json;
}
