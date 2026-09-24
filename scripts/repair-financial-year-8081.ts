import dotenv from "dotenv";
import { Prisma } from "@prisma/client";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const INVALID_YEAR = 8081;
const CANONICAL_YEAR = 2026;
const INVALID_APPROPRIATION_CODE = "APP-6055";

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  try {
    const result = await prisma.$transaction(async (tx) => {
      const [invalidYear, canonicalYear, actor] = await Promise.all([
        tx.financialYear.findUnique({ where: { year: INVALID_YEAR } }),
        tx.financialYear.findUnique({ where: { year: CANONICAL_YEAR } }),
        tx.usuario.findFirst({ where: { ativo: true }, orderBy: { createdAt: "asc" }, select: { id: true, employeeId: true } }),
      ]);

      if (!invalidYear) return { repaired: false, reason: `Exercício ${INVALID_YEAR} não encontrado.` };
      if (!canonicalYear || canonicalYear.status !== "Aberto") throw new Error(`O exercício ${CANONICAL_YEAR} deve estar aberto para receber a correção.`);
      if (!actor) throw new Error("Não existe usuário ativo para auditar a correção do exercício.");

      const [appropriation, movements, commitments, reservations] = await Promise.all([
        tx.budgetAppropriation.findFirst({ where: { code: INVALID_APPROPRIATION_CODE, financialYearId: invalidYear.id }, select: { id: true } }),
        tx.treasuryMovement.findMany({ where: { financialYearId: invalidYear.id }, select: { id: true } }),
        tx.commitment.count({ where: { appropriation: { financialYearId: invalidYear.id } } }),
        tx.budgetReservation.count({ where: { appropriation: { financialYearId: invalidYear.id } } }),
      ]);
      if (!appropriation || movements.length !== 13 || commitments !== 0 || reservations !== 0) {
        throw new Error("A massa inválida não corresponde ao conjunto conhecido; a correção foi interrompida sem alterar dados.");
      }

      const expenses = await tx.expense.findMany({ where: { appropriationId: appropriation.id }, select: { id: true } });
      if (expenses.length !== 2) throw new Error("A dotação inválida possui despesas inesperadas; a correção foi interrompida.");

      await tx.expense.deleteMany({ where: { id: { in: expenses.map((expense) => expense.id) } } });
      await tx.budgetAppropriation.delete({ where: { id: appropriation.id } });
      await tx.treasuryMovement.updateMany({
        where: { id: { in: movements.map((movement) => movement.id) } },
        data: { financialYearId: canonicalYear.id },
      });
      await tx.financialYear.delete({ where: { id: invalidYear.id } });

      await tx.budgetUnit.updateMany({
        where: { code: "BU-6055" },
        data: { name: "Unidade Orçamentária Assistência" },
      });
      await tx.secretariat.updateMany({
        where: { name: { contains: "Assist�ncia" } },
        data: { name: "Secretaria de Assistência Social 6055" },
      });
      await tx.resourceSource.updateMany({
        where: { code: "RS-6055" },
        data: { name: "Recursos Ordinários" },
      });
      await tx.expenseNature.updateMany({
        where: { code: "EN-6055" },
        data: { name: "Despesas de Custeio" },
      });

      // FinancialAuditLog is append-only. Keep the original evidence and record the correction separately.
      await tx.financialAuditLog.create({
        data: {
          action: "CORRECAO_EXERCICIO_FINANCEIRO",
          entityType: "FinancialYear",
          entityId: invalidYear.id,
          financialYearId: canonicalYear.id,
          authorUsuarioId: actor.id,
          authorEmployeeId: actor.employeeId,
          payload: {
            previousYear: INVALID_YEAR,
            canonicalYear: CANONICAL_YEAR,
            migratedTreasuryMovementIds: movements.map((movement) => movement.id),
            removedAppropriationCode: INVALID_APPROPRIATION_CODE,
            reason: "Correção de exercício sobreposto criado pela seed-modulo14.",
          },
        },
      });

      return { repaired: true, migratedMovements: movements.length, removedExpenses: expenses.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log(result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
