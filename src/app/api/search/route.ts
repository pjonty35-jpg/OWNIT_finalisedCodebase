import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return Response.json({ products: [], designs: [], creators: [] });

    const [products, designs, creators] = await Promise.all([
      db.product.findMany({
        where: {
          active: true,
          deletedAt: null,
          OR: [
            { name: { contains: q } },
            { subtitle: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: { slug: true, name: true, subtitle: true },
        take: 6,
      }),
      db.inspirationPost.findMany({
        where: { OR: [{ title: { contains: q } }, { handle: { contains: q } }] },
        select: { id: true, title: true, handle: true },
        take: 5,
      }),
      db.user.findMany({
        where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
        select: { id: true, name: true },
        take: 4,
      }),
    ]);
    return Response.json({ products, designs, creators });
  } catch (err) {
    return errorResponse(err);
  }
}
