"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useDict } from "@/components/i18n-provider";
import type { AuthFormState } from "@/app/(auth)/actions";

type Action = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 w-full rounded-xl text-sm"
      disabled={pending}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
      {!pending && <ArrowRight className="size-4 rtl:rotate-180" />}
    </Button>
  );
}

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: Action;
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {});
  const dict = useDict();
  const t = dict.auth;
  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-6xl">
      <div className="grid overflow-hidden rounded-[1.5rem] border border-white/50 bg-white/80 shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-white/10 dark:bg-card/90 lg:grid-cols-[1fr_0.86fr]">
        <section className="relative overflow-hidden bg-[#12745b] p-6 text-white sm:p-8 lg:min-h-[660px]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f6e56_0%,#1d9e75_46%,#ef9f27_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(150deg,transparent_0%,rgb(255_255_255_/_0.16)_42%,transparent_43%)]" />

          <div className="relative flex h-full min-h-[330px] flex-col justify-between gap-10">
            <div className="flex items-center justify-between gap-4">
              <Logo className="[&_span:first-child]:bg-white [&_span:first-child]:text-[#0f6e56]" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                <Sparkles className="size-3.5" />
                {dict.savings.onTrack}
              </span>
            </div>

            <div className="max-w-lg space-y-5">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {isSignup ? t.createHousehold : t.welcomeBack}
              </h1>
              <p className="max-w-md text-base leading-7 text-white/85">
                {isSignup ? t.signupSubtitle : t.loginSubtitle}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl border border-white/20 bg-white/16 p-4 backdrop-blur">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-white text-[#0f6e56]">
                  <CircleDollarSign className="size-5" />
                </div>
                <p className="text-xs text-white/70">{dict.dashboard.totalBalance}</p>
                <p className="mt-1 text-lg font-semibold">42,850 MAD</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/16 p-4 backdrop-blur">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-[#fff4d7] text-[#9a5b00]">
                  <TrendingUp className="size-5" />
                </div>
                <p className="text-xs text-white/70">{dict.reports.net}</p>
                <p className="mt-1 text-lg font-semibold">+7,240 MAD</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/16 p-4 backdrop-blur">
                <div className="mb-3 flex h-9 items-center gap-1.5">
                  <span className="h-9 w-3 rounded-full bg-white/92" />
                  <span className="h-7 w-3 rounded-full bg-[#ffd77a]" />
                  <span className="h-5 w-3 rounded-full bg-[#9bc7ff]" />
                </div>
                <p className="text-xs text-white/70">{dict.dashboard.budgetStatus}</p>
                <p className="mt-1 text-lg font-semibold">{dict.savings.onTrack}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-[390px]">
            <div className="mb-7 space-y-2">
              <Logo className="lg:hidden" />
              <h2 className="text-3xl font-semibold tracking-tight">
                {isSignup ? t.createHousehold : t.welcomeBack}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {isSignup ? t.signupSubtitle : t.loginSubtitle}
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t.name}</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t.namePlaceholder}
                    className="h-12 rounded-xl border-transparent bg-muted/65 px-3 focus-visible:bg-background"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  className="h-12 rounded-xl border-transparent bg-muted/65 px-3 focus-visible:bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">{t.password}</Label>
                  {!isSignup && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t.forgotPassword}
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="h-12 rounded-xl border-transparent bg-muted/65 px-3 focus-visible:bg-background"
                  required
                />
              </div>

              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <SubmitButton label={isSignup ? t.createAccount : t.login} />
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              {isSignup ? (
                <>
                  {t.alreadyHaveAccount}{" "}
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {t.login}
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Link>
                </>
              ) : (
                <>
                  {t.newToApp}{" "}
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {t.createAHousehold}
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Link>
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
