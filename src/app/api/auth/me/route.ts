import { getSessionUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { engagementSnapshot } from "@/lib/rewards";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ user: null, engagement: null });
    const engagement = await engagementSnapshot(user.id);
    return Response.json({ user, engagement });
  } catch (err) {
    return errorResponse(err);
  }
}
