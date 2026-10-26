"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Paperclip,
  FileText,
  Check,
  X,
  Trash2,
  ReceiptText,
  FileWarning,
  CalendarDays,
  Building2,
  StickyNote,
  UserRound,
  MessageSquareText,
} from "lucide-react";
import type { ExpenseRow } from "@/lib/expenses";
import { formatINR, formatDate } from "@/lib/format";
import { CATEGORIES, getCategory } from "@/lib/categories";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toaster";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export interface MemberOption {
  id: string;
  name: string;
}

export function ExpensesClient({
  rows,
  filters,
  isOwner,
  members,
  currentUserId,
}: {
  rows: ExpenseRow[];
  filters: { status: string; category: string; userId: string; month: string; q: string };
  isOwner: boolean;
  members: MemberOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState(filters.q);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const totalShown = rows.reduce((s, r) => s + r.amountCents, 0);

  function applyFilter(patch: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...patch };
    if (merged.status) params.set("status", merged.status);
    if (merged.category) params.set("category", merged.category);
    if (isOwner && merged.userId) params.set("userId", merged.userId);
    if (merged.month) params.set("month", merged.month);
    if (merged.q) params.set("q", merged.q);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt-500">
            Ledger
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
            {isOwner ? "All expenses" : "My expenses"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rows.length} record{rows.length === 1 ? "" : "s"} ·{" "}
            <span className="font-semibold text-zinc-300">{formatINR(totalShown)}</span>{" "}
            in view
          </p>
        </div>
        <Link href="/expenses/new">
          <Button icon={<Plus className="h-4 w-4" />}>New expense</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card-surface flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => applyFilter({ status: t.value })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                filters.status === t.value
                  ? "bg-volt-500 text-ink-950"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200",
              )}
            >
              {t.label}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilter({ q: search });
              }}
              onBlur={() => {
                if (search !== filters.q) applyFilter({ q: search });
              }}
              placeholder="Search title or vendor…"
              className="h-9 pl-9 text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select
            value={filters.category}
            onChange={(e) => applyFilter({ category: e.target.value })}
            className="h-9 text-xs"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          {isOwner ? (
            <Select
              value={filters.userId}
              onChange={(e) => applyFilter({ userId: e.target.value })}
              className="h-9 text-xs"
            >
              <option value="">All teammates</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.id === currentUserId ? " (you)" : ""}
                </option>
              ))}
            </Select>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Input
            type="month"
            value={filters.month}
            max={currentMonth}
            onChange={(e) => applyFilter({ month: e.target.value })}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-6 w-6" />}
          title="Nothing here"
          description="No expenses match these filters. Try widening the filters or log a new expense."
          action={
            <Link href="/expenses/new">
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                New expense
              </Button>
            </Link>
          }
        />
      ) : (
        <div className={cn("card-surface overflow-hidden", pending && "opacity-60 transition")}>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  <th className="px-5 py-3.5 font-semibold">Expense</th>
                  {isOwner && <th className="px-4 py-3.5 font-semibold">By</th>}
                  <th className="px-4 py-3.5 font-semibold">Category</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold">Receipt</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => {
                  const cat = getCategory(e.category);
                  return (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.4) }}
                      onClick={() => setSelectedId(e.id)}
                      className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-100">{e.title}</p>
                        {e.vendor && (
                          <p className="mt-0.5 text-xs text-zinc-500">{e.vendor}</p>
                        )}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-volt-300">
                              {e.userName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                            </span>
                            <span className="text-xs text-zinc-300">{e.userName}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                          <cat.icon className="h-3.5 w-3.5 text-volt-500" />
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400">
                        {formatDate(e.expenseDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        {e.receiptPath ? (
                          <Paperclip className="h-4 w-4 text-volt-400" />
                        ) : (
                          <span className="text-xs text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={e.status as "pending" | "approved" | "rejected"}>
                          {e.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-display font-bold text-white">
                        {formatINR(e.amountCents)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-white/5 md:hidden">
            {rows.map((e) => {
              const cat = getCategory(e.category);
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-volt-400">
                    <cat.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-100">{e.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {isOwner && `${e.userName} · `}
                      {formatDate(e.expenseDate)}
                      {e.receiptPath && " · receipt attached"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-display font-bold text-white">
                      {formatINR(e.amountCents)}
                    </p>
                    <Badge tone={e.status as "pending" | "approved" | "rejected"}>
                      {e.status}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ExpenseDetailModal
        key={selected?.id ?? "none"}
        expense={selected}
        isOwner={isOwner}
        currentUserId={currentUserId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

/* ----------------------------- Detail modal ------------------------------- */

export function ExpenseDetailModal({
  expense,
  isOwner,
  currentUserId,
  onClose,
  onChanged,
}: {
  expense: ExpenseRow | null;
  isOwner: boolean;
  currentUserId: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "reject" | "delete">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!expense) return <Modal open={false} onClose={onClose} title="" children={<></>} />;
  const cat = getCategory(expense.category);
  const isImage = expense.receiptMime?.startsWith("image/");
  const receiptUrl = `/api/expenses/${expense.id}/receipt`;
  const canDelete =
    isOwner || (expense.userId === currentUserId && expense.status === "pending");
  const canReview = isOwner && expense.status === "pending";

  async function act(action: "approve" | "reject") {
    setBusy(action);
    try {
      const res = await fetch(`/api/expenses/${expense!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast("error", "Action failed", data.error ?? "Try again");
        return;
      }
      toast(
        "success",
        action === "approve" ? "Expense approved" : "Expense rejected",
        expense!.title,
      );
      onChanged?.();
      router.refresh();
      onClose();
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    setBusy("delete");
    try {
      const res = await fetch(`/api/expenses/${expense!.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", "Could not delete", data.error ?? "Try again");
        return;
      }
      toast("info", "Expense deleted", expense!.title);
      onChanged?.();
      router.refresh();
      onClose();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal open onClose={onClose} title={expense.title} subtitle={`Logged by ${expense.userName}`} wide>
      <div className="flex flex-col gap-5">
        {/* Amount + status */}
        <div className="flex items-center justify-between rounded-2xl bg-ink-800/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-volt-500/12 text-volt-400">
              <cat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{cat.label}</p>
              <p className="font-display text-2xl font-bold text-white">
                {formatINR(expense.amountCents)}
              </p>
            </div>
          </div>
          <Badge tone={expense.status as "pending" | "approved" | "rejected"} className="!px-3 !py-1 !text-xs">
            {expense.status}
          </Badge>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: CalendarDays, label: "Expense date", value: formatDate(expense.expenseDate) },
            { icon: Building2, label: "Vendor / Paid to", value: expense.vendor || "—" },
            { icon: UserRound, label: "Submitted by", value: expense.userName },
            { icon: FileText, label: "Logged on", value: formatDate(expense.createdAt) },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-3 rounded-xl border border-white/5 px-3.5 py-2.5">
              <m.icon className="h-4 w-4 shrink-0 text-zinc-600" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">{m.label}</p>
                <p className="truncate text-sm text-zinc-200">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {expense.notes && (
          <div className="flex gap-3 rounded-xl border border-white/5 px-4 py-3">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Notes</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-300">{expense.notes}</p>
            </div>
          </div>
        )}

        {/* Receipt */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Receipt / Bill
          </p>
          {expense.receiptPath ? (
            <div>
              <button
                onClick={() => setShowReceipt((s) => !s)}
                className="flex w-full items-center gap-3 rounded-xl border border-volt-500/20 bg-volt-500/[0.06] px-4 py-3 text-left transition hover:border-volt-500/40"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-volt-400" />
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                  {expense.receiptName ?? "View receipt"}
                </span>
                <span className="shrink-0 text-xs font-medium text-volt-400">
                  {showReceipt ? "Hide" : "Preview"}
                </span>
              </button>
              {showReceipt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 overflow-hidden rounded-xl border border-white/10"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receiptUrl}
                      alt="Receipt"
                      className="max-h-[420px] w-full bg-ink-800 object-contain"
                    />
                  ) : (
                    <iframe src={receiptUrl} title="Receipt PDF" className="h-[420px] w-full bg-ink-800" />
                  )}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-ink-600 px-4 py-3 text-sm text-zinc-500">
              <FileWarning className="h-4 w-4 text-zinc-600" />
              No receipt attached
            </div>
          )}
        </div>

        {/* Review note from owner */}
        {expense.reviewNote && expense.status !== "pending" && (
          <div className="flex gap-3 rounded-xl border border-white/5 bg-ink-800/60 px-4 py-3">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-volt-500" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                Owner&rsquo;s note
              </p>
              <p className="mt-0.5 text-sm text-zinc-300">{expense.reviewNote}</p>
            </div>
          </div>
        )}

        {/* Owner review actions */}
        {canReview && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
              Owner review
            </p>
            <Textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional note for the employee (e.g. missing bill, approved for site work…)"
              className="!min-h-[64px] text-sm"
            />
            <div className="flex gap-2.5">
              <Button
                className="flex-1"
                icon={<Check className="h-4 w-4" />}
                loading={busy === "approve"}
                onClick={() => act("approve")}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                icon={<X className="h-4 w-4" />}
                loading={busy === "reject"}
                onClick={() => act("reject")}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Delete */}
        {canDelete && (
          <div className="flex justify-end">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Delete permanently?</span>
                <Button size="sm" variant="danger" loading={busy === "delete"} onClick={doDelete}>
                  Yes, delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => setConfirmDelete(true)}
                className="text-zinc-500 hover:!text-rose-300"
              >
                Delete entry
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
