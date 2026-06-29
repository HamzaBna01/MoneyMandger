import "server-only";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * The active locale for the current request, read from the per-user locale
 * cookie (set at login from the user's DB preference, and cleared on logout so
 * a shared browser never leaks one account's language into another's).
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}
