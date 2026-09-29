"use client";

import { useId, type ReactNode, type PointerEvent } from "react";
import { stickerById, templateById, type DesignElement, type DesignSide, type DesignState } from "@/lib/design";
import type { CatalogProduct } from "./catalog-type";

export const ARTBOARD_WIDTH = 1200;
export const ARTBOARD_HEIGHT = 1500;
export type ElementBounds = { x: number; y: number; width: number; height: number };

/** A stable approximate hit target; selection uses the SVG's measured ink bounds. */
export function elementBounds(element: DesignElement): ElementBounds {
  if (element.type === "text") {
    const lines = element.text.split("\n");
    const width = Math.max(40, ...lines.map((line) => line.length * (element.fontSize * 0.62 + element.letterSpacing)));
    return { x: element.align === "center" ? -width / 2 : element.align === "right" ? -width : 0, y: -element.fontSize * 0.1, width, height: Math.max(element.fontSize, lines.length * element.fontSize * 1.16) };
  }
  if (element.type === "drawing") return { x: -10, y: -10, width: Math.max(20, element.width + 20), height: Math.max(20, element.height + 20) };
  if (element.type === "template") {
    const template = templateById(element.templateId);
    return { x: -element.size / 2, y: 0, width: element.size, height: (template?.lines.reduce((height, line) => height + line.size * 1.16, 0) ?? 220) * element.size / 600 };
  }
  const width = element.type === "sticker" ? element.size : element.width;
  const height = element.type === "sticker" ? element.size : element.height;
  return { x: -width / 2, y: -height / 2, width: Math.max(width, 10), height: Math.max(height, 10) };
}

export function elementTransform(element: Pick<DesignElement, "x" | "y" | "rotation" | "scale">) {
  return `translate(${element.x} ${element.y}) rotate(${element.rotation}) scale(${element.scale})`;
}

