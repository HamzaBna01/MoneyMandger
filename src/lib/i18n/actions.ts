"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocale, LOCALE_COOKIE, type Locale } from "./config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Write the locale cookie (used at login and when switching language). */
export async function setLocaleCookie(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
}

/** Clear the locale cookie — called on logout so the next account starts fresh. */
export async function clearLocaleCookie() {
  (await cookies()).delete(LOCALE_COOKIE);
}

/**
 * Switch the active language. Persists to the cookie (for instant, flash-free
 * SSR) and to the signed-in user's DB record (so it follows the account to any
 * browser). Safe to call from the login screen, where there is no session.
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  await setLocaleCookie(locale);

  const session = await auth();
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { locale },
      });
    } catch {
      // Non-fatal: the cookie already carries the choice for this session.
    }
  }

  revalidatePath("/", "layout");
}
