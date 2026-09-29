"use client";

import { useRef, useState } from "react";
import { STICKERS, TEMPLATES } from "@/lib/design";
import type { TextElement } from "@/lib/design";
import type { StudioApi, ToolMode } from "./use-studio";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createEditorImage } from "@/lib/editor-assets";
import { validateEditorUpload } from "@/lib/editor-upload-policy";

const FONT_OPTIONS = [
  { label: "Bebas Display", value: "'Bebas Neue', Impact, sans-serif" },
  { label: "Serif Classic", value: "Georgia, 'Times New Roman', serif" },
  { label: "Clean Sans", value: "Helvetica, Arial, sans-serif" },
  { label: "Mono Note", value: "'Courier New', monospace" },
];

const INK_COLORS = ["#f5f2ea", "#111111", "#e0245e", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#a855f7"];

export function DesignPanel({ studio }: { studio: StudioApi }) {
  const [tool, setTool] = useState<ToolMode>("select");
  const [openSection, setOpenSection] = useState<"text" | "layers" | null>("text");
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = studio.selected;
  const isText = selected?.type === "text";

  function useTool(t: ToolMode) {
    setTool(t);
    studio.setTool(t);
    if (t === "text") {
      studio.addText();
      studio.select(null);
      setTool("select");
      studio.setTool("select");
    }
  }

  async function onUpload(file: File) {
    const validation = validateEditorUpload(file);
    if (!validation.ok) {
      alert(validation.reason);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      if (Math.max(img.naturalWidth, img.naturalHeight) < 600) {
        const proceed = window.confirm(
          "Your image may appear soft when printed. Try uploading a higher-resolution version — or continue anyway?"
        );
        if (!proceed) {
          URL.revokeObjectURL(url);
          return;
        }
      }
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/uploads/artwork", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        studio.addImage(data.url, img.naturalWidth, img.naturalHeight);
      } catch {
        // Offline or API hiccup: fall back to the local blob so work isn't lost.
        studio.addImage(url, img.naturalWidth, img.naturalHeight);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tool grid */}
      <div className="border-b border-line p-5">
        <div className="grid grid-cols-3 gap-2">
          <ToolButton label="Add Text" icon="T" active={tool === "text"} onClick={() => useTool("text")} />
          <ToolButton label="Upload" icon="↑" onClick={() => fileRef.current?.click()} />
          <ToolButton label="Draw" icon="✎" active={tool === "draw"} onClick={() => useTool(tool === "draw" ? "select" : "draw")} />
          <ToolButton label="Shapes" icon="◇" onClick={() => { studio.addShape("rect"); }} />
          <ToolButton label="Ellipse" icon="○" onClick={() => { studio.addShape("ellipse"); }} />
          <ToolButton label="Stickers" icon="✦" onClick={() => setOpenSection(openSection === "text" ? "text" : "text")} />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onUpload(f);
            e.target.value = "";
          }}
        />

        {/* Stickers row */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STICKERS.map((s) => (
            <button
              key={s.id}
              title={s.name}
              onClick={() => studio.addSticker(s.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ivory transition hover:border-mute"
            >
              <span className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: s.svg }} />
            </button>
          ))}
        </div>

        {/* Templates row */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => studio.addTemplate(t.id, studio.state.colorHex)}
              className="rounded-lg border border-line px-2.5 py-2 text-left text-[0.625rem] text-mute transition hover:border-mute hover:text-ivory"
            >
              ✦ {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Text settings */}
        <section className="rounded-xl border border-line">
          <button
            onClick={() => setOpenSection(openSection === "text" ? null : "text")}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold"
            aria-expanded={openSection === "text"}
          >
            <span className="flex items-center gap-2">T Text Settings</span>
            <span className="text-faint">{openSection === "text" ? "⌃" : "⌄"}</span>
          </button>
          {openSection === "text" ? (
            <div className="space-y-4 border-t border-line p-4">
              {isText ? (
                <>
                  <textarea
                    value={(selected as TextElement).text}
                    onChange={(e) => studio.updateSelected({ text: e.target.value } as Partial<TextElement>)}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-line bg-coal px-3 py-2 text-sm text-ivory focus:border-mute focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={(selected as TextElement).fontFamily}
                      onChange={(e) => studio.updateSelected({ fontFamily: e.target.value } as Partial<TextElement>)}
                      className="h-9 flex-1 rounded-lg border border-line bg-coal px-2 text-xs text-ivory"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    {(["bold", "italic", "underline"] as const).map((prop) => (
                      <button
                        key={prop}
                        onClick={() => studio.updateSelected({ [prop]: !(selected as TextElement)[prop] } as Partial<TextElement>)}
                        className={cn(
                          "h-9 w-9 rounded-lg border text-xs",
                          (selected as TextElement)[prop] ? "border-ivory bg-ivory text-ink" : "border-line text-mute hover:border-mute"
                        )}
                      >
                        {prop === "bold" ? "B" : prop === "italic" ? "I" : "U"}
                      </button>
                    ))}
                  </div>
                  <label className="block space-y-1.5">
                    <span className="flex justify-between text-[0.625rem] text-mute"><span>Size</span><span>{(selected as TextElement).fontSize}px</span></span>
                    <input
                      type="range"
                      min={24}
                      max={320}
                      value={(selected as TextElement).fontSize}
                      onChange={(e) => studio.updateSelected({ fontSize: Number(e.target.value) } as Partial<TextElement>)}
                      className="w-full accent-white"
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INK_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => studio.updateSelected({ color: c } as Partial<TextElement>)}
                        aria-label={`Ink ${c}`}
                        className={cn(
                          "h-7 w-7 rounded-full border-2",
                          (selected as TextElement).color === c ? "border-ivory" : "border-line2"
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => studio.updateSelected({ align: a } as Partial<TextElement>)}
                        className={cn(
                          "h-8 flex-1 rounded-lg border text-[0.625rem]",
                          (selected as TextElement).align === a ? "border-ivory text-ivory" : "border-line text-mute"
                        )}
                      >
                        {a.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-faint">Add or select a text element to edit it.</p>
              )}
            </div>
          ) : null}
        </section>

        {/* Transform */}
        {selected ? (
          <section className="rounded-xl border border-line p-4">
            <p className="mb-3 text-xs font-semibold">Transform</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="flex justify-between text-[0.625rem] text-mute"><span>Scale</span><span>{selected.scale.toFixed(2)}×</span></span>
                <input type="range" min={0.1} max={3} step={0.05} value={selected.scale} onChange={(e) => studio.updateSelected({ scale: Number(e.target.value) })} className="w-full accent-white" />
              </label>
              <label className="space-y-1">
                <span className="flex justify-between text-[0.625rem] text-mute"><span>Rotate</span><span>{Math.round(selected.rotation)}°</span></span>
                <input type="range" min={-180} max={180} value={selected.rotation} onChange={(e) => studio.updateSelected({ rotation: Number(e.target.value) })} className="w-full accent-white" />
              </label>
              <label className="space-y-1">
                <span className="flex justify-between text-[0.625rem] text-mute"><span>Opacity</span><span>{Math.round(selected.opacity * 100)}%</span></span>
                <input type="range" min={0.05} max={1} step={0.05} value={selected.opacity} onChange={(e) => studio.updateSelected({ opacity: Number(e.target.value) })} className="w-full accent-white" />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={studio.duplicateSelected} className="flex-1">Duplicate</Button>
              <Button size="sm" variant="danger" onClick={studio.deleteSelected} className="flex-1">Delete</Button>
            </div>
          </section>
        ) : null}

        {/* Layers */}
        <section className="rounded-xl border border-line">
          <button
            onClick={() => setOpenSection(openSection === "layers" ? null : "layers")}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold"
            aria-expanded={openSection === "layers"}
          >
            <span>Layers ({studio.state.elements.filter((e) => e.side === studio.activeSide).length})</span>
            <span className="text-faint">{openSection === "layers" ? "⌃" : "⌄"}</span>
          </button>
          {openSection === "layers" ? (
            <ul className="divide-y divide-line border-t border-line">
              {studio.state.elements
                .filter((e) => e.side === studio.activeSide)
                .sort((a, b) => b.z - a.z)
                .map((el) => (
                  <li key={el.id} className={cn("flex items-center gap-2 px-4 py-2.5", el.id === studio.selectedId ? "bg-white/5" : "")}>
                    <button
                      onClick={() => studio.updateSelectedOn(el.id, { visible: !el.visible })}
                      aria-label={el.visible ? "Hide layer" : "Show layer"}
                      className="text-mute hover:text-ivory"
                    >
                      {el.visible ? "◉" : "○"}
                    </button>
                    <button onClick={() => studio.select(el.id)} className="flex-1 truncate text-left text-xs text-ivory">
                      {layerLabel(el)}
                    </button>
                    <span className="text-[0.625rem] text-faint">{el.type}</span>
                    <div className="flex">
                      <button onClick={() => studio.reorder(el.id, "up")} aria-label="Bring forward" className="px-1 text-mute hover:text-ivory">↑</button>
                      <button onClick={() => studio.reorder(el.id, "down")} aria-label="Send backward" className="px-1 text-mute hover:text-ivory">↓</button>
                    </div>
                  </li>
                ))}
              {studio.state.elements.filter((e) => e.side === studio.activeSide).length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-faint">No layers on this side yet.</li>
              ) : null}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ToolButton({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-[0.625rem] transition",
        active ? "border-ivory bg-white/5 text-ivory" : "border-line text-mute hover:border-mute hover:text-ivory"
      )}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

function layerLabel(el: { type: string; text?: string; stickerId?: string; templateId?: string; shape?: string }) {
  switch (el.type) {
    case "text":
      return el.text?.split("\n")[0] || "Text";
    case "sticker":
      return STICKERS.find((s) => s.id === el.stickerId)?.name ?? "Sticker";
    case "template":
      return TEMPLATES.find((t) => t.id === el.templateId)?.name ?? "Template";
    case "image":
      return "Image";
    case "drawing":
      return "Drawing";
    default:
      return el.shape ?? "Shape";
  }
}

// OWNIT PASS 7: shared upload preparation.
// Call this before handing a selected File to the existing upload flow.
export async function prepareOwnitEditorUpload(file: File) {
  const validation = validateEditorUpload(file);
  if (!validation.ok) throw new Error(validation.reason);
  const editorBlob = await createEditorImage(file);
  return { original: file, editorBlob };
}
