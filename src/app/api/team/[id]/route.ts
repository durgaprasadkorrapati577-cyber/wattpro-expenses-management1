import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { requireApiOwner } from "@/lib/auth";
import { generateTempPassword, hashPassword } from "@/lib/password";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiOwner();
  if (error) return error;

  const { id } = await ctx.params;
  const body = (await req.json()) as { action?: string };

  const target = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const member = target[0];
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (body.action === "deactivate") {
    if (member.id === user.id || member.role === "owner") {
      return NextResponse.json(
        { error: "You cannot deactivate an owner account" },
        { status: 400 },
      );
    }
    await db.update(users).set({ active: false }).where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "activate") {
    await db.update(users).set({ active: true }).where(eq(users.id, id));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reset-password") {
    if (member.role === "owner" && member.id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const temp = generateTempPassword();
    await db
      .update(users)
      .set({ passwordHash: hashPassword(temp), mustChangePassword: true })
      .where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    return NextResponse.json({ ok: true, tempPassword: temp });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
