"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireHousehold, canWrite } from "@/lib/session";
import { parseToCents } from "@/lib/money";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

const creditSchema = z.object({
  id: z.string().optional(),
  contactName: z.string().trim().min(1, "Contact is required"),
  direction: z.enum(["LENT", "BORROWED"]),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  total: z.string().trim().min(1, "Amount is required"),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

function readForm(formData: FormData) {
  return {
    id: (formData.get("id") as string) || undefined,
    contactName: (formData.get("contactName") as string) || "",
    direction: (formData.get("direction") as "LENT" | "BORROWED") || "LENT",
    description: (formData.get("description") as string) || "",
    total: (formData.get("total") as string) || "",
    dueDate: (formData.get("dueDate") as string) || "",
  };
}

function revalidateAll() {
  revalidatePath("/credits");
}

export async function saveCredit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { householdId, userId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const parsed = creditSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const totalCents = parseToCents(parsed.data.total);
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }

  const dueDateValue = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  const description = parsed.data.description?.trim() || null;
  if (parsed.data.dueDate && Number.isNaN(dueDateValue?.getTime())) {
    return { error: "Enter a valid due date." };
  }

  try {
    const contact = await prisma.contact.upsert({
      where: { householdId_name: { householdId, name: parsed.data.contactName.trim() } },
      update: {},
      create: { householdId, name: parsed.data.contactName.trim() },
    });

    await prisma.credit.upsert({
      where: { id: parsed.data.id ?? "__missing__" },
      update: {
        contactId: contact.id,
        direction: parsed.data.direction,
        description,
        totalCents,
        dueDate: dueDateValue,
      },
      create: {
        householdId,
        contactId: contact.id,
        createdById: userId,
        direction: parsed.data.direction,
        description,
        totalCents,
        dueDate: dueDateValue,
      },
    });
  } catch (error) {
    console.error(error);
    return { error: "Could not save the credit." };
  }

  revalidateAll();
  return { ok: true };
}

export async function deleteCredit(id: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  try {
    const credit = await prisma.credit.findFirst({ where: { id, householdId } });
    if (!credit) return { error: "Credit not found." };
    await prisma.credit.delete({ where: { id } });
  } catch (error) {
    console.error(error);
    return { error: "Could not delete the credit." };
  }

  revalidateAll();
  return { ok: true };
}

export async function addPayment(creditId: string, amount: string, note?: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const amountCents = parseToCents(amount);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Enter a valid payment amount greater than zero." };
  }

  const credit = await prisma.credit.findFirst({ where: { id: creditId, householdId } });
  if (!credit) return { error: "Credit not found." };

  const nextPaid = credit.paidCents + amountCents;
  if (nextPaid > credit.totalCents) {
    return { error: "Payment cannot exceed the remaining credit balance." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.creditPayment.create({
        data: {
          creditId,
          amountCents,
          note: note?.trim() || null,
        },
      });
      await tx.credit.update({
        where: { id: creditId },
        data: { paidCents: nextPaid },
      });
    });
  } catch (error) {
    console.error(error);
    return { error: "Could not save the payment." };
  }

  revalidateAll();
  return { ok: true };
}
