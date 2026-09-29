"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CatalogProduct } from "./catalog-type";
import { useStudio } from "./use-studio";
import { EditorCanvas } from "./editor-canvas";
import { GarmentPreview } from "./garment-preview";
import { ProductPanel } from "./product-panel";
import { DesignPanel } from "./design-panel";
import type { DesignSide } from "@/lib/design";
import { formatMoney } from "@/lib/money";

export interface InitialDesign { id: string; name: string; state: unknown; productId: string }
const SIDES: DesignSide[] = ["front", "back", "left", "right"];
type WorkspaceMode = "design" | "mockups" | "preview";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {name === "arrow" ? <path d="M4 12h16m-6-6 6 6-6 6" /> :
      name === "back" ? <path d="M20 12H4m6-6-6 6 6 6" /> :
      name === "save" ? <path d="M6 3h12v18l-6-4-6 4V3Z" /> :
      name === "undo" ? <><path d="M8 4 3 9l5 5M3 9h10a7 7 0 0 1 0 14" transform="translate(0 -2)" /></> :
      name === "redo" ? <path d="m16 4 5 5-5 5m5-5H11a7 7 0 0 0 0 14" transform="translate(0 -2)" /> :
      name === "reset" ? <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></> :
      name === "zoom" ? <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6m-3-3v6" /></> :
      name === "download" ? <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></> :
      name === "close" ? <path d="m6 6 12 12M18 6 6 18" /> :
      name === "check" ? <path d="m5 12 4 4L19 6" /> :
      <><path d="m12 3 8 5v8l-8 5-8-5V8l8-5Z" /><path d="m4 8 8 5 8-5m-8 5v8" /></>}
  </svg>;
}

