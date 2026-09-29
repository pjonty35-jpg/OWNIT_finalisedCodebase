import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, HttpError } from "@/lib/session";
import { readJson, errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
    return Response.json({ addresses });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({
  label: z.string().max(30).optional(),
  fullName: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  line1: z.string().min(4).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  postalCode: z.string().min(4).max(10),
  country: z.string().length(2).default("IN"),
  isDefault: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(req));
    if (body.isDefault) {
      await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    const address = await db.address.create({
      data: {
        userId: user.id,
        label: body.label ?? "Address",
        fullName: body.fullName, phone: body.phone, line1: body.line1, line2: body.line2 ?? null,
        city: body.city, state: body.state, postalCode: body.postalCode, country: body.country,
        isDefault: body.isDefault ?? false,
      },
    });
    return Response.json({ address });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: err.issues[0]?.message ?? "Invalid address" }, { status: 400 });
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "Missing id");
    const addr = await db.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== user.id) throw new HttpError(404, "Not found");
    await db.address.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export const dynamic = "force-dynamic";
