"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { accountMeta } from "@/lib/accounts";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  AccountDialog,
  type AccountInitial,
} from "@/components/account-dialog";
import { useDict } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/interpolate";

export interface AccountView {
  id: string;
  name: string;
  type: string;
  balanceCents: number;
  amountInput: string;
  isPrimary: boolean;
}

export function AccountsClient({
  accounts,
  currency,
  total,
}: {
  accounts: AccountView[];
  currency: string;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountInitial | null>(null);
  const dict = useDict();
  const t = dict.accounts;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(accounts.length === 1 ? t.summaryOne : t.summaryOther, {
              amount: formatCents(total, currency),
              count: accounts.length,
            })}
          </p>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const meta = accountMeta(a.type);
          const Icon = meta.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setEditing({
                  id: a.id,
                  name: a.name,
                  type: a.type,
                  amount: a.amountInput,
                  isPrimary: a.isPrimary,
                });
                setOpen(true);
              }}
              className="text-left"
            >
              <Card className="transition-colors hover:border-primary/40 hover:bg-accent/40">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        meta.tone
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="flex items-center gap-1.5">
                      {a.isPrimary && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          {t.mainBadge}
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t.types[a.type as keyof typeof t.types] ?? meta.label}
                      </span>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{a.name}</p>
                    <p
                      className={cn(
                        "text-xl font-semibold tabular-nums",
                        a.balanceCents < 0 && "text-negative"
                      )}
                    >
                      {formatCents(a.balanceCents, currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <AccountDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
