"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Vec = { x: number; y: number; z: number };

const rotY = (p: Vec, a: number): Vec => ({
  x: p.x * Math.cos(a) + p.z * Math.sin(a),
  y: p.y,
  z: -p.x * Math.sin(a) + p.z * Math.cos(a),
});
const rotX = (p: Vec, a: number): Vec => ({
  x: p.x,
  y: p.y * Math.cos(a) - p.z * Math.sin(a),
  z: p.y * Math.sin(a) + p.z * Math.cos(a),
});

// Orbital planes the satellites travel on (radius in globe units).
const RINGS = [
  { r: 1.42, inc: 1.12, node: 0.35, speed: 0.32 },
  { r: 1.62, inc: -0.82, node: 2.9, speed: -0.22 },
  { r: 1.26, inc: -0.35, node: -0.6, speed: 0.46 },
];

const SAT_COLORS_DARK = ["#d4ff3a", "#36e2f5", "#a78bfa", "#ffb547", "#ff6fa8", "#ffffff"];
const SAT_COLORS_LIGHT = ["#6a9a00", "#0a9fb5", "#7c5cf0", "#e8862a", "#d9467a", "#3d4434"];

// Evenly spread "data points" across the globe surface (Fibonacci sphere).
const SURFACE_POINTS = 220;
const SURFACE: Vec[] = Array.from({ length: SURFACE_POINTS }, (_, i) => {
  const y = 1 - (i / (SURFACE_POINTS - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const t = i * 2.399963;
  return { x: Math.cos(t) * r, y, z: Math.sin(t) * r };
});

/**
 * Rotating wireframe globe with orbital rings. Each satellite is one of the
 * month's top spending categories — its size follows that category's share.
 * Purely decorative; pauses offscreen and honours reduced motion.
 */
export function OrbitGlobe({
  shares,
  className,
}: {
  /** 0..1 shares of the month's spending, largest first. */
  shares: number[];
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sharesKey = shares.map((s) => s.toFixed(3)).join(",");

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sats = (sharesKey ? sharesKey.split(",").map(Number) : [0.4, 0.3, 0.2]).map(
      (share, i) => ({
        ring: RINGS[i % RINGS.length],
        offset: i * 2.15 + (i % 2) * 0.7,
        size: 2.6 + Math.sqrt(share) * 7,
        color: i,
      })
    );

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(start + 4000);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      pointer.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    };

    function draw(now: number) {
      if (!ctx || w === 0) return;
      const t = (now - start) / 1000;
      const dark = document.documentElement.classList.contains("dark");
      const neon = dark ? "212,255,58" : "106,154,0";
      const line = dark ? "214,236,180" : "40,52,20";
      const palette = dark ? SAT_COLORS_DARK : SAT_COLORS_LIGHT;

      tilt.x += (pointer.y * 0.2 - tilt.x) * 0.05;
      tilt.y += (pointer.x * 0.5 - tilt.y) * 0.05;

      const R = Math.min(w, h) * 0.3;
      const cx = w / 2;
      const cy = h / 2;
      const spin = t * 0.22 + tilt.y;
      const lean = -0.38 + tilt.x;
      const fov = 4.2;

      const view = (p: Vec) => rotX(p, lean);
      const project = (p: Vec) => {
        const s = (R * fov) / (fov - p.z);
        return { x: cx + p.x * s, y: cy + p.y * s, z: p.z, s: s / R };
      };

      ctx.clearRect(0, 0, w, h);

      // Halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.1);
      halo.addColorStop(0, `rgba(${neon},${dark ? 0.22 : 0.16})`);
      halo.addColorStop(0.45, `rgba(${neon},${dark ? 0.07 : 0.05})`);
      halo.addColorStop(1, `rgba(${neon},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      const ringPoint = (ring: (typeof RINGS)[number], theta: number) =>
        view(
          rotY(
            rotX({ x: Math.cos(theta) * ring.r, y: 0, z: Math.sin(theta) * ring.r }, ring.inc),
            ring.node + Math.sin(t * 0.15) * 0.12
          )
        );

      const drawRings = (front: boolean) => {
        ctx.lineWidth = 1.1;
        for (const ring of RINGS) {
          const steps = 140;
          let prev = project(ringPoint(ring, 0));
          for (let i = 1; i <= steps; i++) {
            const p = project(ringPoint(ring, (i / steps) * Math.PI * 2));
            const z = (p.z + prev.z) / 2;
            if (z >= 0 === front) {
              const a = front ? 0.25 + 0.55 * Math.min(1, z / ring.r) : 0.1;
              ctx.strokeStyle = `rgba(${neon},${a})`;
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
            }
            prev = p;
          }
        }
      };

      const drawSats = (front: boolean) => {
        for (const sat of sats) {
          const theta = sat.offset + t * sat.ring.speed;
          const head = ringPoint(sat.ring, theta);
          if (head.z >= 0 !== front) continue;
          const color = palette[sat.color % palette.length];
          const dir = Math.sign(sat.ring.speed);
          // Comet tail
          for (let k = 12; k >= 1; k--) {
            const p = project(ringPoint(sat.ring, theta - dir * k * 0.035));
            ctx.globalAlpha = (1 - k / 13) * (front ? 0.5 : 0.18);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, sat.size * p.s * (1 - k / 16) * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
          const p = project(head);
          ctx.globalAlpha = front ? 1 : 0.35;
          ctx.shadowColor = color;
          ctx.shadowBlur = front ? 18 : 0;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, sat.size * p.s, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      };

      drawRings(false);
      drawSats(false);

      // Globe body
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
      if (dark) {
        body.addColorStop(0, "rgba(40,48,30,0.95)");
        body.addColorStop(0.7, "rgba(10,13,16,0.92)");
        body.addColorStop(1, "rgba(4,5,10,0.9)");
      } else {
        body.addColorStop(0, "rgba(255,255,255,0.95)");
        body.addColorStop(0.75, "rgba(236,240,224,0.9)");
        body.addColorStop(1, "rgba(220,228,200,0.9)");
      }
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Rim light
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(${neon},${dark ? 0.55 : 0.6})`;
      ctx.shadowColor = `rgba(${neon},0.8)`;
      ctx.shadowBlur = dark ? 16 : 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Wireframe — latitudes and meridians, brighter on the near side
      const sphere = (lat: number, lon: number) =>
        project(
          view(
            rotY(
              { x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon) },
              spin
            )
          )
        );
      const seg = (a: ReturnType<typeof sphere>, b: ReturnType<typeof sphere>) => {
        const z = (a.z + b.z) / 2;
        if (z < -0.05) return;
        ctx.strokeStyle = `rgba(${line},${0.05 + 0.3 * Math.max(0, z)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };
      ctx.lineWidth = 0.8;
      for (let lat = -60; lat <= 60; lat += 30) {
        const la = (lat * Math.PI) / 180;
        let prev = sphere(la, 0);
        for (let i = 1; i <= 72; i++) {
          const p = sphere(la, (i / 72) * Math.PI * 2);
          seg(prev, p);
          prev = p;
        }
      }
      for (let m = 0; m < 12; m++) {
        const lo = (m / 12) * Math.PI * 2;
        let prev = sphere(-Math.PI / 2, lo);
        for (let i = 1; i <= 48; i++) {
          const p = sphere(-Math.PI / 2 + (i / 48) * Math.PI, lo);
          seg(prev, p);
          prev = p;
        }
      }

      // Surface data points
      for (const s of SURFACE) {
        const p = project(view(rotY(s, spin)));
        if (p.z < 0) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + s.x * 9 + s.y * 7);
        ctx.fillStyle = `rgba(${neon},${(0.15 + 0.6 * p.z) * (0.4 + 0.6 * pulse)})`;
        ctx.fillRect(p.x - 0.9, p.y - 0.9, 1.8, 1.8);
      }

      // Scanning equator sweep
      const sweep = (t * 0.9) % (Math.PI * 2);
      ctx.lineWidth = 2;
      let prev = sphere(0, sweep - spin);
      for (let i = 1; i <= 24; i++) {
        const p = sphere(0, sweep - spin + (i / 24) * 1.2);
        if ((p.z + prev.z) / 2 > 0) {
          ctx.strokeStyle = `rgba(${neon},${0.9 * (i / 24)})`;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = p;
      }

      drawRings(true);
      drawSats(true);
    }

    const loop = (now: number) => {
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!reduce && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      wake();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", wake);
    if (!reduce) window.addEventListener("pointermove", onMove);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pointermove", onMove);
    };
  }, [sharesKey]);

  // Absolutely positioned so the canvas's pixel size never feeds back into layout.
  return (
    <canvas ref={ref} aria-hidden className={cn("absolute inset-0 block h-full w-full", className)} />
  );
}
