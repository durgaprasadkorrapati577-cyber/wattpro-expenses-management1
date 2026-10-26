import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCompany } from "@/lib/company";
import { EnergyField } from "@/components/energy-field";
import { LogoLockup } from "@/components/logo";
import { LoginForm } from "@/components/auth-forms";
import { ShieldCheck, ReceiptText, Zap, GaugeCircle, Sun, MapPin, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    if (user.mustChangePassword) redirect("/change-password");
    redirect("/dashboard");
  }
  const company = await getCompany();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink-950">
      {/* Ambient background */}
      <div className="grid-lines absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(1100px_500px_at_15%_-10%,rgba(255,107,0,0.12),transparent_60%),radial-gradient(900px_500px_at_100%_110%,rgba(255,107,0,0.08),transparent_60%)]" />
      <EnergyField className="absolute inset-0 hidden h-full w-full lg:block" />
      <div className="noise pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        {/* Brand panel */}
        <section className="hidden lg:block">
          <LogoLockup size={46} />
          <h1 className="mt-10 font-display text-[3.4rem] font-bold leading-[1.02] tracking-tight text-white">
            Every rupee,
            <br />
            <span className="text-glow text-volt-400">accounted for.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">
            {company.companyName}&rsquo;s private expense desk. The team logs
            site expenses, bills and receipts — the owner reviews and approves
            them in real time. Invite-only access, always under control.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            {[
              {
                icon: ReceiptText,
                title: "Receipts & bills",
                text: "Snap a photo or attach a PDF — stored with every entry.",
              },
              {
                icon: GaugeCircle,
                title: "Live monitoring",
                text: "Spend by person, category and month at a glance.",
              },
              {
                icon: ShieldCheck,
                title: "Invite-only",
                text: "No public sign-up. Only people you invite can get in.",
              },
              {
                icon: Zap,
                title: "Fast approvals",
                text: "Approve or reject in one tap, with review notes.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-surface p-4 transition-colors hover:border-volt-500/30"
              >
                <f.icon className="h-5 w-5 text-volt-400" />
                <p className="mt-2.5 font-display text-sm font-semibold text-zinc-100">
                  {f.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {f.text}
                </p>
              </div>
            ))}
          </div>

          {/* Contact footer on login */}
          <div className="mt-10 flex flex-wrap items-center gap-5 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-volt-500/70" />
              Guntur, Andhra Pradesh
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-volt-500/70" />
              +91 9440161253
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-volt-500/70" />
              info@wattprosolar.in
            </span>
          </div>
        </section>

        {/* Auth card */}
        <section className="w-full">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <LogoLockup size={38} />
            </div>
            <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-card">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-volt-500/20 blur-3xl" />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400">
                  Sign in with the credentials shared by the owner.
                </p>
                <div className="mt-7">
                  <LoginForm />
                </div>
                <div className="mt-6 rounded-xl border border-ink-600 bg-ink-800/60 px-4 py-3">
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    <span className="font-semibold text-zinc-300">
                      Invite-only system.
                    </span>{" "}
                    There is no public sign-up — ask the owner to send you an
                    invite link.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-[11px] text-zinc-600">
              © {new Date().getFullYear()} {company.companyName} · Internal
              expense system
              {company.phone ? ` · ${company.phone}` : ""}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
