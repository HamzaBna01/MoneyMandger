import { format } from "date-fns";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { centsToInput, formatCents } from "@/lib/money";
import { getLocale } from "@/lib/i18n/server";
import { dateLocale } from "@/lib/i18n/date-locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { describeCreditStatus } from "@/lib/credits";
import { CreditsClient, type CreditView } from "@/components/credits-client";

export default async function CreditsPage() {
  const { householdId, household } = await requireHousehold();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const df = dateLocale(locale);

  const credits = await prisma.credit.findMany({
    where: { householdId },
    include: { contact: true, payments: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const views: CreditView[] = credits.map((credit) => {
    const status = describeCreditStatus({
      totalCents: credit.totalCents,
      paidCents: credit.paidCents,
      dueDate: credit.dueDate,
    });

    const remainingCents = credit.totalCents - credit.paidCents;
    return {
      id: credit.id,
      contactName: credit.contact.name,
      direction: credit.direction as "LENT" | "BORROWED",
      description: credit.description ?? undefined,
      totalCents: credit.totalCents,
      paidCents: credit.paidCents,
      remainingCents,
      status,
      currency: credit.currency,
      dueDate: credit.dueDate ? format(credit.dueDate, "yyyy-MM-dd") : undefined,
      dueLabel: credit.dueDate ? format(credit.dueDate, "d MMM yyyy", { locale: df }) : undefined,
      payments: credit.payments.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        note: payment.note ?? undefined,
        paidAt: payment.paidAt,
      })),
      edit: {
        id: credit.id,
        contactName: credit.contact.name,
        direction: credit.direction as "LENT" | "BORROWED",
        description: credit.description ?? "",
        total: centsToInput(credit.totalCents),
        dueDate: credit.dueDate ? format(credit.dueDate, "yyyy-MM-dd") : "",
      },
      summary: `${status} · ${formatCents(remainingCents, credit.currency)} remaining`,
    };
  });

  return (
    <CreditsClient
      credits={views}
      currency={household.baseCurrency}
      dict={dict}
    />
  );
}
