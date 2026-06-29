"use client";

import { CategoryIcon } from "@/components/category-icon";
import { useDict } from "@/components/i18n-provider";
import { tCategory } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface BudgetBarData {
  categoryId: string;
  name: string;
  iconKey: string;
  spentCents: number;
  limitCents: number;
  currency: string;
}

/** green < 80% · amber 80–100% · red > 100% */
function status(pct: number) {
  if (pct > 100) return { bar: "bg-negative", text: "text-negative" };
  if (pct >= 80) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-positive", text: "text-positive" };
}

export function BudgetBar({ data }: { data: BudgetBarData }) {
  const dict = useDict();
  const pct = data.limitCents > 0 ? (data.spentCents / data.limitCents) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const s = status(pct);
  const remaining = data.limitCents - data.spentCents;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={data.iconKey} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tCategory(dict, data.name)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium tabular-nums">
            {formatCents(data.spentCents, data.currency)}
            <span className="text-muted-foreground">
              {" "}
              / {formatCents(data.limitCents, data.currency)}
            </span>
          </p>
          <p className={cn("text-xs tabular-nums", s.text)}>
            {remaining >= 0
              ? fmt(dict.budgets.left, { amount: formatCents(remaining, data.currency) })
              : fmt(dict.budgets.over, { amount: formatCents(-remaining, data.currency) })}
          </p>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", s.bar)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
