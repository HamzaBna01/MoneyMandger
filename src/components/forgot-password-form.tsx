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
import { requestPasswordResetAction } from "@/app/(auth)/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    {}
  );
  const t = useDict().auth;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="scale-110" />
        <div>
          <h1 className="text-xl font-semibold">{t.forgotTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.forgotSubtitle}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
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

        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">{state.success}</p>
        )}
        {state.resetUrl && (
          <p className="break-all rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span className="mb-1 block font-medium text-foreground">
              {t.resetLinkLabel}
            </span>
            <Link href={state.resetUrl} className="text-primary hover:underline">
              {state.resetUrl}
            </Link>
          </p>
        )}
        {state.oauthResetUrl && (
          <p className="break-all rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span className="mb-1 block font-medium text-foreground">
              {t.googleRecoveryLabel}
            </span>
            <Link
              href={state.oauthResetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {state.oauthResetUrl}
            </Link>
          </p>
        )}

        <SubmitButton label={t.sendResetLink} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
