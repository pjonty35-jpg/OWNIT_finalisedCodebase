/*
 * Dependency-free studio regression checks, using the project's TypeScript compiler.
 * The small hook harness exercises synchronous editor events and document history;
 * it intentionally does not replace browser checks for React effects, gestures,
 * layout, focus or automatic draft restoration.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function loadTypeScript(relativePath, resolve, browserWindow) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", "window", outputText)(resolve, module, module.exports, browserWindow);
  return module.exports;
}
const design = loadTypeScript("src/lib/design.ts", require);
const drafts = loadTypeScript("src/app/(site)/create/studio-draft.ts", id => {
  if (id === "@/lib/design") return design;
  throw new Error(`Unexpected draft dependency: ${id}`);
});

const colors = [{ name: "Off White", hex: "#eae5da", sizes: ["M", "L"], variantIdBySize: { M: "tee-m", L: "tee-l" } }];
const catalog = [
  { id: "tee", slug: "essential-oversized-tee", name: "Essential Oversized Tee", colors, printAreas: [] },
  { id: "hoodie", slug: "hoodie", name: "Hoodie", colors, printAreas: [] },
];

function studioHarness(options = {}) {
  const slots = [];
  let cursor = 0;
  const stored = new Map();
  const browserWindow = { localStorage: {
    setItem(key, value) {
      if (options.storageUnavailable) throw new Error("Storage is unavailable");
      stored.set(key, value);
    },
    getItem(key) { return stored.get(key) ?? null; },
  } };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo: factory => factory(),
    useCallback: callback => callback,
    useEffect() { /* Lifecycle effects are verified in the browser, not simulated. */ },
  };
  const { useStudio } = loadTypeScript("src/app/(site)/create/use-studio.ts", id => {
    if (id === "react") return react;
    if (id === "@/lib/design") return design;
    if (id === "./studio-draft") return drafts;
    if (id === "@/lib/artwork") return {
      makePreviewDataUrl() { throw new Error("Raster preview requires browser coverage"); },
      renderDesign() { throw new Error("Raster preview requires browser coverage"); },
    };
    throw new Error(`Unexpected hook dependency: ${id}`);
  }, browserWindow);
  return {
    stored,
    render() {
      cursor = 0;
      return useStudio({ catalog, initialDesign: null, initialProductSlug: null, ...options });
    },
  };
}

function makeDraft(state) {
  return { version: 1, productSlug: catalog[0].slug, name: "My original", savedAt: "2026-09-27T00:00:00.000Z", state };
}

test("local draft preserves full raster image URLs and all four independent views", () => {
  const url = `data:image/png;base64,${"QUJD".repeat(1000)}`;
  const state = drafts.restoreStudioState({ colorName: "Custom", colorHex: "#abcdef", activeSide: "right",
    elements: ["front", "back", "left", "right"].map((side, index) => ({ id: `photo-${index}`, type: "image", side, url, width: 300, height: 200 })),
  });
  const json = drafts.serializeStudioDraft(makeDraft(state));
  assert.ok(json);
  const restored = drafts.parseStudioDraft(json);
  assert.equal(restored.state.activeSide, "right");
  assert.equal(restored.state.colorName, "Custom");
  assert.deepEqual(restored.state.sides, ["front", "back", "left", "right"]);
  for (const image of restored.state.elements) assert.equal(image.url, url);
});

test("draft parser rejects malformed, incompatible and oversized inputs", () => {
  for (const json of ["{", "null", "[]", JSON.stringify({ version: 2, productSlug: "tee", state: { elements: [] } }),
    JSON.stringify({ version: 1, productSlug: "tee", state: {} }), " ".repeat(drafts.STUDIO_DRAFT_MAX_BYTES / 2 + 1)]) {
    assert.equal(drafts.parseStudioDraft(json), null);
  }
});

