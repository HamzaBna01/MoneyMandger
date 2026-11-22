"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditDialog, type CreditInitial } from "@/components/credit-dialog";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteCredit, addPayment } from "@/app/(dashboard)/credits/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export interface CreditView {
  id: string;
  contactName: string;
  direction: "LENT" | "BORROWED";
  description?: string;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  currency: string;
  dueDate?: string;
  dueLabel?: string;
  payments: { id: string; amountCents: number; note?: string; paidAt: Date }[];
  edit: CreditInitial;
  summary: string;
}

export function CreditsClient({
  credits,
  currency,
  dict,
}: {
  credits: CreditView[];
  currency: string;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditInitial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = dict.credits;

  const overdueCount = useMemo(() => credits.filter((c) => c.status === "OVERDUE").length, [credits]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.subtitle}
            {overdueCount > 0 ? ` · ${t.overdueCount.replace("{count}", overdueCount.toString())}` : ""}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4" />
          {t.add}
        </Button>
      </div>

      {credits.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">{t.empty}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {credits.map((credit) => (
            <Card key={credit.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{credit.contactName}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", {
                        "bg-warning/15 text-warning": credit.status === "OVERDUE",
                        "bg-primary/10 text-primary": credit.status === "PARTIALLY_PAID",
                        "bg-positive/15 text-positive": credit.status === "PAID",
                        "bg-muted text-muted-foreground": credit.status === "PENDING",
                      })}>
                        {t.statuses[credit.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{credit.description ?? t.noDescription}</p>
                    <p className="mt-2 text-sm">{credit.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {credit.direction === "LENT" ? t.direction.lent : t.direction.borrowed}
                      {credit.dueLabel ? ` · ${t.due} ${credit.dueLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(credit.edit);
                        setOpen(true);
                      }}
                    >
                      {t.edit}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === credit.id || pending}
                      onClick={() => {
                        setDeletingId(credit.id);
                        startTransition(async () => {
                          const res = await deleteCredit(credit.id);
                          if (res.ok) {
                            toast.success(t.toast.deleted);
                          } else {
                            toast.error(res.error ?? dict.common.couldNotDelete);
                          }
                          setDeletingId(null);
                        });
                      }}
                    >
                      {deletingId === credit.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-semibold">{formatCents(credit.totalCents, credit.currency)}</p>
                    <p className="text-xs text-muted-foreground">{t.total}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatCents(credit.paidCents, credit.currency)}</p>
                    <p className="text-xs text-muted-foreground">{t.paid}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatCents(credit.remainingCents, credit.currency)}</p>
                    <p className="text-xs text-muted-foreground">{t.remaining}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={payingId === credit.id || pending}
                    onClick={() => {
                      const value = window.prompt(t.recordPaymentPrompt ?? "Enter payment amount");
                      if (!value) return;
                      setPayingId(credit.id);
                      startTransition(async () => {
                        const res = await addPayment(credit.id, value, t.toast.paymentNote);
                        if (res.ok) {
                          toast.success(t.toast.paymentAdded);
                        } else {
                          toast.error(res.error ?? t.toast.paymentFailed);
                        }
                        setPayingId(null);
                      });
                    }}
                  >
                    {payingId === credit.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t.recordPayment}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreditDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
      />
    </div>
  );
}
