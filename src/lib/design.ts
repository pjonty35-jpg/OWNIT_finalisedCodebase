/**
 * OWNIT design model. Designs are structured, editable data — never just an
 * image. The same JSON renders the editor canvas, the 3D print texture and
 * the production-ready export.
 */

export type DesignElementType = "text" | "image" | "drawing" | "shape" | "sticker" | "template";

export type DesignSide = "front" | "back" | "left" | "right";

export interface BaseElement {
  id: string;
  type: DesignElementType;
  side: DesignSide;
  x: number; // design-space px, origin = print-area top-left
  y: number;
  scale: number; // 1 = natural size
  rotation: number; // degrees
  opacity: number; // 0..1
  z: number;
  locked: boolean;
  visible: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  letterSpacing: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  url: string;
  width: number; // natural px
  height: number;
  crop?: { x: number; y: number; w: number; h: number };
}

export interface DrawingElement extends BaseElement {
  type: "drawing";
  strokes: { points: { x: number; y: number }[]; color: string; width: number }[];
  width: number; // bounding box of the drawing in design-space
  height: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: "rect" | "ellipse" | "triangle" | "line";
  color: string;
  width: number;
  height: number;
  strokeOnly: boolean;
}

export interface StickerElement extends BaseElement {
  type: "sticker";
  stickerId: string;
  size: number;
}

export interface TemplateElement extends BaseElement {
  type: "template";
  templateId: string;
  size: number;
}

export type DesignElement =
  | TextElement
  | ImageElement
  | DrawingElement
  | ShapeElement
  | StickerElement
  | TemplateElement;

export interface DesignState {
  /** product variant choices */
  colorName: string;
  colorHex: string;
  size: string;
  fit: string;
  /** elements grouped by side; z-index is order within each side array */
  elements: DesignElement[];
  /** which sides are being printed (drives pricing) */
  sides: DesignSide[];
  zoom: number;
  activeSide: DesignSide;
}

export function emptyDesignState(color: { name: string; hex: string }, size = "M"): DesignState {
  return {
    colorName: color.name,
    colorHex: color.hex,
    size,
    fit: "regular",
    elements: [],
    sides: ["front"],
    zoom: 1,
    activeSide: "front",
  };
}

export function sidesFromElements(elements: DesignElement[]): DesignSide[] {
  const set = new Set<DesignSide>();
  for (const el of elements) {
    if (el.visible) set.add(el.side);
  }
  return set.size ? [...set] : ["front"];
}

export function nextZ(elements: DesignElement[], side: DesignSide) {
  return elements.filter((e) => e.side === side).length;
}

export function newElementId() {
  return `el_${Math.random().toString(36).slice(2, 10)}`;
}

/** Validate an incoming design state (used when saving — never trust the client shape). */
export function sanitizeDesignState(input: unknown): DesignState {
  const state = (input ?? {}) as Partial<DesignState>;
  const sides: DesignSide[] = ["front", "back", "left", "right"];
  const elements: DesignElement[] = Array.isArray(state.elements)
    ? state.elements.slice(0, 200).map((raw, i) => {
        const el = raw as unknown as Partial<BaseElement> & Record<string, unknown>;
        const side = sides.includes(el.side as DesignSide) ? (el.side as DesignSide) : "front";
        const base: BaseElement = {
          id: typeof el.id === "string" ? el.id.slice(0, 40) : newElementId(),
          type: (["text", "image", "drawing", "shape", "sticker", "template"] as const).includes(
            el.type as DesignElementType
          )
            ? (el.type as DesignElementType)
            : "shape",
          side,
          x: clampNum(el.x, -2000, 2000),
          y: clampNum(el.y, -2000, 2000),
          scale: clampNum(el.scale, 0.05, 8) || 1,
          rotation: clampNum(el.rotation, -360, 360) || 0,
          opacity: Math.min(1, Math.max(0.02, clampNum(el.opacity, 0.02, 1) || 1)),
          z: typeof el.z === "number" ? el.z : i,
          locked: !!el.locked,
          visible: el.visible !== false,
        };
        // Type-specific known fields (string/number only, bounded lengths).
        const clean: Record<string, unknown> = { ...base };
        for (const key of [
          "text", "fontFamily", "color", "align", "url", "stickerId", "templateId", "shape",
        ] as const) {
          if (typeof el[key] === "string") clean[key] = (el[key] as string).slice(0, 400);
        }
        for (const key of ["fontSize", "letterSpacing", "width", "height", "size"] as const) {
          if (typeof el[key] === "number") clean[key] = clampNum(el[key], -5000, 5000);
        }
        for (const key of ["bold", "italic", "underline", "strokeOnly"] as const) {
          clean[key] = !!el[key];
        }
        if (Array.isArray(el.strokes)) clean.strokes = el.strokes.slice(0, 400);
        return clean as unknown as DesignElement;
      })
    : [];
  return {
    colorName: str(state.colorName, "Black", 40),
    colorHex: /^#[0-9a-fA-F]{3,8}$/.test(state.colorHex ?? "") ? state.colorHex! : "#111111",
    size: str(state.size, "M", 8),
    fit: str(state.fit, "regular", 20),
    elements,
    sides: Array.isArray(state.sides)
      ? state.sides.filter((s): s is DesignSide => sides.includes(s as DesignSide)).slice(0, 4)
      : sidesFromElements(elements),
    zoom: 1,
    activeSide: sides.includes(state.activeSide as DesignSide)
      ? (state.activeSide as DesignSide)
      : "front",
  };
}

