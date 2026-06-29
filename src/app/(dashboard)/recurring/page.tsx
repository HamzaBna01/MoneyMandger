import { format } from "date-fns";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary, tCategory } from "@/lib/i18n/get-dictionary";
import { dateLocale } from "@/lib/i18n/date-locale";
import { fmt } from "@/lib/i18n/interpolate";
import { RecurringClient, type RecurringView } from "@/components/recurring-client";

export default async function RecurringPage() {
  const { householdId, household } = await requireHousehold();
  const currency = household.baseCurrency;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const df = dateLocale(locale);

  const [rules, accounts, categories] = await Promise.all([
    prisma.recurringRule.findMany({
      where: { householdId },
      include: { category: true, account: true },
      orderBy: { nextRun: "asc" },
    }),
    prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();

  const views: RecurringView[] = rules.map((r) => {
    const nextRunKey = format(r.nextRun, "yyyy-MM-dd");
    const cadenceLabel = dict.recurring.cadence[r.cadence];
    const nextLabel = fmt(dict.recurring.next, {
      date: format(r.nextRun, "d MMM yyyy", { locale: df }),
    });
    return {
      id: r.id,
      iconKey: r.category.icon,
      title: tCategory(dict, r.category.name),
      subtitle: `${cadenceLabel}  ·  ${nextLabel}  ·  ${r.account.name}`,
      amountCents: r.amountCents,
      type: r.type as "INCOME" | "EXPENSE",
      currency,
      due: r.nextRun <= now,
      edit: {
        id: r.id,
        type: r.type as "INCOME" | "EXPENSE",
        amount: centsToInput(r.amountCents),
        accountId: r.accountId,
        categoryId: r.categoryId,
        cadence: r.cadence as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
        nextRun: nextRunKey,
        note: r.note ?? undefined,
      },
    };
  });

  return (
    <RecurringClient
      rules={views}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        kind: c.kind as "INCOME" | "EXPENSE",
      }))}
    />
  );
}
