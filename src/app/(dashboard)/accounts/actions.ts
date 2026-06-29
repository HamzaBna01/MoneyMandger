"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHousehold, canWrite } from "@/lib/session";
import { accountSchema } from "@/lib/validations";
import { parseToCents } from "@/lib/money";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

function revalidate() {
  for (const p of ["/", "/accounts", "/transactions", "/reports", "/settings"]) {
    revalidatePath(p);
  }
}

export async function saveAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, household, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const parsed = accountSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const balanceCents = parseToCents(parsed.data.amount);
  if (!Number.isFinite(balanceCents)) {
    return { error: "Enter a valid balance." };
  }

  try {
    if (parsed.data.id) {
      const owned = await prisma.account.findFirst({
        where: { id: parsed.data.id, householdId },
      });
      if (!owned) return { error: "Account not found." };
      await prisma.account.update({
        where: { id: parsed.data.id },
        data: { name: parsed.data.name, type: parsed.data.type, balanceCents },
      });
    } else {
      await prisma.account.create({
        data: {
          householdId,
          name: parsed.data.name,
          type: parsed.data.type,
          balanceCents,
          currency: household.baseCurrency,
        },
      });
    }
  } catch (e) {
    console.error(e);
    return { error: "Could not save the account." };
  }

  revalidate();
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const owned = await prisma.account.findFirst({ where: { id, householdId } });
  if (!owned) return { error: "Account not found." };

  try {
    // Transactions on this account cascade-delete with it.
    await prisma.account.delete({ where: { id } });
  } catch (e) {
    console.error(e);
    return { error: "Could not delete the account." };
  }

  revalidate();
  return { ok: true };
}
