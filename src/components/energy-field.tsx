"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas backdrop: drifting electric particles linked by faint filaments,
 * with occasional lightning strikes. Pointer-reactive, DPR aware.
 */
export function EnergyField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const count = Math.min(90, Math.floor((w * h) / 14000) || 40);
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
    }));

    interface Bolt {
      pts: Array<{ x: number; y: number }>;
      life: number;
      max: number;
    }
    let bolts: Bolt[] = [];
    let boltTimer = 80 + Math.random() * 160;

    function spawnBolt() {
      const startX = Math.random() * w;
      const pts = [{ x: startX, y: -10 }];
      let x = startX;
      let y = -10;
      const endY = h * (0.35 + Math.random() * 0.5);
      while (y < endY) {
        y += 14 + Math.random() * 22;
        x += (Math.random() - 0.5) * 46;
        pts.push({ x, y });
      }
      bolts.push({ pts, life: 0, max: 26 });
    }

    const LINK = 110;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          p.x += (dx / d) * 0.6;
          p.y += (dy / d) * 0.6;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 107, 0, 0.5)";
        ctx.fill();
      }

      // filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.14;
            ctx.strokeStyle = `rgba(255, 107, 0, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // lightning
      boltTimer -= 1;
      if (boltTimer <= 0) {
        spawnBolt();
        boltTimer = 140 + Math.random() * 260;
      }
      bolts = bolts.filter((b) => b.life < b.max);
      for (const b of bolts) {
        b.life += 1;
        const t = 1 - b.life / b.max;
        const flicker = Math.random() > 0.3 ? 1 : 0.4;
        ctx.strokeStyle = `rgba(255, 148, 77, ${0.35 * t * flicker})`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = "rgba(255, 107, 0, 0.8)";
        ctx.shadowBlur = 12 * t;
        ctx.beginPath();
        ctx.moveTo(b.pts[0].x, b.pts[0].y);
        for (const pt of b.pts.slice(1)) ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "absolute inset-0 h-full w-full"}
      aria-hidden
    />
  );
}
