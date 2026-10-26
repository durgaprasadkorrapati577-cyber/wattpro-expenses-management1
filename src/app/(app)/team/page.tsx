import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, invites, users } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { TeamClient } from "@/components/team-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Team & Invites" };

export default async function TeamPage() {
  const user = await requireOwner();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
      totalCents: sql<number>`coalesce(sum(${expenses.amountCents}),0)::int`,
      expenseCount: sql<number>`count(${expenses.id})::int`,
      pendingCount: sql<number>`count(${expenses.id}) filter (where ${expenses.status} = 'pending')::int`,
      monthCents: sql<number>`coalesce(sum(case when ${expenses.expenseDate} >= ${monthStart} then ${expenses.amountCents} else 0 end),0)::int`,
    })
    .from(users)
    .leftJoin(expenses, eq(expenses.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(sql`sum(${expenses.amountCents})`));

  const inviteRows = await db
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
    .limit(50);

  return (
    <TeamClient
      members={members.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      invites={inviteRows.map((i) => ({
        ...i,
        status:
          i.status === "pending" && i.expiresAt < now ? ("expired" as const) : i.status,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))}
      currentUserId={user.id}
    />
  );
}