export function Studio({ catalog, initialDesign, initialProductSlug }: {
  catalog: CatalogProduct[]; initialDesign: InitialDesign | null; initialProductSlug: string | null;
}) {
  const studio = useStudio({ catalog, initialDesign, initialProductSlug });
  const [mode, setMode] = useState<WorkspaceMode>("design");
  const [zoom, setZoom] = useState(1);
  const [mobilePanel, setMobilePanel] = useState<"product" | "design" | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const product = studio.product;

  useEffect(() => {
    const editText = () => {
      if (window.matchMedia("(max-width: 1100px)").matches) {
        setMobilePanel("design");
        setMode("design");
      }
    };
    window.addEventListener("ownit:edit-text", editText);
    return () => window.removeEventListener("ownit:edit-text", editText);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const el = dialogRef.current;
    if (reviewOpen) el?.showModal(); else el?.close();
  }, [reviewOpen]);
  useEffect(() => {
    const el = mobileDialogRef.current;
    if (mobilePanel) el?.showModal(); else el?.close();
  }, [mobilePanel]);
  useEffect(() => {
    if (!reviewOpen && !mobilePanel) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [reviewOpen, mobilePanel]);

  function saveDraft() {
    const saved = studio.saveLocalDraft();
    setMessage(saved ? "Design saved on this device." : "Could not save on this device. Download your design to keep a copy.");
  }

  function downloadDesign() {
    const document = { format: "ownit-concept", version: 1, name: studio.designName, savedAt: new Date().toISOString(),
      productionStatus: "concept-only", productId: product?.id, productName: product?.name, state: studio.state };
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = (studio.designName.replace(/[^a-z0-9_-]+/gi, "-") || "ownit-design") + ".ownit.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Editable concept downloaded. This is not a print-ready production file.");
  }

  const sidebar = <>
    <div className="os-panel-tabs" role="tablist" aria-label="Studio workspace">
      {(["design", "mockups", "preview"] as WorkspaceMode[]).map((tab, index, tabs) => <button key={tab} role="tab" aria-selected={mode === tab} tabIndex={mode === tab ? 0 : -1}
        onKeyDown={event => {
          const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
          if (next < 0) return;
          event.preventDefault(); setMode(tabs[next]); studio.setTool("select");
          window.document.getElementById(`studio-tab-${tabs[next]}`)?.focus();
        }}
        onClick={() => { setMode(tab); studio.setTool("select"); }} id={`studio-tab-${tab}`} aria-controls="studio-settings">{tab}</button>)}
    </div>
    <div id="studio-settings" role="tabpanel" aria-labelledby={`studio-tab-${mode}`} className="os-settings-scroll">
      {mode === "design" ? <DesignPanel studio={studio} /> : mode === "mockups" ? <div className="os-mockups-panel">
        <p className="os-panel-eyebrow">Every angle. Your story.</p>
        <h2>Four sides.<br />One original.</h2>
        <p>Switch views to work on each side independently.</p>
        <div className="os-mockup-grid">{SIDES.map(side => <button key={side} onClick={() => studio.setActiveSide(side)}
          aria-pressed={studio.activeSide === side} className="os-mockup-card">
          <GarmentPreview state={studio.state} side={side} product={product ?? undefined} /><span>{side}</span>
        </button>)}</div>
        <p className="os-note">Flat 2D mockups. Side artwork is separate; continuous wraparound printing is not simulated.</p>
      </div> : <div className="os-review-panel">
        <span className="os-panel-eyebrow">A little check before you go</span>
        <h2>Made by you.</h2>
        <p>Take a moment to look at every side.</p>
        <dl><div><dt>Canvas</dt><dd>{product?.name}</dd></div><div><dt>Colour</dt><dd><i style={{ background: studio.state.colorHex }} />{studio.state.colorName}</dd></div><div><dt>Fit / size</dt><dd>{studio.state.fit} / {studio.state.size}</dd></div><div><dt>Design elements</dt><dd>{studio.state.elements.filter(e => e.visible).length}</dd></div></dl>
        <div className="os-production-note"><Icon name="cube" /><p><strong>Freedom to explore.</strong>Colours and placements are concept options. Manufacturing availability and final pricing will be confirmed once production is set up.</p></div>
        <button className="os-primary-button" onClick={() => setReviewOpen(true)}>Review all views <Icon name="arrow" /></button>
        <button className="os-secondary-button" onClick={downloadDesign}><Icon name="download" size={16} />Download editable design</button>
      </div>}
    </div>
  </>;

  if (!product) return <div className="os-empty-catalog"><h1>Your studio is almost ready.</h1><p>Add an active product to start designing.</p><Link href="/shop">Back to shop</Link></div>;

  return <div className="ownit-studio">
    <div className="os-workspace">
      <aside className="os-left">
        <Link href="/shop" className="os-back"><Icon name="back" size={17} />Back to shop</Link>
        <div className="os-glass-panel os-product-panel"><ProductPanel studio={studio} /></div>
      </aside>

      <section className="os-stage" aria-label="Clothing design workspace">
        <div className="os-stage-top">
          <div className="os-side-switcher" role="group" aria-label="Garment view">
            {SIDES.map(side => <button key={side} onClick={() => studio.setActiveSide(side)} aria-pressed={studio.activeSide === side}>{side}</button>)}
          </div>
          <div className="os-draft-status"><span />{studio.localSaveStatus}</div>
        </div>
        <div className="os-stage-art">
          <div className="os-orbit os-orbit-one" aria-hidden="true" /><div className="os-orbit os-orbit-two" aria-hidden="true" />
          <div className="os-handwritten os-note-left" aria-hidden="true">Your<br />imagination<br />looks good<br />here.<svg width="67" height="65" viewBox="0 0 67 65" fill="none"><path d="M8 3c-5 24 8 41 42 43m-9-8 11 9-14 6" stroke="currentColor" strokeWidth="1.5" /></svg></div>
          <div className="os-handwritten os-note-right" aria-hidden="true">Move it.<br />Make it.<br />Own it.</div>
          <div className="os-canvas-wrap"><EditorCanvas studio={studio} preview={mode !== "design"} zoom={zoom} /></div>
          <div className="os-view-tools" aria-label="View controls">
            <button onClick={() => setMode(mode === "preview" ? "design" : "preview")} aria-label={mode === "preview" ? "Return to editing" : "Show clean preview"} title="Toggle clean preview"><Icon name="cube" /><span>2D</span></button>
            <button onClick={() => setZoom(z => z === 1 ? 1.35 : 1)} aria-label={zoom === 1 ? "Zoom in" : "Fit garment"} title={zoom === 1 ? "Zoom in" : "Fit garment"}><Icon name="zoom" /><span>{zoom === 1 ? "Zoom" : "Fit"}</span></button>
            <button onClick={() => { setZoom(1); studio.select(null); studio.setTool("select"); setMode("design"); }} aria-label="Reset view" title="Reset view"><Icon name="reset" /><span>Reset</span></button>
          </div>
        </div>
        <div className="os-stage-bottom">
          <div className="os-history">
            <button aria-label="Undo" title="Undo (Ctrl+Z)" onClick={studio.undo} disabled={!studio.canUndo}><Icon name="undo" size={17} /></button>
            <button aria-label="Redo" title="Redo (Ctrl+Shift+Z)" onClick={studio.redo} disabled={!studio.canRedo}><Icon name="redo" size={17} /></button>
          </div>
          <p>{studio.tool === "draw" ? "Draw directly on your canvas" : mode === "design" ? "Select your artwork. Make it yours." : "Your design, without distractions."}</p>
          <span className="os-concept-label">2D concept</span>
        </div>
      </section>

      <aside className="os-right os-glass-panel">{sidebar}</aside>
    </div>

    <div className="os-mobile-tools"><button onClick={() => setMobilePanel("product")}>Product & colour</button><button onClick={() => { setMode("design"); setMobilePanel("design"); }}>Design tools <span>＋</span></button></div>
    <footer className="os-bottom-bar">
      <div className="os-signature"><label htmlFor="studio-design-name">YOUR NEXT ORIGINAL</label><input id="studio-design-name" value={studio.designName} onChange={e => studio.setDesignName(e.target.value)} maxLength={60} aria-label="Design name" /><span>DESIGN IT. OWN IT. WEAR IT.</span></div>
      <div className="os-view-thumbnails" aria-label="View thumbnails">{SIDES.map(side => <button key={side} aria-label={`Show ${side} view`} aria-pressed={studio.activeSide === side} onClick={() => studio.setActiveSide(side)}><GarmentPreview state={studio.state} side={side} product={product} /><span>{side}</span></button>)}</div>
      <div className="os-checkout"><div className="os-price"><strong>{formatMoney(product.basePrice)}<span>+</span></strong><small>Base garment · print price TBD</small></div>
        <button className="os-save-button" aria-label="Save design on this device" title="Save on this device" onClick={saveDraft}><Icon name="save" /></button>
        <button className="os-primary-button" onClick={() => setReviewOpen(true)}>Review design <Icon name="arrow" /></button>
      </div>
    </footer>
    <div className="os-toast" role="status" aria-live="polite" data-visible={!!message && !reviewOpen}>{!reviewOpen && message && <><Icon name="check" size={17} />{message}</>}</div>

    <dialog ref={mobileDialogRef} className="os-mobile-dialog" aria-label={mobilePanel === "product" ? "Product and colour settings" : "Design tools"} onCancel={() => setMobilePanel(null)} onClick={e => { if (e.target === e.currentTarget) setMobilePanel(null); }}>
      <div className="os-mobile-dialog-inner"><div className="os-dialog-heading"><h2>{mobilePanel === "product" ? "Your canvas" : "Your design"}</h2><button aria-label="Close tools" onClick={() => setMobilePanel(null)}><Icon name="close" /></button></div>
        {mobilePanel === "product" ? <ProductPanel studio={studio} /> : mobilePanel === "design" ? <DesignPanel studio={studio} /> : null}
        <button className="os-primary-button os-return-canvas" onClick={() => setMobilePanel(null)}>Back to my canvas <Icon name="arrow" /></button>
      </div>
    </dialog>
    <dialog ref={dialogRef} className="os-review-dialog" aria-label="Review your design" onCancel={() => setReviewOpen(false)} onClick={e => { if (e.target === e.currentTarget) setReviewOpen(false); }}>
      <div className="os-dialog-content"><div className="os-dialog-heading"><div><p className="os-panel-eyebrow">Designed by you</p><h2>{studio.designName}</h2></div><button aria-label="Close design review" onClick={() => setReviewOpen(false)}><Icon name="close" /></button></div>
        <div className="os-review-views">{SIDES.map(side => <div key={side}><GarmentPreview state={studio.state} side={side} product={product} /><span>{side}</span></div>)}</div>
        <p className="os-review-spec">{product.name} <span>·</span> {studio.state.colorName} <span>·</span> {studio.state.fit} <span>·</span> Size {studio.state.size}</p>
        <div className="os-production-note"><Icon name="cube" /><p><strong>This is your creative concept—not a production proof.</strong>Explore any colour and placement. Ordering will become available after garment options, print methods and prices are confirmed with a production partner.</p></div>
        <p className="os-dialog-status" role="status" aria-live="polite">{reviewOpen ? message : ""}</p>
        <div className="os-dialog-actions"><button className="os-secondary-button" onClick={() => { setReviewOpen(false); setMode("design"); }}>Keep creating</button><button className="os-secondary-button" onClick={downloadDesign}><Icon name="download" size={17} />Download design</button><button className="os-primary-button" onClick={saveDraft}><Icon name="save" size={17} />Save on this device</button></div>
      </div>
    </dialog>
  </div>;
}
