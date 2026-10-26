import { requireOwner } from "@/lib/auth";
import { queryExpenses } from "@/lib/expenses";
import { ApprovalsClient } from "@/components/approvals-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const user = await requireOwner();
  const [pending, approved, rejected] = await Promise.all([
    queryExpenses(user, { status: "pending" }),
    queryExpenses(user, { status: "approved" }),
    queryExpenses(user, { status: "rejected" }),
  ]);
  const reviewed = [...approved, ...rejected]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return (
    <ApprovalsClient
      pending={pending}
      reviewed={reviewed}
      currentUserId={user.id}
    />
  );
}
