"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  type LabelHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-volt-500 text-ink-950 font-semibold hover:bg-volt-400 disabled:hover:bg-volt-500 shadow-glow",
  ghost: "text-zinc-300 hover:bg-white/5 hover:text-white",
  outline:
    "border border-ink-500 bg-transparent text-zinc-200 hover:border-volt-500/60 hover:text-volt-300",
  danger:
    "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20",
  subtle: "bg-white/5 text-zinc-200 hover:bg-white/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-sm rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, icon, className, children, disabled, ...props },
    ref,
  ) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={cn(
        "volt-ring inline-flex select-none items-center justify-center font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...(props as object)}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  ),
);
Button.displayName = "Button";

/* ---------------------------------- Field ---------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Input ---------------------------------- */

const fieldBase =
  "w-full rounded-xl border border-ink-600 bg-ink-800/80 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-volt-500/70 focus:outline-none focus:ring-2 focus:ring-volt-500/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-[96px] resize-none py-3", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, "h-11 appearance-none pr-9", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
    }}
    {...props}
  />
));
Select.displayName = "Select";

/* ---------------------------------- Badge ---------------------------------- */

export type StatusTone = "pending" | "approved" | "rejected" | "neutral" | "owner";

const tones: Record<StatusTone, string> = {
  pending: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  approved: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  rejected: "bg-rose-400/10 text-rose-300 border-rose-400/25",
  neutral: "bg-zinc-400/10 text-zinc-300 border-zinc-400/25",
  owner: "bg-volt-500/10 text-volt-300 border-volt-500/30",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = true,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "glass relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl shadow-card sm:rounded-3xl",
              wide ? "max-w-3xl" : "max-w-lg",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- Divider --------------------------------- */

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/5", className)} />;
}

/* ------------------------------- Empty state ------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-600 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-volt-500/10 text-volt-400">
        {icon}
      </div>
      <div>
        <p className="font-display text-base font-semibold text-zinc-100">
          {title}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
