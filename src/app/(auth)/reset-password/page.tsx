import { ResetPasswordForm } from "@/components/reset-password-form";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const dict = await getDictionary(await getLocale());
  const t = dict.auth;

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="scale-110" />
          <div>
            <h1 className="text-xl font-semibold">{t.resetTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.resetInvalid}</p>
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

  return <ResetPasswordForm token={token} />;
}
