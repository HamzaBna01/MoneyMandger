"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
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
import {
  saveBudget,
  deleteBudget,
  type ActionState,
} from "@/app/(dashboard)/budgets/actions";

export interface BudgetInitial {
  categoryId: string;
  amount: string;
  editing: boolean;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  const d = useDict().budgets.dialog;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {editing ? d.submitSave : d.submitSet}
    </Button>
  );
}

export function BudgetDialog({
  open,
  onOpenChange,
  initial,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: BudgetInitial | null;
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveBudget, {});
  const [deleting, startDelete] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const dict = useDict();
  const t = dict.budgets;
  const d = t.dialog;

  useEffect(() => {
    if (open) setCategoryId(initial?.categoryId ?? categories[0]?.id ?? "");
  }, [open, initial, categories]);

  useEffect(() => {
    if (state.ok) {
      toast.success(t.toast.saved);
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const editing = !!initial?.editing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? d.editTitle : d.newTitle}</DialogTitle>
          <DialogDescription>{d.description}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="categoryId" value={categoryId} />

          <div className="space-y-2">
            <Label>{d.category}</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v as string)}
              disabled={editing}
              items={categories.map((c) => ({
                value: c.id,
                label: tCategory(dict, c.name),
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={d.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {tCategory(dict, c.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{d.monthlyLimit}</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={initial?.amount ?? ""}
              required
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
                    const res = await deleteBudget(initial!.categoryId);
                    if (res.ok) {
                      toast.success(t.toast.removed);
                      onOpenChange(false);
                    } else {
                      toast.error(res.error ?? dict.common.couldNotRemove);
                    }
                  });
                }}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {dict.common.remove}
              </Button>
            )}
            <SubmitButton editing={editing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
