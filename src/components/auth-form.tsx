"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
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
  const t = useDict().auth;
  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="scale-110" />
        <div>
          <h1 className="text-xl font-semibold">
            {isSignup ? t.createHousehold : t.welcomeBack}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignup ? t.signupSubtitle : t.loginSubtitle}
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="name">{t.name}</Label>
            <Input id="name" name="name" placeholder={t.namePlaceholder} required />
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
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
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

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? (
          <>
            {t.alreadyHaveAccount}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t.login}
            </Link>
          </>
        ) : (
          <>
            {t.newToApp}{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              {t.createAHousehold}
            </Link>
          </>
        )}
      </p>

      {!isSignup && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t.demoLoginTitle}</span>
          <br />
          demo@barakah.app &nbsp;/&nbsp; demo1234
        </div>
      )}
    </div>
  );
}
