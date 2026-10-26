import { and, desc, eq, gte, ilike, lt, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { expenses, users, type User } from "@/db/schema";

export interface ExpenseFilters {
  status?: string;
  category?: string;
  userId?: string;
  month?: string; // YYYY-MM
  q?: string;
}

export interface ExpenseRow {
  id: string;
  title: string;
  vendor: string | null;
  category: string;
  amountCents: number;
  expenseDate: string;
  notes: string | null;
  receiptPath: string | null;
  receiptName: string | null;
  receiptMime: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: Date;
  userId: string;
  userName: string;
  userEmail: string;
}

export async function queryExpenses(
  user: User,
  filters: ExpenseFilters = {},
): Promise<ExpenseRow[]> {
  const conditions: SQL[] = [];
  if (user.role !== "owner") {
    conditions.push(eq(expenses.userId, user.id));
  } else if (filters.userId) {
    conditions.push(eq(expenses.userId, filters.userId));
  }
  if (filters.status && ["pending", "approved", "rejected"].includes(filters.status)) {
    conditions.push(eq(expenses.status, filters.status as "pending" | "approved" | "rejected"));
  }
  if (filters.category) {
    conditions.push(eq(expenses.category, filters.category));
  }
  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const [y, m] = filters.month.split("-").map(Number);
    const from = `${filters.month}-01`;
    const toDate = new Date(Date.UTC(y, m, 1));
    const to = toDate.toISOString().slice(0, 10);
    conditions.push(gte(expenses.expenseDate, from), lt(expenses.expenseDate, to));
  }
  if (filters.q) {
    conditions.push(
      sql`(${ilike(expenses.title, `%${filters.q}%`)} or ${ilike(expenses.vendor, `%${filters.q}%`)})`,
    );
  }

  const rows = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      vendor: expenses.vendor,
      category: expenses.category,
      amountCents: expenses.amountCents,
      expenseDate: expenses.expenseDate,
      notes: expenses.notes,
      receiptPath: expenses.receiptPath,
      receiptName: expenses.receiptName,
      receiptMime: expenses.receiptMime,
      status: expenses.status,
      reviewNote: expenses.reviewNote,
      createdAt: expenses.createdAt,
      userId: expenses.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(expenses)
    .innerJoin(users, eq(users.id, expenses.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt))
    .limit(500);

  return rows;
}
