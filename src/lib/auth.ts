import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User } from "@/db/schema";
import { getSessionUser } from "./session";

/** Page-layout guard: redirects when not authenticated. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/dashboard");
  return user;
}

/** API guard: returns the user or a ready-to-return 401/403 response. */
export async function requireApiUser(): Promise<
  { user: User; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user };
}

export async function requireApiOwner(): Promise<
  { user: User; error?: never } | { user?: never; error: NextResponse }
> {
  const res = await requireApiUser();
  if (res.error) return res;
  if (res.user.role !== "owner") {
    return {
      error: NextResponse.json(
        { error: "Owner access required" },
        { status: 403 },
      ),
    };
  }
  return res;
}
