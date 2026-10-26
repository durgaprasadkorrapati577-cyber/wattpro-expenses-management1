"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, BadgeCheck, Inbox } from "lucide-react";
import type { ExpenseRow } from "@/lib/expenses";
import { formatINR, formatDate } from "@/lib/format";
import { getCategory } from "@/lib/categories";
import { Badge, EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/toaster";
import { ExpenseDetailModal } from "@/components/expenses-client";

export function ApprovalsClient({
  pending,
  reviewed,
  currentUserId,
}: {
  pending: ExpenseRow[];
  reviewed: ExpenseRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selected =
    [...pending, ...reviewed].find((r) => r.id === selectedId) ?? null;
  const pendingTotal = pending.reduce((s, r) => s + r.amountCents, 0);

  async function quickAction(id: string, action: "approve" | "reject", title: string) {
    setBusyId(id + action);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", "Action failed", data.error ?? "Try again");
        return;
      }
      toast(
        "success",
        action === "approve" ? "Approved" : "Rejected",
        title,
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt-500">
          Owner console
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
          Approvals queue
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {pending.length} waiting ·{" "}
          <span className="font-semibold text-zinc-300">{formatINR(pendingTotal)}</span>{" "}
          to review
        </p>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Queue is clear"
          description="Every expense from the team has been reviewed. New submissions will appear here instantly."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {pending.map((e, i) => {
              const cat = getCategory(e.category);
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className="card-surface group p-4 transition-colors hover:border-volt-500/25"
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-volt-400">
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-medium text-zinc-100">
                            {e.title}
                          </p>
                          <p className="shrink-0 font-display text-base font-bold text-white">
                            {formatINR(e.amountCents)}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-300">{e.userName}</span>
                          {" · "}
                          {cat.label}
                          {" · "}
                          {formatDate(e.expenseDate)}
                          {e.receiptPath && " · receipt attached"}
                        </p>
                      </div>
                    </button>
                  </div>
                  <div className="mt-3.5 flex gap-2">
                    <button
                      onClick={() => quickAction(e.id, "approve", e.title)}
                      disabled={busyId !== null}
                      className="volt-ring flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-400/10 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {busyId === e.id + "approve" ? "Approving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => quickAction(e.id, "reject", e.title)}
                      disabled={busyId !== null}
                      className="volt-ring flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-400/10 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      {busyId === e.id + "reject" ? "Rejecting…" : "Reject"}
                    </button>
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className="volt-ring flex h-9 items-center justify-center rounded-xl bg-white/[0.05] px-4 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.09]"
                    >
                      Details
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Recently reviewed */}
      {reviewed.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-volt-500" />
            <h2 className="font-display text-base font-semibold text-white">
              Recently reviewed
            </h2>
          </div>
          <div className="card-surface divide-y divide-white/5">
            {reviewed.map((e) => {
              const cat = getCategory(e.category);
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-volt-400">
                    <cat.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {e.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {e.userName} · {formatDate(e.expenseDate)}
                    </p>
                  </div>
                  <p className="font-display text-sm font-bold text-white">
                    {formatINR(e.amountCents)}
                  </p>
                  <Badge tone={e.status as "approved" | "rejected"}>{e.status}</Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ExpenseDetailModal
        key={selected?.id ?? "none"}
        expense={selected}
        isOwner
        currentUserId={currentUserId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
