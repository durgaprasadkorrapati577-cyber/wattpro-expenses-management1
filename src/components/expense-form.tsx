"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileImage,
  FileText,
  X,
  ArrowLeft,
  IndianRupee,
  Zap,
} from "lucide-react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { todayISODate } from "@/lib/format";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toaster";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  "Attach the bill or receipt — it stays linked to the entry forever.",
  "The expense lands in the owner's review queue instantly.",
  "You'll see it flip to Approved (or Rejected, with a note) right here.",
];

export function ExpenseForm({ role }: { role: "owner" | "employee" }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayISODate());
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cat = category ? getCategory(category) : null;

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ok.includes(f.type)) {
      setError("Receipt must be a JPG, PNG, WEBP image or a PDF");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Receipt file is too large (max 8 MB)");
      return;
    }
    setFile(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!category) {
      setError("Please choose a category");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("title", title);
      fd.set("vendor", vendor);
      fd.set("category", category);
      fd.set("amount", amount);
      fd.set("expenseDate", expenseDate);
      fd.set("notes", notes);
      if (file) fd.set("receipt", file);

      const res = await fetch("/api/expenses", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save the expense");
        return;
      }
      toast("success", "Expense logged", `${title} · ₹${amount}`);
      router.push("/expenses");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
      {/* Form */}
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-surface flex flex-col gap-5 p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="What was this expense for?">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solar panel 545W — Greenfield Rooftop site"
                required
                minLength={2}
                maxLength={140}
                autoFocus
              />
            </Field>
          </div>

          <Field label="Vendor / paid to" hint="Shop, supplier or person">
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Loom Solar, Tata Power Solar"
              maxLength={120}
            />
          </Field>

          <Field label="Category">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>
                Choose a category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Amount (₹)">
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="pl-10 font-display text-lg font-bold"
              />
            </div>
          </Field>

          <Field label="Date of expense">
            <Input
              type="date"
              value={expenseDate}
              max={todayISODate()}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="Notes" hint="Optional — anything the owner should know">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Site name, kW capacity, project reference…"
            maxLength={600}
          />
        </Field>

        {/* Receipt upload */}
        <Field label="Receipt / bill" hint="JPG, PNG, WEBP or PDF · max 8 MB">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-volt-500/25 bg-volt-500/[0.06] px-4 py-3">
              {file.type === "application/pdf" ? (
                <FileText className="h-5 w-5 shrink-0 text-volt-400" />
              ) : (
                <FileImage className="h-5 w-5 shrink-0 text-volt-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {(file.size / 1024).toFixed(0)} KB · ready to upload
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-rose-300"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition",
                dragOver
                  ? "border-volt-500 bg-volt-500/[0.07]"
                  : "border-ink-600 bg-ink-800/40 hover:border-ink-500",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-volt-500/12 text-volt-400">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-zinc-200">
                Drop the receipt here, or{" "}
                <span className="text-volt-400 underline underline-offset-2">
                  browse files
                </span>
              </p>
              <p className="text-xs text-zinc-600">
                A clear photo of the bill works perfectly
              </p>
            </button>
          )}
        </Field>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {error}
          </motion.p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Link href="/expenses">
            <Button type="button" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={<Zap className="h-4 w-4" />}
            className="flex-1 sm:flex-none sm:px-10"
          >
            {loading ? "Saving…" : "Save expense"}
          </Button>
        </div>
      </motion.form>

      {/* Live preview + tips */}
      <motion.aside
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="flex flex-col gap-4"
      >
        <div className="card-surface overflow-hidden">
          <div className="border-b border-white/5 bg-ink-800/40 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Live preview
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-volt-500/12 text-volt-400">
                {cat ? <cat.icon className="h-5 w-5" /> : <ReceiptPlaceholder />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {title || "Expense title"}
                </p>
                <p className="text-xs text-zinc-500">
                  {cat?.label ?? "Category"} · {vendor || "Vendor"}
                </p>
              </div>
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-white">
              ₹{amount ? Number(amount).toLocaleString("en-IN") : "0"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {expenseDate
                ? new Date(expenseDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Pick a date"}{" "}
              · {file ? "Receipt attached" : "No receipt"}
            </p>
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            What happens next
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            {NEXT_STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 text-xs leading-relaxed text-zinc-400">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-volt-500/12 font-display text-[10px] font-bold text-volt-400">
                  {i + 1}
                </span>
                {role === "owner" && i === 1
                  ? "As the owner, your entries go in like everyone else's — other expenses from your team land in your review queue."
                  : s}
              </li>
            ))}
          </ol>
        </div>
      </motion.aside>
    </div>
  );
}

function ReceiptPlaceholder() {
  return <FileText className="h-5 w-5" />;
}