test("draft saving rejects temporary blob images and drafts above the storage guard", () => {
  const state = drafts.restoreStudioState({ elements: [{ id: "photo", type: "image", url: "/uploads/photo.png", width: 200, height: 200 }] });
  const withUrl = url => makeDraft({ ...state, elements: [{ ...state.elements[0], url }] });
  assert.equal(drafts.serializeStudioDraft(withUrl("blob:temporary")), null);
  assert.equal(drafts.serializeStudioDraft(withUrl(`data:image/png;base64,${"A".repeat(3_000_000)}`)), null);
  assert.ok(drafts.serializeStudioDraft(withUrl("/uploads/photo.png")));
});

test("draft restoration bounds unsafe values and excludes non-raster or external image URLs", () => {
  const state = drafts.restoreStudioState({ activeSide: "invalid", colorHex: "not-a-colour", elements: [
    { id: "text", type: "text", side: "invalid", x: Infinity, text: 33, fontSize: -10 },
    ...["javascript:alert(1)", "data:image/svg+xml;base64,PHN2Zz4=", "blob:temporary", "//example.com/image.png", "https://example.com/image.png"]
      .map((url, index) => ({ id: `unsafe-${index}`, type: "image", url })),
  ] });
  assert.equal(state.elements.length, 1);
  assert.equal(state.activeSide, "front");
  assert.equal(state.elements[0].text, "YOUR TEXT");
  assert.equal(state.elements[0].side, "front");
  assert.equal(state.elements[0].x, 600);
  assert.equal(state.elements[0].fontSize, 8);
});

test("default studio uses the ivory tee, loaded font and actual size variant", () => {
  const studio = studioHarness().render();
  assert.equal(studio.productSlug, "essential-oversized-tee");
  assert.equal(studio.currentVariantId, "tee-m");
  assert.equal(studio.state.fit, "oversized");
  assert.equal(studio.state.elements[0].fontFamily, "var(--font-archivo), sans-serif");
  assert.equal(studio.state.elements[0].fontSize, 82);
});

test("initial authenticated design wins over a conflicting product query", () => {
  const studio = studioHarness({ initialProductSlug: catalog[0].slug, initialDesign: {
    id: "saved", name: "Saved idea", productId: "hoodie", state: { elements: [], colorName: "Custom", colorHex: "#123456", activeSide: "back" },
  } }).render();
  assert.equal(studio.productSlug, "hoodie");
  assert.equal(studio.designName, "Saved idea");
  assert.equal(studio.activeSide, "back");
  assert.equal(studio.state.elements.length, 0);
});

test("add selects new artwork and a whole transform gesture is one undo step", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.addText(); studio = harness.render();
  const id = studio.selectedId;
  assert.equal(studio.selected.type, "text");
  studio.beginInteraction();
  studio.updateSelectedOn(id, { x: 100 });
  studio.updateSelectedOn(id, { x: 250, rotation: 20 });
  studio.endInteraction(); studio = harness.render();
  assert.equal(studio.selected.x, 250);
  studio.undo(); studio = harness.render();
  assert.equal(studio.state.elements.find(element => element.id === id).x, 600);
  assert.equal(studio.state.elements.find(element => element.id === id).rotation, 0);
  studio.redo(); studio = harness.render();
  assert.equal(studio.state.elements.find(element => element.id === id).x, 250);
  studio.undo(); studio = harness.render(); studio.undo(); studio = harness.render();
  assert.equal(studio.state.elements.some(element => element.id === id), false);
});

test("custom colours and unknown sizes never silently select a different SKU", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.setCustomColor("#aabbcc"); studio = harness.render();
  assert.equal(studio.currentVariantId, null);
  assert.equal(studio.colorName, "Custom");
  studio.setColor("Off White"); studio.setSize("XXXL"); studio = harness.render();
  assert.equal(studio.currentVariantId, null);
  studio.setSize("L"); studio = harness.render();
  assert.equal(studio.currentVariantId, "tee-l");
});

