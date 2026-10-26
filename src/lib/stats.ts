import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, users, type User } from "@/db/schema";

function monthStartISO(offsetMonths = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export interface DashboardStats {
  scope: "owner" | "employee";
  totals: {
    allTime: number;
    thisMonth: number;
    lastMonth: number;
    pendingAmount: number;
    pendingCount: number;
    approvedThisMonth: number;
    rejectedCount: number;
    expenseCount: number;
  };
  daily: Array<{ date: string; amount: number }>;
  monthly: Array<{ month: string; amount: number }>;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  byEmployee: Array<{
    userId: string;
    name: string;
    amount: number;
    count: number;
    pending: number;
  }>;
  recent: Array<{
    id: string;
    title: string;
    category: string;
    amountCents: number;
    expenseDate: string;
    status: string;
    userName: string;
  }>;
  employeeCount: number;
}

export async function getDashboardStats(user: User): Promise<DashboardStats> {
  const isOwner = user.role === "owner";
  const scope = isOwner ? undefined : eq(expenses.userId, user.id);
  const monthStart = monthStartISO(0);
  const lastMonthStart = monthStartISO(-1);
  const fourteenDaysAgo = monthStartISO(0).slice(0, 8) + "01";
  const d14 = new Date();
  d14.setDate(d14.getDate() - 13);
  const off = d14.getTimezoneOffset();
  const dailyFrom = new Date(d14.getTime() - off * 60000)
    .toISOString()
    .slice(0, 10);

  const whereAll = scope ?? sql`true`;

  const [totalsRow] = await db
    .select({
      allTime: sql<number>`coalesce(sum(${expenses.amountCents}),0)::int`,
      expenseCount: sql<number>`count(*)::int`,
      pendingAmount: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amountCents} else 0 end),0)::int`,
      pendingCount: sql<number>`count(*) filter (where ${expenses.status} = 'pending')::int`,
      rejectedCount: sql<number>`count(*) filter (where ${expenses.status} = 'rejected')::int`,
    })
    .from(expenses)
    .where(whereAll);

  const [monthRow] = await db
    .select({
      thisMonth: sql<number>`coalesce(sum(${expenses.amountCents}),0)::int`,
      approvedThisMonth: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amountCents} else 0 end),0)::int`,
    })
    .from(expenses)
    .where(and(whereAll, gte(expenses.expenseDate, monthStart)));

  const [lastRow] = await db
    .select({
      lastMonth: sql<number>`coalesce(sum(${expenses.amountCents}),0)::int`,
    })
    .from(expenses)
    .where(
      and(
        whereAll,
        gte(expenses.expenseDate, lastMonthStart),
        sql`${expenses.expenseDate} < ${monthStart}`,
      ),
    );

  const daily = await db
    .select({
      date: expenses.expenseDate,
      amount: sql<number>`sum(${expenses.amountCents})::int`,
    })
    .from(expenses)
    .where(and(whereAll, gte(expenses.expenseDate, dailyFrom)))
    .groupBy(expenses.expenseDate)
    .orderBy(expenses.expenseDate);

  const monthly = await db
    .select({
      month: sql<string>`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`,
      amount: sql<number>`sum(${expenses.amountCents})::int`,
    })
    .from(expenses)
    .where(and(whereAll, gte(expenses.expenseDate, fourteenDaysAgo.slice(0, 4) + "-01-01")))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const byCategory = await db
    .select({
      category: expenses.category,
      amount: sql<number>`sum(${expenses.amountCents})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(and(whereAll, gte(expenses.expenseDate, monthStart)))
    .groupBy(expenses.category)
    .orderBy(desc(sql`sum(${expenses.amountCents})`));

  let byEmployee: DashboardStats["byEmployee"] = [];
  if (isOwner) {
    byEmployee = await db
      .select({
        userId: users.id,
        name: users.name,
        amount: sql<number>`coalesce(sum(${expenses.amountCents}),0)::int`,
        count: sql<number>`count(${expenses.id})::int`,
        pending: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amountCents} else 0 end),0)::int`,
      })
      .from(users)
      .leftJoin(
        expenses,
        and(
          eq(expenses.userId, users.id),
          gte(expenses.expenseDate, monthStart),
        ),
      )
      .where(eq(users.active, true))
      .groupBy(users.id, users.name)
      .orderBy(desc(sql`sum(${expenses.amountCents})`));
  }

  const recentRows = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      category: expenses.category,
      amountCents: expenses.amountCents,
      expenseDate: expenses.expenseDate,
      status: expenses.status,
      userName: users.name,
    })
    .from(expenses)
    .innerJoin(users, eq(users.id, expenses.userId))
    .where(whereAll)
    .orderBy(desc(expenses.createdAt))
    .limit(6);

  const [{ employeeCount }] = await db
    .select({ employeeCount: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.active, true), eq(users.role, "employee")));

  return {
    scope: isOwner ? "owner" : "employee",
    totals: {
      allTime: totalsRow?.allTime ?? 0,
      thisMonth: monthRow?.thisMonth ?? 0,
      lastMonth: lastRow?.lastMonth ?? 0,
      pendingAmount: totalsRow?.pendingAmount ?? 0,
      pendingCount: totalsRow?.pendingCount ?? 0,
      approvedThisMonth: monthRow?.approvedThisMonth ?? 0,
      rejectedCount: totalsRow?.rejectedCount ?? 0,
      expenseCount: totalsRow?.expenseCount ?? 0,
    },
    daily,
    monthly,
    byCategory,
    byEmployee,
    recent: recentRows,
    employeeCount,
  };
}
