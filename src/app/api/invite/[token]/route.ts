import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const rows = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);
  const invite = rows[0];

  if (!invite || invite.status !== "pending") {
    return NextResponse.json(
      { error: "This invite link is no longer valid." },
      { status: 404 },
    );
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invite link has expired. Ask the owner for a new one." },
      { status: 410 },
    );
  }

  return NextResponse.json({
    invite: { name: invite.name, email: invite.email },
  });
}
