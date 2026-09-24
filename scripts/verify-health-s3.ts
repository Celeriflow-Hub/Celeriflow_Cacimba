import { config } from "dotenv";

async function main() {
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
  const { prisma } = await import("../src/lib/prisma");
  try {
    const [medicineCounts] = await prisma.$queryRaw<Array<{ linked: bigint; unlinked: bigint }>>`
      SELECT COUNT(*) FILTER (WHERE "isActive" AND "materialId" IS NOT NULL)::bigint AS linked,
             COUNT(*) FILTER (WHERE "isActive" AND "materialId" IS NULL)::bigint AS unlinked
      FROM "Medicine"`;
    const [vaccineCounts] = await prisma.$queryRaw<Array<{ linked: bigint; unlinked: bigint }>>`
      SELECT COUNT(*) FILTER (WHERE "isActive" AND "materialId" IS NOT NULL)::bigint AS linked,
             COUNT(*) FILTER (WHERE "isActive" AND "materialId" IS NULL)::bigint AS unlinked
      FROM "Vaccine"`;
    const checks = {
      activeUnits: await prisma.healthUnit.count({ where: { isActive: true } }),
      activePatients: await prisma.patient.count({ where: { status: "Ativo" } }),
      activeProfessionals: await prisma.healthProfessional.count({ where: { isActive: true } }),
      teams: await prisma.healthTeam.count({ where: { isActive: true } }),
      linkedMedicines: Number(medicineCounts.linked),
      unlinkedMedicines: Number(medicineCounts.unlinked),
      linkedVaccines: Number(vaccineCounts.linked),
      unlinkedVaccines: Number(vaccineCounts.unlinked),
      assistentialProfiles: await prisma.healthMaterialProfile.count({ where: { isActive: true } }),
      prescriptions: await prisma.healthPrescription.count(),
      examRequests: await prisma.healthExamRequest.count(),
    };

    if (checks.unlinkedMedicines || checks.unlinkedVaccines) throw new Error("Há medicamentos ou imunobiológicos ativos fora do cadastro único de materiais.");
    for (const [key, value] of Object.entries(checks)) {
      if (!["unlinkedMedicines", "unlinkedVaccines"].includes(key) && value === 0) throw new Error(`Massa mínima ausente: ${key}.`);
    }

    console.log(JSON.stringify({ status: "READY", ...checks }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
