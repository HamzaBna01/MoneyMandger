import {
  startOfMonth,
  subMonths,
  addMonths,
  differenceInCalendarMonths,
} from "date-fns";
import { prisma } from "./prisma";

/** Sum of EXPENSE transactions per category within a date range (live spent). */
export async function spentByCategory(
  householdId: string,
  start: Date,
  end: Date
): Promise<Map<string, number>> {
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      type: "EXPENSE",
      date: { gte: start, lte: end },
      account: { householdId },
    },
    _sum: { amountCents: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.categoryId) map.set(r.categoryId, r._sum.amountCents ?? 0);
  }
  return map;
}

export interface CategorySpend {
  categoryId: string;
  name: string;
  icon: string;
  amountCents: number;
}

/**
 * The household's biggest EXPENSE categories in a date range, largest first.
 * Uncategorised expenses are excluded (no name to show).
 */
export async function topSpendingCategories(
  householdId: string,
  start: Date,
  end: Date,
  limit = 5
): Promise<CategorySpend[]> {
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      type: "EXPENSE",
      date: { gte: start, lte: end },
      account: { householdId },
      categoryId: { not: null },
    },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
    take: limit,
  });

  const ids = rows.map((r) => r.categoryId).filter((id): id is string => !!id);
  if (ids.length === 0) return [];

  const cats = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, icon: true },
  });
  const byId = new Map(cats.map((c) => [c.id, c]));

  return rows.flatMap((r) => {
    const c = r.categoryId ? byId.get(r.categoryId) : undefined;
    if (!c) return [];
    return [
      {
        categoryId: c.id,
        name: c.name,
        icon: c.icon,
        amountCents: r._sum.amountCents ?? 0,
      },
    ];
  });
}

/** Total INCOME and EXPENSE within a range for the household. */
export async function incomeExpenseTotals(
  householdId: string,
  start: Date,
  end: Date
): Promise<{ income: number; expense: number }> {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      type: { in: ["INCOME", "EXPENSE"] },
      date: { gte: start, lte: end },
      account: { householdId },
    },
    _sum: { amountCents: true },
  });
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "INCOME") income = r._sum.amountCents ?? 0;
    if (r.type === "EXPENSE") expense = r._sum.amountCents ?? 0;
  }
  return { income, expense };
}

/** Sum of all account balances for the household. */
export async function totalBalance(householdId: string): Promise<number> {
  const res = await prisma.account.aggregate({
    where: { householdId },
    _sum: { balanceCents: true },
  });
  return res._sum.balanceCents ?? 0;
}

/** Current total across SAVINGS-type accounts (money explicitly set aside). */
export async function savingsBalance(householdId: string): Promise<number> {
  const res = await prisma.account.aggregate({
    where: { householdId, type: "SAVINGS" },
    _sum: { balanceCents: true },
  });
  return res._sum.balanceCents ?? 0;
}

/**
 * Average net change in SAVINGS accounts per month over the last `months`
 * calendar months, *including* the current month so recent deposits are
 * reflected in the pace right away (a household that just started saving this
 * month sees its real pace rather than 0).
 *
 * Savings deposits are lumpy, so a trailing average is used rather than a
 * single month. If the household has less history than the window, the net is
 * divided by the months actually elapsed since its first savings activity.
 */
export async function monthlySavingsAverage(
  householdId: string,
  months = 3
): Promise<number> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  // Window = the current month plus the (months - 1) preceding months.
  const windowStart = startOfMonth(subMonths(now, months - 1));
  const windowEnd = startOfMonth(addMonths(now, 1)); // exclusive: end of this month

  const savingsAccount = { householdId, type: "SAVINGS" as const };

  // Net change, split by type so transfer/income/expense signs are correct.
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { account: savingsAccount, date: { gte: windowStart, lt: windowEnd } },
    _sum: { amountCents: true },
  });
  let net = 0;
  for (const r of rows) {
    const sum = r._sum.amountCents ?? 0;
    if (r.type === "INCOME") net += sum;
    else if (r.type === "EXPENSE") net -= sum;
    else net += sum; // TRANSFER legs store a signed amount
  }

  // Graceful fallback for short history: divide by months actually elapsed,
  // counting the current month (+1) so a first-month saver divides by 1.
  const first = await prisma.transaction.findFirst({
    where: { account: savingsAccount, date: { lt: windowEnd } },
    orderBy: { date: "asc" },
    select: { date: true },
  });
  if (!first) return 0;
  const elapsed = Math.min(
    months,
    differenceInCalendarMonths(monthStart, startOfMonth(first.date)) + 1
  );
  const divisor = Math.max(1, elapsed);
  return Math.round(net / divisor);
}
