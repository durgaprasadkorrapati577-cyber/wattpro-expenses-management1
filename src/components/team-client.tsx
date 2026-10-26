"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserPlus,
  Link2,
  Copy,
  CheckCheck,
  Ban,
  KeyRound,
  Power,
  PowerOff,
  UsersRound,
  MailPlus,
  Crown,
} from "lucide-react";
import { formatCompactINR, formatDate } from "@/lib/format";
import { Badge, Button, EmptyState, Field, Input, Modal } from "@/components/ui";
import { useToast } from "@/components/toaster";

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: "owner" | "employee";
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  totalCents: number;
  expenseCount: number;
  pendingCount: number;
  monthCents: number;
}

export interface InviteRow {
  id: string;
  token: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  inviter: string;
}

function inviteLink(token: string) {
  if (typeof window === "undefined") return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

export function TeamClient({
  members,
  invites,
  currentUserId,
}: {
  members: MemberRow[];
  invites: InviteRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tempPw, setTempPw] = useState<{ name: string; pw: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const employees = members.filter((m) => m.role === "employee");
  const activeCount = employees.filter((m) => m.active).length;
  const pendingInvites = invites.filter((i) => i.status === "pending");

  async function copyLink(token: string, id: string) {
    try {
      await navigator.clipboard.writeText(inviteLink(token));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink(token);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }

  async function memberAction(id: string, action: string, name: string) {
    setBusy(id + action);
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        tempPassword?: string;
      };
      if (!res.ok) {
        toast("error", "Action failed", data.error ?? "Try again");
        return;
      }
      if (action === "reset-password" && data.tempPassword) {
        setTempPw({ name, pw: data.tempPassword });
      } else {
        toast(
          "success",
          action === "deactivate" ? "Access suspended" : "Access restored",
          name,
        );
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function revokeInvite(id: string, name: string) {
    setBusy(id + "revoke");
    try {
      const res = await fetch(`/api/invites/${id}/revoke`, { method: "POST" });
      if (!res.ok) {
        toast("error", "Could not revoke", "Try again");
        return;
      }
      toast("info", "Invite revoked", name);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt-500">
            Owner console
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
            Team &amp; invites
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {activeCount} active employee{activeCount === 1 ? "" : "s"} ·{" "}
            {pendingInvites.length} pending invite
            {pendingInvites.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
          Invite employee
        </Button>
      </div>

      <div className="rounded-2xl border border-volt-500/20 bg-volt-500/[0.05] px-5 py-4">
        <p className="text-xs leading-relaxed text-zinc-400">
          <span className="font-semibold text-volt-300">Invite-only access.</span>{" "}
          Nobody can create an account on their own. Generate an invite link and
          share it on WhatsApp or SMS — the employee sets their own password when
          they open it.
        </p>
      </div>

      {/* Members */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-white">
          <UsersRound className="h-4 w-4 text-volt-500" />
          Members
        </h2>
        <div className="card-surface divide-y divide-white/5">
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
                    m.role === "owner"
                      ? "bg-gradient-to-br from-volt-400 to-volt-600 text-ink-950"
                      : "bg-white/[0.06] text-volt-300"
                  }`}
                >
                  {m.role === "owner" ? (
                    <Crown className="h-5 w-5" />
                  ) : (
                    m.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {m.name}
                      {m.id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-zinc-500">
                          (you)
                        </span>
                      )}
                    </p>
                    <Badge tone={m.role === "owner" ? "owner" : "neutral"} dot={false}>
                      {m.role}
                    </Badge>
                    {!m.active && <Badge tone="rejected">suspended</Badge>}
                    {m.mustChangePassword && (
                      <Badge tone="pending" dot={false}>
                        temp password
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {m.email} · joined {formatDate(m.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 pl-[52px] sm:pl-0">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    This month
                  </p>
                  <p className="font-display text-sm font-bold text-white">
                    {formatCompactINR(m.monthCents)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Entries
                  </p>
                  <p className="font-display text-sm font-bold text-white">
                    {m.expenseCount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Pending
                  </p>
                  <p
                    className={`font-display text-sm font-bold ${
                      m.pendingCount > 0 ? "text-amber-300" : "text-white"
                    }`}
                  >
                    {m.pendingCount}
                  </p>
                </div>
              </div>

              {m.role !== "owner" && (
                <div className="flex items-center gap-1.5 pl-[52px] sm:pl-2">
                  {m.active && (
                    <button
                      onClick={() => memberAction(m.id, "reset-password", m.name)}
                      disabled={busy !== null}
                      title="Reset password (gives a temporary password)"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-volt-300 disabled:opacity-50"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                  )}
                  {m.active ? (
                    <button
                      onClick={() => memberAction(m.id, "deactivate", m.name)}
                      disabled={busy !== null}
                      title="Suspend access"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-rose-300 disabled:opacity-50"
                    >
                      <PowerOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => memberAction(m.id, "activate", m.name)}
                      disabled={busy !== null}
                      title="Restore access"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-emerald-300 disabled:opacity-50"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Invites */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-white">
          <MailPlus className="h-4 w-4 text-volt-500" />
          Invite links
        </h2>
        {invites.length === 0 ? (
          <EmptyState
            icon={<Link2 className="h-6 w-6" />}
            title="No invites yet"
            description="Create your first invite link and share it with an employee so they can activate their account."
            action={
              <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setInviteOpen(true)}>
                Invite employee
              </Button>
            }
          />
        ) : (
          <div className="card-surface divide-y divide-white/5">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100">{inv.name}</p>
                    <Badge
                      tone={
                        inv.status === "pending"
                          ? "pending"
                          : inv.status === "accepted"
                            ? "approved"
                            : "rejected"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {inv.email} · by {inv.inviter} · expires{" "}
                    {formatDate(inv.expiresAt)}
                  </p>
                </div>
                {inv.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={
                        copied === inv.id ? (
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )
                      }
                      onClick={() => copyLink(inv.token, inv.id)}
                    >
                      {copied === inv.id ? "Copied" : "Copy link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Ban className="h-3.5 w-3.5" />}
                      loading={busy === inv.id + "revoke"}
                      onClick={() => revokeInvite(inv.id, inv.name)}
                      className="text-zinc-500 hover:!text-rose-300"
                    >
                      Revoke
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite modal */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={() => {
          router.refresh();
        }}
      />

      {/* Temp password modal */}
      <Modal
        open={tempPw !== null}
        onClose={() => setTempPw(null)}
        title="Password reset"
        subtitle={`Share this temporary password with ${tempPw?.name ?? ""}`}
      >
        <p className="text-sm leading-relaxed text-zinc-400">
          The old password no longer works. Send this temporary password and ask{" "}
          {tempPw?.name.split(" ")[0]} to sign in — they&rsquo;ll be asked to set
          a new one immediately.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-volt-500/25 bg-ink-800 px-4 py-3">
          <code className="font-display text-lg font-bold tracking-wide text-volt-300">
            {tempPw?.pw}
          </code>
          <Button
            size="sm"
            variant="outline"
            icon={copied === "pw" ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            onClick={async () => {
              if (!tempPw) return;
              await navigator.clipboard.writeText(tempPw.pw).catch(() => {});
              setCopied("pw");
              setTimeout(() => setCopied(null), 1800);
            }}
          >
            {copied === "pw" ? "Copied" : "Copy"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------- Invite modal ------------------------------ */

function InviteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ token: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        invite?: { token: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Could not create invite");
        return;
      }
      setCreated({ token: data.invite!.token, name });
      toast("success", "Invite created", "Share the link with the employee.");
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(inviteLink(created.token));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink(created.token);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const link = created ? inviteLink(created.token) : "";

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setTimeout(reset, 250);
      }}
      title={created ? "Invite link ready" : "Invite an employee"}
      subtitle={created ? "Share this one-time link" : "Only invited people can join"}
    >
      <AnimatePresence mode="wait">
        {created ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-2 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"
            >
              <CheckCheck className="h-7 w-7" />
            </motion.div>
            <p className="text-sm text-zinc-400">
              Send this link to{" "}
              <span className="font-semibold text-zinc-200">{created.name}</span> —
              it works once and expires in 7 days.
            </p>
            <div className="w-full rounded-xl border border-volt-500/25 bg-ink-800 px-4 py-3">
              <p className="break-all text-left font-mono text-xs leading-relaxed text-volt-200">
                {link}
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button onClick={copy} icon={copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                {copied ? "Copied!" : "Copy link"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onClose();
                  setTimeout(reset, 250);
                }}
              >
                Done
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
          >
            <Field label="Employee name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
                minLength={2}
                autoFocus
              />
            </Field>
            <Field label="Employee email" hint="They'll use this email to sign in">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@wattprosolar.in"
                required
              />
            </Field>
            {error && (
              <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} icon={<Link2 className="h-4 w-4" />}>
              Generate invite link
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
