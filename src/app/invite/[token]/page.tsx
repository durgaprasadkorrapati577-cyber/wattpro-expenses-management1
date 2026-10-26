import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { LogoLockup, BoltMark } from "@/components/logo";
import { EnergyField } from "@/components/energy-field";
import { InviteAcceptForm } from "@/components/auth-forms";
import { Link2Off, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Accept your invite" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const rows = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);
  const invite = rows[0];
  const valid =
    invite && invite.status === "pending" && invite.expiresAt > new Date();

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
            {valid ? (
              <>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-volt-500/15 text-volt-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                  You&rsquo;re invited to WATTPRO Solar
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  The owner of WATTPRO Solar Energy Pvt. Ltd. has invited you to
                  the company expense desk. Set your password to activate your
                  account.
                </p>
                <div className="mt-7">
                  <InviteAcceptForm
                    token={token}
                    name={invite.name}
                    email={invite.email}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <Link2Off className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-white">
                    This invite is no longer valid
                  </h1>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                    The link may have expired, been revoked, or already used.
                    Ask the owner to send you a fresh invite.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-volt-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-volt-400"
                >
                  <BoltMark size={20} className="hidden" />
                  Go to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
