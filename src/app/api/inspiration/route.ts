import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") ?? "all";
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const perPage = 12;

    const where = category !== "all" ? { category } : {};
    const [posts, total] = await Promise.all([
      db.inspirationPost.findMany({
        where,
        orderBy: [{ trending: "desc" }, { likes: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.inspirationPost.count({ where }),
    ]);
    return NextResponse.json({ posts, page, total, pages: Math.ceil(total / perPage) });
  } catch (err) {
    return errorResponse(err);
  }
}
