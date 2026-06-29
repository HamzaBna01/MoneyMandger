import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parse,
} from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";

/** "2026-06" string for the current month. */
export function currentMonthKey(): string {
  return format(new Date(), "yyyy-MM");
}

/** Parse a "yyyy-MM" key (falling back to current month) into start/end Dates. */
export function monthRange(key?: string): { start: Date; end: Date; key: string } {
  const base = key ? parse(key + "-01", "yyyy-MM-dd", new Date()) : new Date();
  const valid = isNaN(base.getTime()) ? new Date() : base;
  return {
    start: startOfMonth(valid),
    end: endOfMonth(valid),
    key: format(valid, "yyyy-MM"),
  };
}

/** Start/end Dates for the month before `key` (or before the current month). */
export function previousMonthRange(key?: string): { start: Date; end: Date } {
  const { start } = monthRange(key);
  const prev = subMonths(start, 1);
  return { start: startOfMonth(prev), end: endOfMonth(prev) };
}

export function monthLabel(key: string, locale?: DateFnsLocale): string {
  const d = parse(key + "-01", "yyyy-MM-dd", new Date());
  return isNaN(d.getTime()) ? key : format(d, "MMMM yyyy", { locale });
}

/** The last `count` month keys, oldest first (for report axes / selectors). */
export function recentMonthKeys(count = 6): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(format(subMonths(now, i), "yyyy-MM"));
  }
  return keys;
}
