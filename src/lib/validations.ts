import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const accountTypes = ["CASH", "BANK", "SAVINGS", "CREDIT_CARD"] as const;
export const txTypes = ["INCOME", "EXPENSE", "TRANSFER"] as const;
export const cadences = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export const categoryKinds = ["INCOME", "EXPENSE"] as const;

// Amount comes from the form as a raw string; it is parsed to cents in the action.
const amountString = z.string().trim().min(1, "Amount is required");

export const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  type: z.enum(accountTypes),
  amount: amountString, // current/initial balance
});

export const transactionSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(txTypes),
    amount: amountString,
    accountId: z.string().min(1, "Account is required"),
    toAccountId: z.string().optional(), // only for transfers
    categoryId: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    note: z.string().trim().max(280).optional().or(z.literal("")),
  })
  .refine(
    (d) => d.type !== "TRANSFER" || (d.toAccountId && d.toAccountId !== d.accountId),
    { message: "Pick a different destination account", path: ["toAccountId"] }
  )
  .refine((d) => d.type === "TRANSFER" || !!d.categoryId, {
    message: "Category is required",
    path: ["categoryId"],
  });

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: amountString, // limit
});

export const recurringSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: amountString,
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  cadence: z.enum(cadences),
  nextRun: z.string().min(1, "Start date is required"),
  note: z.string().trim().max(280).optional().or(z.literal("")),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(40),
  kind: z.enum(categoryKinds),
  icon: z.string().trim().min(1).max(40),
});

export const householdSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  baseCurrency: z.string().trim().min(1).max(8),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

// Both fields optional: an empty amount clears the goal. Amount is parsed to
// cents (and validated > 0) in the action; deadline is an optional yyyy-MM-dd.
export const savingsGoalSchema = z.object({
  amount: z.string().trim().optional().or(z.literal("")),
  deadline: z.string().trim().optional().or(z.literal("")),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["MEMBER", "VIEWER", "OWNER"]),
});
