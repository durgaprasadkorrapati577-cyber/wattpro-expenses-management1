import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LogoLockup } from "@/components/logo";
import { EnergyField } from "@/components/energy-field";
import { ChangePasswordForm } from "@/components/auth-forms";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Secure your account" };

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="grid-lines absolute inset-0 opacity-50" />
      <EnergyField className="absolute inset-0 h-full w-full opacity-60" />
      <div className="noise pointer-events-none absolute inset-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <LogoLockup size={42} />
        </div>
        <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-card">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-volt-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-volt-500/15 text-volt-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              {user.mustChangePassword
                ? "Set your new password"
                : "Change password"}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              {user.mustChangePassword
                ? `Hi ${user.name.split(" ")[0]} — you're signed in with a temporary password. Choose your own password to continue.`
                : "Update the password for your account."}
            </p>
            <div className="mt-7">
              <ChangePasswordForm forced={user.mustChangePassword} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
