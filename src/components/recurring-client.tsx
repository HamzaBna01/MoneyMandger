"use client";

import { useState, useTransition } from "react";
import { Plus, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icon";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  RecurringDialog,
  type RecurringInitial,
} from "@/components/recurring-dialog";
import type {
  AccountOption,
  CategoryOption,
} from "@/components/transaction-dialog";
import { useDict } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/interpolate";
import { runRecurringNow } from "@/app/(dashboard)/recurring/actions";

export interface RecurringView {
  id: string;
  iconKey: string;
  title: string;
  subtitle: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  currency: string;
  due: boolean;
  edit: RecurringInitial;
}

export function RecurringClient({
  rules,
  accounts,
  categories,
}: {
  rules: RecurringView[];
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringInitial | null>(null);
  const [running, startRun] = useTransition();
  const dict = useDict();
  const t = dict.recurring;

  const dueCount = rules.filter((r) => r.due).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.subtitle}
            {dueCount > 0 && (
              <span className="font-medium text-foreground">
                {fmt(t.dueNow, { count: dueCount })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={running}
            onClick={() =>
              startRun(async () => {
                const res = await runRecurringNow();
                if (res.ok) {
                  toast.success(
                    res.created
                      ? fmt(
                          res.created === 1 ? t.toast.postedOne : t.toast.postedOther,
                          { count: res.created }
                        )
                      : t.toast.nothingDue
                  );
                } else {
                  toast.error(res.error ?? t.toast.couldNotRun);
                }
              })
            }
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            {t.runDueNow}
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t.add}
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-2">
            {rules.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setEditing(r.edit);
                  setOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
              >
                <CategoryIcon icon={r.iconKey} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    {r.due && (
                      <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                        {t.dueBadge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    r.type === "INCOME" ? "text-positive" : "text-negative"
                  )}
                >
                  {r.type === "INCOME" ? "+" : "-"}
                  {formatCents(r.amountCents, r.currency)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <RecurringDialog
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
        initial={editing}
      />
    </div>
  );
}
