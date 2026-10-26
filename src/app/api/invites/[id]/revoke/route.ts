import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { requireApiOwner } from "@/lib/auth";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiOwner();
  if (error) return error;

  const { id } = await ctx.params;
  const rows = await db
    .update(invites)
    .set({ status: "revoked" })
    .where(eq(invites.id, id))
    .returning({ id: invites.id });

  if (!rows[0]) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
