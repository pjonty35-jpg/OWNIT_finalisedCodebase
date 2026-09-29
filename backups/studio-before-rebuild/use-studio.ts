"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "./catalog-type";
import {
  type DesignElement,
  type DesignSide,
  type DesignState,
  type TextElement,
  emptyDesignState,
  newElementId,
  sidesFromElements,
} from "@/lib/design";
import { makePreviewDataUrl, renderDesign } from "@/lib/artwork";

export type ToolMode = "select" | "text" | "draw" | "shape" | "sticker";

const HISTORY_LIMIT = 60;

export interface StudioApi {
  catalog: CatalogProduct[];
  product: CatalogProduct | null;
  productSlug: string | null;
  setProductSlug: (slug: string) => void;
  state: DesignState;
  designName: string;
  setDesignName: (n: string) => void;
  currentVariantId: string | null;
  colorName: string;
  setColor: (name: string) => void;
  setSize: (size: string) => void;
  hasArtwork: boolean;
  selectedId: string | null;
  selected: DesignElement | null;
  select: (id: string | null) => void;
  updateSelected: (patch: Partial<DesignElement>) => void;
  updateSelectedOn: (id: string, patch: Partial<DesignElement>) => void;
  addText: (preset?: Partial<TextElement>) => void;
  addImage: (url: string, width: number, height: number) => void;
  addShape: (shape: "rect" | "ellipse" | "triangle" | "line") => void;
  addSticker: (stickerId: string) => void;
  addTemplate: (templateId: string, colorHex: string) => void;
  commitDrawing: (strokes: { points: { x: number; y: number }[]; color: string; width: number }[]) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  reorder: (id: string, dir: "up" | "down") => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeSide: DesignSide;
  setActiveSide: (s: DesignSide) => void;
  exportPreview: () => Promise<string>;
  exportPrintTexture: (side: DesignSide, w: number, h: number) => Promise<HTMLCanvasElement>;
  needsAuth: boolean;
  setNeedsAuth: (v: boolean) => void;
  mobileSheet: "product" | "design" | null;
  setMobileSheet: (v: "product" | "design" | null) => void;
  tool: ToolMode;
  setTool: (t: ToolMode) => void;
  printAreaFor: (side: DesignSide) => { widthPx: number; heightPx: number } | null;
}

