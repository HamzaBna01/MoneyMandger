"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { setLocaleCookie } from "@/lib/i18n/actions";
import { isLocale } from "@/lib/i18n/config";
import { headers } from "next/headers";
import {
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  resetTokenExpiresAt,
} from "@/lib/password-reset";

export interface AuthFormState {
  error?: string;
  success?: string;
  resetUrl?: string;
  oauthResetUrl?: string;
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

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const dict = await getDictionary(await getLocale());
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? dict.auth.invalidInput };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return { success: dict.auth.resetEmailSent };
  }

  if (!user.passwordHash) {
    return {
      success: dict.auth.oauthResetInstructions,
      oauthResetUrl: "https://accounts.google.com/signin/recovery",
    };
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = resetTokenExpiresAt();

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  const origin = await requestOrigin();
  const resetUrl = `${origin || ""}/reset-password?token=${encodeURIComponent(token)}`;

  // Invites are local-only too: no mailer is wired up, so the link is shown
  // on this screen when the account exists.
  return { success: dict.auth.resetEmailSent, resetUrl };
}

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const dict = await getDictionary(await getLocale());
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? dict.auth.invalidInput };
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!row || !isResetTokenUsable(row)) {
    return { error: dict.auth.resetInvalid };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
    }),
  ]);

  return { success: dict.auth.resetSuccess };
}
