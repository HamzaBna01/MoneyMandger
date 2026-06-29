"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetBar, type BudgetBarData } from "@/components/budget-bar";
import { BudgetDialog, type BudgetInitial } from "@/components/budget-dialog";
import { useDict } from "@/components/i18n-provider";
import { tCategory } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";

export interface BudgetItem extends BudgetBarData {
  limitInput: string;
}

export function BudgetsClient({
  monthLabel,
  budgets,
  unbudgeted,
}: {
  monthLabel: string;
  budgets: BudgetItem[];
  unbudgeted: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<BudgetInitial | null>(null);
  const dict = useDict();
  const t = dict.budgets;

  function openAdd() {
    setInitial({ categoryId: unbudgeted[0]?.id ?? "", amount: "", editing: false });
    setOpen(true);
  }
  function openEdit(b: BudgetItem) {
    setInitial({ categoryId: b.categoryId, amount: b.limitInput, editing: true });
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(t.subtitle, { month: monthLabel })}
          </p>
        </div>
        <Button onClick={openAdd} disabled={unbudgeted.length === 0}>
          <Plus className="size-4" />
          {t.add}
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-6 p-5">
            {budgets.map((b) => (
              <button
                key={b.categoryId}
                type="button"
                onClick={() => openEdit(b)}
                className="block w-full rounded-lg text-left transition-colors hover:bg-accent/40"
              >
                <BudgetBar data={b} />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {unbudgeted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.notBudgeted}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {unbudgeted.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setInitial({ categoryId: c.id, amount: "", editing: false });
                  setOpen(true);
                }}
                className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + {tCategory(dict, c.name)}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <BudgetDialog
        open={open}
        onOpenChange={setOpen}
        initial={initial}
        categories={
          initial?.editing
            ? budgets
                .filter((b) => b.categoryId === initial.categoryId)
                .map((b) => ({ id: b.categoryId, name: b.name }))
            : unbudgeted
        }
      />
    </div>
  );
}
