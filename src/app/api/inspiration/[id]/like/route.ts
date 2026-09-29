import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { errorResponse } from "@/lib/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to like designs");
    const { id } = await ctx.params;
    const post = await db.inspirationPost.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "Post not found");

    const existing = await db.like.findUnique({
      where: { userId_inspirationPostId: { userId: user.id, inspirationPostId: id } },
    });
    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      await db.inspirationPost.update({ where: { id }, data: { likes: { decrement: 1 } } });
      return Response.json({ liked: false });
    }
    await db.like.create({ data: { userId: user.id, inspirationPostId: id } });
    await db.inspirationPost.update({ where: { id }, data: { likes: { increment: 1 } } });
    return Response.json({ liked: true });
  } catch (err) {
    return errorResponse(err);
  }
}
