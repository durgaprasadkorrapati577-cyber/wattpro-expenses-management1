/**
 * Seed the WattPro Pulse database.
 * Run with: npx tsx src/db/seed.ts
 *
 * Creates:
 *  - the owner account with a TEMPORARY password (forced change on first login)
 *  - the singleton company settings row
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { companySettings, users } from "./schema";
import { hashPassword } from "../lib/password";

const OWNER_NAME = process.env.SEED_OWNER_NAME ?? "WattPro Admin";
const OWNER_EMAIL = "info@wattprosolar.in";
const OWNER_TEMP_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "WattPro#2025";

async function main() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, OWNER_EMAIL))
    .limit(1);

  if (existing[0]) {
    console.log(`• Owner already exists (${OWNER_EMAIL}) — leaving untouched.`);
  } else {
    await db.insert(users).values({
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      passwordHash: hashPassword(OWNER_TEMP_PASSWORD),
      role: "owner",
      mustChangePassword: true,
    });
    console.log(`✓ Owner created: ${OWNER_EMAIL}`);
    console.log(`  Temporary password: ${OWNER_TEMP_PASSWORD}`);
    console.log("  (forced to set a new password on first login)");
  }

  await db
    .insert(companySettings)
    .values({
      id: 1,
      companyName: "WATTPRO Solar Energy Pvt. Ltd.",
      email: "info@wattprosolar.in",
      phone: "+91 9440161253",
      address: "Guntur, Andhra Pradesh",
    })
    .onConflictDoUpdate({
      target: companySettings.id,
      set: {
        companyName: "WATTPRO Solar Energy Pvt. Ltd.",
        email: "info@wattprosolar.in",
        phone: "+91 9440161253",
        address: "Guntur, Andhra Pradesh",
      },
    });
  console.log("✓ Company settings synced with official contact details");

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
