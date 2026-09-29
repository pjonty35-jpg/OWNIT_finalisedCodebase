import { getStorage } from "@/lib/storage";
import { HttpError } from "@/lib/session";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: parts } = await ctx.params;
    if (!parts || parts.length === 0) throw new HttpError(404, "Not found");
    const key = parts.join("/");
    const data = await getStorage().get(key);
    if (!data) throw new HttpError(404, "Not found");
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const mime =
      ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "webp" ? "image/webp" :
      ext === "svg" ? "image/svg+xml" : "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return Response.json({ error: "Not found" }, { status });
  }
}
