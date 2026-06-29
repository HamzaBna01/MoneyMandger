import { format, isToday, isYesterday } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { monthRange, recentMonthKeys, monthLabel } from "@/lib/dates";
import { centsToInput } from "@/lib/money";
import { toRowData } from "@/lib/tx-display";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { dateLocale } from "@/lib/i18n/date-locale";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import {
  TransactionsClient,
  type TxGroup,
} from "@/components/transactions-client";
import type { TxInitial } from "@/components/transaction-dialog";

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}
function dayLabel(d: Date, dict: Dictionary, df: DateFnsLocale) {
  if (isToday(d)) return dict.transactions.today;
  if (isYesterday(d)) return dict.transactions.yesterday;
  return format(d, "EEEE, d MMMM yyyy", { locale: df });
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { householdId, household } = await requireHousehold();
  const currency = household.baseCurrency;
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const df = dateLocale(locale);
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q : "";
  const accountId = typeof sp.accountId === "string" ? sp.accountId : "";
  const categoryId = typeof sp.categoryId === "string" ? sp.categoryId : "";
  const month = typeof sp.month === "string" ? sp.month : "";
  const autoNew = sp.new === "1";

  const where: Record<string, unknown> = { account: { householdId } };
  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (q) where.note = { contains: q };
  if (month) {
    const { start, end } = monthRange(month);
    where.date = { gte: start, lte: end };
  }

  const [txns, accounts, categories] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 500,
    }),
    prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
  ]);

  // Resolve transfer pairs (fetch all legs of any group present in the results).
  const groupIds = [
    ...new Set(txns.map((t) => t.transferGroupId).filter(Boolean) as string[]),
  ];
  const legs = groupIds.length
    ? await prisma.transaction.findMany({
        where: { transferGroupId: { in: groupIds } },
        include: { account: true },
      })
    : [];
  const legsByGroup = new Map<string, typeof legs>();
  for (const l of legs) {
    const arr = legsByGroup.get(l.transferGroupId!) ?? [];
    arr.push(l);
    legsByGroup.set(l.transferGroupId!, arr);
  }

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));

  // Build ordered day groups with both display rows and edit payloads.
  const groups: TxGroup[] = [];
  let current: TxGroup | null = null;
  let currentKey: string | null = null;
  const seenGroups = new Set<string>();

  for (const t of txns) {
    if (t.type === "TRANSFER" && t.transferGroupId) {
      if (seenGroups.has(t.transferGroupId)) continue;
      seenGroups.add(t.transferGroupId);
    }

    const key = dayKey(t.date);
    if (!current || currentKey !== key) {
      current = { label: dayLabel(t.date, dict, df), items: [] };
      currentKey = key;
      groups.push(current);
    }

    if (t.type === "TRANSFER" && t.transferGroupId) {
      const pair = legsByGroup.get(t.transferGroupId) ?? [];
      const from = pair.find((l) => l.amountCents < 0) ?? t;
      const to = pair.find((l) => l.amountCents > 0);
      const fromName = accountName.get(from.accountId) ?? dict.transactions.account;
      const toName = to
        ? accountName.get(to.accountId) ?? dict.transactions.account
        : dict.transactions.account;
      const amt = Math.abs(t.amountCents);

      const parts = [
        `${fromName} → ${toName}`,
        format(t.date, "d MMM yyyy", { locale: df }),
      ];
      if (t.note) parts.push(t.note);

      current.items.push({
        row: {
          id: from.id,
          type: "TRANSFER",
          amountCents: amt,
          currency,
          iconKey: "transfer",
          title: dict.transactions.transfer,
          subtitle: parts.join("  ·  "),
          recurring: false,
        },
        edit: {
          id: from.id,
          type: "TRANSFER",
          amount: centsToInput(amt),
          accountId: from.accountId,
          toAccountId: to?.accountId,
          date: dayKey(t.date),
          note: t.note ?? undefined,
        } satisfies TxInitial,
      });
    } else {
      current.items.push({
        row: toRowData(t, currency, dict, locale),
        edit: {
          id: t.id,
          type: t.type as "INCOME" | "EXPENSE",
          amount: centsToInput(t.amountCents),
          accountId: t.accountId,
          categoryId: t.categoryId ?? undefined,
          date: dayKey(t.date),
          note: t.note ?? undefined,
        } satisfies TxInitial,
      });
    }
  }

  const months = recentMonthKeys(12)
    .map((k) => ({ value: k, label: monthLabel(k, df) }))
    .reverse();

  return (
    <TransactionsClient
      groups={groups}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        kind: c.kind as "INCOME" | "EXPENSE",
      }))}
      months={months}
      filters={{ q, accountId, categoryId, month }}
      autoNew={autoNew}
    />
  );
}
