"use client";

import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountMeta } from "@/lib/accounts";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  AccountDialog,
  type AccountInitial,
} from "@/components/account-dialog";
import { useDict } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/interpolate";
import { TiltCard } from "@/components/fx/tilt-card";
import { CountUp } from "@/components/fx/count-up";

export interface AccountView {
  id: string;
  name: string;
  type: string;
  balanceCents: number;
  amountInput: string;
  isPrimary: boolean;
}

/** Card finish per account type — the accent drives glow, orbit lines and the allocation bar. */
const FINISH: Record<string, { accent: string; glow: string }> = {
  BANK: { accent: "#36e2f5", glow: "rgb(54 226 245 / 0.32)" },
  SAVINGS: { accent: "#a78bfa", glow: "rgb(167 139 250 / 0.34)" },
  CASH: { accent: "#3ee08f", glow: "rgb(62 224 143 / 0.3)" },
  CREDIT_CARD: { accent: "#ffb547", glow: "rgb(255 181 71 / 0.32)" },
};
const finishFor = (type: string) => FINISH[type] ?? FINISH.BANK;

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

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

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  // Share of the money each account holds (accounts in debt don't take a slice).
  const positiveTotal = accounts.reduce((s, a) => s + Math.max(0, a.balanceCents), 0);
  const slices = accounts
    .filter((a) => a.balanceCents > 0)
    .map((a) => ({ ...a, share: a.balanceCents / positiveTotal }));

  return (
    <div className="space-y-6">
      {/* ── Header: total + allocation ── */}
      <section
        className="reveal relative isolate overflow-hidden rounded-3xl border bg-card/50 p-6 backdrop-blur-xl sm:p-8"
        style={stagger(0)}
      >
        <div className="hero-floor -z-10 opacity-30" />
        <div className="pointer-events-none absolute -inset-e-20 -top-24 -z-10 size-72 rounded-full bg-neon/15 blur-3xl" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmt(accounts.length === 1 ? t.summaryOne : t.summaryOther, {
                amount: formatCents(total, currency),
                count: accounts.length,
              })}
            </p>
          </div>
          <Button
            size="lg"
            className="neon-glow h-11 rounded-full px-5 text-sm font-semibold transition-transform hover:scale-[1.03]"
            onClick={openNew}
          >
            <Plus className="size-4" />
            {t.add}
          </Button>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {dict.dashboard.totalBalance}
          </p>
          <CountUp
            cents={total}
            currency={currency}
            duration={1800}
            className={cn(
              "font-display mt-1 block text-4xl font-bold tabular-nums sm:text-5xl",
              total < 0 && "text-negative"
            )}
          />
        </div>

        {slices.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full">
              {slices.map((s, i) => (
                <div
                  key={s.id}
                  className="bar-fill h-full min-w-1.5 rounded-full"
                  style={
                    {
                      flex: `${s.share} 1 0%`,
                      background: finishFor(s.type).accent,
                      color: finishFor(s.type).accent,
                      "--i": i,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {slices.map((s) => (
                <li key={s.id} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      background: finishFor(s.type).accent,
                      boxShadow: `0 0 8px ${finishFor(s.type).accent}`,
                    }}
                  />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold tabular-nums">{Math.round(s.share * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Account cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a, i) => {
          const meta = accountMeta(a.type);
          const Icon = meta.icon;
          const finish = finishFor(a.type);
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
              className="reveal rounded-2xl text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              style={stagger(i + 1)}
            >
              <TiltCard className="rounded-2xl" max={10}>
                <div
                  data-slot="card"
                  className={cn(
                    "relative isolate flex aspect-[1.7/1] min-h-44 flex-col justify-between overflow-hidden rounded-2xl p-5 text-white",
                    !a.isPrimary && "ring-1 ring-white/10"
                  )}
                  style={{
                    background: `radial-gradient(120% 140% at 100% 0%, ${finish.glow}, transparent 55%), radial-gradient(90% 120% at 0% 100%, rgb(212 255 58 / ${a.isPrimary ? 0.22 : 0.08}), transparent 60%), linear-gradient(135deg, #12151d, #07080c)`,
                    boxShadow: a.isPrimary
                      ? "0 0 0 1.5px rgb(212 255 58 / 0.75), 0 20px 60px -24px rgb(212 255 58 / 0.45)"
                      : undefined,
                  }}
                >
                  {/* Orbit lines etched into the card */}
                  <svg
                    aria-hidden
                    viewBox="0 0 200 120"
                    className="pointer-events-none absolute -inset-e-8 -top-4 -z-10 h-[130%] opacity-45"
                  >
                    <ellipse cx="125" cy="60" rx="88" ry="32" fill="none" stroke={finish.accent} strokeWidth="0.6" transform="rotate(-16 125 60)" />
                    <ellipse cx="125" cy="60" rx="66" ry="50" fill="none" stroke={finish.accent} strokeWidth="0.4" transform="rotate(26 125 60)" />
                    <circle cx="190" cy="46" r="2.2" fill={finish.accent} />
                  </svg>

                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/8 ring-1 ring-inset ring-white/15"
                      style={{ color: finish.accent, boxShadow: `0 0 24px -6px ${finish.accent}` }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="flex flex-wrap items-center justify-end gap-1.5">
                      {a.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#d4ff3a] px-2 py-0.5 text-[11px] font-semibold text-[#0b0e02]">
                          <Star className="size-3 fill-current" />
                          {t.mainBadge}
                        </span>
                      )}
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur">
                        {t.types[a.type as keyof typeof t.types] ?? meta.label}
                      </span>
                    </span>
                  </div>

                  <div className="min-w-0">
                    {/* EMV chip */}
                    <span
                      aria-hidden
                      className="mb-3 block h-6 w-8 rounded-md bg-gradient-to-br from-[#f5e7a8] via-[#c9a94e] to-[#8a6d22] shadow-inner"
                    />
                    <p className="truncate text-xs uppercase tracking-[0.16em] text-white/60">{a.name}</p>
                    <CountUp
                      cents={a.balanceCents}
                      currency={currency}
                      delay={300 + i * 120}
                      className={cn(
                        "font-display block truncate text-2xl font-bold tabular-nums",
                        a.balanceCents < 0 && "text-negative"
                      )}
                    />
                  </div>

                  <span aria-hidden className="card-gloss pointer-events-none absolute inset-0" />
                </div>
              </TiltCard>
            </button>
          );
        })}

        {/* Ghost card — same action as the header button */}
        <button
          type="button"
          onClick={openNew}
          className="reveal group flex aspect-[1.7/1] min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-card/30 text-sm font-medium text-muted-foreground backdrop-blur transition-all hover:border-primary/70 hover:bg-primary/5 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/60 outline-none"
          style={stagger(accounts.length + 1)}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
            <Plus className="size-6" />
          </span>
          {t.add}
        </button>
      </div>

      <AccountDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}
