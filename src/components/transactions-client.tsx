"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionRow, type TxRowData } from "@/components/transaction-row";
import {
  TransactionDialog,
  type AccountOption,
  type CategoryOption,
  type TxInitial,
} from "@/components/transaction-dialog";
import { useDict } from "@/components/i18n-provider";
import { tCategory } from "@/lib/i18n/get-dictionary";

export interface TxGroup {
  label: string;
  items: { row: TxRowData; edit: TxInitial }[];
}

const ALL = "all";

export function TransactionsClient({
  groups,
  accounts,
  categories,
  months,
  filters,
  autoNew,
}: {
  groups: TxGroup[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  months: { value: string; label: string }[];
  filters: { q: string; accountId: string; categoryId: string; month: string };
  autoNew: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const dict = useDict();
  const t = dict.transactions;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TxInitial | null>(null);
  const [q, setQ] = useState(filters.q);

  // Open the dialog automatically when arriving via the mobile "+" (?new=1).
  useEffect(() => {
    if (autoNew) {
      setEditing(null);
      setOpen(true);
    }
  }, [autoNew]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("new");
    startTransition(() => router.replace(`/transactions?${params.toString()}`));
  }

  // Debounced search.
  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== filters.q) setParam("q", q);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(init: TxInitial) {
    setEditing(init);
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          {t.add}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchNotes}
              className="ps-8"
            />
          </div>
          <FilterSelect
            value={filters.month || ALL}
            onChange={(v) => setParam("month", v)}
            placeholder={t.month}
            options={[{ value: ALL, label: t.allTime }, ...months]}
          />
          <FilterSelect
            value={filters.categoryId || ALL}
            onChange={(v) => setParam("categoryId", v)}
            placeholder={t.category}
            options={[
              { value: ALL, label: t.allCategories },
              ...categories.map((c) => ({ value: c.id, label: tCategory(dict, c.name) })),
            ]}
          />
          <FilterSelect
            value={filters.accountId || ALL}
            onChange={(v) => setParam("accountId", v)}
            placeholder={t.account}
            options={[
              { value: ALL, label: t.allAccounts },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        </CardContent>
      </Card>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t.noMatch}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <Card>
                <CardContent className="p-2">
                  {group.items.map((item) => (
                    <TransactionRow
                      key={item.row.id}
                      tx={item.row}
                      onClick={() => openEdit(item.edit)}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
        initial={editing}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as string)}
      items={options}
    >
      <SelectTrigger className="w-full md:w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
