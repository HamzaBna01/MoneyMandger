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
import { resetPasswordAction } from "@/app/(auth)/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    {}
  );
  const t = useDict().auth;

  if (state.success) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="scale-110" />
          <div>
            <h1 className="text-xl font-semibold">{t.resetTitle}</h1>
            <p className="text-sm text-muted-foreground">{state.success}</p>
          </div>
        </div>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.backToLogin}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="scale-110" />
        <div>
          <h1 className="text-xl font-semibold">{t.resetTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.resetSubtitle}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t.newPassword}</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>

        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton label={t.saveNewPassword} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
