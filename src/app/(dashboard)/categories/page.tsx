import { requireHousehold, canWrite } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/categories-client";

export default async function CategoriesPage() {
  const { householdId, role } = await requireHousehold();

  const categories = await prisma.category.findMany({
    where: { householdId },
    orderBy: { name: "asc" },
  });

  return (
    <CategoriesClient
      canEdit={canWrite(role)}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        kind: c.kind as "INCOME" | "EXPENSE",
        icon: c.icon,
      }))}
    />
  );
}
