import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { readLocalReceipt } from "@/lib/storage";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const { id } = await ctx.params;
  const rows = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  const expense = rows[0];

  if (!expense || !expense.receiptPath || !expense.receiptMime)
    return NextResponse.json({ error: "No receipt found" }, { status: 404 });
  if (user.role !== "owner" && expense.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If it's a Cloudinary URL (starts with https://), redirect to it directly
  if (expense.receiptPath.startsWith("http")) {
    return NextResponse.redirect(expense.receiptPath);
  }

  // Otherwise serve from local disk (dev mode)
  const data = await readLocalReceipt(expense.receiptPath);
  if (!data)
    return NextResponse.json({ error: "Receipt file is missing" }, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": expense.receiptMime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(expense.receiptName ?? "receipt")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
