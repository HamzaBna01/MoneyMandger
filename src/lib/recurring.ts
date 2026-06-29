import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Prisma, type Cadence, type TxType } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Effect of a transaction on its account balance, in cents.
 * INCOME adds, EXPENSE subtracts. TRANSFER legs store a SIGNED amountCents
 * (negative on the source account, positive on the destination) so the effect
 * is just the stored value — which makes reversing an edit/delete trivial.
 */
export function balanceDelta(type: TxType, amountCents: number): number {
  if (type === "INCOME") return amountCents;
  if (type === "EXPENSE") return -amountCents;
  return amountCents; // TRANSFER: amountCents is already signed
}

export function advance(date: Date, cadence: Cadence): Date {
  switch (cadence) {
    case "DAILY":
      return addDays(date, 1);
    case "WEEKLY":
      return addWeeks(date, 1);
    case "MONTHLY":
      return addMonths(date, 1);
    case "YEARLY":
      return addYears(date, 1);
  }
}

export interface MaterializeResult {
  created: number;
  rulesProcessed: number;
}

/**
 * Turn every recurring rule whose nextRun is due (<= now) into a real
 * Transaction, updating the account balance, then advance nextRun. Catches up
 * multiple missed periods (capped per rule). Safe to call repeatedly / via cron.
 *
 * @param householdId optional — restrict to a single household.
 */
export async function materializeDueRules(
  householdId?: string
): Promise<MaterializeResult> {
  const now = new Date();
  const rules = await prisma.recurringRule.findMany({
    where: {
      nextRun: { lte: now },
      ...(householdId ? { householdId } : {}),
    },
  });

  let created = 0;

  for (const rule of rules) {
    await prisma.$transaction(async (tx) => {
      let next = rule.nextRun;
      let guard = 0; // never loop forever on a misconfigured rule
      while (next <= now && guard < 500) {
        await tx.transaction.create({
          data: {
            accountId: rule.accountId,
            categoryId: rule.categoryId,
            enteredById: await ownerId(tx, rule.householdId),
            recurringRuleId: rule.id,
            amountCents: rule.amountCents,
            type: rule.type,
            date: next,
            note: rule.note,
            source: "MANUAL",
          },
        });
        await tx.account.update({
          where: { id: rule.accountId },
          data: { balanceCents: { increment: balanceDelta(rule.type, rule.amountCents) } },
        });
        created++;
        next = advance(next, rule.cadence);
        guard++;
      }
      await tx.recurringRule.update({
        where: { id: rule.id },
        data: { nextRun: next },
      });
    });
  }

  return { created, rulesProcessed: rules.length };
}

// Recurring transactions are attributed to the household owner.
async function ownerId(
  tx: Prisma.TransactionClient,
  householdId: string
): Promise<string> {
  const m = await tx.membership.findFirst({
    where: { householdId, role: "OWNER" },
    select: { userId: true },
  });
  if (m) return m.userId;
  const any = await tx.membership.findFirst({
    where: { householdId },
    select: { userId: true },
  });
  if (!any) throw new Error("Household has no members");
  return any.userId;
}
