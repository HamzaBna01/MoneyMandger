"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { signupSchema, loginSchema } from "@/lib/validations";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { setLocaleCookie } from "@/lib/i18n/actions";
import { isLocale } from "@/lib/i18n/config";

export interface AuthFormState {
  error?: string;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const dict = await getDictionary(await getLocale());
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? dict.auth.invalidInput };
  }

  // Apply this account's saved language for the session that's about to start.
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { locale: true },
  });
  if (user && isLocale(user.locale)) {
    await setLocaleCookie(user.locale);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: dict.auth.invalidCredentials };
    }
    throw err; // re-throw redirect
  }
  return {};
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? dict.auth.invalidInput };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: dict.auth.emailExists };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // First signup creates a household + OWNER membership + default categories.
  // The new account adopts the language the visitor chose on the signup screen.
  await prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: { name: `${name.split(" ")[0]}'s Household`, baseCurrency: "MAD" },
    });
    const user = await tx.user.create({
      data: { name, email, passwordHash, locale },
    });
    await tx.membership.create({
      data: { householdId: household.id, userId: user.id, role: "OWNER" },
    });
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        householdId: household.id,
        name: c.name,
        kind: c.kind,
        icon: c.icon,
      })),
    });
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: dict.auth.accountCreated };
    }
    throw err;
  }
  return {};
}
