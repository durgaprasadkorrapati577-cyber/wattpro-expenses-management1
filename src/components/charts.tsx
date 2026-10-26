"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useInView } from "framer-motion";
import { formatINR, formatCompactINR } from "@/lib/format";

/* --------------------------------- CountUp -------------------------------- */

export function CountUp({
  value,
  format = (n: number) => Math.round(n).toString(),
  duration = 900,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(display)}
    </span>
  );
}

/* -------------------------------- AreaChart ------------------------------- */

interface Point {
  label: string;
  value: number;
}

export function AreaChart({ points, height = 180 }: { points: Point[]; height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState<number | null>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padX = 6;
  const padTop = 14;
  const padBottom = 8;
  const max = Math.max(...points.map((p) => p.value), 1);
  const usableW = width - padX * 2;
  const usableH = height - padTop - padBottom;

  const coords = points.map((p, i) => ({
    x: padX + (points.length === 1 ? usableW / 2 : (i / (points.length - 1)) * usableW),
    y: padTop + usableH - (p.value / max) * usableH,
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(2)},${height - padBottom} L${coords[0].x.toFixed(2)},${height - padBottom} Z`;

  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={width}
        height={height}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="block"
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={width - padX}
            y1={padTop + usableH * t}
            y2={padTop + usableH * t}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 6"
          />
        ))}
        <motion.path
          d={area}
          fill={`url(#area-${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="#ff6b00"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        {hover !== null && coords[hover] && (
          <g>
            <line
              x1={coords[hover].x}
              x2={coords[hover].x}
              y1={padTop - 6}
              y2={height - padBottom}
              stroke="rgba(255,107,0,0.35)"
            />
            <circle
              cx={coords[hover].x}
              cy={coords[hover].y}
              r={4.5}
              fill="#ff6b00"
              stroke="#0a0a0c"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-center shadow-card"
          style={{
            left: Math.min(Math.max(coords[hover].x, 56), width - 56),
            top: 0,
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {points[hover].label}
          </p>
          <p className="font-display text-sm font-bold text-volt-300">
            {formatINR(points[hover].value)}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- DonutChart ------------------------------- */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 190,
  thickness = 26,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = useMemo(
    () =>
      slices.map((s) => {
        const frac = total > 0 ? s.value / total : 0;
        const dash = frac * circ;
        const arc = { ...s, dash, offset };
        offset += dash;
        return arc;
      }),
    [slices, total, circ],
  );

  const center =
    active !== null && arcs[active]
      ? { label: arcs[active].label, value: arcs[active].value }
      : { label: "Total", value: total };

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={thickness}
          />
          {arcs.map((a, i) => (
            <motion.circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={active === i ? thickness + 4 : thickness}
              strokeDasharray={`${a.dash} ${circ - a.dash}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: active === null || active === i ? 1 : 0.25 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              style={{ cursor: "pointer", transition: "stroke-width .2s" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="max-w-[110px] truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {center.label}
          </p>
          <p className="mt-0.5 font-display text-lg font-bold text-white">
            <CountUp value={center.value / 100} format={(n) => `₹${Math.round(n).toLocaleString("en-IN")}`} />
          </p>
        </div>
      </div>
      <ul className="flex min-w-0 flex-col gap-2">
        {arcs.map((a, i) => (
          <li
            key={a.label}
            className={`flex cursor-pointer items-center gap-2 text-xs transition-opacity ${
              active === null || active === i ? "opacity-100" : "opacity-40"
            }`}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
              style={{ background: a.color }}
            />
            <span className="truncate text-zinc-300">{a.label}</span>
            <span className="ml-auto pl-3 font-semibold text-zinc-400">
              {total > 0 ? Math.round((a.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- HBar ----------------------------------- */

export function HBar({
  rows,
}: {
  rows: Array<{ label: string; sub: string; value: number }>;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <p className="truncate font-medium text-zinc-200">
              {r.label}
              <span className="ml-2 text-[10px] text-zinc-500">{r.sub}</span>
            </p>
            <p className="shrink-0 font-semibold text-zinc-300">
              {formatCompactINR(r.value)}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-volt-600 to-volt-400"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(2.5, (r.value / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.07, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
