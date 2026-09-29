"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { STICKERS, type DesignElement } from "@/lib/design";
import { getSafeCanvasDimensions } from "@/lib/canvas-performance";
import type { StudioApi } from "./use-studio";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH, GarmentScene, elementBounds, elementTransform, pathForPoints, type ElementBounds } from "./garment-preview";

type Point = { x: number; y: number };
type Gesture = { kind: "move" | "scale" | "rotate"; pointerId: number; initial: DesignElement; start: Point; latest: Partial<DesignElement> } | { kind: "draw"; pointerId: number; points: Point[]; color: string; width: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** The pointer loop changes only two SVG nodes; React receives one commit on release. */
export function EditorCanvas({ studio, preview = false, zoom = 1 }: { studio: StudioApi; preview?: boolean; zoom?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const artboardRef = useRef<SVGGElement>(null);
  const selectionRef = useRef<SVGGElement>(null);
  const strokeRef = useRef<SVGPathElement>(null);
  const nodes = useRef(new Map<string, SVGGElement>());
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef<number | null>(null);
  const studioRef = useRef(studio);
  studioRef.current = studio;
  const [bounds, setBounds] = useState<ElementBounds | null>(null);
  const selected = studio.selected?.visible ? studio.selected : null;

  useLayoutEffect(() => {
    if (!selected) { setBounds(null); return; }
    const ink = nodes.current.get(selected.id)?.querySelector<SVGGElement>("[data-element-ink]");
    try {
      const box = ink?.getBBox();
      setBounds(box && box.width > 0 ? { x: box.x - 15, y: box.y - 15, width: Math.max(24, box.width + 30), height: Math.max(24, box.height + 30) } : elementBounds(selected));
    } catch { setBounds(elementBounds(selected)); }
  }, [selected]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (gesture.current && gesture.current.kind !== "draw") studioRef.current.cancelInteraction();
  }, []);

  function point(event: { clientX: number; clientY: number }): Point {
    const matrix = artboardRef.current?.getScreenCTM();
    if (!matrix) return { x: 600, y: 750 };
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }

  function capture(pointerId: number) {
    svgRef.current?.focus({ preventScroll: true });
    svgRef.current?.setPointerCapture(pointerId);
  }

  function beginTransform(event: PointerEvent, element: DesignElement, kind: "move" | "scale" | "rotate") {
    if (preview || event.button !== 0 || studio.tool === "draw") return;
    event.stopPropagation();
    event.preventDefault();
    studio.select(element.id);
    if (element.locked) return;
    studio.beginInteraction();
    gesture.current = { kind, pointerId: event.pointerId, initial: element, start: point(event), latest: {} };
    capture(event.pointerId);
  }

  function beginCanvas(event: PointerEvent<SVGSVGElement>) {
    if (preview || event.button !== 0) return;
    studio.select(null);
    if (studio.tool !== "draw") return;
    event.preventDefault();
    gesture.current = { kind: "draw", pointerId: event.pointerId, points: [point(event)], color: studio.brushColor, width: studio.brushSize };
    if (strokeRef.current) {
      strokeRef.current.setAttribute("stroke", studio.brushColor);
      strokeRef.current.setAttribute("stroke-width", String(studio.brushSize));
      strokeRef.current.setAttribute("d", "");
    }
    capture(event.pointerId);
  }

  function paint() {
    frame.current = null;
    const current = gesture.current;
    if (!current) return;
    if (current.kind === "draw") {
      strokeRef.current?.setAttribute("d", pathForPoints(current.points));
      return;
    }
    const transform = elementTransform({ ...current.initial, ...current.latest });
    nodes.current.get(current.initial.id)?.setAttribute("transform", transform);
    selectionRef.current?.setAttribute("transform", transform);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const at = point(event);
    if (current.kind === "draw") {
      const last = current.points[current.points.length - 1];
      if (Math.hypot(at.x - last.x, at.y - last.y) >= 2 && current.points.length < 5000) current.points.push({ x: clamp(at.x, 0, ARTBOARD_WIDTH), y: clamp(at.y, 0, ARTBOARD_HEIGHT) });
    } else {
      const initial = current.initial;
      if (current.kind === "move") current.latest = { x: Math.round(clamp(initial.x + at.x - current.start.x, 0, ARTBOARD_WIDTH)), y: Math.round(clamp(initial.y + at.y - current.start.y, 0, ARTBOARD_HEIGHT)) };
      if (current.kind === "scale") {
        const initialDistance = Math.hypot(current.start.x - initial.x, current.start.y - initial.y);
        const distance = Math.hypot(at.x - initial.x, at.y - initial.y);
        current.latest = { scale: Math.round(clamp(initial.scale * distance / Math.max(initialDistance, 1), 0.1, 6) * 1000) / 1000 };
      }
      if (current.kind === "rotate") {
        const startAngle = Math.atan2(current.start.y - initial.y, current.start.x - initial.x);
        const angle = Math.atan2(at.y - initial.y, at.x - initial.x);
        let rotation = initial.rotation + (angle - startAngle) * 180 / Math.PI;
        if (event.shiftKey) rotation = Math.round(rotation / 15) * 15;
        current.latest = { rotation: Math.round(((rotation + 540) % 360) - 180) };
      }
    }
    if (frame.current === null) frame.current = requestAnimationFrame(paint);
  }

  function finish(cancelled = false) {
    const current = gesture.current;
    if (!current) return;
    if (frame.current !== null) { cancelAnimationFrame(frame.current); frame.current = null; }
    gesture.current = null;
    if (svgRef.current?.hasPointerCapture(current.pointerId)) svgRef.current.releasePointerCapture(current.pointerId);
    if (current.kind === "draw") {
      strokeRef.current?.setAttribute("d", "");
      if (!cancelled && current.points.length > 1) studio.commitDrawing([{ points: current.points, color: current.color, width: current.width }]);
      return;
    }
    if (cancelled) {
      const transform = elementTransform(current.initial);
      nodes.current.get(current.initial.id)?.setAttribute("transform", transform);
      selectionRef.current?.setAttribute("transform", transform);
      studio.cancelInteraction();
    } else {
      studio.updateSelectedOn(current.initial.id, current.latest);
      studio.endInteraction();
    }
  }

  function keyboard(event: KeyboardEvent<SVGSVGElement>) {
    if (preview) return;
    if (event.key === "Escape") { finish(true); studio.select(null); studio.setTool("select"); return; }
    if (!selected || selected.locked) return;
    const step = event.shiftKey ? 10 : 1;
    const arrows: Record<string, Point> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    const offset = arrows[event.key];
    if (offset) {
      event.preventDefault();
      studio.updateSelected({ x: clamp(selected.x + offset.x, 0, ARTBOARD_WIDTH), y: clamp(selected.y + offset.y, 0, ARTBOARD_HEIGHT) });
    }
  }

  const handleSize = 15 / (selected?.scale ?? 1);
  return <svg ref={svgRef} id="ownit-studio-artboard" className="os-editor-svg" viewBox={`0 125 ${ARTBOARD_WIDTH} 1180`} role="group" aria-label={`${studio.activeSide} garment design canvas. Select artwork, drag to move, or use arrow keys. Resize and rotation handles are available for the selected layer.`} tabIndex={preview ? -1 : 0} onPointerDown={beginCanvas} onPointerMove={move} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onLostPointerCapture={() => { if (gesture.current) finish(true); }} onKeyDown={keyboard} style={{ touchAction: "none", cursor: !preview && studio.tool === "draw" ? "crosshair" : "default", userSelect: "none" }}>
    <g ref={artboardRef} transform={`translate(600 750) scale(${zoom}) translate(-600 -750)`}>
      <GarmentScene state={studio.state} side={studio.activeSide} product={studio.product} elementRef={(id, node) => { if (node) nodes.current.set(id, node); else nodes.current.delete(id); }} onElementPointerDown={preview ? undefined : (event, element) => beginTransform(event, element, "move")} onElementDoubleClick={preview ? undefined : (element) => { if (element.type === "text" && !element.locked) { studio.select(element.id); window.dispatchEvent(new CustomEvent("ownit:edit-text", { detail: { id: element.id } })); } }}>
        <path ref={strokeRef} fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
      </GarmentScene>
      {!preview && studio.tool !== "draw" && selected && bounds && <g ref={selectionRef} transform={elementTransform(selected)}>
        <rect {...bounds} fill="none" stroke={selected.locked ? "#d6b579" : "#f9faf4"} strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray={selected.locked ? "5 4" : undefined} pointerEvents="none" />
        {!selected.locked && <>
          <line x1={bounds.x + bounds.width / 2} x2={bounds.x + bounds.width / 2} y1={bounds.y} y2={bounds.y - 65 / selected.scale} stroke="#f9faf4" strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none" />
          <circle cx={bounds.x + bounds.width / 2} cy={bounds.y - 65 / selected.scale} r={handleSize * 1.25} fill="#f7f7f0" stroke="#252c29" strokeWidth={3 / selected.scale} style={{ cursor: "grab" }} onPointerDown={(event) => beginTransform(event, selected, "rotate")}><title>Rotate artwork. Hold Shift to snap by 15 degrees.</title></circle>
          {[{ x: bounds.x, y: bounds.y }, { x: bounds.x + bounds.width, y: bounds.y }, { x: bounds.x, y: bounds.y + bounds.height }, { x: bounds.x + bounds.width, y: bounds.y + bounds.height }].map((corner, index) => <rect key={index} x={corner.x - handleSize} y={corner.y - handleSize} width={handleSize * 2} height={handleSize * 2} rx={4 / selected.scale} fill="#f7f7f0" stroke="#252c29" strokeWidth={2 / selected.scale} style={{ cursor: index === 0 || index === 3 ? "nwse-resize" : "nesw-resize" }} onPointerDown={(event) => beginTransform(event, selected, "scale")}><title>Resize artwork</title></rect>)}
        </>}
      </g>}
    </g>
  </svg>;
}

export { STICKERS };
export function getEditorCanvasDimensions(width: number, height: number) { return getSafeCanvasDimensions(width, height); }
