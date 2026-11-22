import Link from "next/link";
import { format } from "date-fns";
import { Coins, Target, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCents, formatSignedCents } from "@/lib/money";
import type { SavingsProjection } from "@/lib/savings";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { fmt } from "@/lib/i18n/interpolate";
import { dateLocale } from "@/lib/i18n/date-locale";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/fx/count-up";

export function SavingsCard({
  projection,
  currency,
  canEdit,
  dict,
  locale,
}: {
  projection: SavingsProjection;
  currency: string;
  canEdit: boolean;
  dict: Dictionary;
  locale: Locale;
}) {
  const { currentCents, monthlyAvgCents, yearEndCents, goal } = projection;
  const t = dict.savings;
  const df = dateLocale(locale);
  const yearLabel = format(new Date(), "yyyy", { locale: df });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-inset ring-primary/25">
              <Coins className="size-4" />
            </span>
            {t.title}
          </CardTitle>
          {canEdit && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/settings" />}>
              {goal ? t.editGoal : t.setGoal}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current balance + pace */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t.inSavings}</p>
            <CountUp
              cents={currentCents}
              currency={currency}
              delay={700}
              className="font-display block text-3xl font-bold tabular-nums"
            />
          </div>
          <div className="text-end">
            <p className="text-sm text-muted-foreground">{t.pace}</p>
            <p
              className={cn(
                "text-sm font-medium tabular-nums",
                monthlyAvgCents > 0
                  ? "text-positive"
                  : monthlyAvgCents < 0
                    ? "text-negative"
                    : "text-muted-foreground"
              )}
            >
              {fmt(t.perMonth, {
                amount: formatSignedCents(monthlyAvgCents, currency),
              })}
            </p>
          </div>
        </div>

        {/* Year-end projection */}
        <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-muted-foreground">
          {fmt(t.onPace, {
            amount: formatCents(yearEndCents, currency),
            year: yearLabel,
          })}
        </div>

        {/* Goal progress */}
        {goal ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Target className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {fmt(t.goalLabel, {
                    amount: formatCents(goal.monthlyTargetCents, currency),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmt(t.targetBy, {
                    amount: formatCents(goal.targetCents, currency),
                    date: format(goal.deadline, "d MMM yyyy", { locale: df }),
                  })}
                </p>
              </div>
              <OnTrackBadge onTrack={goal.onTrack} dict={dict} />
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "bar-fill h-full rounded-full",
                  goal.onTrack
                    ? "bg-gradient-to-r from-positive to-neon"
                    : "bg-gradient-to-r from-warning to-negative/80"
                )}
                style={{ width: `${goal.progress * 100}%` }}
              />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">
              {goal.remainingCents > 0
                ? fmt(t.toGo, {
                    remaining: formatCents(goal.remainingCents, currency),
                    projected: formatCents(goal.projectedCents, currency),
                  })
                : t.goalReached}
            </p>
            {/* Warn when the monthly pace falls short of the chosen target. */}
            {!goal.onTrack && goal.shortfallCents > 0 && (
              <p className="flex items-start gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  {fmt(t.behindWarning, {
                    pace: formatCents(Math.max(0, monthlyAvgCents), currency),
                    shortfall: formatCents(goal.shortfallCents, currency),
                  })}
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {canEdit ? t.setGoalHint : t.noGoal}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OnTrackBadge({ onTrack, dict }: { onTrack: boolean; dict: Dictionary }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        onTrack ? "bg-positive/15 text-positive" : "bg-warning/15 text-warning"
      )}
    >
      {onTrack ? dict.savings.onTrack : dict.savings.behind}
    </span>
  );
}
