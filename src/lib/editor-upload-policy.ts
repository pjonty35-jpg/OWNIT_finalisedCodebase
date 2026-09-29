/**
 * OWNIT upload policy.
 *
 * These limits protect the browser editor from pathological camera files while
 * leaving room for a separate, server-side production original.
 */
export const EDITOR_UPLOAD_POLICY = {
  // Keep this in lockstep with MAX_UPLOAD_MB in storage.ts and .env.example.
  maxFileBytes: 8 * 1024 * 1024,
  maxEditorDimension: 2048,
  maxEditorPixels: 4_000_000,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
} as const;

export function validateEditorUpload(file: File) {
  if (!EDITOR_UPLOAD_POLICY.acceptedTypes.includes(file.type as (typeof EDITOR_UPLOAD_POLICY.acceptedTypes)[number])) {
    return { ok: false as const, reason: "Unsupported image format. Upload PNG, JPG, WebP or SVG." };
  }

  if (file.size > EDITOR_UPLOAD_POLICY.maxFileBytes) {
    return { ok: false as const, reason: "Image is too large. Please choose an image under 8 MB." };
  }

  return { ok: true as const };
}
