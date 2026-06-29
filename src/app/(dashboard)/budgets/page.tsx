import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { monthRange, monthLabel, currentMonthKey } from "@/lib/dates";
import { spentByCategory } from "@/lib/queries";
import { centsToInput } from "@/lib/money";
import { getLocale } from "@/lib/i18n/server";
import { dateLocale } from "@/lib/i18n/date-locale";
import { BudgetsClient, type BudgetItem } from "@/components/budgets-client";

export default async function BudgetsPage() {
  const { householdId, household } = await requireHousehold();
  const currency = household.baseCurrency;
  const { start, end } = monthRange();
  const df = dateLocale(await getLocale());

  const [budgets, expenseCategories, spentMap] = await Promise.all([
    prisma.budget.findMany({
      where: { householdId, period: "MONTHLY" },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { householdId, kind: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    spentByCategory(householdId, start, end),
  ]);

  const items: BudgetItem[] = budgets
    .map((b) => ({
      categoryId: b.categoryId,
      name: b.category.name,
      iconKey: b.category.icon,
      spentCents: spentMap.get(b.categoryId) ?? 0,
      limitCents: b.limitCents,
      limitInput: centsToInput(b.limitCents),
      currency,
    }))
    .sort((a, b) => b.spentCents / b.limitCents - a.spentCents / a.limitCents);

  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgeted = expenseCategories
    .filter((c) => !budgetedIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <BudgetsClient
      monthLabel={monthLabel(currentMonthKey(), df)}
      budgets={items}
      unbudgeted={unbudgeted}
    />
  );
}
