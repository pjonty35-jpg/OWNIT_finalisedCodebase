"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "./catalog-type";
import { type DesignElement, type DesignSide, type DesignState, type TextElement, emptyDesignState, newElementId, sidesFromElements } from "@/lib/design";
import { makePreviewDataUrl, renderDesign } from "@/lib/artwork";
import { parseStudioDraft, restoreStudioState, serializeStudioDraft, STUDIO_DRAFT_KEY, validHex } from "./studio-draft";

export type ToolMode = "select" | "text" | "draw" | "shape" | "sticker";
type Stroke = { points: { x: number; y: number }[]; color: string; width: number };
type StudioDocument = { productSlug: string | null; name: string; state: DesignState };
const HISTORY_LIMIT = 60;
const SIDES: DesignSide[] = ["front", "back", "left", "right"];

export interface StudioApi {
  catalog: CatalogProduct[]; product: CatalogProduct | null; productSlug: string | null;
  setProductSlug: (slug: string) => void; state: DesignState;
  designName: string; setDesignName: (name: string) => void;
  currentVariantId: string | null; colorName: string; setColor: (name: string) => void;
  setCustomColor: (hex: string) => void; setSize: (size: string) => void; setFit: (fit: "regular" | "oversized") => void;
  hasArtwork: boolean; selectedId: string | null; selected: DesignElement | null; select: (id: string | null) => void;
  updateSelected: (patch: Partial<DesignElement>) => void; updateSelectedOn: (id: string, patch: Partial<DesignElement>) => void;
  addText: (preset?: Partial<TextElement>) => void; addImage: (url: string, width: number, height: number) => void;
  addShape: (shape: "rect" | "ellipse" | "triangle" | "line") => void;
  addSticker: (id: string) => void; addTemplate: (id: string, colorHex: string) => void; commitDrawing: (strokes: Stroke[]) => void;
  deleteSelected: () => void; duplicateSelected: () => void; reorder: (id: string, direction: "up" | "down") => void;
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean;
  beginInteraction: () => void; endInteraction: () => void; cancelInteraction: () => void;
  resetDesign: () => void; clearSide: () => void;
  activeSide: DesignSide; setActiveSide: (side: DesignSide) => void;
  exportPreview: () => Promise<string>;
  /** Legacy renderer compatibility only. This output is not a production proof. */
  exportPrintTexture: (side: DesignSide, width: number, height: number) => Promise<HTMLCanvasElement>;
  needsAuth: boolean; setNeedsAuth: (value: boolean) => void;
  mobileSheet: "product" | "design" | null; setMobileSheet: (value: "product" | "design" | null) => void;
  tool: ToolMode; setTool: (tool: ToolMode) => void;
  brushColor: string; setBrushColor: (color: string) => void; brushSize: number; setBrushSize: (size: number) => void;
  printAreaFor: (side: DesignSide) => { widthPx: number; heightPx: number } | null;
  saveLocalDraft: () => boolean; localSaveStatus: string;
}

function initialState(product: CatalogProduct | null): DesignState {
  const color = product?.colors.find(c => /off white|cream|ivory/i.test(c.name)) ?? product?.colors.find(c => /white/i.test(c.name)) ?? product?.colors[0] ?? { name: "Off White", hex: "#eae5da", sizes: ["M"] };
  const state = emptyDesignState(color, color.sizes.includes("M") ? "M" : color.sizes[0] ?? "M");
  state.fit = /oversized/i.test(product?.name ?? "") ? "oversized" : "regular";
  state.elements = [{ id: "ownit-starter-text", type: "text", side: "front", x: 600, y: 590, scale: 1, rotation: 0, opacity: 1, z: 0, locked: false, visible: true,
    text: "GOOD IDEAS\nBETTER DAYS", fontFamily: "var(--font-archivo), sans-serif", fontSize: 82, color: "#171717", bold: true, italic: false, underline: false, align: "center", letterSpacing: -3 }];
  return state;
}

