"use server";

import { signOut } from "@/lib/auth";
import { clearLocaleCookie } from "@/lib/i18n/actions";

export async function logoutAction() {
  // Clear the locale cookie so the next account on this browser starts from
  // their own saved language rather than inheriting this one.
  await clearLocaleCookie();
  await signOut({ redirectTo: "/login" });
}
