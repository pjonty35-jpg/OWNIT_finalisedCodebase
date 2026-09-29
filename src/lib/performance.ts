/**
 * OWNIT Pass 10 production performance helpers.
 *
 * These helpers intentionally avoid doing work during the critical render.
 */

export function idle(callback: () => void, timeout = 1500) {
  if (typeof window === "undefined") return () => {};

  const w = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(() => callback(), { timeout });
    return () => w.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(callback, Math.min(timeout, 250));
  return () => window.clearTimeout(id);
}

export function shouldReduceMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