test("product selection and its garment state undo together", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.setCustomColor("#aabbcc");
  studio.setProductSlug("hoodie"); studio = harness.render();
  assert.equal(studio.productSlug, "hoodie");
  assert.equal(studio.state.colorHex, "#aabbcc");
  assert.equal(studio.currentVariantId, null);
  studio.undo(); studio = harness.render();
  assert.equal(studio.productSlug, "essential-oversized-tee");
  assert.equal(studio.state.colorHex, "#aabbcc");
});

test("side transfer uses destination layer order, is undoable, and rejects invalid sides", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.setActiveSide("back"); studio.addShape("rect"); studio = harness.render();
  const background = studio.selected;
  studio.setActiveSide("front"); studio.addText(); studio = harness.render();
  const id = studio.selectedId;
  studio.updateSelected({ side: "back" }); studio = harness.render();
  const moved = studio.state.elements.find(element => element.id === id);
  assert.equal(moved.side, "back");
  assert.ok(moved.z > background.z);
  studio.undo(); studio = harness.render();
  assert.equal(studio.state.elements.find(element => element.id === id).side, "front");
  studio.updateSelectedOn(id, { side: "invalid" }); studio = harness.render();
  assert.equal(studio.state.elements.find(element => element.id === id).side, "front");
});

test("locked artwork cannot move, transfer, or delete but can unlock and change visibility", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.addText(); studio = harness.render();
  const id = studio.selectedId;
  studio.updateSelected({ locked: true });
  studio.updateSelectedOn(id, { x: 800, side: "right" });
  studio.deleteSelected(); studio = harness.render();
  assert.equal(studio.selected.x, 600);
  assert.equal(studio.selected.side, "front");
  studio.updateSelectedOn(id, { visible: false }); studio = harness.render();
  assert.equal(studio.selected.visible, false);
  studio.updateSelectedOn(id, { locked: false });
  studio.updateSelectedOn(id, { side: "right" }); studio = harness.render();
  assert.equal(studio.state.elements.find(element => element.id === id).side, "right");
});

test("canceling an interaction restores the starting document without an undo entry", () => {
  const harness = studioHarness();
  let studio = harness.render();
  const id = studio.state.elements[0].id;
  studio.beginInteraction(); studio.updateSelectedOn(id, { x: 900 }); studio.cancelInteraction(); studio = harness.render();
  assert.equal(studio.state.elements[0].x, 600);
  assert.equal(studio.canUndo, false);
});

test("drawing remains side-specific and keeps its points after undo and redo", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.setActiveSide("left");
  studio.commitDrawing([{ color: "#abcdef", width: 10, points: [{ x: 100, y: 200 }, { x: 130, y: 240 }] }]); studio = harness.render();
  const drawing = studio.selected;
  assert.equal(drawing.type, "drawing");
  assert.equal(drawing.side, "left");
  assert.equal(drawing.x, 100);
  assert.equal(drawing.y, 200);
  assert.deepEqual(drawing.strokes[0].points, [{ x: 0, y: 0 }, { x: 30, y: 40 }]);
  studio.undo(); studio = harness.render();
  assert.equal(studio.state.elements.some(element => element.id === drawing.id), false);
  studio.redo(); studio = harness.render();
  assert.deepEqual(studio.state.elements.find(element => element.id === drawing.id), drawing);
});

test("manual draft save reports success only after storage accepts the document", () => {
  const harness = studioHarness();
  let studio = harness.render();
  studio.setDesignName("Saved concept");
  assert.equal(studio.saveLocalDraft(), true);
  studio = harness.render();
  assert.equal(studio.localSaveStatus, "Saved on this device");
  assert.equal(drafts.parseStudioDraft(harness.stored.get(drafts.STUDIO_DRAFT_KEY)).name, "Saved concept");
  const blocked = studioHarness({ storageUnavailable: true });
  assert.equal(blocked.render().saveLocalDraft(), false);
  assert.match(blocked.render().localSaveStatus, /unavailable/);
});
