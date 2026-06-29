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
import { useDict } from "@/components/i18n-provider";
import { tCategory } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/interpolate";
import { cn } from "@/lib/utils";
import {
  saveTransaction,
  deleteTransaction,
  type ActionState,
} from "@/app/(dashboard)/transactions/actions";

export interface AccountOption {
  id: string;
  name: string;
}
export interface CategoryOption {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
}

export interface TxInitial {
  id?: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  date: string; // yyyy-MM-dd
  note?: string;
}

const TYPE_VALUES = ["EXPENSE", "INCOME", "TRANSFER"] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  const d = useDict().transactions.dialog;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {editing ? d.submitSave : d.submitAdd}
    </Button>
  );
}

export function TransactionDialog({
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
  initial?: TxInitial | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveTransaction, {});
  const [deleting, startDelete] = useTransition();
  const dict = useDict();
  const d = dict.transactions.dialog;
  const typeLabel: Record<(typeof TYPE_VALUES)[number], string> = {
    EXPENSE: d.typeExpense,
    INCOME: d.typeIncome,
    TRANSFER: d.typeTransfer,
  };

  const [type, setType] = useState<TxInitial["type"]>("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Reset form fields whenever the dialog opens (with or without initial data).
  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "EXPENSE");
    setAccountId(initial?.accountId ?? accounts[0]?.id ?? "");
    setToAccountId(initial?.toAccountId ?? "");
    setCategoryId(initial?.categoryId ?? "");
  }, [open, initial, accounts]);

  useEffect(() => {
    if (state.ok) {
      toast.success(
        initial?.id
          ? dict.transactions.toast.updated
          : dict.transactions.toast.added
      );
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const visibleCategories = useMemo(
    () =>
      categories.filter((c) =>
        type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE"
      ),
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

          {/* Type segmented control */}
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {TYPE_VALUES.map((value) => (
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
                {typeLabel[value]}
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
              <Label>{type === "TRANSFER" ? d.fromAccount : d.account}</Label>
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

            {type === "TRANSFER" ? (
              <div className="space-y-2">
                <Label>{d.toAccount}</Label>
                <Select
                  name="toAccountId"
                  value={toAccountId}
                  onValueChange={(v) => setToAccountId(v as string)}
                  items={accounts.map((a) => ({ value: a.id, label: a.name }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={d.selectAccount} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">{d.date}</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={initial?.date ?? todayKey()}
                required
              />
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
                    const res = await deleteTransaction(initial!.id!);
                    if (res.ok) {
                      toast.success(dict.transactions.toast.deleted);
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
