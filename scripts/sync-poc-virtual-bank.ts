import crypto from "crypto";
import dotenv from "dotenv";
import { Prisma } from "@prisma/client";
import type { BankStatementItemDTO } from "../src/lib/financeiro/bank-integration-client";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const BANK = "001 - Banco Virtual Robonuvem";
const AGENCY = "0001";
const PERIOD = { periodoInicio: "2025-01-01", periodoFim: "2026-12-31" };
const ACCOUNTS = [
  { number: "10001-0", type: "CORRENTE" },
  { number: "20001-1", type: "CORRENTE" },
  { number: "90001-4", type: "APLICACAO" },
] as const;

function externalId(item: BankStatementItemDTO, checksum: string, index: number) {
  return item.codigoTransacao || crypto
    .createHash("sha256")
    .update(`${checksum}:${index}:${item.date.toISOString()}:${item.value}:${item.description}`)
    .digest("hex");
}

function revenueRuleForDescription(
  description: string,
  rules: { textoProcurado: string; naturezaReceita: string | null; fonteRecurso: string | null; eventoContabil: string | null }[],
) {
  const normalized = description.toUpperCase();
  return rules.find((rule) => normalized.includes(rule.textoProcurado.toUpperCase()))
    ?? (normalized.includes("ADO_LC_176_2020") ? rules.find((rule) => rule.textoProcurado === "ADO25") : undefined);
}