export function useStudio({
  catalog,
  initialDesign,
  initialProductSlug,
}: {
  catalog: CatalogProduct[];
  initialDesign: { id: string; name: string; state: unknown; productId: string } | null;
  initialProductSlug: string | null;
}): StudioApi {
  const firstProduct =
    (initialProductSlug ? catalog.find((p) => p.slug === initialProductSlug) : null) ??
    (initialDesign ? catalog.find((p) => p.id === initialDesign.productId) : null) ??
    catalog[0] ??
    null;

  const [productSlug, setProductSlugState] = useState<string | null>(firstProduct?.slug ?? null);
  const product = useMemo(() => catalog.find((p) => p.slug === productSlug) ?? null, [catalog, productSlug]);

  const [state, setState] = useState<DesignState>(() => {
    if (initialDesign) {
      const parsed = initialDesign.state as Partial<DesignState>;
      return { ...emptyDesignState({ name: parsed.colorName ?? "Black", hex: parsed.colorHex ?? "#111111" }), ...parsed };
    }
    const firstColor = firstProduct?.colors[0];
    return emptyDesignState(firstColor ?? { name: "Black", hex: "#111111" });
  });
  const [designName, setDesignName] = useState(initialDesign?.id ? initialDesign.name : "Untitled Design");

  // History
  const past = useRef<DesignState[]>([]);
  const future = useRef<DesignState[]>([]);
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const commit = useCallback((updater: (s: DesignState) => DesignState) => {
    setState((prev) => {
      past.current = [...past.current.slice(-HISTORY_LIMIT), prev];
      future.current = [];
      return updater(prev);
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      const last = past.current.pop();
      if (!last) return prev;
      future.current = [prev, ...future.current.slice(0, HISTORY_LIMIT)];
      return last;
    });
    bump();
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = future.current.shift();
      if (!next) return prev;
      past.current = [...past.current, prev];
      return next;
    });
    bump();
  }, []);

  // Product/variant helpers
  const colorName = state.colorName;
  const activeColor = product?.colors.find((c) => c.name === colorName) ?? product?.colors[0] ?? null;
  const sizes = activeColor?.sizes ?? [];
  const size = sizes.includes(state.size) ? state.size : sizes[Math.floor(sizes.length / 2)] ?? "M";
  const currentVariantId = activeColor?.variantIdBySize[size] ?? null;

  const setProductSlug = useCallback(
    (slug: string) => {
      const next = catalog.find((p) => p.slug === slug);
      if (!next) return;
      setProductSlugState(slug);
      commit((s) => {
        const keepColor = next.colors.find((c) => c.name === s.colorName) ?? next.colors[0];
        const keepSize = keepColor?.sizes.includes(s.size) ? s.size : keepColor?.sizes[0] ?? "M";
        const allowedSides = new Set(next.printAreas.map((a) => a.side));
        const activeSide = allowedSides.has(s.activeSide) ? s.activeSide : (next.printAreas[0]?.side as DesignSide) ?? "front";
        return {
          ...s,
          colorName: keepColor?.name ?? s.colorName,
          colorHex: keepColor?.hex ?? s.colorHex,
          size: keepSize,
          activeSide,
          sides: sidesFromElements(s.elements),
        };
      });
    },
    [catalog, commit]
  );

  const setColor = useCallback(
    (name: string) => {
      const c = product?.colors.find((x) => x.name === name);
      if (!c) return;
      commit((s) => ({
        ...s,
        colorName: c.name,
        colorHex: c.hex,
        size: c.sizes.includes(s.size) ? s.size : c.sizes[0] ?? "M",
      }));
    },
    [product, commit]
  );

  const setSize = useCallback(
    (sz: string) => {
      setState((prev) => ({ ...prev, size: sz })); // size doesn't affect artwork; skip history
    },
    []
  );

  const setActiveSide = useCallback((side: DesignSide) => {
    setState((prev) => ({ ...prev, activeSide: side }));
  }, []);

  // Elements
  const addElement = useCallback(
    (el: Omit<DesignElement, "id" | "z" | "side"> & { side?: DesignSide }) => {
      commit((s) => {
        const side = el.side ?? s.activeSide;
        const element = {
          ...el,
          side,
          id: newElementId(),
          z: s.elements.filter((e) => e.side === side).length,
        } as DesignElement;
        const sides = s.sides.includes(side) ? s.sides : [...s.sides, side];
        return { ...s, elements: [...s.elements, element], sides };
      });
    },
    [commit]
  );

  const addText = useCallback(
    (preset: Partial<TextElement> = {}) => {
      addElement({
        type: "text",
        x: 600,
        y: 620,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        text: "YOUR TEXT",
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: 120,
        color: "#f5f2ea",
        bold: true,
        italic: false,
        underline: false,
        align: "center",
        letterSpacing: 2,
        ...preset,
      } as Omit<TextElement, "id" | "z" | "side">);
    },
    [addElement]
  );

  const addImage = useCallback(
    (url: string, width: number, height: number) => {
      const maxW = 700;
      const scale = Math.min(1, maxW / width);
      addElement({
        type: "image",
        x: 600,
        y: 650,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        url,
        width: Math.round(width * scale),
        height: Math.round(height * scale),
      } as Omit<DesignElement, "id" | "z" | "side">);
    },
    [addElement]
  );

  const addShape = useCallback(
    (shape: "rect" | "ellipse" | "triangle" | "line") => {
      addElement({
        type: "shape",
        x: 600,
        y: 650,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        shape,
        color: "#f5f2ea",
        width: 360,
        height: shape === "line" ? 6 : 360,
        strokeOnly: false,
      } as Omit<DesignElement, "id" | "z" | "side">);
    },
    [addElement]
  );

  const addSticker = useCallback(
    (stickerId: string) => {
      addElement({
        type: "sticker",
        x: 600,
        y: 650,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        stickerId,
        size: 260,
      } as Omit<DesignElement, "id" | "z" | "side">);
    },
    [addElement]
  );

  const addTemplate = useCallback(
    (templateId: string, colorHex: string) => {
      addElement({
        type: "template",
        x: 600,
        y: 480,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        templateId,
        size: 600,
      } as Omit<DesignElement, "id" | "z" | "side">);
      void colorHex;
    },
    [addElement]
  );

  const commitDrawing = useCallback(
    (strokes: { points: { x: number; y: number }[]; color: string; width: number }[]) => {
      if (!strokes.length) return;
      const allPts = strokes.flatMap((s) => s.points);
      const xs = allPts.map((p) => p.x);
      const ys = allPts.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const shifted = strokes.map((s) => ({ ...s, points: s.points.map((p) => ({ x: p.x - minX, y: p.y - minY })) }));
      addElement({
        type: "drawing",
        x: minX,
        y: minY,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        strokes: shifted,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
      } as Omit<DesignElement, "id" | "z" | "side">);
    },
    [addElement]
  );

  const [selectedIdState, setSelectedId] = useState<string | null>(null);
  const selected = state.elements.find((e) => e.id === selectedIdState && e.side === state.activeSide) ?? null;

  const select = useCallback((id: string | null) => setSelectedId(id), []);

  const updateSelected = useCallback(
    (patch: Partial<DesignElement>) => {
      setState((prev) => ({
        ...prev,
        elements: prev.elements.map((e) => (e.id === selectedIdState ? ({ ...e, ...patch } as DesignElement) : e)),
      }));
    },
    [selectedIdState]
  );

  const updateSelectedOn = useCallback((id: string, patch: Partial<DesignElement>) => {
    setState((prev) => ({
      ...prev,
      elements: prev.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)),
    }));
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedIdState) return;
    commit((s) => ({ ...s, elements: s.elements.filter((e) => e.id !== selectedIdState) }));
    setSelectedId(null);
  }, [selectedIdState, commit]);

  const duplicateSelected = useCallback(() => {
    if (!selectedIdState) return;
    commit((s) => {
      const el = s.elements.find((e) => e.id === selectedIdState);
      if (!el) return s;
      const copy = { ...el, id: newElementId(), x: el.x + 40, y: el.y + 40, z: el.z + 1 } as DesignElement;
      return { ...s, elements: [...s.elements, copy] };
    });
  }, [selectedIdState, commit]);

  const reorder = useCallback(
    (id: string, dir: "up" | "down") => {
      commit((s) => {
        const sideEls = s.elements.filter((e) => e.side === s.activeSide).sort((a, b) => a.z - b.z);
        const idx = sideEls.findIndex((e) => e.id === id);
        const swapWith = dir === "up" ? idx + 1 : idx - 1;
        if (idx < 0 || swapWith < 0 || swapWith >= sideEls.length) return s;
        const reordered = [...sideEls];
        [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];
        const zMap = new Map(reordered.map((e, i) => [e.id, i]));
        return { ...s, elements: s.elements.map((e) => (e.side === s.activeSide ? { ...e, z: zMap.get(e.id) ?? e.z } : e)) };
      });
    },
    [commit]
  );

  const hasArtwork = state.elements.some((e) => e.visible);

  // Exports
  const printAreaFor = useCallback(
    (side: DesignSide) => {
      const area = product?.printAreas.find((a) => a.side === side);
      return area ? { widthPx: area.widthPx, heightPx: area.heightPx } : null;
    },
    [product]
  );

  const exportPrintTexture = useCallback(
    async (side: DesignSide, w: number, h: number) => {
      return renderDesign(state, {
        width: w,
        height: h,
        area: { x: 0, y: 0, w: 1, h: 1 },
        designWidth: w,
        designHeight: h,
        side,
      });
    },
    [state]
  );

  const exportPreview = useCallback(async () => {
    return makePreviewDataUrl(state, 480);
  }, [state]);

  const [needsAuth, setNeedsAuth] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"product" | "design" | null>(null);
  const [tool, setTool] = useState<ToolMode>("select");

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void 0; // handled in studio.tsx via UI button; reserved
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIdState) {
          e.preventDefault();
          deleteSelected();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelected, selectedIdState]);

  return {
    catalog,
    product,
    productSlug,
    setProductSlug,
    state,
    designName,
    setDesignName,
    currentVariantId,
    colorName: activeColor?.name ?? state.colorName,
    setColor,
    setSize,
    hasArtwork,
    selectedId: selectedIdState,
    selected,
    select,
    updateSelected,
    updateSelectedOn,
    addText,
    addImage,
    addShape,
    addSticker,
    addTemplate,
    commitDrawing,
    deleteSelected,
    duplicateSelected,
    reorder,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    activeSide: state.activeSide,
    setActiveSide,
    exportPreview,
    exportPrintTexture,
    needsAuth,
    setNeedsAuth,
    mobileSheet,
    setMobileSheet,
    tool,
    setTool,
    printAreaFor,
  };
}
