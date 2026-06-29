import { format } from "date-fns";
import type { TxRowData } from "@/components/transaction-row";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { tCategory } from "@/lib/i18n/get-dictionary";
import { dateLocale } from "@/lib/i18n/date-locale";

export interface TxWithRelations {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amountCents: number;
  date: Date;
  note: string | null;
  recurringRuleId: string | null;
  category: { name: string; icon: string } | null;
  account: { name: string };
}

export function toRowData(
  tx: TxWithRelations,
  currency: string,
  dict: Dictionary,
  locale: Locale
): TxRowData {
  const isTransfer = tx.type === "TRANSFER";
  const title = isTransfer
    ? tx.amountCents >= 0
      ? dict.transactions.transferIn
      : dict.transactions.transferOut
    : tx.category
      ? tCategory(dict, tx.category.name)
      : tx.type === "INCOME"
        ? dict.transactions.income
        : dict.transactions.expense;

  const parts = [
    tx.account.name,
    format(tx.date, "d MMM yyyy", { locale: dateLocale(locale) }),
  ];
  if (tx.note) parts.push(tx.note);

  return {
    id: tx.id,
    type: tx.type,
    amountCents: tx.amountCents,
    currency,
    iconKey: isTransfer ? "transfer" : tx.category?.icon ?? "circle",
    title,
    subtitle: parts.join("  ·  "),
    recurring: !!tx.recurringRuleId,
  };
}
