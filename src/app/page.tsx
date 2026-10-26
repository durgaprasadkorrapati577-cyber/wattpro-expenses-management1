import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    if (user.mustChangePassword) redirect("/change-password");
    redirect("/dashboard");
  }
  redirect("/login");
}
