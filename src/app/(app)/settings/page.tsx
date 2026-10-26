import { requireUser } from "@/lib/auth";
import { getCompany } from "@/lib/company";
import { SettingsClient } from "@/components/settings-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const company = await getCompany();
  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }}
      company={{
        companyName: company.companyName,
        email: company.email,
        phone: company.phone,
        address: company.address,
      }}
    />
  );
}
