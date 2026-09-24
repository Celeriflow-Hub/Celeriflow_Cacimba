import { config } from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

config({ path: ".env.local" });
config();

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} nao configurada.`);
  return value;
}

async function main() {
  neonConfig.webSocketConstructor = ws;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: requiredEnvironment("DATABASE_URL") }) });
  try {
    const migrationUser = process.env.FINANCE_BACKFILL_USER_ID
      ? await prisma.usuario.findFirst({ where: { id: process.env.FINANCE_BACKFILL_USER_ID, ativo: true }, select: { id: true, employeeId: true } })
      : await prisma.usuario.findFirst({ where: { ativo: true }, orderBy: { createdAt: "asc" }, select: { id: true, employeeId: true } });
    if (!migrationUser) throw new Error("Nenhum usuario ativo esta disponivel para registrar a auditoria da migracao.");

    const accounts = await prisma.bankAccount.findMany({ select: { id: true, createdAt: true, currentBalanceDecimal: true } });
    let created = 0;
    let skipped = 0;
    for (const account of accounts) {
      const balance = account.currentBalanceDecimal;
      if (!balance || balance.isZero()) { skipped += 1; continue; }
      await prisma.$transaction(async (tx) => {
        const existing = await tx.treasuryMovement.findFirst({ where: { bankAccountId: account.id } });
        if (existing) { skipped += 1; return; }
        const year = await tx.financialYear.findFirst({
          where: { startDate: { lte: account.createdAt }, endDate: { gte: account.createdAt } },
          orderBy: { year: "desc" },
        });
        if (!year) { skipped += 1; return; }
        const idempotencyKey = `FINANCEIRO:LEGACY_BANK_ACCOUNT:${account.id}:OPENING_BALANCE`;
        const movement = await tx.treasuryMovement.upsert({
          where: { idempotencyKey },
          create: {
            date: account.createdAt,
            type: "OpeningBalance",
            direction: balance.isNegative() ? "Saída" : "Entrada",
            valueDecimal: new Prisma.Decimal(balance).abs(),
            history: "Migração auditada do saldo bancário legado para tesouraria.",
            bankAccountId: account.id,
            financialYearId: year.id,
            sourceModule: "FINANCEIRO",
            sourceType: "LEGACY_BANK_ACCOUNT",
            sourceId: account.id,
            eventType: "OPENING_BALANCE_MIGRATION",
            idempotencyKey,
          },
          update: {},
        });
        await tx.financialAuditLog.create({
          data: {
            action: "MIGRATE_OPENING_BALANCE",
            entityType: "TreasuryMovement",
            entityId: movement.id,
            financialYearId: year.id,
            payload: { source: "SYSTEM_MIGRATION", legacyBankAccountId: account.id, value: balance.abs().toFixed(2) },
            authorUsuarioId: migrationUser.id,
            authorEmployeeId: migrationUser.employeeId,
          },
        });
        created += 1;
      });
    }
    console.log(JSON.stringify({ created, skipped, auditUserId: migrationUser.id }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
