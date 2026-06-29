// Materialize all due recurring rules. Run with: npm run recurring
import { materializeDueRules } from "../src/lib/recurring";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await materializeDueRules();
  console.log(
    `Recurring run complete — processed ${result.rulesProcessed} rule(s), created ${result.created} transaction(s).`
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
