import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    name?: string;
    password?: string;
  };
  const token = body.token ?? "";
  const name = body.name?.trim();
  const password = body.password ?? "";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your full name" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const inviteRows = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);
  const invite = inviteRows[0];

  if (
    !invite ||
    invite.status !== "pending" ||
    invite.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: "This invite link is no longer valid." },
      { status: 410 },
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);
  if (existing[0]) {
    return NextResponse.json(
      { error: "An account already exists for this email." },
      { status: 409 },
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      name,
      email: invite.email,
      passwordHash: hashPassword(password),
      role: "employee",
      mustChangePassword: false,
    })
    .returning();

  await db
    .update(invites)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invites.id, invite.id));

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
