import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companySettings } from "@/db/schema";
import { requireApiUser, requireApiOwner } from "@/lib/auth";
import { getCompany } from "@/lib/company";

export async function GET() {
  const { error } = await requireApiUser();
  if (error) return error;
  const company = await getCompany();
  return NextResponse.json({ company });
}

export async function PATCH(req: Request) {
  const { error } = await requireApiOwner();
  if (error) return error;

  const body = (await req.json()) as {
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const companyName = body.companyName?.trim() || "WattPro";
  const [updated] = await db
    .update(companySettings)
    .set({
      companyName: companyName.slice(0, 80),
      email: (body.email ?? "").trim().slice(0, 120),
      phone: (body.phone ?? "").trim().slice(0, 40),
      address: (body.address ?? "").trim().slice(0, 300),
      updatedAt: new Date(),
    })
    .where(eq(companySettings.id, 1))
    .returning();

  return NextResponse.json({ company: updated });
}
