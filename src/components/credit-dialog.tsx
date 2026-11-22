"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
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
import { saveCredit, type ActionState } from "@/app/(dashboard)/credits/actions";

export interface CreditInitial {
  id?: string;
  contactName: string;
  direction: "LENT" | "BORROWED";
  description: string;
  total: string;
  dueDate: string;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  const d = useDict().credits.dialog;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {editing ? d.submitSave : d.submitAdd}
    </Button>
  );
}

export function CreditDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CreditInitial | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveCredit, {});
  const [direction, setDirection] = useState<"LENT" | "BORROWED">("LENT");
  const dict = useDict();
  const t = dict.credits;
  const d = t.dialog;

  useEffect(() => {
    if (open) {
      setDirection(initial?.direction ?? "LENT");
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
          <div className="space-y-2">
            <Label htmlFor="contactName">{d.contact}</Label>
            <Input id="contactName" name="contactName" defaultValue={initial?.contactName ?? ""} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{d.direction}</Label>
              <Select name="direction" value={direction} onValueChange={(v) => setDirection(v as "LENT" | "BORROWED")}
                items={[
                  { value: "LENT", label: t.direction.lent },
                  { value: "BORROWED", label: t.direction.borrowed },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={d.direction} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LENT">{t.direction.lent}</SelectItem>
                  <SelectItem value="BORROWED">{t.direction.borrowed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">{d.amount}</Label>
              <Input id="total" name="total" inputMode="decimal" defaultValue={initial?.total ?? "0"} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{d.descriptionLabel}</Label>
            <Input id="description" name="description" defaultValue={initial?.description ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">{d.dueDate}</Label>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={initial?.dueDate ?? ""} />
          </div>

          <DialogFooter showCloseButton>
            <SubmitButton editing={editing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
