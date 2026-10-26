"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  ReceiptText,
  BadgeCheck,
  UsersRound,
  Settings2,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { LogoLockup } from "@/components/logo";
import { Badge } from "@/components/ui";
import { useToast } from "@/components/toaster";
import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "employee";
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, ownerOnly: false },
  { href: "/expenses", label: "Expenses", icon: ReceiptText, ownerOnly: false },
  { href: "/approvals", label: "Approvals", icon: BadgeCheck, ownerOnly: true },
  { href: "/team", label: "Team & Invites", icon: UsersRound, ownerOnly: true },
  { href: "/settings", label: "Settings", icon: Settings2, ownerOnly: false },
];

function NavItems({
  user,
  onNavigate,
}: {
  user: ShellUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.filter((n) => !n.ownerOnly || user.role === "owner").map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-volt-300"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl border border-volt-500/25 bg-volt-500/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <item.icon className="relative z-10 h-[18px] w-[18px]" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  user,
  onNavigate,
  onLogout,
  loggingOut,
}: {
  user: ShellUser;
  onNavigate?: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <LogoLockup size={40} />
      </div>

      <div className="px-3">
        <Link
          href="/expenses/new"
          onClick={onNavigate}
          className="group flex items-center justify-center gap-2 rounded-xl bg-volt-500 px-4 py-3 text-sm font-semibold text-ink-950 shadow-glow transition hover:bg-volt-400"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          New expense
        </Link>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-3">
        <p className="px-3.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
          Workspace
        </p>
        <NavItems user={user} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-volt-400 to-volt-600 font-display text-sm font-bold text-ink-950">
            {user.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {user.name}
            </p>
            <Badge
              tone={user.role === "owner" ? "owner" : "neutral"}
              dot={false}
              className="mt-0.5 !px-1.5 !py-0 text-[9px] uppercase tracking-wider"
            >
              {user.role}
            </Badge>
          </div>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-rose-300"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logoutAction();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-dvh bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/5 bg-ink-900/80 backdrop-blur-xl lg:block">
        <SidebarContent user={user} onLogout={onLogout} loggingOut={loggingOut} />
      </aside>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-ink-950/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <LogoLockup size={34} compact={false} />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-300 hover:bg-white/5"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 w-[272px] border-r border-white/5 bg-ink-900"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-zinc-500 hover:bg-white/5"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent
                user={user}
                onNavigate={() => setMobileOpen(false)}
                onLogout={onLogout}
                loggingOut={loggingOut}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-[248px]">
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
