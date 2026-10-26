import { requireUser } from "@/lib/auth";
import { ExpenseForm } from "@/components/expense-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "New expense" };

export default async function NewExpensePage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt-500">
          Ledger
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
          Log an expense
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add the details, attach the bill or receipt, and it goes straight to
          the owner&rsquo;s review queue.
        </p>
      </div>
      <ExpenseForm role={user.role} />
    </div>
  );
}
