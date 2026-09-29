/**
 * OWNIT editor asset utilities.
 *
 * The editor should work with a bounded, decoded image rather than the user's
 * original full-resolution camera image. The original upload can remain in
 * storage for production output; this copy is for interactive editing only.
 */

export type EditorImageOptions = {
  maxDimension?: number;
  maxPixels?: number;
  quality?: number;
};

const DEFAULT_MAX_DIMENSION = 2048;
const DEFAULT_MAX_PIXELS = 4_000_000;

function isImage(file: File) {
  return file.type.startsWith("image/");
}

function clampDimensions(
  width: number,
  height: number,
  maxDimension: number,
  maxPixels: number,
) {
  let scale = Math.min(1, maxDimension / Math.max(width, height));
  const pixels = width * height * scale * scale;

  if (pixels > maxPixels) {
    scale *= Math.sqrt(maxPixels / pixels);
  }

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

/**
 * Creates a compressed editor copy. The original File is never mutated.
 */
export async function createEditorImage(
  file: File,
  options: EditorImageOptions = {},
): Promise<Blob> {
  if (!isImage(file)) {
    throw new Error("Only image files can be added to the editor.");
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxPixels = options.maxPixels ?? DEFAULT_MAX_PIXELS;
  const quality = options.quality ?? 0.88;

  const bitmap = await createImageBitmap(file);
  try {
    const dimensions = clampDimensions(
      bitmap.width,
      bitmap.height,
      maxDimension,
      maxPixels,
    );

    // OffscreenCanvas is ideal where supported; fall back to a normal canvas.
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(dimensions.width, dimensions.height)
        : Object.assign(document.createElement("canvas"), {
            width: dimensions.width,
            height: dimensions.height,
          });

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Could not create an image processing context.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

    if ("convertToBlob" in canvas) {
      return await (canvas as OffscreenCanvas).convertToBlob({
        type: "image/webp",
        quality,
      });
    }

    return await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Image conversion failed."))),
        "image/webp",
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Safely revokes a temporary object URL.
 */
export function revokeObjectUrl(url?: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Cache decoded image elements by stable URL. Call clearEditorImageCache when
 * a design/session is disposed so long-lived tabs do not retain image objects.
 */
const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadEditorImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

  imageCache.set(url, promise);
  promise.catch(() => imageCache.delete(url));
  return promise;
}

export function clearEditorImageCache(urls?: string[]) {
  if (!urls) {
    imageCache.clear();
    return;
  }
  for (const url of urls) imageCache.delete(url);
}
