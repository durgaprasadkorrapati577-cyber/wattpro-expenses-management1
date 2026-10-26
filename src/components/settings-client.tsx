"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, Crown, Save } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth-forms";
import { Badge, Button, Field, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/toaster";
import { formatDate } from "@/lib/format";

interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "employee";
  createdAt: string;
}

interface CompanyShape {
  companyName: string;
  email: string;
  phone: string;
  address: string;
}

export function SettingsClient({
  user,
  company,
}: {
  user: SettingsUser;
  company: CompanyShape;
}) {
  const isOwner = user.role === "owner";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt-500">
          Account
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your profile, security and company details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Profile */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface p-6"
        >
          <h2 className="font-display text-base font-semibold text-white">
            Profile
          </h2>
          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-volt-400 to-volt-600 font-display text-lg font-bold text-ink-950">
              {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-display text-lg font-bold text-white">
                  {user.name}
                </p>
                <Badge tone={isOwner ? "owner" : "neutral"} dot={false}>
                  {isOwner && <Crown className="h-3 w-3" />}
                  {user.role}
                </Badge>
              </div>
              <p className="truncate text-sm text-zinc-500">{user.email}</p>
              <p className="mt-0.5 text-xs text-zinc-600">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <p className="mt-5 rounded-xl border border-white/5 bg-ink-800/50 px-4 py-3 text-xs leading-relaxed text-zinc-500">
            {isOwner
              ? "To change an employee's name or email, suspend the account and send a fresh invite with the correct details."
              : "Need to fix your name or email? Ask the owner — they manage team access."}
          </p>
        </motion.section>

        {/* Security */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-surface p-6"
        >
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-volt-500" />
            Security
          </h2>
          <div className="mt-5">
            <ChangePasswordForm forced={false} />
          </div>
        </motion.section>
      </div>

      {/* Company profile */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-surface p-6"
      >
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
          <Building2 className="h-4 w-4 text-volt-500" />
          Company profile
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {isOwner
            ? "Shown across the expense desk and on the sign-in page footer."
            : "Company details — managed by the owner."}
        </p>
        <CompanyForm company={company} editable={isOwner} />
      </motion.section>
    </div>
  );
}

function CompanyForm({
  company,
  editable,
}: {
  company: CompanyShape;
  editable: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState<CompanyShape>(company);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast("error", "Could not save", "Try again");
        return;
      }
      toast("success", "Company profile updated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!editable) {
    return (
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: "Company", value: company.companyName },
          { label: "Email", value: company.email || "—" },
          { label: "Phone", value: company.phone || "—" },
          { label: "Address", value: company.address || "—" },
        ].map((d) => (
          <div key={d.label} className="rounded-xl border border-white/5 px-4 py-3">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">
              {d.label}
            </dt>
            <dd className="mt-0.5 text-sm text-zinc-200">{d.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Company name">
        <Input
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          required
        />
      </Field>
      <Field label="Work phone">
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+91 …"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="info@wattprosolar.in"
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Office address">
          <Textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Shop no., street, city, state, PIN"
            className="!min-h-[72px]"
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" loading={loading} icon={<Save className="h-4 w-4" />}>
          Save company profile
        </Button>
      </div>
    </form>
  );
}
