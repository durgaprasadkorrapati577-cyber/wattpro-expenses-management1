import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { queryExpenses } from "@/lib/expenses";
import { ExpensesClient } from "@/components/expenses-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const pick = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : "";
  };
  const filters = {
    status: pick("status"),
    category: pick("category"),
    userId: pick("userId"),
    month: pick("month"),
    q: pick("q"),
  };

  const rows = await queryExpenses(user, {
    status: filters.status || undefined,
    category: filters.category || undefined,
    userId: filters.userId || undefined,
    month: filters.month || undefined,
    q: filters.q || undefined,
  });

  const members =
    user.role === "owner"
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.active, true))
          .orderBy(desc(users.createdAt))
      : [];

  return (
    <ExpensesClient
      rows={rows}
      filters={filters}
      isOwner={user.role === "owner"}
      members={members}
      currentUserId={user.id}
    />
  );
}