export function pathForPoints(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function ElementInk({ element }: { element: DesignElement }) {
  switch (element.type) {
    case "text": return <text fill={element.color} fontFamily={element.fontFamily} fontSize={element.fontSize} fontWeight={element.bold ? 700 : 400} fontStyle={element.italic ? "italic" : "normal"} textDecoration={element.underline ? "underline" : undefined} textAnchor={element.align === "center" ? "middle" : element.align === "right" ? "end" : "start"} letterSpacing={element.letterSpacing} style={{ whiteSpace: "pre" }}>
      {element.text.split("\n").map((line, index) => <tspan key={index} x="0" y={element.fontSize * (0.84 + index * 1.16)}>{line || "\u00a0"}</tspan>)}
    </text>;
    case "image": return <svg x={-element.width / 2} y={-element.height / 2} width={element.width} height={element.height} viewBox={element.crop ? `${element.crop.x} ${element.crop.y} ${element.crop.w} ${element.crop.h}` : `0 0 ${element.width} ${element.height}`} overflow="hidden" preserveAspectRatio="none"><image href={element.url} width={element.width} height={element.height} preserveAspectRatio="none" /></svg>;
    case "drawing": return <g fill="none" strokeLinecap="round" strokeLinejoin="round">{element.strokes.map((stroke, index) => <path key={index} d={pathForPoints(stroke.points)} stroke={stroke.color} strokeWidth={stroke.width} />)}</g>;
    case "shape": {
      const props = { fill: element.strokeOnly || element.shape === "line" ? "none" : element.color, stroke: element.strokeOnly || element.shape === "line" ? element.color : "none", strokeWidth: 6 };
      if (element.shape === "ellipse") return <ellipse rx={element.width / 2} ry={element.height / 2} {...props} />;
      if (element.shape === "triangle") return <path d={`M0 ${-element.height / 2}L${element.width / 2} ${element.height / 2}L${-element.width / 2} ${element.height / 2}Z`} {...props} />;
      if (element.shape === "line") return <line x1={-element.width / 2} x2={element.width / 2} {...props} strokeLinecap="round" />;
      return <rect x={-element.width / 2} y={-element.height / 2} width={element.width} height={element.height} rx="3" {...props} />;
    }
    case "sticker": {
      const sticker = stickerById(element.stickerId);
      return sticker ? <image href={`data:image/svg+xml,${encodeURIComponent(sticker.svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/currentColor/g, "#171a1a"))}`} x={-element.size / 2} y={-element.size / 2} width={element.size} height={element.size} /> : null;
    }
    case "template": {
      const template = templateById(element.templateId);
      if (!template) return null;
      let top = 0;
      return <g transform={`scale(${element.size / 600})`}>{template.lines.map((line, index) => {
        const y = top + line.size * 0.84;
        top += line.size * 1.16;
        return <text key={index} y={y} fontFamily={template.fontFamily} fontSize={line.size} fontWeight={line.bold ? 700 : 400} fill={template.color} textAnchor={line.align === "left" ? "start" : line.align === "right" ? "end" : "middle"}>{line.text}</text>;
      })}</g>;
    }
  }
}

export function isPhotographicTshirt(product?: CatalogProduct | null) {
  if (!product) return true;
  return /t-shirt|tshirt|tee/i.test(`${product.silhouette} ${product.categoryName} ${product.slug}`);
}

function TshirtAtlas({ side, filter }: { side: DesignSide; filter?: string }) {
  const x = side === "back" || side === "right" ? 1000 : 0;
  const y = side === "left" || side === "right" ? 1000 : 0;
  return <svg x="0" y="90" width="1200" height="1200" viewBox={`${x} ${y} 1000 1000`} overflow="hidden"><image href="/img/studio/tshirt-views.png" x="0" y="0" width="2000" height="2000" filter={filter} /></svg>;
}

/** Alternative categories intentionally use flat templates, not misleading product photos. */
function GarmentTemplate({ product, side, fill, outline = true }: { product?: CatalogProduct | null; side: DesignSide; fill: string; outline?: boolean }) {
  const category = `${product?.silhouette ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
  const profile = side === "left" || side === "right";
  const flip = side === "right" ? "translate(1200 0) scale(-1 1)" : undefined;
  const stroke = outline ? "rgba(0,0,0,.28)" : "none";
  const seam = outline ? "rgba(0,0,0,.18)" : "none";
  if (/bag/.test(category)) return <g transform={flip} fill={fill} stroke={stroke} strokeWidth="6">
    <path d={profile ? "M525 510L710 535L760 1270L500 1280Z" : "M270 510L930 510L995 1275Q600 1320 205 1275Z"} />
    <path d={profile ? "M575 565V340Q600 205 665 345L675 570" : "M390 550V340Q600 140 810 340V550"} fill="none" stroke={outline ? fill : "white"} strokeWidth="60" />
    {outline && <path d="M280 1220Q600 1260 920 1220" fill="none" stroke={seam} />}
  </g>;
  if (/cap/.test(category)) return <g transform={flip} fill={fill} stroke={stroke} strokeWidth="6">
    <path d={profile ? "M390 880Q365 405 720 450Q950 505 950 895L350 990L170 960Z" : "M265 960Q235 390 600 365Q965 390 935 960L1080 1070Q615 1240 120 1070Z"} />
    {outline && <path d={profile ? "M450 855Q680 775 940 895M720 460Q700 645 780 850" : "M265 960Q600 820 935 960M600 380L600 865M415 465Q390 665 400 900M785 465Q810 665 800 900"} fill="none" stroke={seam} />}
  </g>;
  const hoodie = /hood/.test(category);
  const jacket = /jacket/.test(category);
  const jersey = /jersey/.test(category);
  const path = profile ? "M465 260Q590 230 710 280L760 550L825 1140L725 1190L660 760L710 1310L455 1300L480 650L365 1060L280 1000L395 435Z" : hoodie || jacket ? "M430 240L285 305L105 1070L245 1125L360 665L330 1280Q600 1340 870 1280L840 665L955 1125L1095 1070L915 305L770 240Q600 335 430 240Z" : "M430 270L260 330L100 630L280 735L365 585L335 1280Q600 1315 865 1280L835 585L920 735L1100 630L940 330L770 270Q600 355 430 270Z";
  return <g transform={flip} fill={fill} stroke={stroke} strokeWidth="5">
    <path d={path} />
    {hoodie && <path d={profile ? "M465 290Q450 75 650 155Q760 205 710 330Z" : "M420 280Q390 60 600 95Q810 60 780 280Q600 370 420 280Z"} />}
    {outline && <g fill="none" stroke={seam}>
      <path d={profile ? "M495 470Q550 680 535 1100M480 1240L695 1250" : "M385 625L375 1205M815 625L825 1205M345 1230Q600 1290 855 1230"} />
      {side === "front" && hoodie && <><path d="M455 985L405 1175Q600 1210 795 1175L745 985Z" /><path d="M555 315L540 600M645 315L660 600" strokeWidth="9" /></>}
      {jacket && side === "front" && <><path d="M600 340V1290M405 610H515V755H405ZM685 610H795V755H685Z" /><path d="M430 240L500 420L600 330L700 420L770 240" /></>}
      {!hoodie && !profile && <path d={side === "back" ? "M435 275Q600 330 765 275" : "M435 275Q600 410 765 275"} strokeWidth={jersey ? 16 : 9} />}
      {jersey && !profile && <path d="M125 608L290 700M1075 608L910 700" strokeWidth="16" />}
    </g>}
  </g>;
}

interface SceneProps {
  state: DesignState;
  side: DesignSide;
  product?: CatalogProduct | null;
  onElementPointerDown?: (event: PointerEvent<SVGGElement>, element: DesignElement) => void;
  onElementDoubleClick?: (element: DesignElement) => void;
  elementRef?: (id: string, node: SVGGElement | null) => void;
  children?: ReactNode;
}

export function GarmentScene({ state, side, product, onElementPointerDown, onElementDoubleClick, elementRef, children }: SceneProps) {
  const uid = useId().replace(/:/g, "");
  const maskId = `garment-mask-${uid}`;
  const tintId = `garment-tint-${uid}`;
  const gradientId = `garment-shade-${uid}`;
  const hex = /^#[\da-f]{6}$/i.test(state.colorHex) ? state.colorHex : "#eae5da";
  const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const photographic = isPhotographicTshirt(product);
  const apparel = !/bag|cap/i.test(`${product?.silhouette ?? ""} ${product?.categoryName ?? ""}`);
  const fitTransform = apparel && state.fit === "regular" ? "translate(600 0) scale(.94 1) translate(-600 0)" : undefined;
  const garment = (isMask: boolean) => photographic ? <TshirtAtlas side={side} filter={isMask ? undefined : `url(#${tintId})`} /> : <GarmentTemplate product={product} side={side} fill={isMask ? "white" : `url(#${gradientId})`} outline={!isMask} />;
  return <>
    <defs>
      <filter id={tintId} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="linear" slope={rgb[0]} /><feFuncG type="linear" slope={rgb[1]} /><feFuncB type="linear" slope={rgb[2]} /></feComponentTransfer></filter>
      <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2=".6"><stop stopColor={hex} /><stop offset=".38" stopColor={hex} /><stop offset=".65" stopColor={hex} stopOpacity=".72" /><stop offset="1" stopColor={hex} /></linearGradient>
      <mask id={maskId} x="0" y="0" width={ARTBOARD_WIDTH} height={ARTBOARD_HEIGHT} maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}><g transform={fitTransform}>{garment(true)}</g></mask>
    </defs>
    <g transform={fitTransform} pointerEvents="none">{garment(false)}</g>
    <g mask={`url(#${maskId})`}>
      {state.elements.filter((element) => element.visible && element.side === side).sort((a, b) => a.z - b.z).map((element) => {
        const bounds = elementBounds(element);
        return <g key={element.id} ref={elementRef ? (node) => elementRef(element.id, node) : undefined} data-design-element={element.id} transform={elementTransform(element)} opacity={element.opacity} onPointerDown={onElementPointerDown ? (event) => onElementPointerDown(event, element) : undefined} onDoubleClick={onElementDoubleClick ? () => onElementDoubleClick(element) : undefined} style={{ cursor: onElementPointerDown ? element.locked ? "not-allowed" : "grab" : undefined }}>
          {onElementPointerDown && <rect {...bounds} fill="transparent" pointerEvents="all" />}
          <g data-element-ink="true"><ElementInk element={element} /></g>
        </g>;
      })}
      {children}
    </g>
  </>;
}

export function GarmentPreview({ state, side, product, className }: { state: DesignState; side: DesignSide; product?: CatalogProduct | null; className?: string }) {
  return <svg className={className ?? "os-garment-preview"} viewBox={`0 0 ${ARTBOARD_WIDTH} ${ARTBOARD_HEIGHT}`} role="img" aria-label={`${state.colorName} ${product?.name ?? "T-shirt"}, ${side} concept view`}><GarmentScene state={state} side={side} product={product} /></svg>;
}
