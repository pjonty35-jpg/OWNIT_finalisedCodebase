"use client";

import { useEffect, useId, useRef, useState } from "react";
import { STICKERS, TEMPLATES, type DesignElement, type DesignSide, type ShapeElement, type TextElement } from "@/lib/design";
import { createEditorImage } from "@/lib/editor-assets";
import type { StudioApi } from "./use-studio";

const FONT_OPTIONS = [
  { label: "Archivo — bold & clean", value: "var(--font-archivo), sans-serif" },
  { label: "Inter — everyday classic", value: "var(--font-inter), sans-serif" },
  { label: "Caveat — handwritten", value: "var(--font-caveat), cursive" },
  { label: "Georgia — editorial", value: "Georgia, serif" },
  { label: "Courier — typewriter", value: "'Courier New', monospace" },
];
const INK_COLORS = ["#f7f6f0", "#161616", "#a9a9a6", "#5184ea", "#e25e62", "#e9c7a1", "#dcd1ae"];
type AssetTray = "stickers" | "shapes" | "templates" | null;
type PanelIconName = "text" | "image" | "draw" | "stickers" | "shapes" | "templates" | "layers" | "eye" | "hidden" | "lock" | "unlock" | "delete" | "duplicate";

function PanelIcon({ name }: { name: PanelIconName }) {
  const paths: Record<PanelIconName, React.ReactNode> = {
    text: <><path d="M4 6V3h16v3M12 3v18M8 21h8" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.4" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
    draw: <><path d="m4 20 1-5L16 4a2.1 2.1 0 0 1 3 3L8 18l-4 2Z M14 6l4 4" /></>,
    stickers: <><circle cx="12" cy="12" r="9" /><path d="M8 14c2 3 6 3 8 0M8 9h.01M16 9h.01" /></>,
    shapes: <><path d="m12 2 4 7H8l4-7Z" /><rect x="3" y="13" width="7" height="7" rx="1" /><circle cx="17" cy="16.5" r="3.5" /></>,
    templates: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    hidden: <><path d="m3 3 18 18M9 6.4A12 12 0 0 1 12 6c6 0 10 6 10 6a20 20 0 0 1-3 3M6 7.5A20 20 0 0 0 2 12s4 6 10 6a13 13 0 0 0 5-1" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    unlock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2M12 14v3" /></>,
    delete: <><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>,
    duplicate: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function DesignPanel({ studio }: { studio: StudioApi }) {
  const uid = useId();
  const [tray, setTray] = useState<AssetTray>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = studio.selected;
  const layers = studio.state.elements.filter((element) => element.side === studio.activeSide).sort((a, b) => b.z - a.z);
  const selectedColor = selected?.type === "text" || selected?.type === "shape" ? selected.color : null;
  const gesture = { onFocus: studio.beginInteraction, onPointerDown: studio.beginInteraction, onPointerUp: studio.endInteraction, onPointerCancel: studio.endInteraction, onBlur: studio.endInteraction };

  useEffect(() => {
    function focusText() {
      // Both desktop and mobile panels can exist. Only focus the visible one.
      window.requestAnimationFrame(() => {
        const field = textRef.current;
        if (field && !field.disabled && panelRef.current?.getBoundingClientRect().width) {
          const settings = field.closest("details");
          if (settings) settings.open = true;
          field.focus();
        }
      });
    }
    window.addEventListener("ownit:edit-text", focusText);
    return () => window.removeEventListener("ownit:edit-text", focusText);
  }, []);

  function openTray(next: AssetTray) {
    studio.setTool("select");
    setTray((current) => current === next ? null : next);
  }

  async function onUpload(file: File) {
    setUploading(true);
    setStatus("Preparing a lightweight editing copy…");
    try {
      const { editorBlob } = await prepareOwnitEditorUpload(file);
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image could not be read."));
        reader.onerror = () => reject(new Error("Image could not be read."));
        reader.readAsDataURL(editorBlob);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const result = new Image();
        result.onload = () => resolve(result);
        result.onerror = () => reject(new Error("This image cannot be decoded. Please try another PNG, JPEG or WebP."));
        result.src = url;
      });
      studio.setTool("select");
      studio.addImage(url, image.naturalWidth, image.naturalHeight);
      setTray(null);
      setStatus(`${Math.max(image.naturalWidth, image.naturalHeight) < 600 ? "Small image: it may look soft at larger sizes. " : "Image added. "}The editing copy stays in this browser; keep your original for production.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image could not be added. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function setInk(color: string) {
    if (selected?.type === "text") studio.updateSelected({ color } as Partial<TextElement>);
    if (selected?.type === "shape") studio.updateSelected({ color } as Partial<ShapeElement>);
  }

  return (
    <div className="os-design-panel" ref={panelRef}>
      <div className="os-tool-grid" aria-label="Add to your design">
        <ToolButton label="Add Text" icon="text" active={selected?.type === "text" && studio.tool !== "draw"} onClick={() => { studio.setTool("select"); studio.addText(); setTray(null); window.requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("ownit:edit-text"))); }} />
        <ToolButton label={uploading ? "Preparing…" : "Upload Image"} icon="image" disabled={uploading} onClick={() => fileRef.current?.click()} />
        <ToolButton label="Draw" icon="draw" active={studio.tool === "draw"} onClick={() => { studio.setTool(studio.tool === "draw" ? "select" : "draw"); setTray(null); }} />
        <ToolButton label="Stickers" icon="stickers" active={tray === "stickers"} onClick={() => openTray("stickers")} />
        <ToolButton label="Shapes" icon="shapes" active={tray === "shapes"} onClick={() => openTray("shapes")} />
        <ToolButton label="Templates" icon="templates" active={tray === "templates"} onClick={() => openTray("templates")} />
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose an image for your design" className="os-hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); event.target.value = ""; }} />
      {status ? <p className="os-status" role="status">{status}</p> : null}

      {tray ? <section className="os-settings"><h3 className="os-settings-title">{tray === "stickers" ? "A little personality" : tray === "shapes" ? "Start with a shape" : "Make it your own"}</h3><div className="os-settings-body">
        {tray === "stickers" ? <div className="os-asset-grid">{STICKERS.map((sticker) => <button type="button" key={sticker.id} className="os-asset-button" aria-label={`Add ${sticker.name} sticker`} onClick={() => studio.addSticker(sticker.id)}><span aria-hidden="true" dangerouslySetInnerHTML={{ __html: sticker.svg }} /><span>{sticker.name}</span></button>)}</div> : null}
        {tray === "shapes" ? <div className="os-asset-grid">{(["rect", "ellipse", "triangle", "line"] as const).map((shape, index) => <button type="button" key={shape} className="os-asset-button" onClick={() => studio.addShape(shape)}><span aria-hidden="true">{["□", "○", "△", "╱"][index]}</span><span>{["Rectangle", "Circle", "Triangle", "Line"][index]}</span></button>)}</div> : null}
        {tray === "templates" ? <><div className="os-asset-grid">{TEMPLATES.map((template) => <button type="button" key={template.id} className="os-template-button" onClick={() => studio.addText({ text: template.lines.map((line) => line.text).join("\n"), fontFamily: FONT_OPTIONS[0].value, fontSize: 84, bold: true, align: "center", letterSpacing: 1, color: template.color })}><strong>{template.lines.map((line) => line.text).join(" ")}</strong><span>Editable text</span></button>)}</div><p className="os-note">A starting point, never a limit. Every word, font and colour is editable.</p></> : null}
      </div></section> : null}

      {studio.tool === "draw" ? <section className="os-settings"><h3 className="os-settings-title"><PanelIcon name="draw" /> Your freehand brush</h3><div className="os-settings-body"><p className="os-note">Draw directly on the garment. Each stroke is its own editable layer.</p><Range label="Brush width" value={studio.brushSize} min={2} max={60} step={1} display={`${studio.brushSize}px`} onChange={studio.setBrushSize} /><ColorChoices value={studio.brushColor} onChange={studio.setBrushColor} label="Brush colour" /><button type="button" className="os-small-button" onClick={() => studio.setTool("select")}>Done drawing · select artwork</button></div></section> : null}

      <details className="os-settings" open>
        <summary className="os-settings-title"><PanelIcon name={selected?.type === "shape" ? "shapes" : selected?.type === "image" ? "image" : "text"} /><span>{selected?.type === "text" ? "Text Settings" : selected?.type === "shape" ? "Shape Settings" : selected ? "Artwork Settings" : "Your Design"}</span><span aria-hidden="true">⌃</span></summary>
        <div className="os-settings-body">
          {!selected ? <p className="os-empty">Add something above, or select a layer to make it yours.</p> : <>
            {selected.locked ? <p className="os-note">This layer is locked. Unlock it in Layers to edit.</p> : null}
            <fieldset disabled={selected.locked} className="os-edit-fields">
              {selected.type === "text" ? <>
                <label className="os-hidden" htmlFor={`${uid}-text`}>Your text</label>
                <textarea id={`${uid}-text`} data-studio-text-input ref={textRef} className="os-textarea" value={selected.text} rows={3} maxLength={400} onFocus={studio.beginInteraction} onBlur={studio.endInteraction} onChange={(event) => studio.updateSelected({ text: event.target.value } as Partial<TextElement>)} />
                <div className="os-font-row"><label className="os-hidden" htmlFor={`${uid}-font`}>Font family</label><select id={`${uid}-font`} className="os-input" value={selected.fontFamily} onChange={(event) => studio.updateSelected({ fontFamily: event.target.value } as Partial<TextElement>)}>{!FONT_OPTIONS.some((font) => font.value === selected.fontFamily) ? <option value={selected.fontFamily}>Current font</option> : null}{FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select>{(["bold", "italic", "underline"] as const).map((style) => <button type="button" key={style} className="os-format-button" aria-label={style} aria-pressed={selected[style]} onClick={() => studio.updateSelected({ [style]: !selected[style] } as Partial<TextElement>)} style={{ fontWeight: style === "bold" ? 700 : 400, fontStyle: style === "italic" ? "italic" : "normal", textDecoration: style === "underline" ? "underline" : "none" }}>{style[0].toUpperCase()}</button>)}</div>
                <Range label="Text size" value={selected.fontSize} min={20} max={300} step={1} display={`${Math.round(selected.fontSize)}`} onChange={(value) => studio.updateSelected({ fontSize: value } as Partial<TextElement>)} gesture={gesture} />
              </> : null}
              {selected.type === "shape" ? <><label className="os-field"><span>Shape</span><select className="os-input" value={selected.shape} onChange={(event) => studio.updateSelected({ shape: event.target.value as ShapeElement["shape"] } as Partial<ShapeElement>)}><option value="rect">Rectangle</option><option value="ellipse">Ellipse</option><option value="triangle">Triangle</option><option value="line">Line</option></select></label><div className="os-transform-grid"><NumberField label="Width" value={selected.width} min={10} max={1200} onChange={(value) => studio.updateSelected({ width: value } as Partial<ShapeElement>)} gesture={gesture} /><NumberField label={selected.shape === "line" ? "Thickness" : "Height"} value={selected.height} min={2} max={selected.shape === "line" ? 80 : 1500} onChange={(value) => studio.updateSelected({ height: value } as Partial<ShapeElement>)} gesture={gesture} /></div>{selected.shape !== "line" ? <button type="button" className="os-small-button" aria-pressed={selected.strokeOnly} onClick={() => studio.updateSelected({ strokeOnly: !selected.strokeOnly } as Partial<ShapeElement>)}>{selected.strokeOnly ? "Outline only ✓" : "Make outline only"}</button> : null}</> : null}
              {selectedColor ? <ColorChoices value={selectedColor} onChange={setInk} label="Artwork colour" gesture={gesture} /> : null}
              {selected.type === "text" ? <div className="os-alignment" aria-label="Text alignment">{(["left", "center", "right"] as const).map((alignment) => <button type="button" key={alignment} className="os-format-button" aria-label={`Align text ${alignment}`} aria-pressed={selected.align === alignment} onClick={() => studio.updateSelected({ align: alignment } as Partial<TextElement>)}><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M2 3h14M2 9h14M2 15h14" /><path d={alignment === "left" ? "M2 6h9M2 12h9" : alignment === "right" ? "M7 6h9M7 12h9" : "M4.5 6h9M4.5 12h9"} /></svg></button>)}</div> : null}
              {selected.type === "image" ? <p className="os-note">Drag to position. Use the corner handle to resize, or fine-tune below. Your original file is not stored on a server.</p> : null}
              {selected.type === "sticker" || selected.type === "template" || selected.type === "drawing" ? <p className="os-note">Drag to position, then resize or rotate with the canvas handles. Fine-tune in Placement below.</p> : null}
            </fieldset>
            <div className="os-action-row"><button type="button" className="os-small-button" onClick={studio.duplicateSelected}><PanelIcon name="duplicate" /> Duplicate</button><button type="button" className="os-small-button" disabled={selected.locked} onClick={studio.deleteSelected}><PanelIcon name="delete" /> Delete</button></div>
          </>}
        </div>
      </details>

      {selected ? <details className="os-settings"><summary className="os-settings-title"><span>Placement &amp; fine-tuning</span><span aria-hidden="true">⌄</span></summary><fieldset className="os-settings-body" disabled={selected.locked}>
        <Range label="Scale" value={selected.scale} min={0.1} max={4} step={0.05} display={`${selected.scale.toFixed(2)}×`} onChange={(value) => studio.updateSelected({ scale: value })} gesture={gesture} />
        <Range label="Rotation" value={selected.rotation} min={-180} max={180} step={1} display={`${Math.round(selected.rotation)}°`} onChange={(value) => studio.updateSelected({ rotation: value })} gesture={gesture} />
        <Range label="Opacity" value={selected.opacity} min={0.05} max={1} step={0.05} display={`${Math.round(selected.opacity * 100)}%`} onChange={(value) => studio.updateSelected({ opacity: value })} gesture={gesture} />
        <div className="os-transform-grid"><NumberField label="Horizontal position" value={Math.round(selected.x)} min={-1200} max={2400} onChange={(value) => studio.updateSelected({ x: value })} gesture={gesture} /><NumberField label="Vertical position" value={Math.round(selected.y)} min={-1500} max={3000} onChange={(value) => studio.updateSelected({ y: value })} gesture={gesture} /></div>
        {selected.type === "text" ? <Range label="Letter spacing" value={selected.letterSpacing} min={-5} max={25} step={0.5} display={`${selected.letterSpacing}px`} onChange={(value) => studio.updateSelected({ letterSpacing: value } as Partial<TextElement>)} gesture={gesture} /> : null}
        <label className="os-field"><span>Move artwork to another view</span><select className="os-input" value={selected.side} onChange={(event) => { const side = event.target.value as DesignSide; studio.updateSelected({ side }); studio.setActiveSide(side); }}>{(["front", "back", "left", "right"] as const).map((side) => <option key={side} value={side}>{side[0].toUpperCase() + side.slice(1)}</option>)}</select></label>
        <p className="os-note">Positions use a 1200 × 1500 design canvas, not physical print dimensions.</p>
      </fieldset></details> : null}

      <details className="os-settings" open><summary className="os-settings-title"><PanelIcon name="layers" /><span>Layers <small>({layers.length})</small></span><span aria-hidden="true">⌃</span></summary>
        <ul className="os-layer-list">{layers.map((element, index) => <li key={element.id} className="os-layer-row" data-selected={element.id === studio.selectedId}>
          <button type="button" className="os-layer-action" aria-label={`${element.visible ? "Hide" : "Show"} ${layerLabel(element)}`} title={element.visible ? "Hide layer" : "Show layer"} onClick={() => studio.updateSelectedOn(element.id, { visible: !element.visible })}><PanelIcon name={element.visible ? "eye" : "hidden"} /></button>
          <button type="button" className="os-layer-select" aria-pressed={element.id === studio.selectedId} onClick={() => { studio.setTool("select"); studio.select(element.id); }}><span>{layerLabel(element)}</span><small>{element.type}</small></button>
          <button type="button" className="os-layer-action" aria-label={`${element.locked ? "Unlock" : "Lock"} ${layerLabel(element)}`} title={element.locked ? "Unlock layer" : "Lock layer"} onClick={() => studio.updateSelectedOn(element.id, { locked: !element.locked })}><PanelIcon name={element.locked ? "lock" : "unlock"} /></button>
          <div className="os-layer-order"><button type="button" className="os-layer-action" disabled={index === 0 || element.locked} aria-label={`Bring ${layerLabel(element)} forward`} onClick={() => studio.reorder(element.id, "up")}>↑</button><button type="button" className="os-layer-action" disabled={index === layers.length - 1 || element.locked} aria-label={`Send ${layerLabel(element)} backward`} onClick={() => studio.reorder(element.id, "down")}>↓</button></div>
        </li>)}{layers.length === 0 ? <li className="os-empty">A fresh canvas. Add your first idea.</li> : null}</ul>
      </details>
    </div>
  );
}

type GestureProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, "onFocus" | "onPointerDown" | "onPointerUp" | "onPointerCancel" | "onBlur">;

function Range({ label, value, min, max, step, display, onChange, gesture }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void; gesture?: GestureProps }) {
  return <label className="os-field os-range"><span>{label}<output>{display}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} {...gesture} /></label>;
}

function NumberField({ label, value, min, max, onChange, gesture }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void; gesture?: GestureProps }) {
  return <label className="os-field"><span>{label}</span><input className="os-input" type="number" value={value} min={min} max={max} step={1} onChange={(event) => { const next = event.target.valueAsNumber; if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next))); }} {...gesture} /></label>;
}

function ColorChoices({ value, onChange, label, gesture }: { value: string; onChange: (color: string) => void; label: string; gesture?: GestureProps }) {
  return <div className="os-color-row" role="group" aria-label={label}>{INK_COLORS.map((color) => <button type="button" className="os-swatch" key={color} style={{ backgroundColor: color }} aria-label={`${label}: ${color}`} aria-pressed={value.toLowerCase() === color.toLowerCase()} onClick={() => onChange(color)} />)}<label className="os-custom-color" title={`Custom ${label.toLowerCase()}`}><input type="color" aria-label={`Custom ${label.toLowerCase()}`} value={/^#[a-f0-9]{6}$/i.test(value) ? value : "#161616"} onChange={(event) => onChange(event.target.value)} {...gesture} /><span aria-hidden="true">+</span></label></div>;
}

function ToolButton({ label, icon, active = false, disabled = false, onClick }: { label: string; icon: PanelIconName; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" className="os-tool-button" aria-pressed={active} disabled={disabled} onClick={onClick}><PanelIcon name={icon} /><span>{label}</span></button>;
}

function layerLabel(element: DesignElement) {
  switch (element.type) {
    case "text": return element.text.replace(/\n/g, " ").trim() || "Untitled text";
    case "sticker": return STICKERS.find((sticker) => sticker.id === element.stickerId)?.name ?? "Sticker";
    case "template": return TEMPLATES.find((template) => template.id === element.templateId)?.name ?? "Template";
    case "image": return "Your image";
    case "drawing": return "Freehand drawing";
    case "shape": return element.shape === "rect" ? "Rectangle" : element.shape[0].toUpperCase() + element.shape.slice(1);
  }
}

/** Keep a bounded, durable local copy; never persist a revoked object URL. */
export async function prepareOwnitEditorUpload(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPEG or WebP image. SVG and animated formats are not supported.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Please choose an image smaller than 8 MB.");
  if (file.size === 0) throw new Error("This image is empty. Please choose another file.");
  await checkRasterDimensions(file);
  const editorBlob = await createEditorImage(file, { maxDimension: 1600, maxPixels: 2_560_000, quality: 0.86 });
  return { original: file, editorBlob };
}

/** Inspect bounded compressed bytes before asking the browser to allocate pixels. */
async function checkRasterDimensions(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const tag = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  const uint24 = (offset: number) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
  let width = 0;
  let height = 0;
  if (bytes.length >= 24 && bytes[0] === 0x89 && tag(1) === "PNG\r" && tag(12) === "IHDR") {
    width = view.getUint32(16);
    height = view.getUint32(20);
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (tag(offset + 4) === "acTL") throw new Error("Please use a still image, not an animated PNG.");
      if (tag(offset + 4) === "IDAT") break;
      offset += size + 12;
    }
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda || offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (bytes.length >= 30 && tag(0) === "RIFF" && tag(8) === "WEBP") {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + 4, true);
      const start = offset + 8;
      if (start + size > bytes.length) break;
      if (tag(offset) === "VP8X" && size >= 10) {
        if (bytes[start] & 2) throw new Error("Please use a still image, not an animated WebP.");
        width = uint24(start + 4) + 1;
        height = uint24(start + 7) + 1;
        break;
      }
      if (tag(offset) === "VP8 " && size >= 10) {
        width = view.getUint16(start + 6, true) & 0x3fff;
        height = view.getUint16(start + 8, true) & 0x3fff;
        break;
      }
      if (tag(offset) === "VP8L" && size >= 5) {
        const dimensions = view.getUint32(start + 1, true);
        width = (dimensions & 0x3fff) + 1;
        height = ((dimensions >>> 14) & 0x3fff) + 1;
        break;
      }
      offset = start + size + (size % 2);
    }
  }
  if (!width || !height) throw new Error("This file is not a readable PNG, JPEG or WebP. Please choose another image.");
  if (width > 16000 || height > 16000 || width * height > 40_000_000) throw new Error("This image is too large to edit smoothly. Please resize it to less than 40 megapixels before uploading.");
}
