import { Wallet, Landmark, PiggyBank, CreditCard, type LucideIcon } from "lucide-react";

export const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit card" },
] as const;

const META: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  CASH: { label: "Cash", icon: Wallet, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  BANK: { label: "Bank", icon: Landmark, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  SAVINGS: { label: "Savings", icon: PiggyBank, tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  CREDIT_CARD: { label: "Credit card", icon: CreditCard, tone: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
};

export function accountMeta(type: string) {
  return META[type] ?? META.BANK;
}
