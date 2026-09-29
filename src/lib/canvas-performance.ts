/**
 * OWNIT canvas performance helpers.
 * Keeps mobile canvas backing stores bounded so high-DPR phones/tablets
 * don't allocate enormous pixel buffers.
 */
export function getSafeDevicePixelRatio(maxDpr = 2): number {
  if (typeof window === "undefined") return 1;
  const dpr = window.devicePixelRatio || 1;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  const mobileCap = coarsePointer ? 1.5 : maxDpr;
  return Math.min(dpr, mobileCap);
}

export function getCanvasScale(width: number, height: number, maxPixels = 5_000_000) {
  const pixels = Math.max(1, width * height);
  if (pixels <= maxPixels) return 1;
  return Math.sqrt(maxPixels / pixels);
}


/**
 * Returns safe backing-store dimensions for a logical canvas.
 * The editor should use these values for canvas.width/height while CSS
 * controls the visual size. This prevents high-DPI mobile devices from
 * allocating excessive memory.
 */
export function getSafeCanvasDimensions(
  logicalWidth: number,
  logicalHeight: number,
  maxPixels = 5_000_000,
) {
  const dpr = getSafeDevicePixelRatio();
  const scale = getCanvasScale(
    logicalWidth * dpr,
    logicalHeight * dpr,
    maxPixels,
  );

  return {
    width: Math.max(1, Math.floor(logicalWidth * dpr * scale)),
    height: Math.max(1, Math.floor(logicalHeight * dpr * scale)),
    pixelRatio: dpr * scale,
  };
}


/**
 * Coalesces high-frequency pointer/render requests into one callback per frame.
 * Callers should keep the callback lightweight and avoid serializing the whole design
 * during the interaction itself.
 */
export function createRafScheduler<T>(callback: (value: T) => void) {
  let frame: number | null = null;
  let latest: T | undefined;

  return {
    schedule(value: T) {
      latest = value;
      if (frame !== null || typeof window === "undefined") return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const valueToUse = latest;
        latest = undefined;
        if (valueToUse !== undefined) callback(valueToUse);
      });
    },
    cancel() {
      if (frame !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(frame);
      }
      frame = null;
      latest = undefined;
    },
  };
}


/**
 * Draw a cached image into a 2D canvas. The cache lives in editor-assets.ts;
 * this helper keeps draw logic free from per-frame Image construction.
 */
export async function drawCachedEditorImage(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { loadEditorImage } = await import("./editor-assets");
  const image = await loadEditorImage(url);
  ctx.drawImage(image, x, y, width, height);
}


/**
 * Creates a lightweight interaction gate.
 * Use one begin()/commit() pair for a drag/resize/rotate/draw gesture so
 * undo history records one semantic action rather than every pointermove.
 */
export function createInteractionCommitGate(onCommit: () => void) {
  let active = false;
  let dirty = false;

  return {
    begin() {
      active = true;
      dirty = false;
    },
    markDirty() {
      if (active) dirty = true;
    },
    commit() {
      if (active && dirty) onCommit();
      active = false;
      dirty = false;
    },
    cancel() {
      active = false;
      dirty = false;
    },
  };
}


/** Flush the latest queued value on the next animation frame without creating
 * a backlog. Useful when a gesture ends immediately after a pointer event. */
export function flushLatestFrame<T>(
  schedule: { schedule(value: T): void },
  value: T,
) {
  schedule.schedule(value);
}
