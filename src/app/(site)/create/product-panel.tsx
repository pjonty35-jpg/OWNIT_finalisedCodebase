"use client";

import { useId } from "react";
import type { StudioApi } from "./use-studio";
import { GarmentPreview } from "./garment-preview";

const CATEGORY_LABELS: Record<string, string> = {
  "t-shirts": "T-Shirt", hoodies: "Hoodie", jackets: "Jacket",
  jerseys: "Jersey", caps: "Cap", bags: "Tote Bag",
};
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ONE SIZE", "OS"];

export function ProductPanel({ studio }: { studio: StudioApi }) {
  const uid = useId();
  const product = studio.product;
  if (!product) return <p className="os-empty">No garments are available yet.</p>;
  const categories = [...new Set(studio.catalog.map((item) => item.silhouette))];
  const styles = studio.catalog.filter((item) => item.silhouette === product.silhouette);
  const hasFit = !["caps", "bags"].includes(product.silhouette);
  const color = product.colors.find((item) => item.name === studio.state.colorName && item.hex.toLowerCase() === studio.state.colorHex.toLowerCase());
  const sizes = [...new Set((color ? [color] : product.colors).flatMap((item) => item.sizes))].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.toUpperCase());
    const bi = SIZE_ORDER.indexOf(b.toUpperCase());
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi) || a.localeCompare(b);
  });

  return (
    <div className="os-panel-content">
      <section className="os-panel-section" aria-labelledby={`${uid}-product`}>
        <h2 className="os-section-heading" id={`${uid}-product`}>1. Choose Product</h2>
        <div className="os-product-summary"><strong>{CATEGORY_LABELS[product.silhouette] ?? product.categoryName}</strong><span className="os-badge">2D concept</span></div>
        <div className="os-product-grid">
          {categories.map((category) => {
            const item = category === product.silhouette ? product : studio.catalog.find((entry) => entry.silhouette === category)!;
            return (
              <button type="button" key={category} className="os-product-option" aria-pressed={category === product.silhouette} onClick={() => studio.setProductSlug(item.slug)}>
                <span className="os-product-thumb" aria-hidden="true"><GarmentPreview state={{ ...studio.state, elements: [], colorHex: "#e2e0d8", fit: "regular" }} side="front" product={item} /></span>
                <span className="os-product-name">{CATEGORY_LABELS[category] ?? item.categoryName}</span>
              </button>
            );
          })}
        </div>
        {styles.length > 1 ? <label className="os-field" htmlFor={`${uid}-style`}><span>Style</span><select id={`${uid}-style`} className="os-input" value={product.slug} onChange={(event) => studio.setProductSlug(event.target.value)}>{styles.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label> : <p className="os-note">{product.name}</p>}
        <details className="os-disclosure"><summary>Product details</summary><p>{product.subtitle ?? product.name}. The preview is an illustrative blank, not a physical product photograph. Fabric, fit and production options will be confirmed before ordering.</p></details>
      </section>

      {hasFit ? <section className="os-panel-section" aria-labelledby={`${uid}-fit`}>
        <h2 className="os-section-heading" id={`${uid}-fit`}>2. Choose Fit</h2>
        <div className="os-segmented">{(["regular", "oversized"] as const).map((fit) => <button type="button" className="os-choice-button" key={fit} aria-pressed={studio.state.fit === fit} onClick={() => studio.setFit(fit)}>{fit === "regular" ? "Regular" : "Oversized"}</button>)}</div>
        <p className="os-note">Fit is a design preference, subject to garment availability.</p>
      </section> : null}

      <section className="os-panel-section" aria-labelledby={`${uid}-colour`}>
        <h2 className="os-section-heading" id={`${uid}-colour`}>{hasFit ? "3" : "2"}. Choose Colour <span>{studio.state.colorName}</span></h2>
        <div className="os-swatches">
          {product.colors.map((item) => <button type="button" className="os-swatch" key={item.name} title={item.name} aria-label={`Garment colour: ${item.name}`} aria-pressed={item.name === color?.name} style={{ backgroundColor: item.hex }} onClick={() => studio.setColor(item.name)} />)}
          <label className="os-custom-color" title="Choose any garment colour"><input type="color" aria-label="Custom garment colour" value={studio.state.colorHex} onPointerDown={studio.beginInteraction} onBlur={studio.endInteraction} onChange={(event) => studio.setCustomColor(event.target.value)} /><span aria-hidden="true">+</span></label>
        </div>
        <p className="os-note">Any colour, your way. Custom shades are concept-only until sourcing is confirmed.</p>
      </section>

      <section className="os-panel-section" aria-labelledby={`${uid}-size`}>
        <h2 className="os-section-heading" id={`${uid}-size`}>{hasFit ? "4" : "3"}. Choose Size</h2>
        <div className="os-size-grid">{sizes.map((size) => <button type="button" className="os-choice-button" key={size} aria-pressed={studio.state.size === size} onClick={() => studio.setSize(size)}>{size}</button>)}</div>
        {sizes.length === 0 ? <p className="os-note">Sizing will be confirmed when this garment is available.</p> : null}
        <details className="os-disclosure"><summary>Size guide</summary><p>Final measurements depend on the garment supplier. Choose your usual size as a preference for now; OWNIT will publish a verified size chart before orders open.</p></details>
      </section>
      <p className="os-note">Design across all four views. Preview placement is free; print feasibility and final price need a production review.</p>
    </div>
  );
}
