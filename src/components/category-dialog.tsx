"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PICKABLE_ICONS, iconFor, toneFor } from "@/lib/categories";
import { categoryKinds } from "@/lib/validations";
import { useDict } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import {
  saveCategory,
  deleteCategory,
  type ActionState,
} from "@/app/(dashboard)/categories/actions";

export interface CategoryInitial {
  id?: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  icon: string;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  const d = useDict().categoriesPage.dialog;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {editing ? d.submitSave : d.submitAdd}
    </Button>
  );
}

export function CategoryDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CategoryInitial | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveCategory,
    {}
  );
  const [deleting, startDelete] = useTransition();
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [icon, setIcon] = useState("circle");
  const dict = useDict();
  const t = dict.categoriesPage;
  const d = t.dialog;

  useEffect(() => {
    if (open) {
      setKind(initial?.kind ?? "EXPENSE");
      setIcon(initial?.icon ?? "circle");
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
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="icon" value={icon} />

          {/* Kind segmented control */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {categoryKinds.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  kind === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.kinds[value]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{d.name}</Label>
            <Input
              id="name"
              name="name"
              placeholder={d.namePlaceholder}
              defaultValue={initial?.name ?? ""}
              maxLength={40}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{d.icon}</Label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {PICKABLE_ICONS.map((key) => {
                const Icon = iconFor(key);
                const selected = icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={key}
                    aria-pressed={selected}
                    onClick={() => setIcon(key)}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-lg transition-all",
                      toneFor(key),
                      selected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <Icon className="size-5" />
                    {selected && (
                      <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
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
                    const res = await deleteCategory(initial!.id!);
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
