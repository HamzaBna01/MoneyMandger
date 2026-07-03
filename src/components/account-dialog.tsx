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
import { Switch } from "@/components/ui/switch";
import { ACCOUNT_TYPES } from "@/lib/accounts";
import { useDict } from "@/components/i18n-provider";
import {
  saveAccount,
  deleteAccount,
  type ActionState,
} from "@/app/(dashboard)/accounts/actions";

export interface AccountInitial {
  id?: string;
  name: string;
  type: string;
  amount: string;
  isPrimary?: boolean;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  const d = useDict().accounts.dialog;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {editing ? d.submitSave : d.submitAdd}
    </Button>
  );
}

export function AccountDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AccountInitial | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveAccount, {});
  const [deleting, startDelete] = useTransition();
  const [type, setType] = useState("BANK");
  const [isPrimary, setIsPrimary] = useState(false);
  const dict = useDict();
  const t = dict.accounts;
  const d = t.dialog;

  useEffect(() => {
    if (open) {
      setType(initial?.type ?? "BANK");
      setIsPrimary(initial?.isPrimary ?? false);
    }
  }, [open, initial]);

  useEffect(() => {
    if (state.ok) {
      toast.success(initial?.id ? t.toast.updated : t.toast.added);
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
          <input type="hidden" name="isPrimary" value={isPrimary ? "1" : ""} />

          <div className="space-y-2">
            <Label htmlFor="name">{d.name}</Label>
            <Input
              id="name"
              name="name"
              placeholder={d.namePlaceholder}
              defaultValue={initial?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{d.type}</Label>
              <Select
                name="type"
                value={type}
                onValueChange={(v) => setType(v as string)}
                items={ACCOUNT_TYPES.map((at) => ({
                  value: at.value,
                  label: t.types[at.value],
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={d.type} />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((at) => (
                    <SelectItem key={at.value} value={at.value}>
                      {t.types[at.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">
                {editing ? d.balance : d.startingBalance}
              </Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={initial?.amount ?? "0"}
                required
              />
            </div>
          </div>

          <label className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">{d.mainAccount}</span>
              <span className="block text-xs text-muted-foreground">
                {d.mainAccountHint}
              </span>
            </span>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </label>

          <DialogFooter showCloseButton>
            {editing && (
              <Button
                type="button"
                variant="destructive"
                className="sm:me-auto"
                disabled={deleting}
                onClick={() => {
                  startDelete(async () => {
                    const res = await deleteAccount(initial!.id!);
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
