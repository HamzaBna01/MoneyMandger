import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";
import { formatCents } from "@/lib/money";
import { tCategory } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { CategorySpend } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function TopSpendingCard({
  categories,
  totalCents,
  currency,
  dict,
}: {
  categories: CategorySpend[];
  /** Total spending this month — denominator for each category's share. */
  totalCents: number;
  currency: string;
  dict: Dictionary;
}) {
  const t = dict.dashboard;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.topSpending}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/reports" />}
          >
            {t.viewAll}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t.noSpending}
          </p>
        ) : (
          categories.map((c) => {
            const share = totalCents > 0 ? (c.amountCents / totalCents) * 100 : 0;
            return (
              <div key={c.categoryId} className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={c.icon} size="sm" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {tCategory(dict, c.name)}
                  </p>
                  <div className="text-end">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCents(c.amountCents, currency)}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {Math.round(share)}%
                    </p>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full bg-primary/70 transition-all")}
                    style={{ width: `${Math.min(share, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
