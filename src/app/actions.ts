"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession, destroySession, getSessionUser } from "@/lib/session";

export async function loginAction(
  _prevState: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = rows[0];

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password" };
  }

  if (!user.active) {
    return { error: "This account has been deactivated. Contact the owner." };
  }

  await createSession(user.id);

  if (user.mustChangePassword) {
    redirect("/change-password");
  }
  redirect("/dashboard");
}

export async function changePasswordAction(
  _prevState: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const newPassword = (formData.get("newPassword") as string) ?? "";
  const currentPassword = (formData.get("currentPassword") as string) ?? "";

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  if (!user.mustChangePassword) {
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return { error: "Current password is incorrect" };
    }
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false })
    .where(eq(users.id, user.id));

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
