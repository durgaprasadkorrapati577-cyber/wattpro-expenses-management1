import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireApiUser, requireApiOwner } from "@/lib/auth";
import { deleteReceipt } from "@/lib/storage";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiOwner();
  if (error) return error;

  const { id } = await ctx.params;
  const body = (await req.json()) as { action?: string; reviewNote?: string };

  if (body.action !== "approve" && body.action !== "reject")
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const [updated] = await db
    .update(expenses)
    .set({
      status: body.action === "approve" ? "approved" : "rejected",
      reviewNote: body.reviewNote?.trim() || null,
      reviewedById: user.id,
      reviewedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning({ id: expenses.id });

  if (!updated)
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const { id } = await ctx.params;
  const rows = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  const expense = rows[0];
  if (!expense)
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  const isOwner = user.role === "owner";
  const owns = expense.userId === user.id;
  if (!isOwner && !(owns && expense.status === "pending"))
    return NextResponse.json(
      { error: "Only the owner can delete reviewed expenses" },
      { status: 403 },
    );

  await db.delete(expenses).where(eq(expenses.id, id));
  if (expense.receiptPath) {
    await deleteReceipt(expense.receiptPath);
  }
  return NextResponse.json({ ok: true });
}
