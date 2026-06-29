"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icon";
import {
  CategoryDialog,
  type CategoryInitial,
} from "@/components/category-dialog";
import { useDict } from "@/components/i18n-provider";
import { tCategory } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { cn } from "@/lib/utils";

export interface CategoryView {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  icon: string;
}

function CategoryGroup({
  title,
  items,
  canEdit,
  dict,
  onEdit,
}: {
  title: string;
  items: CategoryView[];
  canEdit: boolean;
  dict: Dictionary;
  onEdit: (c: CategoryView) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onEdit(c)}
            disabled={!canEdit}
            className="text-left disabled:cursor-default"
          >
            <Card
              className={cn(
                "transition-colors",
                canEdit && "hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <CategoryIcon icon={c.icon} />
                <span className="truncate text-sm font-medium">
                  {tCategory(dict, c.name)}
                </span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CategoriesClient({
  categories,
  canEdit,
}: {
  categories: CategoryView[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryInitial | null>(null);
  const dict = useDict();
  const t = dict.categoriesPage;

  const { expenses, income } = useMemo(
    () => ({
      expenses: categories.filter((c) => c.kind === "EXPENSE"),
      income: categories.filter((c) => c.kind === "INCOME"),
    }),
    [categories]
  );

  function startCreate() {
    setEditing(null);
    setOpen(true);
  }
  function startEdit(c: CategoryView) {
    if (!canEdit) return;
    setEditing({ id: c.id, name: c.name, kind: c.kind, icon: c.icon });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {canEdit && (
          <Button onClick={startCreate}>
            <Plus className="size-4" />
            {t.add}
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        <div className="space-y-8">
          <CategoryGroup
            title={t.expenses}
            items={expenses}
            canEdit={canEdit}
            dict={dict}
            onEdit={startEdit}
          />
          <CategoryGroup
            title={t.income}
            items={income}
            canEdit={canEdit}
            dict={dict}
            onEdit={startEdit}
          />
        </div>
      )}

      <CategoryDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
