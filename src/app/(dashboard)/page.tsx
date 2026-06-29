import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowRight } from "lucide-react";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { monthRange, previousMonthRange } from "@/lib/dates";
import {
  totalBalance,
  incomeExpenseTotals,
  spentByCategory,
  savingsBalance,
  monthlySavingsAverage,
  topSpendingCategories,
} from "@/lib/queries";
import { buildSavingsProjection } from "@/lib/savings";
import { formatCents } from "@/lib/money";
import { toRowData } from "@/lib/tx-display";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";
import { MetricCard, type MetricDelta } from "@/components/metric-card";
import { SavingsCard } from "@/components/savings-card";
import { TransactionRow } from "@/components/transaction-row";
import { BudgetBar } from "@/components/budget-bar";
import { TopSpendingCard } from "@/components/top-spending-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { householdId, household, userName, role } = await requireHousehold();
  const currency = household.baseCurrency;
  const { start, end } = monthRange();
  const prev = previousMonthRange();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const t = dict.dashboard;

  const [
    balance,
    totals,
    prevTotals,
    recent,
    budgets,
    spentMap,
    savings,
    savingsAvg,
    topCategories,
  ] = await Promise.all([
      totalBalance(householdId),
      incomeExpenseTotals(householdId, start, end),
      incomeExpenseTotals(householdId, prev.start, prev.end),
      prisma.transaction.findMany({
        where: { account: { householdId } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: { category: true, account: true },
      }),
      prisma.budget.findMany({
        where: { householdId },
        include: { category: true },
      }),
      spentByCategory(householdId, start, end),
      savingsBalance(householdId),
      monthlySavingsAverage(householdId),
      topSpendingCategories(householdId, start, end),
    ]);

  const savingsProjection = buildSavingsProjection({
    currentCents: savings,
    monthlyAvgCents: savingsAvg,
    monthlyTargetCents: household.savingsMonthlyCents,
    goalDeadline: household.savingsGoalDeadline,
  });

  // Month-over-month deltas. `higherIsGood` flips the colour: more income is
  // good, more spending is bad. No delta when there's no prior-month baseline
  // or the change rounds to 0%.
  const monthDelta = (
    current: number,
    previous: number,
    higherIsGood: boolean
  ): MetricDelta | undefined => {
    if (previous <= 0) return undefined;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return undefined;
    const up = pct > 0;
    return {
      text: fmt(t.vsLastMonth, { pct: Math.abs(pct) }),
      up,
      tone: up === higherIsGood ? "positive" : "negative",
    };
  };

  const incomeDelta = monthDelta(totals.income, prevTotals.income, true);
  const spentDelta = monthDelta(totals.expense, prevTotals.expense, false);

  const greeting = fmt(t.greeting, { name: userName.split(" ")[0] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(t.subtitle, { household: household.name })}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/transactions?new=1" />}>
          <Plus className="size-4" />
          {t.addTransaction}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label={t.totalBalance}
          value={formatCents(balance, currency)}
          icon={Wallet}
        />
        <MetricCard
          label={t.incomeThisMonth}
          value={formatCents(totals.income, currency)}
          icon={TrendingUp}
          tone="positive"
          delta={incomeDelta}
        />
        <MetricCard
          label={t.spentThisMonth}
          value={formatCents(totals.expense, currency)}
          icon={TrendingDown}
          tone="negative"
          delta={spentDelta}
        />
      </div>

      <SavingsCard
        projection={savingsProjection}
        currency={currency}
        canEdit={role === "OWNER"}
        dict={dict}
        locale={locale}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.recentTransactions}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/transactions" />}
              >
                {t.viewAll}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyHint text={t.noTransactions} />
            ) : (
              <div className="-mx-2">
                {recent.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={toRowData(tx, currency, dict, locale)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <TopSpendingCard
            categories={topCategories}
            totalCents={totals.expense}
            currency={currency}
            dict={dict}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.budgetStatus}</CardTitle>
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/budgets" />}>
                  {t.manage}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {budgets.length === 0 ? (
                <EmptyHint text={t.noBudgets} />
              ) : (
                budgets.map((b) => (
                  <BudgetBar
                    key={b.id}
                    data={{
                      categoryId: b.categoryId,
                      name: b.category.name,
                      iconKey: b.category.icon,
                      spentCents: spentMap.get(b.categoryId) ?? 0,
                      limitCents: b.limitCents,
                      currency,
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
  );
}
