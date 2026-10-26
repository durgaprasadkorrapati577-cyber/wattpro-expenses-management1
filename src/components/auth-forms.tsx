"use client";

import { useActionState, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  UserRound,
  ShieldAlert,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { loginAction, changePasswordAction } from "@/app/actions";

/* ─────────────────────────── helpers ────────────────────────── */

function PasswordInput({
  name,
  placeholder = "••••••••",
  autoComplete = "current-password",
  minLength,
}: {
  name: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 transition hover:text-zinc-200"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─────────────────────────── LoginForm ──────────────────────── */

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {
    error: "",
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Work email">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <Input
            type="email"
            name="email"
            placeholder="you@wattprosolar.in"
            autoComplete="email"
            required
            className="pl-10"
          />
        </div>
      </Field>

      <Field label="Password">
        <PasswordInput name="password" />
      </Field>

      <AnimatePresence>
        {state.error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-volt-500 px-6 text-sm font-semibold text-white shadow-glow transition hover:bg-volt-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LockKeyhole className="h-4 w-4" />
            Sign in
          </>
        )}
      </button>
    </form>
  );
}

/* ─────────────────────── ChangePasswordForm ─────────────────── */

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {
    error: "",
  });
  const [newPw, setNewPw] = useState("");
  const strength =
    newPw.length === 0 ? 0 : newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : 3;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {!forced && (
        <Field label="Current password">
          <PasswordInput name="currentPassword" />
        </Field>
      )}

      <Field label="New password" hint="Minimum 8 characters">
        <div className="relative">
          <Input
            type="text"
            name="newPassword"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
            className="pr-11"
            style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
            onChange={(e) => setNewPw(e.target.value)}
          />
        </div>
        {newPw.length > 0 && (
          <div className="mt-2 flex gap-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  strength >= i
                    ? i === 1
                      ? "bg-rose-400"
                      : i === 2
                        ? "bg-volt-400"
                        : "bg-emerald-400"
                    : "bg-ink-600"
                }`}
              />
            ))}
          </div>
        )}
      </Field>

      <Field label="Confirm new password">
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
        />
      </Field>

      <AnimatePresence>
        {state.error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-volt-500 px-6 text-sm font-semibold text-white shadow-glow transition hover:bg-volt-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" />
            {forced ? "Set my new password" : "Update password"}
          </>
        )}
      </button>
    </form>
  );
}

/* ─────────────────────── InviteAcceptForm ───────────────────── */

export function InviteAcceptForm({
  token,
  name,
  email,
}: {
  token: string;
  name: string;
  email: string;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const fullName = fd.get("name") as string;
    const password = fd.get("password") as string;
    const confirm = fd.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: fullName, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not activate your account");
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-volt-500/15 text-volt-400">
          <PartyPopper className="h-7 w-7" />
        </div>
        <p className="font-display text-lg font-semibold text-white">
          You&rsquo;re in!
        </p>
        <p className="text-sm text-zinc-400">
          Taking you to your expense desk…
        </p>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Invited email">
        <div className="flex h-11 items-center rounded-xl border border-ink-600 bg-ink-800/50 px-3.5 text-sm text-zinc-400">
          {email}
        </div>
      </Field>

      <Field label="Your full name">
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <Input
            name="name"
            defaultValue={name}
            required
            minLength={2}
            className="pl-10"
          />
        </div>
      </Field>

      <Field label="Create password" hint="Minimum 8 characters">
        <PasswordInput
          name="password"
          autoComplete="new-password"
          minLength={8}
        />
      </Field>

      <Field label="Confirm password">
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
        />
      </Field>

      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-volt-500 px-6 text-sm font-semibold text-white shadow-glow transition hover:bg-volt-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Activating…
          </>
        ) : (
          "Activate my account"
        )}
      </button>
    </form>
  );
}
