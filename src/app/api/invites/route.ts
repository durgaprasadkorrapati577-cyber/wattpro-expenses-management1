import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { requireApiOwner } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const { user, error } = await requireApiOwner();
  if (error) return error;

  const rows = await db
    .select({
      id: invites.id,
      token: invites.token,
      name: invites.name,
      email: invites.email,
      status: invites.status,
      expiresAt: invites.expiresAt,
      createdAt: invites.createdAt,
      inviter: users.name,
    })
    .from(invites)
    .innerJoin(users, eq(users.id, invites.invitedById))
    .orderBy(desc(invites.createdAt))
    .limit(100);

  const now = new Date();
  const data = rows.map((r) => ({
    ...r,
    status:
      r.status === "pending" && r.expiresAt < now ? "expired" : r.status,
  }));

  void user;
  return NextResponse.json({ invites: data });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiOwner();
  if (error) return error;

  const body = (await req.json()) as { name?: string; email?: string };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Employee name is required" },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return NextResponse.json(
      { error: "An account already exists for this email" },
      { status: 409 },
    );
  }

  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite] = await db
    .insert(invites)
    .values({ token, name, email, invitedById: user.id, expiresAt })
    .returning();

  return NextResponse.json({
    invite: {
      id: invite.id,
      token: invite.token,
      name: invite.name,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
    },
    link: `/invite/${invite.token}`,
  });
}
