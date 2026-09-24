import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../../prisma";
import {
  approveExpenseRequest,
  createBudgetReservation,
  createCommitment,
  createExpenseRequest,
  type FinanceActor,
} from "../index";

test("releases a protocol awaiting accounting when its commitment is issued", async (t) => {
  const [actorUser, actorEmployee, appropriation, secretariat] = await Promise.all([
    prisma.usuario.findFirst({ select: { id: true } }),
    prisma.employee.findFirst({ select: { id: true } }),
    prisma.budgetAppropriation.findFirst({
      where: { code: "0101.04.122.0001.2002.3.3.90.30.00" },
      select: { id: true },
    }),
    prisma.secretariat.findFirst({ select: { id: true } }),
  ]);
  if (!actorUser || !actorEmployee || !appropriation || !secretariat) {
    t.skip("A base POC financeira não está disponível.");
    return;
  }

  const secondApprover = await prisma.usuario.findFirst({
    where: { ativo: true, id: { not: actorUser.id } },
    select: { id: true, employeeId: true },
  });
  if (!secondApprover) {
    t.skip("A base POC deve possuir um aprovador diferente do solicitante.");
    return;
  }

  const actor: FinanceActor = { usuarioId: actorUser.id, employeeId: actorEmployee.id };
  const suffix = Date.now().toString();
  const date = new Date("2026-04-15T10:00:00.000Z");
  const previousAccountingMode = process.env.CELERIFLOW_ACCOUNTING_MODE;
  let processTypeId = "";
  let processId = "";
  let expenseId = "";
  let reservationId = "";
  let commitmentId = "";

  process.env.CELERIFLOW_ACCOUNTING_MODE = "POC";
  try {
    const processType = await prisma.processType.create({
      data: {
        name: `Teste de liberação contábil ${suffix}`,
        subjects: { create: { name: `Empenho ${suffix}` } },
      },
      include: { subjects: true },
    });
    processTypeId = processType.id;
    const process = await prisma.process.create({
      data: {
        protocolNumber: `TESTE-CONTABIL-${suffix}`,
        status: "Aguardando Contabilidade",
        processTypeId: processType.id,
        subjectId: processType.subjects[0].id,
      },
    });
    processId = process.id;

    const expense = await createExpenseRequest(prisma, actor, {
      date,
      description: `Despesa para liberação de protocolo ${suffix}`,
      value: "100.00",
      appropriationId: appropriation.id,
      supplierId: "supp-lagoaseca-01",
      secretariatId: secretariat.id,
      sourceModule: "TEST",
      sourceType: "COMMITMENT_PROTOCOL_GATE",
      eventType: "TEST",
    });
    expenseId = expense.id;
    await approveExpenseRequest(prisma, { usuarioId: secondApprover.id, employeeId: secondApprover.employeeId }, expense.id);
    const reservation = await createBudgetReservation(prisma, actor, {
      number: `RES-PROTOCOLO-${suffix}`,
      date,
      value: "100.00",
      appropriationId: appropriation.id,
      expenseId: expense.id,
    });
    reservationId = reservation.id;
    const commitment = await createCommitment(prisma, actor, {
      number: `EMP-PROTOCOLO-${suffix}`,
      date,
      value: "100.00",
      type: "Ordinário",
      history: "Emissão que libera protocolo aguardando contabilidade",
      appropriationId: appropriation.id,
      supplierId: "supp-lagoaseca-01",
      reservationId: reservation.id,
      processId: process.id,
    });
    commitmentId = commitment.id;

    const [updatedProcess, event] = await Promise.all([
      prisma.process.findUniqueOrThrow({ where: { id: process.id }, select: { status: true } }),
      prisma.processEvent.findFirstOrThrow({
        where: { processId: process.id, eventType: "ACCOUNTING_RELEASED" },
        select: { previousStatus: true, newStatus: true, metadata: true },
      }),
    ]);
    assert.equal(updatedProcess.status, "Recebido");
    assert.equal(event.previousStatus, "Aguardando Contabilidade");
    assert.equal(event.newStatus, "Recebido");
    assert.deepEqual(JSON.parse(event.metadata ?? ""), {
      commitmentId: commitment.id,
      commitmentNumber: commitment.number,
      commitmentValue: "100.00",
    });
  } finally {
    const transactions = commitmentId
      ? await prisma.accountingTransaction.findMany({ where: { sourceId: commitmentId }, select: { id: true } })
      : [];
    if (transactions.length) {
      await prisma.accountingEntry.deleteMany({ where: { transactionId: { in: transactions.map((transaction) => transaction.id) } } });
      await prisma.accountingTransaction.deleteMany({ where: { id: { in: transactions.map((transaction) => transaction.id) } } });
    }
    if (commitmentId) await prisma.financialDocument.deleteMany({ where: { commitmentId } });
    if (commitmentId) await prisma.commitment.deleteMany({ where: { id: commitmentId } });
    if (reservationId) await prisma.budgetReservation.deleteMany({ where: { id: reservationId } });
    if (expenseId) await prisma.expense.deleteMany({ where: { id: expenseId } });
    if (processId) await prisma.process.deleteMany({ where: { id: processId } });
    if (processTypeId) await prisma.processType.deleteMany({ where: { id: processTypeId } });
    if (previousAccountingMode === undefined) delete process.env.CELERIFLOW_ACCOUNTING_MODE;
    else process.env.CELERIFLOW_ACCOUNTING_MODE = previousAccountingMode;
  }
});
