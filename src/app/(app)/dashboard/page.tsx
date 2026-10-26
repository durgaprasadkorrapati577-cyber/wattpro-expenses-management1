import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user);
  return (
    <DashboardClient
      stats={stats}
      userName={user.name}
      role={user.role}
    />
  );
}
