export type CreditDirection = "LENT" | "BORROWED";
export type CreditStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

export interface CreditStatusInput {
  totalCents: number;
  paidCents: number;
  dueDate?: Date | null;
}

export function describeCreditStatus(
  { totalCents, paidCents, dueDate }: CreditStatusInput,
  now = new Date()
): CreditStatus {
  if (paidCents >= totalCents) return "PAID";
  if (dueDate && dueDate < now) return "OVERDUE";
  if (paidCents > 0) return "PARTIALLY_PAID";
  return "PENDING";
}
