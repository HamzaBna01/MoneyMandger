// Add any missing DEFAULT_CATEGORIES to every existing household.
// Idempotent: matches on (name, kind), creates only what's missing, updates the
// icon if it changed. Run with: npm run categories:sync
import { prisma } from "../src/lib/prisma";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";

async function main() {
  const households = await prisma.household.findMany({ select: { id: true, name: true } });
  let created = 0;
  let updated = 0;

  for (const h of households) {
    const existing = await prisma.category.findMany({
      where: { householdId: h.id },
      select: { id: true, name: true, kind: true, icon: true },
    });
    const byKey = new Map(existing.map((c) => [`${c.kind}:${c.name.toLowerCase()}`, c]));

    for (const def of DEFAULT_CATEGORIES) {
      const match = byKey.get(`${def.kind}:${def.name.toLowerCase()}`);
      if (!match) {
        await prisma.category.create({
          data: { householdId: h.id, name: def.name, kind: def.kind, icon: def.icon },
        });
        created++;
      } else if (match.icon !== def.icon) {
        await prisma.category.update({ where: { id: match.id }, data: { icon: def.icon } });
        updated++;
      }
    }
  }

  console.log(
    `Synced categories across ${households.length} household(s): created ${created}, updated ${updated} icon(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
