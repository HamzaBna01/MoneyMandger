"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHousehold, canWrite } from "@/lib/session";
import { recurringSchema } from "@/lib/validations";
import { parseToCents } from "@/lib/money";
import { materializeDueRules } from "@/lib/recurring";

export interface ActionState {
  ok?: boolean;
  error?: string;
  created?: number;
}

function revalidate() {
  for (const p of ["/", "/recurring", "/transactions", "/accounts", "/reports"]) {
    revalidatePath(p);
  }
}

export async function saveRecurring(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const parsed = recurringSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    type: formData.get("type"),
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    cadence: formData.get("cadence"),
    nextRun: formData.get("nextRun"),
    note: (formData.get("note") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const amountCents = parseToCents(parsed.data.amount);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }

  // Account + category must belong to this household.
  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: parsed.data.accountId, householdId } }),
    prisma.category.findFirst({ where: { id: parsed.data.categoryId, householdId } }),
  ]);
  if (!account || !category) return { error: "Unknown account or category." };

  const data = {
    householdId,
    accountId: parsed.data.accountId,
    categoryId: parsed.data.categoryId,
    amountCents,
    type: parsed.data.type,
    cadence: parsed.data.cadence,
    nextRun: new Date(parsed.data.nextRun),
    note: parsed.data.note?.trim() || null,
  };

  if (parsed.data.id) {
    const owned = await prisma.recurringRule.findFirst({
      where: { id: parsed.data.id, householdId },
    });
    if (!owned) return { error: "Rule not found." };
    await prisma.recurringRule.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.recurringRule.create({ data });
  }

  revalidate();
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const owned = await prisma.recurringRule.findFirst({ where: { id, householdId } });
  if (!owned) return { error: "Rule not found." };

  await prisma.recurringRule.delete({ where: { id } });
  revalidate();
  return { ok: true };
}

export async function runRecurringNow(): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const res = await materializeDueRules(householdId);
  revalidate();
  return { ok: true, created: res.created };
}
