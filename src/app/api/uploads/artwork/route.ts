import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { errorResponse, rateLimit, clientIp } from "@/lib/http";
import { getStorage, newUploadKey, MIME_BY_EXT, sniffImageMime, MAX_UPLOAD_MB, ALLOWED_EXTENSIONS } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    rateLimit(`upload:${clientIp(req)}`, 20, 60_000);
    const user = await getSessionUser();
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new HttpError(400, "Expected multipart form data");
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file provided");
    if (file.size === 0) throw new HttpError(400, "File is empty");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      throw new HttpError(413, `File too large (max ${MAX_UPLOAD_MB} MB)`);
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageMime(buf);
    if (!sniffed) throw new HttpError(415, "Unsupported file type. Upload PNG, JPG, WebP or SVG.");

    // Never trust the client filename or declared MIME.
    const ext = (ALLOWED_EXTENSIONS.find((e) => MIME_BY_EXT[e] === sniffed) ?? "png");
    const key = newUploadKey(user?.id ?? "guest", ext);
    const stored = await getStorage().put(key, buf, sniffed);

    return Response.json({ url: stored.url, key: stored.key, bytes: stored.bytes, mime: stored.mime });
  } catch (err) {
    return errorResponse(err);
  }
}
