import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, revokeOtherSessions } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const newPassword = body.newPassword ?? "";

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  // On a voluntary change (settings), require the current password.
  if (!user.mustChangePassword) {
    const current = body.currentPassword ?? "";
    if (!verifyPassword(current, user.passwordHash)) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }
  }

  await db
    .update(users)
    .set({
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
    })
    .where(eq(users.id, user.id));

  await revokeOtherSessions(user.id);

  return NextResponse.json({ ok: true });
}
