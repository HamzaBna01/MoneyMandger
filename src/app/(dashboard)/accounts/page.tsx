import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { AccountsClient } from "@/components/accounts-client";

export default async function AccountsPage() {
  const { householdId, household } = await requireHousehold();

  const accounts = await prisma.account.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  });

  const total = accounts.reduce((sum, a) => sum + a.balanceCents, 0);

  return (
    <AccountsClient
      currency={household.baseCurrency}
      total={total}
      accounts={accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balanceCents: a.balanceCents,
        amountInput: centsToInput(a.balanceCents),
        isPrimary: a.isPrimary,
      }))}
    />
  );
}
