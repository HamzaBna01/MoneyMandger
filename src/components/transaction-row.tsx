"use client";

import { Repeat } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { useDict } from "@/components/i18n-provider";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface TxRowData {
  id: string;
  iconKey: string;
  title: string;
  subtitle: string;
  amountCents: number; // for TRANSFER this is signed
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  currency: string;
  recurring?: boolean;
}

function amountDisplay(t: TxRowData) {
  if (t.type === "INCOME") {
    return { text: `+${formatCents(t.amountCents, t.currency)}`, cls: "text-positive" };
  }
  if (t.type === "EXPENSE") {
    return { text: `-${formatCents(t.amountCents, t.currency)}`, cls: "text-negative" };
  }
  // TRANSFER — internal move; show the amount neutrally (direction is in the subtitle).
  return {
    text: formatCents(Math.abs(t.amountCents), t.currency),
    cls: "text-muted-foreground",
  };
}

export function TransactionRow({
  tx,
  onClick,
}: {
  tx: TxRowData;
  onClick?: () => void;
}) {
  const amount = amountDisplay(tx);
  const interactive = !!onClick;
  const dict = useDict();

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2",
        interactive && "cursor-pointer hover:bg-accent"
      )}
    >
      <CategoryIcon icon={tx.iconKey} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{tx.title}</p>
          {tx.recurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Repeat className="size-3" />
              {dict.transactions.recurringBadge}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{tx.subtitle}</p>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", amount.cls)}>
        {amount.text}
      </span>
    </div>
  );
}
