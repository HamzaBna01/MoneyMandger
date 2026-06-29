"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHousehold } from "@/lib/session";
import {
  householdSchema,
  profileSchema,
  inviteSchema,
  savingsGoalSchema,
} from "@/lib/validations";
import { parseToCents } from "@/lib/money";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

function isOwner(role: string) {
  return role === "OWNER";
}

async function settingsDict() {
  return (await getDictionary(await getLocale())).settings;
}

export async function updateHousehold(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  const t = await settingsDict();
  if (!isOwner(role)) return { error: t.errors.ownerOnly };

  const parsed = householdSchema.safeParse({
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.errors.invalidInput };
  }

  await prisma.household.update({
    where: { id: householdId },
    data: {
      name: parsed.data.name,
      baseCurrency: parsed.data.baseCurrency.toUpperCase(),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true, message: t.toast.householdSaved };
}

export async function updateSavingsGoal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  const t = await settingsDict();
  if (!isOwner(role)) return { error: t.errors.ownerOnly };

  const parsed = savingsGoalSchema.safeParse({
    amount: formData.get("amount"),
    deadline: formData.get("deadline"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.errors.invalidInput };
  }

  const rawAmount = parsed.data.amount?.trim();

  // Empty amount → clear the goal entirely.
  if (!rawAmount) {
    await prisma.household.update({
      where: { id: householdId },
      data: { savingsMonthlyCents: null, savingsGoalDeadline: null },
    });
    revalidatePath("/settings");
    revalidatePath("/");
    return { ok: true, message: t.toast.savingsGoalCleared };
  }

  const cents = parseToCents(rawAmount);
  if (!Number.isFinite(cents) || cents <= 0) {
    return { error: t.errors.validGoalAmount };
  }

  let deadline: Date | null = null;
  if (parsed.data.deadline) {
    deadline = new Date(parsed.data.deadline);
    if (isNaN(deadline.getTime())) return { error: t.errors.validTargetDate };
  }

  await prisma.household.update({
    where: { id: householdId },
    data: { savingsMonthlyCents: cents, savingsGoalDeadline: deadline },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true, message: t.toast.savingsGoalSaved };
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireHousehold();
  const t = await settingsDict();

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.errors.invalidInput };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings");
  return { ok: true, message: t.toast.profileSaved };
}

export async function inviteMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  const t = await settingsDict();
  if (!isOwner(role)) return { error: t.errors.ownerOnly };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.errors.invalidInput };
  }
  const { email, role: inviteRole } = parsed.data;

  // If the person already has an account, add them straight to the household.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = await prisma.membership.findUnique({
      where: {
        householdId_userId: { householdId, userId: existingUser.id },
      },
    });
    if (already) return { error: t.errors.alreadyMember };
    await prisma.membership.create({
      data: { householdId, userId: existingUser.id, role: inviteRole },
    });
    revalidatePath("/settings");
    return { ok: true, message: fmt(t.toast.memberAdded, { email }) };
  }

  // Otherwise record a pending invite (local-only — no email is sent).
  await prisma.invite.upsert({
    where: { householdId_email: { householdId, email } },
    update: { role: inviteRole },
    create: { householdId, email, role: inviteRole },
  });

  revalidatePath("/settings");
  return { ok: true, message: fmt(t.toast.invitePending, { email }) };
}

export async function updateMemberRole(
  membershipId: string,
  newRole: "OWNER" | "MEMBER" | "VIEWER"
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  const t = await settingsDict();
  if (!isOwner(role)) return { error: t.errors.ownerOnly };

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, householdId },
  });
  if (!target) return { error: t.errors.memberNotFound };

  // Don't allow demoting the last remaining owner.
  if (target.role === "OWNER" && newRole !== "OWNER") {
    const owners = await prisma.membership.count({
      where: { householdId, role: "OWNER" },
    });
    if (owners <= 1) return { error: t.errors.atLeastOneOwner };
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: { role: newRole },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMember(membershipId: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  const t = await settingsDict();
  if (!isOwner(role)) return { error: t.errors.ownerOnly };

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, householdId },
  });
  if (!target) return { error: t.errors.memberNotFound };

  if (target.role === "OWNER") {
    const owners = await prisma.membership.count({
      where: { householdId, role: "OWNER" },
    });
    if (owners <= 1) return { error: t.errors.cantRemoveLastOwner };
  }

  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function cancelInvite(inviteId: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  const t = await settingsDict();
  if (!isOwner(role)) return { error: t.errors.ownerOnly };

  await prisma.invite.deleteMany({ where: { id: inviteId, householdId } });
  revalidatePath("/settings");
  return { ok: true };
}
