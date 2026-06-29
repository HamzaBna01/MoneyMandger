"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AccountOption, CategoryOption } from "@/components/transaction-dialog";
import { useDict } from "@/components/i18n-provider";
import { tCategory } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";
import {
  saveRecurring,
  deleteRecurring,
  type ActionState,
} from "@/app/(dashboard)/recurring/actions";

export interface RecurringInitial {
  id?: string;
  type: "EXPENSE" | "INCOME";
  amount: string;
  accountId: string;
  categoryId: string;
  cadence: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  nextRun: string; // yyyy-MM-dd
  note?: string;
}

const CADENCE_VALUES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  const d = useDict().recurring.dialog;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {editing ? d.submitSave : d.submitAdd}
    </Button>
  );
}

export function RecurringDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
  initial?: RecurringInitial | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveRecurring, {});
  const [deleting, startDelete] = useTransition();

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cadence, setCadence] = useState("MONTHLY");
  const dict = useDict();
  const t = dict.recurring;
  const d = t.dialog;

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "EXPENSE");
    setAccountId(initial?.accountId ?? accounts[0]?.id ?? "");
    setCategoryId(initial?.categoryId ?? "");
    setCadence(initial?.cadence ?? "MONTHLY");
  }, [open, initial, accounts]);

  useEffect(() => {
    if (state.ok) {
      toast.success(initial?.id ? t.toast.updated : t.toast.added);
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  const editing = !!initial?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? d.editTitle : d.newTitle}</DialogTitle>
          <DialogDescription>{d.description}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={initial!.id} />}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="cadence" value={cadence} />

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["EXPENSE", "INCOME"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setType(value);
                  setCategoryId("");
                }}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  type === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value === "EXPENSE" ? d.typeExpense : d.typeIncome}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{d.amount}</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={initial?.amount ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{d.account}</Label>
              <Select
                name="accountId"
                value={accountId}
                onValueChange={(v) => setAccountId(v as string)}
                items={accounts.map((a) => ({ value: a.id, label: a.name }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={d.selectAccount} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{d.category}</Label>
              <Select
                name="categoryId"
                value={categoryId}
                onValueChange={(v) => setCategoryId(v as string)}
                items={visibleCategories.map((c) => ({
                  value: c.id,
                  label: tCategory(dict, c.name),
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={d.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {visibleCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {tCategory(dict, c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{d.frequency}</Label>
              <Select
                value={cadence}
                onValueChange={(v) => setCadence(v as string)}
                items={CADENCE_VALUES.map((c) => ({ value: c, label: t.cadence[c] }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={d.frequency} />
                </SelectTrigger>
                <SelectContent>
                  {CADENCE_VALUES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t.cadence[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextRun">{d.nextRun}</Label>
              <Input
                id="nextRun"
                name="nextRun"
                type="date"
                defaultValue={initial?.nextRun ?? todayKey()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              {fmt(d.note, { optional: dict.common.optional })}
            </Label>
            <Input
              id="note"
              name="note"
              placeholder={d.notePlaceholder}
              defaultValue={initial?.note ?? ""}
            />
          </div>

          <DialogFooter showCloseButton>
            {editing && (
              <Button
                type="button"
                variant="destructive"
                className="sm:me-auto"
                disabled={deleting}
                onClick={() => {
                  startDelete(async () => {
                    const res = await deleteRecurring(initial!.id!);
                    if (res.ok) {
                      toast.success(t.toast.deleted);
                      onOpenChange(false);
                    } else {
                      toast.error(res.error ?? dict.common.couldNotDelete);
                    }
                  });
                }}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {dict.common.delete}
              </Button>
            )}
            <SubmitButton editing={editing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