async function main() {
  const [{ prisma }, { BankIntegrationClient }, { recordConfirmedRevenue }, { transmitYieldToMunicipalSystem }, { sendMovementToMunicipalSystem }] = await Promise.all([
    import("../src/lib/prisma"),
    import("../src/lib/financeiro/bank-integration-client"),
    import("../src/lib/financeiro"),
    import("../src/lib/financeiro/yield-engine"),
    import("../src/lib/financeiro/classification-engine"),
  ]);
  const client = new BankIntegrationClient();
  const actor = await prisma.usuario.findFirst({
    where: { ativo: true, employeeId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, employeeId: true },
  });
  if (!actor?.employeeId) throw new Error("A sincronização exige um usuário ativo vinculado a servidor.");

  const accountRows = await prisma.bankAccount.findMany({
    where: { bankName: BANK, agency: AGENCY, accountNumber: { in: ACCOUNTS.map((account) => account.number) }, isActive: true },
    select: { id: true, accountNumber: true },
  });
  if (accountRows.length !== ACCOUNTS.length) throw new Error("As três contas do Banco Virtual precisam estar ativas antes da sincronização.");
  const accountByNumber = new Map(accountRows.map((account) => [account.accountNumber, account]));

  let imported = 0;
  for (const definition of ACCOUNTS) {
    const account = accountByNumber.get(definition.number)!;
    const statement = await client.fetchBankStatement({ banco: BANK, agencia: AGENCY, contaNumero: definition.number }, PERIOD);
    const statementImport = await prisma.bankStatementImport.upsert({
      where: { bankAccountId_checksum: { bankAccountId: account.id, checksum: statement.hashSHA256 } },
      create: { bankAccountId: account.id, checksum: statement.hashSHA256, format: statement.formato, fileName: `BANCO_VIRTUAL_${definition.number}_2025_2026.${statement.formato.toLowerCase()}` },
      update: {},
      select: { id: true },
    });
    const result = await prisma.bankStatementItem.createMany({
      data: statement.items.map((item, index) => ({
        statementImportId: statementImport.id,
        bankAccountId: account.id,
        banco: BANK,
        agencia: AGENCY,
        contaNumero: definition.number,
        tipoConta: definition.type,
        date: item.date,
        description: item.description,
        reference: item.reference ?? item.documento ?? null,
        codigoTransacao: externalId(item, statement.hashSHA256, index),
        sinal: item.sinal,
        direction: item.sinal === "CREDITO" ? "CREDIT" : "DEBIT",
        valueDecimal: new Prisma.Decimal(item.value),
        status: "Pendente",
        reciboMunicipal: item.documento ?? null,
        bankTransactionId: item.bankTransactionId ?? null,
        integrationEventId: item.integrationEventId ?? null,
        transactionType: item.transactionType ?? null,
        clientReference: item.clientReference ?? null,
        collectionReference: item.collectionReference ?? null,
        reversalOfBankTransactionId: item.reversalOfBankTransactionId ?? null,
      })),
      skipDuplicates: true,
    });
    imported += result.count;
  }

  // Earlier test data linked statement rows to treasury movements without Revenue or accounting entries.
  const malformed = await prisma.bankStatementItem.findMany({
    where: {
      banco: BANK,
      agencia: AGENCY,
      contaNumero: "20001-1",
      treasuryMovement: { is: { revenueId: null, sourceModule: "FINANCEIRO", type: "Revenue" } },
    },
    select: { id: true, treasuryMovementId: true },
  });
  const malformedMovementIds = malformed.flatMap((item) => item.treasuryMovementId ? [item.treasuryMovementId] : []);
  if (malformedMovementIds.length > 0) {
    const linkedTransfers = await prisma.treasuryTransfer.count({
      where: { OR: [{ sourceMovementId: { in: malformedMovementIds } }, { destinationMovementId: { in: malformedMovementIds } }] },
    });
    if (linkedTransfers > 0) throw new Error("Foram encontrados lançamentos bancários inconsistentes vinculados a transferências; revisão manual obrigatória.");
    await prisma.$transaction(async (tx) => {
      await tx.bankStatementItem.updateMany({
        where: { id: { in: malformed.map((item) => item.id) } },
        data: { treasuryMovementId: null, lancamentoContabilId: null, reciboMunicipal: null, categoriaClassificada: null, status: "Pendente" },
      });
      await tx.treasuryMovement.deleteMany({ where: { id: { in: malformedMovementIds }, revenueId: null } });
      await tx.financialAuditLog.create({
        data: {
          action: "CORRECAO_VINCULO_EXTRATO_BANCARIO",
          entityType: "BankStatementItem",
          entityId: "BANCO_VIRTUAL_20001-1",
          authorUsuarioId: actor.id,
          authorEmployeeId: actor.employeeId,
          payload: { statementItemIds: malformed.map((item) => item.id), removedTreasuryMovementIds: malformedMovementIds },
        },
      });
    });
  }

  const revenueRules = await prisma.classificationRule.findMany({
    where: { ativo: true, tipoMovimento: "RECEITA_CONSTITUCIONAL", bankAccountId: accountByNumber.get("20001-1")!.id },
    select: { textoProcurado: true, naturezaReceita: true, fonteRecurso: true, eventoContabil: true },
  });
  const revenueItems = await prisma.bankStatementItem.findMany({
    where: { banco: BANK, agencia: AGENCY, contaNumero: "20001-1", sinal: "CREDITO", treasuryMovementId: null },
    orderBy: { date: "asc" },
  });
  let constitutionalRevenues = 0;
  for (const item of revenueItems) {
    const rule = revenueRuleForDescription(item.description ?? "", revenueRules);
    if (!rule?.naturezaReceita || !rule.fonteRecurso) continue;
    const natureCode = rule.naturezaReceita.match(/^\d[\d.]+/)?.[0]?.replace(/(?:\.00)+$/, "");
    const sourceCode = rule.fonteRecurso.match(/^\d+/)?.[0];
    if (!natureCode || !sourceCode) throw new Error(`Regra constitucional inválida para ${rule.textoProcurado}.`);
    await prisma.$transaction(async (tx) => {
      const [nature, source] = await Promise.all([
        tx.revenueNature.findUnique({ where: { code: natureCode }, select: { id: true } }),
        tx.resourceSource.findUnique({ where: { code: sourceCode }, select: { id: true } }),
      ]);
      if (!nature || !source) throw new Error(`Natureza ou fonte ausente para ${item.description}.`);
      const revenue = await recordConfirmedRevenue(tx, { usuarioId: actor.id, employeeId: actor.employeeId }, {
        date: item.date,
        value: item.valueDecimal,
        revenueNatureId: nature.id,
        resourceSourceId: source.id,
        bankAccountId: accountByNumber.get("20001-1")!.id,
        history: item.description ?? rule.textoProcurado,
        sourceModule: "BANCO_VIRTUAL",
        sourceType: "CONSTITUTIONAL_REVENUE",
        sourceId: item.id,
        eventType: rule.eventoContabil ?? "RECEITA_CONSTITUCIONAL",
        idempotencyKey: `BANK:CONSTITUTIONAL:${accountByNumber.get("20001-1")!.id}:${item.codigoTransacao ?? item.id}`,
      });
      const accounting = await tx.accountingTransaction.findUnique({
        where: { idempotencyKey: `BANK:CONSTITUTIONAL:${accountByNumber.get("20001-1")!.id}:${item.codigoTransacao ?? item.id}:RECEITA_ARRECADADA` },
        select: { id: true },
      });
      if (!revenue.treasuryMovement) throw new Error(`Movimento de tesouraria não gerado para ${item.codigoTransacao ?? item.id}.`);
      await tx.bankStatementItem.update({
        where: { id: item.id },
        data: { treasuryMovementId: revenue.treasuryMovement.id, lancamentoContabilId: accounting?.id ?? null, reciboMunicipal: `REC-REC-${revenue.id}`, categoriaClassificada: "RECEITA_CONSTITUCIONAL", status: "Processado" },
      });
    });
    constitutionalRevenues += 1;
  }

  const yieldItems = await prisma.bankStatementItem.findMany({
    where: { banco: BANK, agencia: AGENCY, contaNumero: "90001-4", sinal: "CREDITO", treasuryMovementId: null, description: { contains: "RENDIMENTO POSITIVO", mode: "insensitive" } },
    orderBy: { date: "asc" },
  });
  let accumulatedYield = new Prisma.Decimal(0);
  for (const item of yieldItems) {
    accumulatedYield = accumulatedYield.plus(item.valueDecimal);
    await transmitYieldToMunicipalSystem(prisma, {
      statementItemId: item.id,
      contaNumero: "90001-4",
      data: item.date,
      valorBruto: Number(item.valueDecimal),
      irrf: 0,
      iof: 0,
      correcaoMonetaria: 0,
      valorLiquido: Number(item.valueDecimal),
      saldoAcumulado: Number(accumulatedYield),
      tipo: "BRUTO",
      usuarioId: actor.id,
      employeeId: actor.employeeId,
    });
  }

  const investmentItems = await prisma.bankStatementItem.findMany({
    where: {
      banco: BANK,
      agencia: AGENCY,
      contaNumero: "10001-0",
      treasuryMovementId: null,
      OR: [
        { description: { contains: "APLICACAO FINANCEIRA", mode: "insensitive" }, sinal: "DEBITO" },
        { description: { contains: "CREDITO PROVENIENTE DE RESGATE", mode: "insensitive" }, sinal: "CREDITO" },
      ],
    },
    orderBy: { date: "asc" },
  });
  for (const item of investmentItems) {
    await sendMovementToMunicipalSystem(prisma, { statementItemId: item.id, usuarioId: actor.id, employeeId: actor.employeeId });
  }

  console.log({ imported, correctedMalformedLinks: malformed.length, constitutionalRevenues, yields: yieldItems.length, investmentTransfers: investmentItems.length });
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
