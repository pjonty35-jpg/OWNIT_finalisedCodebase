import { destroySession } from "@/lib/session";
import { errorResponse } from "@/lib/http";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
