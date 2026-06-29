"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireHousehold, canWrite } from "@/lib/session";
import { categorySchema } from "@/lib/validations";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

function revalidate() {
  for (const p of [
    "/",
    "/categories",
    "/transactions",
    "/budgets",
    "/recurring",
    "/reports",
    "/settings",
  ]) {
    revalidatePath(p);
  }
}

export async function saveCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const parsed = categorySchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    kind: formData.get("kind"),
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, name, kind, icon } = parsed.data;

  try {
    if (id) {
      const owned = await prisma.category.findFirst({
        where: { id, householdId },
      });
      if (!owned) return { error: "Category not found." };
      await prisma.category.update({
        where: { id },
        data: { name, kind, icon },
      });
    } else {
      await prisma.category.create({
        data: { householdId, name, kind, icon },
      });
    }
  } catch (e) {
    console.error(e);
    return { error: "Could not save the category." };
  }

  revalidate();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const { householdId, role } = await requireHousehold();
  if (!canWrite(role)) return { error: "You have view-only access." };

  const owned = await prisma.category.findFirst({ where: { id, householdId } });
  if (!owned) return { error: "Category not found." };

  try {
    // Transactions keep their history (categoryId is set to null); any budget
    // or recurring rule tied to this category is removed via cascade.
    await prisma.category.delete({ where: { id } });
  } catch (e) {
    console.error(e);
    return { error: "Could not delete the category." };
  }

  revalidate();
  return { ok: true };
}