function clampNum(v: unknown, min: number, max: number) {
  const n = typeof v === "number" && Number.isFinite(v) ? v : NaN;
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, fallback: string, max: number) {
  return typeof v === "string" && v.trim() ? v.slice(0, max) : fallback;
}

// ---------------- Stickers & templates (launch set, drawn as inline SVG) ----

export interface StickerDef {
  id: string;
  name: string;
  svg: string; // inline SVG markup, currentColor-friendly
}

export const STICKERS: StickerDef[] = [
  {
    id: "star",
    name: "Star",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2z"/></svg>`,
  },
  {
    id: "globe",
    name: "Globe",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18-3-4-3-14.5 0-18z"/></svg>`,
  },
  {
    id: "bolt",
    name: "Bolt",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>`,
  },
  {
    id: "heart",
    name: "Heart",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-9.7-9.2C.7 8.6 2.6 5 6.1 5c2 0 3.4 1 4 2.1h3.8c.6-1.1 2-2.1 4-2.1 3.5 0 5.4 3.6 3.8 6.8C19.5 16.1 12 21 12 21z"/></svg>`,
  },
  {
    id: "smiley",
    name: "Smiley",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="15" cy="10" r="0.6" fill="currentColor"/><path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2"/></svg>`,
  },
  {
    id: "lightning-circle",
    name: "Storm",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M13 6l-4 7h3l-1 5 4-7h-3l1-5z" fill="currentColor" stroke="none"/></svg>`,
  },
];

export interface TemplateDef {
  id: string;
  name: string;
  category: string;
  /** Rendered as layered text lines in the given style */
  lines: { text: string; size: number; bold: boolean; align: "left" | "center" | "right" }[];
  fontFamily: string;
  color: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "tt-better-things",
    name: "Better Things",
    category: "typography",
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    color: "#111111",
    lines: [
      { text: "BETTER", size: 96, bold: true, align: "center" },
      { text: "THINGS", size: 96, bold: true, align: "center" },
      { text: "AHEAD", size: 40, bold: false, align: "center" },
    ],
  },
  {
    id: "tt-same-dreams",
    name: "Bigger Plans",
    category: "typography",
    fontFamily: "Georgia, serif",
    color: "#f5f2ea",
    lines: [
      { text: "SAME DREAMS", size: 52, bold: true, align: "center" },
      { text: "BIGGER PLANS", size: 52, bold: true, align: "center" },
    ],
  },
  {
    id: "tt-higher",
    name: "Higher Than Yesterday",
    category: "streetwear",
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    color: "#f5f2ea",
    lines: [
      { text: "HIGHER", size: 88, bold: true, align: "center" },
      { text: "THAN", size: 88, bold: true, align: "center" },
      { text: "YESTERDAY", size: 88, bold: true, align: "center" },
    ],
  },
  {
    id: "tt-make-it-yours",
    name: "Make It Yours",
    category: "minimal",
    fontFamily: "Helvetica, Arial, sans-serif",
    color: "#111111",
    lines: [
      { text: "MAKE IT", size: 64, bold: false, align: "center" },
      { text: "YOURS", size: 64, bold: true, align: "center" },
    ],
  },
];

export function stickerById(id: string) {
  return STICKERS.find((s) => s.id === id);
}
export function templateById(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}
