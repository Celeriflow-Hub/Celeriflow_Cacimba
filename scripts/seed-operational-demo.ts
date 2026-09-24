import { seedOperationalCivic } from "../src/lib/demo-seed/seed-operational-civic";
import { seedOperationalProcesses } from "../src/lib/demo-seed/seed-operational-processes";
import { seedOperationalServices } from "../src/lib/demo-seed/seed-operational-services";
import { reconcileOperationalData } from "../src/lib/demo-seed/reconcile-operational-data";
import type { OperationalSeedReport } from "../src/lib/demo-seed/operational-seed-utils";

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((argument) => argument !== "--apply");
  if (unknown.length) throw new Error(`Argumento desconhecido: ${unknown.join(", ")}.`);
  if (!args.includes("--apply")) {
    throw new Error("Confirme a complementação do banco com --apply.");
  }

  await import("./load-local-environment");
  process.env.DATABASE_URL ??= process.env.DATABASE_URL_UNPOOLED;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_UNPOOLED ou DATABASE_URL não configurada.");

  const { createPrismaClient } = await import("../src/lib/prisma");
  const prisma = createPrismaClient(process.env.DATABASE_URL);
  const reports: OperationalSeedReport[] = [];

  try {
    await seedOperationalServices(prisma, reports);
    await seedOperationalProcesses(prisma, reports);
    await seedOperationalCivic(prisma, reports);
    await reconcileOperationalData(prisma, reports);
    console.log(JSON.stringify({
      planned: reports.reduce((total, report) => total + report.planned, 0),
      inserted: reports.reduce((total, report) => total + report.inserted, 0),
      reportGroups: reports.length,
      changes: reports.filter((report) => report.inserted > 0),
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
