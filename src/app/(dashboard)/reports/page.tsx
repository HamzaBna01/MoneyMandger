import { parse, subMonths, format } from "date-fns";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  monthRange,
  monthLabel,
  currentMonthKey,
  recentMonthKeys,
} from "@/lib/dates";
import { incomeExpenseTotals, spentByCategory } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary, tCategory } from "@/lib/i18n/get-dictionary";
import { dateLocale } from "@/lib/i18n/date-locale";
import { fmt } from "@/lib/i18n/interpolate";
import { MetricCard } from "@/components/metric-card";
import { MonthSelect } from "@/components/month-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SpendingDonut,
  IncomeExpenseBars,
  type CategorySlice,
  type MonthBar,
} from "@/components/reports-charts";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { householdId, household } = await requireHousehold();
  const currency = household.baseCurrency;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const t = dict.reports;
  const df = dateLocale(locale);

  const sp = await searchParams;
  const selectedKey =
    typeof sp.month === "string" ? sp.month : currentMonthKey();
  const selDate = parse(selectedKey + "-01", "yyyy-MM-dd", new Date());
  const { start, end } = monthRange(selectedKey);

  // Trailing 6 months ending at the selected month.
  const barKeys = Array.from({ length: 6 }, (_, i) =>
    format(subMonths(selDate, 5 - i), "yyyy-MM")
  );

  const [categories, spentMap, monthTotals, barTotals] = await Promise.all([
    prisma.category.findMany({ where: { householdId } }),
    spentByCategory(householdId, start, end),
    incomeExpenseTotals(householdId, start, end),
    Promise.all(
      barKeys.map(async (k) => {
        const r = monthRange(k);
        const t = await incomeExpenseTotals(householdId, r.start, r.end);
        return { key: k, ...t };
      })
    ),
  ]);

  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const slices: CategorySlice[] = [...spentMap.entries()]
    .map(([id, value]) => {
      const name = nameById.get(id);
      return { name: name ? tCategory(dict, name) : t.other, value };
    })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const bars: MonthBar[] = barTotals.map((bt) => ({
    month: format(parse(bt.key + "-01", "yyyy-MM-dd", new Date()), "MMM", {
      locale: df,
    }),
    income: bt.income,
    expense: bt.expense,
  }));

  const net = monthTotals.income - monthTotals.expense;

  const monthOptions = recentMonthKeys(12)
    .map((k) => ({ value: k, label: monthLabel(k, df) }))
    .reverse();
  if (!monthOptions.some((o) => o.value === selectedKey)) {
    monthOptions.unshift({ value: selectedKey, label: monthLabel(selectedKey, df) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(t.subtitle, { month: monthLabel(selectedKey, df) })}
          </p>
        </div>
        <MonthSelect value={selectedKey} options={monthOptions} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label={t.income}
          value={formatCents(monthTotals.income, currency)}
          icon={TrendingUp}
          tone="positive"
        />
        <MetricCard
          label={t.expense}
          value={formatCents(monthTotals.expense, currency)}
          icon={TrendingDown}
          tone="negative"
        />
        <MetricCard
          label={t.net}
          value={formatCents(net, currency)}
          icon={Scale}
          tone={net >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.spendingByCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingDonut data={slices} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.incomeVsExpense}</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseBars data={bars} currency={currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
