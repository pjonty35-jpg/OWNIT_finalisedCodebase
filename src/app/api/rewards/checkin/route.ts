import { getSessionUser, HttpError } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { dailyCheckIn, engagementSnapshot } from "@/lib/rewards";

/** POST /api/rewards/checkin — daily streak check-in (+points, once per day). */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to start your streak");
    const result = await dailyCheckIn(user.id);
    const engagement = await engagementSnapshot(user.id);
    return Response.json({ ...result, engagement });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