export function useStudio({ catalog, initialDesign, initialProductSlug }: {
  catalog: CatalogProduct[];
  initialDesign: { id: string; name: string; state: unknown; productId: string } | null;
  initialProductSlug: string | null;
}): StudioApi {
  const [documentState, setDocumentState] = useState<StudioDocument>(() => {
    const first = (initialDesign ? catalog.find(p => p.id === initialDesign.productId) : null) ??
      (initialProductSlug ? catalog.find(p => p.slug === initialProductSlug) : null) ??
      catalog.find(p => p.slug === "essential-oversized-tee") ?? catalog[0] ?? null;
    const state = initialState(first);
    return { productSlug: first?.slug ?? null, name: initialDesign?.name ?? "My original", state: initialDesign ? restoreStudioState(initialDesign.state, state) : state };
  });
  // Refs are updated synchronously in events, never inside React's replayable state updaters.
  const documentRef = useRef(documentState);
  const history = useRef<{ past: StudioDocument[]; future: StudioDocument[] }>({ past: [], future: [] });
  const interaction = useRef<StudioDocument | null>(null);
  const [, renderHistory] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [tool, setTool] = useState<ToolMode>("select");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"product" | "design" | null>(null);
  const [brushColor, setBrushColorState] = useState("#171717");
  const [brushSize, setBrushSizeState] = useState(10);
  const [localSaveStatus, setLocalSaveStatus] = useState("Local draft");
  const [draftReady, setDraftReady] = useState(false);
  const restoreAttempted = useRef(false);
  const lastSaved = useRef<StudioDocument | null>(null);

  const select = useCallback((id: string | null) => { selectedIdRef.current = id; setSelectedId(id); }, []);
  const publish = useCallback((next: StudioDocument) => { documentRef.current = next; setDocumentState(next); }, []);
  const pushHistory = useCallback((before: StudioDocument) => {
    history.current = { past: [...history.current.past.slice(-(HISTORY_LIMIT - 1)), before], future: [] };
    renderHistory(n => n + 1);
  }, []);
  const commit = useCallback((updater: (current: StudioDocument) => StudioDocument, historical = true) => {
    const previous = documentRef.current;
    const next = updater(previous);
    if (next === previous) return;
    if (historical && !interaction.current) pushHistory(previous);
    publish(next);
  }, [publish, pushHistory]);
  const changeState = useCallback((update: (current: DesignState) => DesignState, historical = true) => {
    commit(doc => { const state = update(doc.state); return state === doc.state ? doc : { ...doc, state }; }, historical);
  }, [commit]);
  const beginInteraction = useCallback(() => { if (!interaction.current) interaction.current = documentRef.current; }, []);
  const endInteraction = useCallback(() => {
    const before = interaction.current;
    interaction.current = null;
    if (before && before !== documentRef.current) pushHistory(before);
  }, [pushHistory]);
  const cancelInteraction = useCallback(() => {
    const before = interaction.current;
    interaction.current = null;
    if (before) publish(before);
  }, [publish]);
  const undo = useCallback(() => {
    endInteraction();
    const previous = history.current.past.pop();
    if (!previous) return;
    history.current.future = [documentRef.current, ...history.current.future.slice(0, HISTORY_LIMIT - 1)];
    publish(previous); select(null); renderHistory(n => n + 1);
  }, [endInteraction, publish, select]);
  const redo = useCallback(() => {
    endInteraction();
    const next = history.current.future.shift();
    if (!next) return;
    history.current.past = [...history.current.past.slice(-(HISTORY_LIMIT - 1)), documentRef.current];
    publish(next); select(null); renderHistory(n => n + 1);
  }, [endInteraction, publish, select]);

  const { productSlug, state, name: designName } = documentState;
  const product = useMemo(() => catalog.find(p => p.slug === productSlug) ?? null, [catalog, productSlug]);
  const activeColor = product?.colors.find(c => c.name === state.colorName && c.hex.toLowerCase() === state.colorHex.toLowerCase());
  const currentVariantId = activeColor?.variantIdBySize[state.size] ?? null;
  const selected = state.elements.find(el => el.id === selectedId && el.side === state.activeSide) ?? null;

  const setProductSlug = useCallback((slug: string) => {
    const nextProduct = catalog.find(p => p.slug === slug);
    if (!nextProduct) return;
    endInteraction();
    commit(doc => {
      if (doc.productSlug === slug) return doc;
      const matching = nextProduct.colors.find(c => c.name === doc.state.colorName && c.hex.toLowerCase() === doc.state.colorHex.toLowerCase());
      // Retain a user's custom colour even if the next catalogue garment cannot supply it.
      const color = matching ?? (doc.state.colorName === "Custom" ? null : nextProduct.colors.find(c => /white/i.test(c.name)) ?? nextProduct.colors[0]);
      const sizes = color?.sizes ?? [...new Set(nextProduct.colors.flatMap(c => c.sizes))];
      return { ...doc, productSlug: slug, state: { ...doc.state,
        colorName: color?.name ?? doc.state.colorName, colorHex: color?.hex ?? doc.state.colorHex,
        size: sizes.includes(doc.state.size) ? doc.state.size : sizes.includes("M") ? "M" : sizes[0] ?? doc.state.size } };
    });
    select(null);
  }, [catalog, commit, endInteraction, select]);
  const setColor = useCallback((name: string) => {
    const currentProduct = catalog.find(p => p.slug === documentRef.current.productSlug);
    const color = currentProduct?.colors.find(c => c.name === name);
    if (!color) return;
    changeState(s => s.colorName === color.name && s.colorHex === color.hex ? s : { ...s, colorName: color.name, colorHex: color.hex,
      size: color.sizes.includes(s.size) ? s.size : color.sizes.includes("M") ? "M" : color.sizes[0] ?? s.size });
  }, [catalog, changeState]);
  const setCustomColor = useCallback((hex: string) => {
    if (validHex(hex)) changeState(s => s.colorName === "Custom" && s.colorHex === hex ? s : { ...s, colorName: "Custom", colorHex: hex });
  }, [changeState]);
  const setSize = useCallback((size: string) => changeState(s => s.size === size || !size.trim() ? s : { ...s, size: size.slice(0, 12) }), [changeState]);
  const setFit = useCallback((fit: "regular" | "oversized") => changeState(s => s.fit === fit ? s : { ...s, fit }), [changeState]);
  const setDesignName = useCallback((name: string) => commit(doc => doc.name === name ? doc : { ...doc, name: name.slice(0, 60) }), [commit]);
  const setActiveSide = useCallback((side: DesignSide) => {
    if (!SIDES.includes(side)) return;
    endInteraction();
    changeState(s => s.activeSide === side ? s : { ...s, activeSide: side }, false);
    select(null);
  }, [changeState, endInteraction, select]);

  const base = useCallback(() => ({ id: newElementId(), side: documentRef.current.state.activeSide,
    x: 600, y: 650, scale: 1, rotation: 0, opacity: 1, locked: false, visible: true, z: 0 }), []);
  const addElement = useCallback((element: DesignElement) => {
    if (documentRef.current.state.elements.length >= 200) { setLocalSaveStatus("200-layer limit reached"); return; }
    changeState(s => {
      const z = s.elements.filter(el => el.side === element.side).reduce((max, el) => Math.max(max, el.z + 1), 0);
      const elements = [...s.elements, { ...element, z }];
      return { ...s, elements, sides: sidesFromElements(elements) };
    });
    select(element.id);
  }, [changeState, select]);
  const addText = useCallback((preset: Partial<TextElement> = {}) => {
    const element: TextElement = { ...base(), type: "text", text: "YOUR TEXT", fontFamily: "var(--font-archivo), sans-serif", fontSize: 100,
      color: "#171717", bold: true, italic: false, underline: false, align: "center", letterSpacing: 0, ...preset };
    element.id = newElementId(); element.type = "text";
    addElement(element); setTool("select");
  }, [base, addElement]);
  const addImage = useCallback((url: string, width: number, height: number) => {
    if (!url || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    const scale = Math.min(1, 640 / Math.max(width, height));
    addElement({ ...base(), type: "image", url, width: width * scale, height: height * scale }); setTool("select");
  }, [base, addElement]);
  const addShape = useCallback((shape: "rect" | "ellipse" | "triangle" | "line") => {
    addElement({ ...base(), type: "shape", shape, color: "#171717", width: 320, height: shape === "line" ? 6 : 320, strokeOnly: false }); setTool("select");
  }, [base, addElement]);
  const addSticker = useCallback((stickerId: string) => { addElement({ ...base(), type: "sticker", stickerId, size: 230 }); setTool("select"); }, [base, addElement]);
  const addTemplate = useCallback((templateId: string, _colorHex: string) => { addElement({ ...base(), type: "template", templateId, size: 600, y: 520 }); setTool("select"); }, [base, addElement]);
  const commitDrawing = useCallback((strokes: Stroke[]) => {
    const valid = strokes.map(stroke => ({ ...stroke, points: stroke.points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).slice(0, 5000) })).filter(stroke => stroke.points.length);
    if (!valid.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const stroke of valid) for (const point of stroke.points) { minX = Math.min(minX, point.x); minY = Math.min(minY, point.y); maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y); }
    addElement({ ...base(), type: "drawing", x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
      strokes: valid.map(stroke => ({ ...stroke, points: stroke.points.map(p => ({ x: p.x - minX, y: p.y - minY })) })) });
  }, [base, addElement]);

  const updateSelectedOn = useCallback((id: string, patch: Partial<DesignElement>) => {
    changeState(s => {
      const original = s.elements.find(el => el.id === id);
      if (!original) return s;
      const update = { ...patch } as Record<string, unknown>;
      delete update.id; delete update.type;
      if (update.side !== undefined && !SIDES.includes(update.side as DesignSide)) delete update.side;
      if (original.locked) for (const key of Object.keys(update)) if (key !== "locked" && key !== "visible") delete update[key];
      if (update.side !== undefined && update.side !== original.side) {
        update.z = s.elements.filter(el => el.side === update.side).reduce((max, el) => Math.max(max, el.z + 1), 0);
      }
      if (!Object.entries(update).some(([key, value]) => (original as unknown as Record<string, unknown>)[key] !== value)) return s;
      const elements = s.elements.map(el => el.id === id ? { ...el, ...update } as DesignElement : el);
      return { ...s, elements, sides: sidesFromElements(elements) };
    });
  }, [changeState]);
  const updateSelected = useCallback((patch: Partial<DesignElement>) => { if (selectedIdRef.current) updateSelectedOn(selectedIdRef.current, patch); }, [updateSelectedOn]);
  const deleteSelected = useCallback(() => {
    const id = selectedIdRef.current;
    const target = documentRef.current.state.elements.find(el => el.id === id);
    if (!target || target.locked) return;
    changeState(s => { const elements = s.elements.filter(el => el.id !== id); return { ...s, elements, sides: sidesFromElements(elements) }; }); select(null);
  }, [changeState, select]);
  const duplicateSelected = useCallback(() => {
    const element = documentRef.current.state.elements.find(el => el.id === selectedIdRef.current);
    if (element) addElement({ ...element, id: newElementId(), x: element.x + 35, y: element.y + 35, locked: false });
  }, [addElement]);
  const reorder = useCallback((id: string, direction: "up" | "down") => changeState(s => {
    const target = s.elements.find(el => el.id === id);
    if (!target || target.locked) return s;
    const ordered = s.elements.filter(el => el.side === target.side).sort((a, b) => a.z - b.z);
    const index = ordered.findIndex(el => el.id === id), swap = index + (direction === "up" ? 1 : -1);
    if (swap < 0 || swap >= ordered.length) return s;
    [ordered[index], ordered[swap]] = [ordered[swap], ordered[index]];
    const order = new Map(ordered.map((el, index) => [el.id, index]));
    return { ...s, elements: s.elements.map(el => order.has(el.id) ? { ...el, z: order.get(el.id)! } : el) };
  }), [changeState]);
  const resetDesign = useCallback(() => { changeState(s => s.elements.length ? { ...s, elements: [], sides: ["front"] } : s); select(null); }, [changeState, select]);
  const clearSide = useCallback(() => {
    changeState(s => { const elements = s.elements.filter(el => el.side !== s.activeSide); return elements.length === s.elements.length ? s : { ...s, elements, sides: sidesFromElements(elements) }; }); select(null);
  }, [changeState, select]);

  const saveLocalDraft = useCallback(() => {
    const doc = documentRef.current;
    try {
      const json = serializeStudioDraft({ version: 1, productSlug: doc.productSlug, name: doc.name, savedAt: new Date().toISOString(), state: doc.state });
      if (!json) { setLocalSaveStatus("Draft too large · download to keep it"); return false; }
      window.localStorage.setItem(STUDIO_DRAFT_KEY, json);
      lastSaved.current = doc; setLocalSaveStatus("Saved on this device"); return true;
    } catch { setLocalSaveStatus("Device storage unavailable · download instead"); return false; }
  }, []);
  useEffect(() => {
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;
    try {
      if (!initialDesign) {
        const raw = window.localStorage.getItem(STUDIO_DRAFT_KEY);
        const draft = raw ? parseStudioDraft(raw) : null;
        if (draft && catalog.some(p => p.slug === draft.productSlug) && (!initialProductSlug || draft.productSlug === initialProductSlug)) {
          const restored = { productSlug: draft.productSlug, name: draft.name, state: draft.state };
          publish(restored); lastSaved.current = restored; setLocalSaveStatus("Restored from this device");
        }
      }
    } catch { setLocalSaveStatus("Device storage unavailable"); }
    setDraftReady(true);
  }, [catalog, initialDesign, initialProductSlug, publish]);
  useEffect(() => {
    if (!draftReady || documentState === lastSaved.current) return;
    setLocalSaveStatus("Unsaved changes");
    const timeout = window.setTimeout(saveLocalDraft, 1000);
    return () => window.clearTimeout(timeout);
  }, [documentState, draftReady, saveLocalDraft]);
  useEffect(() => {
    const onLeave = () => { if (draftReady && documentRef.current !== lastSaved.current) saveLocalDraft(); };
    const onVisibility = () => { if (window.document.visibilityState === "hidden") onLeave(); };
    window.addEventListener("pagehide", onLeave);
    window.document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("pagehide", onLeave); window.document.removeEventListener("visibilitychange", onVisibility); };
  }, [draftReady, saveLocalDraft]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      else if ((event.ctrlKey || event.metaKey) && key === "y") { event.preventDefault(); redo(); }
      else if ((event.ctrlKey || event.metaKey) && key === "s") { event.preventDefault(); saveLocalDraft(); }
      else if ((event.ctrlKey || event.metaKey) && key === "d" && selectedIdRef.current) { event.preventDefault(); duplicateSelected(); }
      else if ((key === "delete" || key === "backspace") && selectedIdRef.current) { event.preventDefault(); deleteSelected(); }
    }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, duplicateSelected, redo, saveLocalDraft, undo]);

  // Clone before the legacy raster helper, which decorates image elements while rendering.
  const exportPreview = useCallback(async () => makePreviewDataUrl(structuredClone(documentRef.current.state), 480), []);
  const exportPrintTexture = useCallback(async (side: DesignSide, width: number, height: number) => renderDesign(structuredClone(documentRef.current.state), {
    width, height, area: { x: 0, y: 0, w: 1, h: 1 }, designWidth: 1200, designHeight: 1500, side,
  }), []);
  const printAreaFor = useCallback((side: DesignSide) => {
    const area = product?.printAreas.find(area => area.side === side);
    return area ? { widthPx: area.widthPx, heightPx: area.heightPx } : null;
  }, [product]);
  const setBrushColor = useCallback((color: string) => { if (validHex(color)) setBrushColorState(color); }, []);
  const setBrushSize = useCallback((size: number) => { if (Number.isFinite(size)) setBrushSizeState(Math.max(1, Math.min(100, size))); }, []);

  return { catalog, product, productSlug, setProductSlug, state, designName, setDesignName, currentVariantId,
    colorName: state.colorName, setColor, setCustomColor, setSize, setFit, selectedId, selected, select,
    hasArtwork: state.elements.some(el => el.visible), updateSelected, updateSelectedOn,
    addText, addImage, addShape, addSticker, addTemplate, commitDrawing, deleteSelected, duplicateSelected, reorder,
    undo, redo, canUndo: history.current.past.length > 0, canRedo: history.current.future.length > 0,
    beginInteraction, endInteraction, cancelInteraction, resetDesign, clearSide, activeSide: state.activeSide, setActiveSide,
    exportPreview, exportPrintTexture, needsAuth, setNeedsAuth, mobileSheet, setMobileSheet, tool, setTool,
    brushColor, setBrushColor, brushSize, setBrushSize, printAreaFor, saveLocalDraft, localSaveStatus };
}
