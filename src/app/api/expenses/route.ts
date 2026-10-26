import { NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { queryExpenses, type ExpenseFilters } from "@/lib/expenses";
import { CATEGORY_VALUES } from "@/lib/categories";
import { uploadReceipt } from "@/lib/storage";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function GET(req: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const url = new URL(req.url);
  const filters: ExpenseFilters = {
    status: url.searchParams.get("status") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    userId: url.searchParams.get("userId") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  };
  const rows = await queryExpenses(user, filters);
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  if (user.mustChangePassword) {
    return NextResponse.json(
      { error: "Change your temporary password first" },
      { status: 403 },
    );
  }

  try {
    const form = await req.formData();
    const title = String(form.get("title") ?? "").trim();
    const vendor = String(form.get("vendor") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const amountRaw = String(form.get("amount") ?? "").trim();
    const expenseDate = String(form.get("expenseDate") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    const receipt = form.get("receipt");

    if (!title || title.length < 2)
      return NextResponse.json({ error: "Expense title is required" }, { status: 400 });
    if (!CATEGORY_VALUES.includes(category))
      return NextResponse.json({ error: "Please choose a valid category" }, { status: 400 });

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)
      return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate))
      return NextResponse.json({ error: "Enter a valid expense date" }, { status: 400 });

    let receiptPath: string | null = null;
    let receiptName: string | null = null;
    let receiptMime: string | null = null;

    if (receipt instanceof File && receipt.size > 0) {
      if (!ALLOWED_MIME.has(receipt.type))
        return NextResponse.json(
          { error: "Receipt must be a JPG, PNG, WEBP or PDF" },
          { status: 400 },
        );
      if (receipt.size > MAX_FILE_BYTES)
        return NextResponse.json({ error: "Receipt too large (max 8 MB)" }, { status: 400 });

      const buffer = Buffer.from(await receipt.arrayBuffer());
      const stored = await uploadReceipt(buffer, receipt.type, receipt.name);
      receiptPath = stored.key;
      receiptName = receipt.name.slice(0, 180);
      receiptMime = receipt.type;
    }

    const [row] = await db
      .insert(expenses)
      .values({
        userId: user.id,
        title,
        vendor: vendor || null,
        category,
        amountCents: Math.round(amount * 100),
        expenseDate,
        notes: notes || null,
        receiptPath,
        receiptName,
        receiptMime,
      })
      .returning({ id: expenses.id });

    return NextResponse.json({ id: row.id, ok: true });
  } catch (err) {
    console.error("Expense POST error:", err);
    return NextResponse.json({ error: "Could not save the expense. Try again." }, { status: 500 });
  }
}
