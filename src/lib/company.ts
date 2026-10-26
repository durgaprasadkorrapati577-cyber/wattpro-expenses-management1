import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companySettings, type CompanySettings } from "@/db/schema";

export async function getCompany(): Promise<CompanySettings> {
  const rows = await db.select().from(companySettings).where(eq(companySettings.id, 1)).limit(1);
  if (rows[0]) return rows[0];
  await db
    .insert(companySettings)
    .values({ id: 1 })
    .onConflictDoNothing();
  const again = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.id, 1))
    .limit(1);
  return again[0]!;
}
