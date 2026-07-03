import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { accountMeta } from "@/lib/accounts";
import { formatCents } from "@/lib/money";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { cn } from "@/lib/utils";

/**
 * Prominent dashboard card for the household's main account (where salary
 * lands). Renders a "mark one" prompt when no account is flagged primary.
 */
export function PrimaryAccountCard({
  account,
  currency,
  canEdit,
  dict,
}: {
  account: { name: string; type: string; balanceCents: number } | null;
  currency: string;
  canEdit: boolean;
  dict: Dictionary;
}) {
  const t = dict.dashboard;

  if (!account) {
    if (!canEdit) return null;
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="size-4" />
            {t.noMainAccount}
          </div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/accounts" />}>
            {t.markMainAccount}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const meta = accountMeta(account.type);
  const Icon = meta.icon;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            meta.tone
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
            <Star className="size-3.5" />
            {t.mainAccount}
          </p>
          <p className="truncate text-sm text-muted-foreground">{account.name}</p>
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums",
              account.balanceCents < 0 && "text-negative"
            )}
          >
            {formatCents(account.balanceCents, currency)}
          </p>
        </div>
        {canEdit && (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/accounts" />}>
            <ArrowRight className="size-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
