"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Hourglass,
  BadgeCheck,
  UsersRound,
  ArrowRight,
  Plus,
  ReceiptText,
  ChartNoAxesColumn,
} from "lucide-react";
import type { DashboardStats } from "@/lib/stats";
import { formatINR, formatDate } from "@/lib/format";
import { getCategory } from "@/lib/categories";
import { AreaChart, CountUp, DonutChart, HBar } from "@/components/charts";
import { Badge, Button, EmptyState } from "@/components/ui";

const SLICE_COLORS = [
  "#ff6b00",
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
  "#94a3b8",
  "#e66000",
  "#38bdf8",
  "#a3e635",
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

function buildDailySeries(
  daily: DashboardStats["daily"],
): Array<{ label: string; value: number }> {
  const map = new Map(daily.map((d) => [d.date, d.amount]));
  const out: Array<{ label: string; value: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const off = d.getTimezoneOffset();
    const key = new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
    out.push({
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value: map.get(key) ?? 0,
    });
  }
  return out;
}

export function DashboardClient({
  stats,
  userName,
  role,
}: {
  stats: DashboardStats;
  userName: string;
  role: "owner" | "employee";
}) {
  const t = stats.totals;
  const isOwner = role === "owner";
  const delta =
    t.lastMonth > 0
      ? ((t.thisMonth - t.lastMonth) / t.lastMonth) * 100
      : t.thisMonth > 0
        ? 100
        : 0;
  const dailySeries = buildDailySeries(stats.daily);
  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const kpis = [
    {
      label: isOwner ? "Company spend" : "My spend",
      sub: monthLabel,
      value: t.thisMonth,
      icon: Wallet,
      trend: delta,
    },
    {
      label: "Pending review",
      sub: `${t.pendingCount} expense${t.pendingCount === 1 ? "" : "s"}`,
      value: t.pendingAmount,
      icon: Hourglass,
      amber: true,
    },
    {
      label: isOwner ? "Approved this month" : "My approved, this month",
      sub: monthLabel,
      value: t.approvedThisMonth,
      icon: BadgeCheck,
    },
    {
      label: isOwner ? "Active employees" : "All-time logged",
      sub: isOwner ? "on the expense desk" : `${t.expenseCount} entries`,
      value: isOwner ? stats.employeeCount : t.allTime,
      icon: UsersRound,
      raw: isOwner,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt-500">
            {isOwner ? "Owner console" : "Expense desk"}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Namaste, {userName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link href="/expenses/new">
          <Button icon={<Plus className="h-4 w-4" />} size="lg">
            Log an expense
          </Button>
        </Link>
      </motion.div>

      {/* Pending CTA for owner */}
      {isOwner && t.pendingCount > 0 && (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
            </span>
            <p className="text-sm text-amber-200">
              <span className="font-semibold">{t.pendingCount}</span> expense
              {t.pendingCount === 1 ? "" : "s"} worth{" "}
              <span className="font-semibold">{formatINR(t.pendingAmount)}</span>{" "}
              waiting for your review
            </p>
          </div>
          <Link href="/approvals">
            <Button variant="outline" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              Review now
            </Button>
          </Link>
        </motion.div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.06 + i * 0.05 }}
            className="card-surface group relative overflow-hidden p-5 transition-colors hover:border-volt-500/25"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-volt-500/[0.06] blur-2xl transition group-hover:bg-volt-500/[0.12]" />
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-zinc-500">{k.label}</p>
              <div className="rounded-xl bg-white/[0.04] p-2 text-volt-400">
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-display text-[1.7rem] font-bold leading-none tracking-tight text-white">
              {k.raw ? (
                <CountUp value={k.value} format={(n) => Math.round(n).toString()} />
              ) : (
                <CountUp value={k.value / 100} format={(n) => `₹${Math.round(n).toLocaleString("en-IN")}`} />
              )}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              {k.trend !== undefined ? (
                k.trend >= 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-rose-300">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {Math.abs(k.trend).toFixed(0)}% vs last month
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-300">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {Math.abs(k.trend).toFixed(0)}% vs last month
                  </span>
                )
              ) : (
                <span className={k.amber ? "text-amber-300/90" : "text-zinc-500"}>
                  {k.sub}
                </span>
              )}
              {k.trend !== undefined && (
                <span className="text-zinc-600">· {k.sub}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.14 }}
          className="card-surface p-5 sm:p-6"
        >
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Daily spend
              </h2>
              <p className="text-xs text-zinc-500">Last 14 days</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2 text-volt-400">
              <ChartNoAxesColumn className="h-4 w-4" />
            </div>
          </div>
          {dailySeries.some((d) => d.value > 0) ? (
            <AreaChart points={dailySeries} />
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-zinc-600">
              No spend recorded in the last two weeks
            </div>
          )}
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="card-surface p-5 sm:p-6"
        >
          <h2 className="font-display text-base font-semibold text-white">
            By category
          </h2>
          <p className="mb-5 text-xs text-zinc-500">{monthLabel}</p>
          {stats.byCategory.length > 0 ? (
            <DonutChart
              slices={stats.byCategory.slice(0, 6).map((c, i) => ({
                label: getCategory(c.category).label,
                value: c.amount,
                color: SLICE_COLORS[i % SLICE_COLORS.length],
              }))}
            />
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-zinc-600">
              No categories yet this month
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.6fr]">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.22 }}
          className="card-surface p-5 sm:p-6"
        >
          {isOwner ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Spend by teammate
                  </h2>
                  <p className="text-xs text-zinc-500">{monthLabel}</p>
                </div>
                <Link
                  href="/team"
                  className="text-xs font-medium text-volt-400 hover:text-volt-300"
                >
                  Manage →
                </Link>
              </div>
              {stats.byEmployee.length > 0 &&
              stats.byEmployee.some((e) => e.count > 0) ? (
                <HBar
                  rows={stats.byEmployee
                    .filter((e) => e.count > 0)
                    .slice(0, 6)
                    .map((e) => ({
                      label: e.name,
                      sub: `${e.count} expense${e.count === 1 ? "" : "s"}`,
                      value: e.amount,
                    }))}
                />
              ) : (
                <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-center">
                  <p className="text-sm text-zinc-500">
                    No teammate spend yet this month.
                  </p>
                  <Link href="/team" className="text-xs font-medium text-volt-400 hover:text-volt-300">
                    Invite your first employee →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="font-display text-base font-semibold text-white">
                  Monthly trend
                </h2>
                <p className="text-xs text-zinc-500">This year</p>
              </div>
              {stats.monthly.length > 0 ? (
                <HBar
                  rows={stats.monthly.slice(-6).map((m) => ({
                    label: new Date(m.month + "-02").toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    }),
                    sub: "",
                    value: m.amount,
                  }))}
                />
              ) : (
                <div className="flex h-[150px] items-center justify-center text-sm text-zinc-600">
                  Your monthly spend will appear here
                </div>
              )}
            </>
          )}
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.26 }}
          className="card-surface p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Recent expenses
              </h2>
              <p className="text-xs text-zinc-500">Latest activity</p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-medium text-volt-400 hover:text-volt-300"
            >
              View all →
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-6 w-6" />}
              title="No expenses yet"
              description={
                isOwner
                  ? "Once the team starts logging site expenses, they'll show up here for monitoring."
                  : "Log your first expense — attach a bill or receipt and send it for approval."
              }
              action={
                <Link href="/expenses/new">
                  <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                    Log an expense
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {stats.recent.map((e, i) => {
                const cat = getCategory(e.category);
                return (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Link
                      href="/expenses"
                      className="flex items-center gap-3.5 rounded-lg px-2 py-3 transition hover:bg-white/[0.03]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-volt-400">
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {e.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {isOwner && <span className="text-zinc-400">{e.userName} · </span>}
                          {formatDate(e.expenseDate)} · {cat.label}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="font-display text-sm font-bold text-white">
                          {formatINR(e.amountCents)}
                        </p>
                        <Badge tone={e.status as "pending" | "approved" | "rejected"}>
                          {e.status}
                        </Badge>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
