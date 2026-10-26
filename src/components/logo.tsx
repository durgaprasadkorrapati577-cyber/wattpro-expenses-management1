import { cn } from "@/lib/utils";

export function BoltMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1A2433]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="h-2/3 w-2/3">
        <path
          d="M55 10 L25 55 h20 L35 90 L75 40 H50 Z"
          fill="#FF6B00"
          className="drop-shadow-[0_0_8px_rgba(255,107,0,0.4)]"
        />
      </svg>
    </div>
  );
}

export function LogoLockup({
  compact = false,
  className,
  size = 40,
}: {
  compact?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <BoltMark size={size} />
      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center font-display text-xl font-bold tracking-tight">
            <span className="text-white">WATT</span>
            <span className="text-[#FF6B00]">PRO</span>
          </div>
          <div className="h-px w-full bg-white/20" />
          <p className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            Solar Energy Pvt. Ltd.
          </p>
        </div>
      )}
    </div>
  );
}
