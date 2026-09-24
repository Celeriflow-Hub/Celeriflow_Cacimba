import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../../prisma";
import { collectLaunchedRevenue, createRevenue, launchRevenue, redistributeRevenueResourceSource, reverseRevenue, type FinanceActor } from "../index";
import { pocVirtualBank } from "@/lib/poc/poc-config";

test("revenue lifecycle keeps launch, collection, source redistribution and reversal auditable", async () => {
  const [actorUser, actorEmployee] = await Promise.all([
    prisma.usuario.findFirst({ select: { id: true, employeeId: true } }),
    prisma.employee.findFirst({ select: { id: true } }),
  ]);
  const actor: FinanceActor = { usuarioId: actorUser?.id ?? "usr-admin-lagoaseca", employeeId: actorUser?.employeeId ?? actorEmployee?.id ?? "emp-servidor-lagoaseca" };
  const [nature, source, destination, account] = await Promise.all([
    prisma.revenueNature.findFirst({ select: { id: true } }),
    prisma.resourceSource.findUnique({ where: { code: "15000000" }, select: { id: true } }),
    prisma.resourceSource.findUnique({ where: { code: "15010000" }, select: { id: true } }),
    prisma.bankAccount.findFirst({ where: { bankName: pocVirtualBank.name, accountNumber: "20001-1", resourceSource: { code: "15000000" }, isActive: true }, select: { id: true } }),
  ]);
  assert.ok(nature && source && destination && account, "A seed POC deve fornecer natureza, fontes e conta bancaria para o ciclo de receita.");
  const accountingPlans = await prisma.accountingPlan.findMany({ take: 2, select: { id: true } });
  assert.equal(accountingPlans.length, 2, "A seed POC deve fornecer duas contas contabeis para os eventos de receita.");
  for (const [code, name] of [["RECEITA_LANCADA", "Receita lancada"], ["RECEITA_ARRECADADA", "Receita arrecadada"], ["RECEITA_ESTORNADA", "Receita estornada"], ["RECEITA_REDISTRIBUIDA_FONTE", "Receita redistribuida por fonte"]] as const) {
    const event = await prisma.accountingEventCatalog.upsert({ where: { code }, create: { code, name }, update: { name, isActive: true } });
    await prisma.accountingPostingRule.updateMany({ where: { eventId: event.id }, data: { isActive: false } });
    await prisma.accountingPostingRule.upsert({
      where: { eventId_debitAccountId_creditAccountId: { eventId: event.id, debitAccountId: accountingPlans[0].id, creditAccountId: accountingPlans[1].id } },
      create: { eventId: event.id, debitAccountId: accountingPlans[0].id, creditAccountId: accountingPlans[1].id, isReference: true },
      update: { isActive: true, isReference: true },
    });
  }

  const timestamp = Date.now().toString();
  const date = new Date("2026-08-15T12:00:00.000Z");
  const previousAccountingMode = process.env.CELERIFLOW_ACCOUNTING_MODE;
  process.env.CELERIFLOW_ACCOUNTING_MODE = "POC";
  const revenueIds: string[] = [];
  const transactionSourceIds: string[] = [];

  try {
    const launched = await launchRevenue(prisma, actor, {
      date,
      value: "100.00",
      revenueNatureId: nature.id,
      resourceSourceId: source.id,
      classification: "INTRAORCAMENTARIA",
      history: `Receita lancada de teste ${timestamp}`,
      sourceModule: "TEST",
      sourceType: "REVENUE_LIFECYCLE",
      eventType: "TEST_REVENUE_LAUNCHED",
      idempotencyKey: `TEST:REVENUE:${timestamp}:LAUNCH`,
    });
    revenueIds.push(launched.id);
    transactionSourceIds.push(launched.id);
    assert.equal(launched.stage, "LANCADA");
    assert.equal(launched.classification, "INTRAORCAMENTARIA");

    const collected = await collectLaunchedRevenue(prisma, actor, {
      revenueId: launched.id,
      date,
      bankAccountId: account.id,
      idempotencyKey: `TEST:REVENUE:${timestamp}:COLLECT`,
    });
    assert.equal(collected.stage, "ARRECADADA");
    assert.ok(collected.treasuryMovement);

    const redistribution = await redistributeRevenueResourceSource(prisma, actor, {
      revenueId: launched.id,
      date,
      value: "40.00",
      destinationResourceSourceId: destination.id,
      history: "Redistribuicao interna de teste",
      idempotencyKey: `TEST:REVENUE:${timestamp}:REDISTRIBUTION`,
    });
    transactionSourceIds.push(redistribution.id);
    assert.equal(redistribution.sourceResourceSourceId, source.id);
    assert.equal(redistribution.destinationResourceSourceId, destination.id);
    await assert.rejects(() => reverseRevenue(prisma, actor, { revenueId: launched.id, date, justification: "Nao deve estornar com redistribuicao ativa" }), /redistribuicoes por fonte/i);

    const collectedDirectly = await createRevenue(prisma, actor, {
      date,
      value: "60.00",
      revenueNatureId: nature.id,
      resourceSourceId: source.id,
      bankAccountId: account.id,
      classification: "REDUTORA",
      history: `Receita redutora de teste ${timestamp}`,
      sourceModule: "TEST",
      sourceType: "REVENUE_LIFECYCLE",
      eventType: "TEST_REVENUE_COLLECTED",
      idempotencyKey: `TEST:REVENUE:${timestamp}:DIRECT`,
    });
    revenueIds.push(collectedDirectly.id);
    transactionSourceIds.push(collectedDirectly.id);
    const reversal = await reverseRevenue(prisma, actor, { revenueId: collectedDirectly.id, date, justification: "Estorno interno de teste" });
    transactionSourceIds.push(reversal.id);
    const reversed = await prisma.revenue.findUniqueOrThrow({ where: { id: collectedDirectly.id }, include: { reversal: { include: { treasuryMovement: true } } } });
    assert.equal(reversed.stage, "ESTORNADA");
    assert.equal(reversed.reversal?.id, reversal.id);
    assert.equal(reversed.reversal?.treasuryMovement.direction, "Saída");
    const audit = await prisma.financialAuditLog.findFirst({ where: { action: "REVERSE", entityType: "Revenue", entityId: collectedDirectly.id } });
    assert.ok(audit, "O estorno deve manter evidencia de auditoria da receita de origem.");
  } finally {
    const redistributions = await prisma.revenueResourceRedistribution.findMany({ where: { revenueId: { in: revenueIds } }, select: { id: true } });
    const reversals = await prisma.revenueReversal.findMany({ where: { revenueId: { in: revenueIds } }, select: { id: true, treasuryMovementId: true } });
    const transactions = await prisma.accountingTransaction.findMany({ where: { sourceId: { in: [...transactionSourceIds, ...revenueIds] } }, select: { id: true } });
    if (transactions.length) await prisma.accountingEntry.deleteMany({ where: { transactionId: { in: transactions.map((item) => item.id) } } });
    if (transactions.length) await prisma.accountingTransaction.deleteMany({ where: { id: { in: transactions.map((item) => item.id) } } });
    // Financial audit evidence is append-only by policy and intentionally remains after fixture cleanup.
    if (redistributions.length) await prisma.revenueResourceRedistribution.deleteMany({ where: { id: { in: redistributions.map((item) => item.id) } } });
    if (reversals.length) await prisma.revenueReversal.deleteMany({ where: { id: { in: reversals.map((item) => item.id) } } });
    const movements = await prisma.treasuryMovement.findMany({ where: { OR: [{ revenueId: { in: revenueIds } }, { id: { in: reversals.map((item) => item.treasuryMovementId) } }] }, select: { id: true } });
    if (movements.length) await prisma.treasuryMovement.deleteMany({ where: { id: { in: movements.map((item) => item.id) } } });
    if (revenueIds.length) await prisma.revenue.deleteMany({ where: { id: { in: revenueIds } } });
    if (previousAccountingMode === undefined) delete process.env.CELERIFLOW_ACCOUNTING_MODE;
    else process.env.CELERIFLOW_ACCOUNTING_MODE = previousAccountingMode;
  }
});
