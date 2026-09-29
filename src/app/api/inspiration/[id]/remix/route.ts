import { db } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { sanitizeDesignState } from "@/lib/design";

/** Remix: copies a published community design into the current user's studio as an editable draft. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to remix designs");
    const { id } = await ctx.params;
    const post = await db.inspirationPost.findUnique({ where: { id }, include: { design: true } });
    if (!post || !post.design) throw new HttpError(404, "Design not found");

    const state = sanitizeDesignState(JSON.parse(post.design.state));
    const copy = await db.design.create({
      data: {
        ownerId: user.id,
        productId: post.design.productId,
        name: `${post.design.name} (Remix)`.slice(0, 80),
        state: JSON.stringify(state),
        previewUrl: post.design.previewUrl,
        remixOfId: post.design.id,
        versions: { create: { version: 1, state: JSON.stringify(state) } },
      },
    });
    await db.inspirationPost.update({ where: { id: post.id }, data: { remixes: { increment: 1 } } });
    await db.rewardTransaction.create({ data: { userId: user.id, kind: "design_created", points: 5, note: `Remixed "${post.title}"` } }).catch(() => {});
    await db.rewardAccount.upsert({ where: { userId: user.id }, create: { userId: user.id, points: 5 }, update: { points: { increment: 5 } } }).catch(() => {});
    return Response.json({ designId: copy.id, editUrl: `/create?design=${copy.id}` });
  } catch (err) {
    return errorResponse(err);
  }
}
