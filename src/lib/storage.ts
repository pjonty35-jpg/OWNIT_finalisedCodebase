/**
 * Storage abstraction for user uploads and generated artwork.
 *
 * `local` provider writes to `.uploads/` (served via /api/files/[...path]) —
 * suitable for development. Swap in S3/R2/Supabase Storage in production by
 * implementing the interface. Originals stay private; public access goes
 * through the file API which validates the path.
 */

import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), ".uploads");

export interface StoredFile {
  key: string;
  url: string;
  bytes: number;
  mime: string;
}

export interface StorageProvider {
  readonly name: string;
  put(key: string, data: Buffer, mime: string): Promise<StoredFile>;
  get(key: string): Promise<Buffer | null>;
}

class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  async put(key: string, data: Buffer, mime: string): Promise<StoredFile> {
    const safe = sanitizeKey(key);
    const dest = path.join(UPLOAD_ROOT, safe);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, data);
    return { key: safe, url: `/api/files/${safe}`, bytes: data.length, mime };
  }

  async get(key: string): Promise<Buffer | null> {
    const safe = sanitizeKey(key);
    try {
      return await readFile(path.join(UPLOAD_ROOT, safe));
    } catch {
      return null;
    }
  }
}

function sanitizeKey(key: string) {
  // Block traversal: allow only word chars, dashes, dots, slashes.
  const clean = key.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/\.\.+/g, "_");
  return clean.replace(/^\/+/, "");
}

export function newUploadKey(userId: string, ext: string) {
  const id = randomBytes(10).toString("hex");
  return `artwork/${userId || "guest"}/${Date.now()}-${id}.${ext}`;
}

export function getStorage(): StorageProvider {
  return new LocalStorageProvider();
}

export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export const ALLOWED_EXTENSIONS = Object.keys(MIME_BY_EXT);

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 8);

/** Basic magic-number sniffing — never trust the client-declared MIME. */
export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  const head = buf.slice(0, 300).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "image/svg+xml";
  return null;
}
