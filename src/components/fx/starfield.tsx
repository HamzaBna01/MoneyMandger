"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-screen twinkling starfield with depth parallax and the odd shooting
 * star. Only drawn in dark mode; pauses when the tab is hidden.
 */
export function Starfield({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let stars: { x: number; y: number; z: number; tw: number; r: number }[] = [];
    let shooter: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(420, Math.round((w * h) / 4200));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() ** 2, // more far stars than near ones
        tw: Math.random() * Math.PI * 2,
        r: Math.random(),
      }));
      if (reduce) draw(0);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / w - 0.5;
      pointer.y = e.clientY / h - 0.5;
    };

    function draw(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      if (!document.documentElement.classList.contains("dark")) return;
      const t = now / 1000;
      pointer.sx += (pointer.x - pointer.sx) * 0.04;
      pointer.sy += (pointer.y - pointer.sy) * 0.04;

      for (const s of stars) {
        const depth = 0.25 + s.z * 0.75;
        // Slow upward drift, faster for nearer stars, wrapping around.
        let y = (s.y - t * 6 * depth) % h;
        if (y < 0) y += h;
        const x = s.x - pointer.sx * 30 * depth;
        const y2 = y - pointer.sy * 30 * depth;
        const twinkle = 0.55 + 0.45 * Math.sin(t * (0.8 + s.r * 2) + s.tw);
        const size = 0.4 + depth * 1.3;
        ctx.globalAlpha = (0.25 + 0.75 * depth) * twinkle;
        ctx.fillStyle = s.r > 0.93 ? "#d4ff3a" : s.r > 0.86 ? "#9be7ff" : "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y2, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (reduce) return;
      if (!shooter && Math.random() < 0.004) {
        shooter = {
          x: Math.random() * w * 0.8 + w * 0.2,
          y: Math.random() * h * 0.4,
          vx: -(6 + Math.random() * 4),
          vy: 2.5 + Math.random() * 2,
          life: 1,
        };
      }
      if (shooter) {
        const grad = ctx.createLinearGradient(
          shooter.x,
          shooter.y,
          shooter.x - shooter.vx * 14,
          shooter.y - shooter.vy * 14
        );
        grad.addColorStop(0, `rgba(230,255,170,${shooter.life})`);
        grad.addColorStop(1, "rgba(230,255,170,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(shooter.x, shooter.y);
        ctx.lineTo(shooter.x - shooter.vx * 14, shooter.y - shooter.vy * 14);
        ctx.stroke();
        shooter.x += shooter.vx;
        shooter.y += shooter.vy;
        shooter.life -= 0.012;
        if (shooter.life <= 0 || shooter.x < -100 || shooter.y > h + 100) shooter = null;
      }
    }

    const loop = (now: number) => {
      draw(now);
      raf = document.hidden ? 0 : requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!reduce && !raf && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", wake);
    if (!reduce) window.addEventListener("pointermove", onMove);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 h-full w-full", className)}
    />
  );
}
