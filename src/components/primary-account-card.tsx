import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { accountMeta } from "@/lib/accounts";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/fx/tilt-card";
import { CountUp } from "@/components/fx/count-up";

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
      <Card className="h-full border-dashed">
        <CardContent className="flex h-full flex-wrap items-center justify-between gap-3 p-5">
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
    <TiltCard className="h-full rounded-2xl" max={10}>
      <div
        data-slot="card"
        className="relative isolate flex h-full min-h-40 flex-col justify-between overflow-hidden rounded-2xl p-5 text-white ring-1 ring-white/10"
        style={{
          background:
            "radial-gradient(120% 140% at 100% 0%, rgb(212 255 58 / 0.35), transparent 55%), radial-gradient(90% 120% at 0% 100%, rgb(54 226 245 / 0.22), transparent 60%), linear-gradient(135deg, #12151d, #07080c)",
        }}
      >
        {/* Orbit lines etched into the card */}
        <svg aria-hidden viewBox="0 0 200 120" className="pointer-events-none absolute -inset-e-10 -top-6 -z-10 h-[140%] opacity-40">
          <ellipse cx="120" cy="60" rx="90" ry="34" fill="none" stroke="#d4ff3a" strokeWidth="0.6" transform="rotate(-18 120 60)" />
          <ellipse cx="120" cy="60" rx="70" ry="52" fill="none" stroke="#d4ff3a" strokeWidth="0.4" transform="rotate(24 120 60)" />
          <circle cx="186" cy="44" r="2.2" fill="#d4ff3a" />
        </svg>
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4ff3a]">
            <Star className="size-3.5 fill-current" />
            {t.mainAccount}
          </p>
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
            <Icon className="size-4.5" />
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {/* EMV chip */}
            <span aria-hidden className="mb-3 block h-6 w-8 rounded-md bg-gradient-to-br from-[#f5e7a8] via-[#c9a94e] to-[#8a6d22] shadow-inner" />
            <p className="truncate text-xs text-white/60">{account.name}</p>
            <CountUp
              cents={account.balanceCents}
              currency={currency}
              delay={600}
              className={cn(
                "font-display block truncate text-2xl font-bold tabular-nums",
                account.balanceCents < 0 && "text-negative"
              )}
            />
          </div>
          {canEdit && (
            <Link
              href="/accounts"
              aria-label={t.mainAccount}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#d4ff3a] text-[#0b0e02] shadow-[0_0_24px_-4px_#d4ff3a] transition-transform hover:scale-110 rtl:-scale-x-100"
            >
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        {/* Moving gloss */}
        <span aria-hidden className="card-gloss pointer-events-none absolute inset-0 -z-0" />
      </div>
    </TiltCard>
  );
}
