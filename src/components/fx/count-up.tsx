"use client";

import { useEffect, useState } from "react";
import { formatCents } from "@/lib/money";

/**
 * Renders a money amount that counts up from zero on mount. The server
 * renders the final value, so it's correct without JavaScript too.
 */
export function CountUp({
  cents,
  currency,
  duration = 1600,
  delay = 200,
  className,
}: {
  cents: number;
  currency: string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const [value, setValue] = useState(cents);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const begin = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - begin) / duration));
      const eased = 1 - Math.pow(1 - p, 4);
      // Whole units while counting so decimals don't flicker; exact at the end.
      setValue(p < 1 ? Math.round((cents * eased) / 100) * 100 : cents);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents, duration, delay]);

  return <span className={className}>{formatCents(value, currency)}</span>;
}
