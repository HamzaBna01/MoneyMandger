// All money is stored as integer cents. These helpers are the ONLY place we
// divide by 100 (for display) or multiply by 100 (when parsing user input).

/**
 * Format integer cents as "1,234 MAD".
 * Currencies without minor units in everyday use (like MAD here) are shown
 * with no decimals when the amount is whole, otherwise with 2 decimals.
 */
export function formatCents(cents: number, currency = "MAD"): string {
  const whole = cents / 100;
  const hasFraction = cents % 100 !== 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(whole);
  return `${formatted} ${currency}`;
}

/**
 * Like formatCents but prefixed with an explicit + / - sign. Useful for
 * transaction rows where direction matters.
 */
export function formatSignedCents(cents: number, currency = "MAD"): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "-" : "";
  return `${sign}${formatCents(Math.abs(cents), currency)}`;
}

/**
 * Parse a user-entered amount string into integer cents.
 * Accepts "1234", "1,234.50", "1 234,50", "12.5", etc.
 * Returns NaN for unparseable input so callers can validate.
 */
export function parseToCents(input: string): number {
  if (typeof input !== "string") return NaN;
  let s = input.trim();
  if (!s) return NaN;

  // Drop currency letters / spaces / apostrophes.
  s = s.replace(/[^0-9.,-]/g, "");

  // Normalise decimal separator. If both "," and "." appear, assume the last
  // one is the decimal separator and the other is a thousands separator.
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    // Only commas present — treat as decimal separator.
    s = s.replace(",", ".");
  }

  const value = Number(s);
  if (Number.isNaN(value)) return NaN;
  return Math.round(value * 100);
}

/** Cents -> plain number string for prefilling a text input, e.g. "12.50". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}
