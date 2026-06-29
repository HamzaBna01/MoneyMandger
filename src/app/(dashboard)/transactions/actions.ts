"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireHousehold, canWrite } from "@/lib/session";
import { transactionSchema } from "@/lib/validations";
import { parseToCents } from "@/lib/money";
import { balanceDelta } from "@/lib/recurring";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

/** Thrown when a transaction would drive an account's balance below zero. */
class InsufficientFundsError extends Error {}

/**
 * Block a debit that would push a non-credit account below zero. Credit cards
 * are exempt since carrying a negative (owed) balance is normal for them.
 */
async function assertSufficientBalance(
  tx: Prisma.TransactionClient,
  accountId: string,
  debitCents: number
) {
  const account = await tx.account.findUnique({
    where: { id: accountId },
    select: { type: true, balanceCents: true, name: true },
  });
  if (!account || account.type === "CREDIT_CARD") return;
  if (account.balanceCents - debitCents < 0) {
    throw new InsufficientFundsError(
      `"${account.name}" doesn't have enough balance for this transaction.`
    );
  }
}

function revalidateAll() {
  for (const p of ["/", "/transactions", "/accounts", "/budgets", "/reports"]) {
    revalidatePath(p);
  }
}

/** Remove a transaction (and its sibling leg if it's a transfer), reversing balances. */
async function deleteInternal(
  tx: Prisma.TransactionClient,
  id: string,
  householdId: string
) {
  const row = await tx.transaction.findFirst({
    where: { id, account: { householdId } },
  });
  if (!row) return;

  const rows =
    row.type === "TRANSFER" && row.transferGroupId
      ? await tx.transaction.findMany({ where: { transferGroupId: row.transferGroupId } })
      : [row];

  for (const r of rows) {
    await tx.account.update({
      where: { id: r.accountId },
      data: { balanceCents: { increment: -balanceDelta(r.type, r.amountCents) } },
    });
  }
  await tx.transaction.deleteMany({
    where: rows.length > 1 ? { transferGroupId: row.transferGroupId! } : { id: row.id },
  });
}

async function createInternal(
  tx: Prisma.TransactionClient,
  householdId: string,
  enteredById: string,
  data: ReturnType<typeof transactionSchema.parse>,
  amountCents: number
) {
  const date = new Date(data.date);
  const note = data.note?.trim() || null;

  if (data.type === "TRANSFER") {
    await assertSufficientBalance(tx, data.accountId, amountCents);
    const group = randomUUID();
    // Source leg (negative), destination leg (positive).
    await tx.transaction.create({
      data: {
        accountId: data.accountId,
        enteredById,
        amountCents: -amountCents,
        type: "TRANSFER",
        date,
        note,
        transferGroupId: group,
      },
    });
    await tx.transaction.create({
      data: {
        accountId: data.toAccountId!,
        enteredById,
        amountCents: amountCents,
        type: "TRANSFER",
        date,
        note,
        transferGroupId: group,
      },
    });
    await tx.account.update({
      where: { id: data.accountId },
      data: { balanceCents: { increment: -amountCents } },
    });
    await tx.account.update({
      where: { id: data.toAccountId! },
      data: { balanceCents: { increment: amountCents } },
    });
    return;
  }

  if (data.type === "EXPENSE") {
    await assertSufficientBalance(tx, data.accountId, amountCents);
  }

  await tx.transaction.create({
    data: {
      accountId: data.accountId,
      categoryId: data.categoryId || null,
      enteredById,
      amountCents,
      type: data.type,
      date,
      note,
    },
  });
  await tx.account.update({
    where: { id: data.accountId },
    data: { balanceCents: { increment: balanceDelta(data.type, amountCents) } },
  });
}

function readForm(formData: FormData) {
  return {
    id: (formData.get("id") as string) || undefined,
    type: formData.get("type"),
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    toAccountId: (formData.get("toAccountId") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    date: formData.get("date"),
    note: (formData.get("note") as string) || undefined,
  };
}

export async function saveTransaction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, userId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const parsed = transactionSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const amountCents = parseToCents(parsed.data.amount);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }

  // Verify the chosen accounts/category belong to this household.
  const accountIds = [parsed.data.accountId, parsed.data.toAccountId].filter(
    Boolean
  ) as string[];
  const owned = await prisma.account.count({
    where: { id: { in: accountIds }, householdId },
  });
  if (owned !== accountIds.length) return { error: "Unknown account." };

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.id) {
        await deleteInternal(tx, parsed.data.id, householdId);
      }
      await createInternal(tx, householdId, userId, parsed.data, amountCents);
    });
  } catch (e) {
    if (e instanceof InsufficientFundsError) return { error: e.message };
    console.error(e);
    return { error: "Could not save the transaction." };
  }

  revalidateAll();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  try {
    await prisma.$transaction((tx) => deleteInternal(tx, id, householdId));
  } catch (e) {
    console.error(e);
    return { error: "Could not delete the transaction." };
  }
  revalidateAll();
  return { ok: true };
}
