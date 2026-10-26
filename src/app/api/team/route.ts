import { NextResponse } from "next/server";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, users } from "@/db/schema";
import { requireApiOwner } from "@/lib/auth";

export async function GET() {
  const { error } = await requireApiOwner();
  if (error) return error;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const rows = await db
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

  return NextResponse.json({ members: rows });
}
