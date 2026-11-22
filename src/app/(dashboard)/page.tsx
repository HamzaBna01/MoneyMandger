import Link from "next/link";
import { TrendingUp, TrendingDown, Plus, ArrowRight } from "lucide-react";
import { requireHousehold, canWrite } from "@/lib/session";
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
import { toRowData } from "@/lib/tx-display";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";
import { MetricCard, type MetricDelta } from "@/components/metric-card";
import { SavingsCard } from "@/components/savings-card";
import { PrimaryAccountCard } from "@/components/primary-account-card";
import { TransactionRow } from "@/components/transaction-row";
import { BudgetBar } from "@/components/budget-bar";
import { TopSpendingCard } from "@/components/top-spending-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrbitGlobe } from "@/components/fx/orbit-globe";
import { TiltCard } from "@/components/fx/tilt-card";
import { CountUp } from "@/components/fx/count-up";

/** Staggered entrance order for `.reveal` elements. */
const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

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
    primaryAccount,
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
      prisma.account.findFirst({
        where: { householdId, isPrimary: true },
        select: { name: true, type: true, balanceCents: true },
      }),
    ]);

  const savingsProjection = buildSavingsProjection({
    currentCents: savings,
    monthlyAvgCents: savingsAvg,
    monthlyTargetCents: household.savingsMonthlyCents,
    goalDeadline: household.savingsGoalDeadline,
    goalBaselineCents: household.savingsGoalBaselineCents,
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

  const firstName = userName.split(" ")[0];
  const greeting = fmt(t.greeting, { name: firstName });
  // Split the greeting template around {name} so the name can glow.
  const greetHasName = t.greeting.includes("{name}");
  const [greetBefore, greetAfter = ""] = greetHasName
    ? t.greeting.split("{name}")
    : [greeting];
  const spendShares = topCategories.map((c) =>
    totals.expense > 0 ? c.amountCents / totals.expense : 0
  );

  return (
    <div className="space-y-6">
      {/* ── Hero: balance + orbiting globe ── */}
      <section
        className="reveal relative isolate overflow-hidden rounded-3xl border bg-card/50 backdrop-blur-xl"
        style={stagger(0)}
      >
        <div className="hero-floor -z-10" />
        <div className="pointer-events-none absolute -inset-e-24 -top-24 -z-10 size-80 rounded-full bg-neon/20 blur-3xl" />
        <div className="grid grid-cols-1 items-center md:grid-cols-[1.15fr_1fr]">
          <div className="space-y-7 p-6 sm:p-8 md:p-10">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="live-dot size-1.5 shrink-0 rounded-full bg-neon" />
              <span className="truncate">{fmt(t.subtitle, { household: household.name })}</span>
            </p>
            <h1 className="font-display text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-5xl">
              {greetBefore}
              {greetHasName && <span className="text-neon">{firstName}</span>}
              {greetAfter}
            </h1>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t.totalBalance}
              </p>
              <CountUp
                cents={balance}
                currency={currency}
                duration={2000}
                className="font-display mt-1 block text-4xl font-bold tabular-nums sm:text-5xl lg:text-6xl"
              />
            </div>
            <Button
              size="lg"
              className="neon-glow h-11 rounded-full px-5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              nativeButton={false}
              render={<Link href="/transactions?new=1" />}
            >
              <Plus className="size-4" />
              {t.addTransaction}
            </Button>
          </div>
          <div className="hero-float relative h-64 min-w-0 sm:h-80 md:h-100">
            <OrbitGlobe shares={spendShares} />
          </div>
        </div>
      </section>

      {/* ── Month at a glance ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="reveal" style={stagger(1)}>
          <TiltCard className="h-full">
            <MetricCard
              label={t.incomeThisMonth}
              value={<CountUp cents={totals.income} currency={currency} delay={400} />}
              icon={TrendingUp}
              tone="positive"
              delta={incomeDelta}
            />
          </TiltCard>
        </div>
        <div className="reveal" style={stagger(2)}>
          <TiltCard className="h-full">
            <MetricCard
              label={t.spentThisMonth}
              value={<CountUp cents={totals.expense} currency={currency} delay={500} />}
              icon={TrendingDown}
              tone="negative"
              delta={spentDelta}
            />
          </TiltCard>
        </div>
        <div className="reveal sm:col-span-2 lg:col-span-1" style={stagger(3)}>
          <PrimaryAccountCard
            account={primaryAccount}
            currency={currency}
            canEdit={canWrite(role)}
            dict={dict}
          />
        </div>
      </div>

      <div className="reveal" style={stagger(4)}>
        <SavingsCard
          projection={savingsProjection}
          currency={currency}
          canEdit={role === "OWNER"}
          dict={dict}
          locale={locale}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="reveal lg:col-span-3" style={stagger(5)}>
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
                {recent.map((tx, i) => (
                  <div key={tx.id} className="reveal" style={stagger(6 + i)}>
                    <TransactionRow tx={toRowData(tx, currency, dict, locale)} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="reveal" style={stagger(6)}>
          <TopSpendingCard
            categories={topCategories}
            totalCents={totals.expense}
            currency={currency}
            dict={dict}
          />
          </div>

          <Card className="reveal" style={stagger(7)}>
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
