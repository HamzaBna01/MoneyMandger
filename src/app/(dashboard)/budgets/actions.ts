"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHousehold, canWrite } from "@/lib/session";
import { budgetSchema } from "@/lib/validations";
import { parseToCents } from "@/lib/money";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/budgets");
}

export async function saveBudget(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const limitCents = parseToCents(parsed.data.amount);
  if (!Number.isFinite(limitCents) || limitCents <= 0) {
    return { error: "Enter a valid limit greater than zero." };
  }

  // Category must belong to this household.
  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, householdId },
  });
  if (!category) return { error: "Unknown category." };

  await prisma.budget.upsert({
    where: {
      householdId_categoryId_period: {
        householdId,
        categoryId: parsed.data.categoryId,
        period: "MONTHLY",
      },
    },
    update: { limitCents },
    create: {
      householdId,
      categoryId: parsed.data.categoryId,
      limitCents,
      period: "MONTHLY",
    },
  });

  revalidate();
  return { ok: true };
}

export async function deleteBudget(categoryId: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  await prisma.budget.deleteMany({
    where: { householdId, categoryId, period: "MONTHLY" },
  });

  revalidate();
  return { ok: true };
}
