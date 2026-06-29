import { PrismaClient, type TxType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  addDays,
  startOfMonth,
  subMonths,
  setDate,
  addMonths,
} from "date-fns";

const prisma = new PrismaClient();

const mad = (n: number) => Math.round(n * 100); // currency units -> cents
const delta = (type: TxType, cents: number) =>
  type === "INCOME" ? cents : type === "EXPENSE" ? -cents : 0;

async function main() {
  console.log("Resetting demo data…");
  // Order matters because of FKs.
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.recurringRule.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const household = await prisma.household.create({
    data: { name: "Barakah Family", baseCurrency: "MAD" },
  });

  const owner = await prisma.user.create({
    data: { email: "demo@barakah.app", name: "Yusuf Benali", passwordHash },
  });
  const member = await prisma.user.create({
    data: { email: "sara@barakah.app", name: "Sara Benali", passwordHash },
  });

  await prisma.membership.createMany({
    data: [
      { householdId: household.id, userId: owner.id, role: "OWNER" },
      { householdId: household.id, userId: member.id, role: "MEMBER" },
    ],
  });

  // --- Categories ---------------------------------------------------------
  const categoryDefs = [
    { name: "Food", kind: "EXPENSE", icon: "shopping-cart" },
    { name: "Dining", kind: "EXPENSE", icon: "coffee" },
    { name: "Utilities", kind: "EXPENSE", icon: "zap" },
    { name: "Transport", kind: "EXPENSE", icon: "bus" },
    { name: "Health", kind: "EXPENSE", icon: "heart-pulse" },
    { name: "Shopping", kind: "EXPENSE", icon: "shopping-bag" },
    { name: "Housing", kind: "EXPENSE", icon: "home" },
    { name: "Salary", kind: "INCOME", icon: "banknote" },
    { name: "Other income", kind: "INCOME", icon: "plus-circle" },
  ] as const;

  const cat: Record<string, string> = {};
  for (const c of categoryDefs) {
    const created = await prisma.category.create({
      data: { householdId: household.id, name: c.name, kind: c.kind, icon: c.icon },
    });
    cat[c.name] = created.id;
  }

  // --- Accounts (opening balances; adjusted as transactions are added) ----
  const cash = await prisma.account.create({
    data: { householdId: household.id, name: "Cash Wallet", type: "CASH", balanceCents: mad(1200) },
  });
  const bank = await prisma.account.create({
    data: { householdId: household.id, name: "CIH Checking", type: "BANK", balanceCents: mad(8000) },
  });
  const savings = await prisma.account.create({
    data: { householdId: household.id, name: "Attijari Savings", type: "SAVINGS", balanceCents: mad(40000) },
  });
  const card = await prisma.account.create({
    data: { householdId: household.id, name: "Visa Card", type: "CREDIT_CARD", balanceCents: mad(-1500) },
  });

  const thisMonth = startOfMonth(new Date());
  const lastMonth = startOfMonth(subMonths(new Date(), 1));

  // Helper to create a normal (income/expense) transaction + adjust balance.
  async function tx(opts: {
    accountId: string;
    categoryName?: string;
    type: TxType;
    amount: number; // currency units
    date: Date;
    note?: string;
  }) {
    const amountCents = mad(opts.amount);
    await prisma.transaction.create({
      data: {
        accountId: opts.accountId,
        categoryId: opts.categoryName ? cat[opts.categoryName] : null,
        enteredById: owner.id,
        amountCents,
        type: opts.type,
        date: opts.date,
        note: opts.note,
      },
    });
    await prisma.account.update({
      where: { id: opts.accountId },
      data: { balanceCents: { increment: delta(opts.type, amountCents) } },
    });
  }

  // Salaries
  await tx({ accountId: bank.id, categoryName: "Salary", type: "INCOME", amount: 14000, date: setDate(lastMonth, 1), note: "Monthly salary" });
  await tx({ accountId: bank.id, categoryName: "Salary", type: "INCOME", amount: 14000, date: setDate(thisMonth, 1), note: "Monthly salary" });
  await tx({ accountId: bank.id, categoryName: "Other income", type: "INCOME", amount: 1500, date: addDays(thisMonth, 4), note: "Freelance" });

  // This-month expenses
  await tx({ accountId: cash.id, categoryName: "Food", type: "EXPENSE", amount: 420, date: addDays(thisMonth, 2), note: "Marjane groceries" });
  await tx({ accountId: cash.id, categoryName: "Food", type: "EXPENSE", amount: 260, date: addDays(thisMonth, 9), note: "Vegetables & bread" });
  await tx({ accountId: card.id, categoryName: "Dining", type: "EXPENSE", amount: 180, date: addDays(thisMonth, 3), note: "Café Maure" });
  await tx({ accountId: card.id, categoryName: "Dining", type: "EXPENSE", amount: 95, date: addDays(thisMonth, 11), note: "Coffee" });
  await tx({ accountId: bank.id, categoryName: "Utilities", type: "EXPENSE", amount: 540, date: addDays(thisMonth, 5), note: "Electricity + water" });
  await tx({ accountId: cash.id, categoryName: "Transport", type: "EXPENSE", amount: 300, date: addDays(thisMonth, 6), note: "Fuel" });
  await tx({ accountId: card.id, categoryName: "Shopping", type: "EXPENSE", amount: 760, date: addDays(thisMonth, 7), note: "Clothes" });
  await tx({ accountId: bank.id, categoryName: "Housing", type: "EXPENSE", amount: 4500, date: addDays(thisMonth, 1), note: "Rent" });
  await tx({ accountId: cash.id, categoryName: "Health", type: "EXPENSE", amount: 220, date: addDays(thisMonth, 8), note: "Pharmacy" });

  // Last-month expenses
  await tx({ accountId: bank.id, categoryName: "Housing", type: "EXPENSE", amount: 4500, date: addDays(lastMonth, 1), note: "Rent" });
  await tx({ accountId: cash.id, categoryName: "Food", type: "EXPENSE", amount: 880, date: addDays(lastMonth, 10), note: "Groceries" });
  await tx({ accountId: card.id, categoryName: "Dining", type: "EXPENSE", amount: 340, date: addDays(lastMonth, 14), note: "Restaurant" });
  await tx({ accountId: bank.id, categoryName: "Utilities", type: "EXPENSE", amount: 500, date: addDays(lastMonth, 5), note: "Internet + electricity" });

  // --- Transfer: Bank -> Savings (paired two-row ledger) ------------------
  const transferAmount = mad(2000);
  const transferGroupId = `seed-transfer-1`;
  const transferDate = addDays(thisMonth, 10);
  await prisma.transaction.create({
    data: { accountId: bank.id, enteredById: owner.id, amountCents: transferAmount, type: "TRANSFER", date: transferDate, note: "To savings", transferGroupId },
  });
  await prisma.transaction.create({
    data: { accountId: savings.id, enteredById: owner.id, amountCents: transferAmount, type: "TRANSFER", date: transferDate, note: "From CIH Checking", transferGroupId },
  });
  await prisma.account.update({ where: { id: bank.id }, data: { balanceCents: { decrement: transferAmount } } });
  await prisma.account.update({ where: { id: savings.id }, data: { balanceCents: { increment: transferAmount } } });

  // --- Budgets (monthly limits) ------------------------------------------
  await prisma.budget.createMany({
    data: [
      { householdId: household.id, categoryId: cat["Food"], limitCents: mad(2000), period: "MONTHLY" },
      { householdId: household.id, categoryId: cat["Dining"], limitCents: mad(800), period: "MONTHLY" },
      { householdId: household.id, categoryId: cat["Transport"], limitCents: mad(600), period: "MONTHLY" },
      { householdId: household.id, categoryId: cat["Shopping"], limitCents: mad(1000), period: "MONTHLY" },
    ],
  });

  // --- Recurring rules ----------------------------------------------------
  const nextMonthFirst = setDate(addMonths(thisMonth, 1), 1);
  await prisma.recurringRule.createMany({
    data: [
      { householdId: household.id, categoryId: cat["Salary"], accountId: bank.id, amountCents: mad(14000), type: "INCOME", cadence: "MONTHLY", nextRun: nextMonthFirst, note: "Monthly salary" },
      { householdId: household.id, categoryId: cat["Housing"], accountId: bank.id, amountCents: mad(4500), type: "EXPENSE", cadence: "MONTHLY", nextRun: nextMonthFirst, note: "Rent" },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo login →  demo@barakah.app  /  demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
