/**
 * Garment silhouette outlines. (Rendering uses primitive-based 3D forms in
 * GarmentScene; these outlines document the canonical print-side geometry.)
 */

export interface SilhouetteDef {
  /** Outline points, front layer (x, y) in metres-ish units. */
  outline: [number, number][];
  /** Optional back layer outline (defaults to outline). */
  back?: [number, number][];
  /** Scale factor from outline units to world units. */
  scale: number;
}

const TEE: [number, number][] = [
  [-0.34, 0.5], [-0.14, 0.56], [-0.1, 0.5], [0.1, 0.5], [0.14, 0.56], [0.34, 0.5],
  [0.52, 0.32], [0.62, 0.1], [0.44, -0.02], [0.36, 0.08],
  [0.34, -0.62], [-0.34, -0.62], [-0.36, 0.08], [-0.44, -0.02], [-0.62, 0.1], [-0.52, 0.32],
];

const HOODIE: [number, number][] = [
  [-0.36, 0.56], [-0.2, 0.66], [0.2, 0.66], [0.36, 0.56],
  [0.56, 0.3], [0.64, 0.06], [0.46, -0.06], [0.38, 0.04],
  [0.38, -0.78], [-0.38, -0.78], [-0.38, 0.04], [-0.46, -0.06], [-0.64, 0.06], [-0.56, 0.3],
];

const CAP: [number, number][] = [
  [-0.34, 0.16], [-0.3, 0.32], [-0.12, 0.42], [0.12, 0.42], [0.3, 0.32], [0.34, 0.16],
  [0.36, 0.06], [0.62, 0.04], [0.64, -0.06], [0.36, -0.06],
  [-0.36, -0.06], [-0.64, -0.06], [-0.62, 0.04],
];

const TOTE: [number, number][] = [
  [-0.3, 0.28], [-0.36, -0.5], [0.36, -0.5], [0.3, 0.28],
];

const JERSEY = TEE;

const JACKET: [number, number][] = [
  [-0.36, 0.56], [-0.14, 0.52], [0.14, 0.52], [0.36, 0.56],
  [0.56, 0.3], [0.64, 0.06], [0.46, -0.06], [0.38, 0.04],
  [0.38, -0.72], [-0.38, -0.72], [-0.38, 0.04], [-0.46, -0.06], [-0.64, 0.06], [-0.56, 0.3],
];

export const SILHOUETTES: Record<string, SilhouetteDef> = {
  "t-shirts": { outline: TEE, scale: 1 },
  hoodies: { outline: HOODIE, scale: 1 },
  jackets: { outline: JACKET, scale: 1 },
  caps: { outline: CAP, scale: 1 },
  bags: { outline: TOTE, scale: 1 },
  jerseys: { outline: JERSEY, scale: 1 },
};

export function silhouetteFor(category: string): SilhouetteDef {
  return SILHOUETTES[category] ?? SILHOUETTES["t-shirts"];
}
