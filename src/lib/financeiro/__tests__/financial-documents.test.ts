import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../../prisma";
import {
  approveExpenseRequest,
  createBudgetReservation,
  createCommitment,
  createExpenseRequest,
  createPayment,
  createSettlement,
  type FinanceActor,
} from "../index";

test("generates linked internal financial documents with each financial fact", async (t) => {
  const [user, employee, approver, appropriation, secretariat, document, bankAccount] = await Promise.all([
    prisma.usuario.findFirst({ select: { id: true } }),
    prisma.employee.findFirst({ select: { id: true } }),
    prisma.usuario.findFirst({ where: { ativo: true }, select: { id: true, employeeId: true } }),
    prisma.budgetAppropriation.findFirst({ where: { code: "0101.04.122.0001.2002.3.3.90.30.00" }, select: { id: true } }),
    prisma.secretariat.findFirst({ select: { id: true } }),
    prisma.document.findUnique({ where: { id: "doc-nf-lagoaseca-01" }, select: { id: true } }),
    prisma.bankAccount.findUnique({ where: { id: "poc-robonuvem-checking-10001" }, select: { id: true } }),
  ]);
  if (!user || !employee || !appropriation || !secretariat || !document || !bankAccount) {
    t.skip("A base POC financeira não está disponível.");
    return;
  }
  const secondApprover = approver?.id === user.id
    ? await prisma.usuario.findFirst({ where: { ativo: true, id: { not: user.id } }, select: { id: true, employeeId: true } })
    : approver;
  if (!secondApprover) {
    t.skip("A base POC deve possuir um aprovador diferente do solicitante.");
    return;
  }

  const actor: FinanceActor = { usuarioId: user.id, employeeId: employee.id };
  const suffix = Date.now().toString();
  const date = new Date("2026-04-15T10:00:00.000Z");
  const previousAccountingMode = process.env.CELERIFLOW_ACCOUNTING_MODE;
  let expenseId = "";
  let reservationId = "";
  let commitmentId = "";
  let settlementId = "";
  let paymentId = "";
  let obrasServiceId = "";

  process.env.CELERIFLOW_ACCOUNTING_MODE = "POC";
  try {
    const obrasService = await prisma.obrasServico.create({
      data: {
        protocolo: `OS-DOC-${suffix}`,
        tipo: "Teste",
        descricao: "Ordem de serviço para rastreabilidade do empenho",
        local: "Base POC",
        budgetAppropriationId: appropriation.id,
      },
    });
    obrasServiceId = obrasService.id;
    const expense = await createExpenseRequest(prisma, actor, {
      date,
      description: `Documentos financeiros ${suffix}`,
      value: "100.00",
      appropriationId: appropriation.id,
      supplierId: "supp-lagoaseca-01",
      secretariatId: secretariat.id,
      sourceModule: "TEST",
      sourceType: "FINANCIAL_DOCUMENT",
      eventType: "TEST",
    });
    expenseId = expense.id;
    await approveExpenseRequest(prisma, { usuarioId: secondApprover.id, employeeId: secondApprover.employeeId }, expense.id);
    const reservation = await createBudgetReservation(prisma, actor, {
      number: `RES-DOC-${suffix}`,
      date,
      value: "100.00",
      appropriationId: appropriation.id,
      expenseId: expense.id,
    });
    reservationId = reservation.id;
    const commitment = await createCommitment(prisma, actor, {
      number: `EMP-DOC-${suffix}`,
      date,
      value: "100.00",
      type: "Ordinário",
      history: "Teste de documento interno",
      appropriationId: appropriation.id,
      supplierId: "supp-lagoaseca-01",
      reservationId: reservation.id,
      obrasServiceId,
    });
    commitmentId = commitment.id;
    const commitmentDocument = await prisma.financialDocument.findUniqueOrThrow({ where: { commitmentId } });
    assert.equal(commitmentDocument.documentType, "NOTA_DE_EMPENHO");
    assert.equal(commitmentDocument.number, `NE-${commitment.number}`);
    assert.equal(commitmentDocument.generatedByUsuarioId, actor.usuarioId);
    assert.equal((commitmentDocument.snapshot as { commitment: { obrasService: { id: string; protocolo: string } } }).commitment.obrasService.id, obrasServiceId);
    assert.equal((commitmentDocument.snapshot as { commitment: { obrasService: { id: string; protocolo: string } } }).commitment.obrasService.protocolo, `OS-DOC-${suffix}`);

    const settlement = await createSettlement(prisma, actor, {
      date,
      value: "100.00",
      commitmentId,
      documentId: document.id,
      authorId: employee.id,
      fiscalDocumentNumber: `DOC-${suffix}`,
      fiscalDocumentIssueDate: date,
    });
    settlementId = settlement.id;
    const settlementDocument = await prisma.financialDocument.findUniqueOrThrow({ where: { settlementId } });
    assert.equal(settlementDocument.documentType, "NOTA_DE_LIQUIDACAO");
    assert.equal((settlementDocument.snapshot as { settlement: { commitmentId: string } }).settlement.commitmentId, commitmentId);
    assert.equal((settlementDocument.snapshot as { settlement: { fiscalDocumentNumber: string } }).settlement.fiscalDocumentNumber, `DOC-${suffix}`);

    const payment = await createPayment(prisma, actor, {
      orderNumber: `OP-DOC-${suffix}`,
      date,
      value: "100.00",
      commitmentId,
      settlementId,
      bankAccountId: bankAccount.id,
      supplierId: "supp-lagoaseca-01",
      paymentMethod: "Transferência",
    });
    paymentId = payment.id;
    const paymentDocument = await prisma.financialDocument.findUniqueOrThrow({ where: { paymentId } });
    assert.equal(paymentDocument.documentType, "ORDEM_DE_PAGAMENTO");
    assert.equal((paymentDocument.snapshot as { payment: { settlementId: string; commitmentId: string } }).payment.settlementId, settlementId);
    assert.equal((paymentDocument.snapshot as { payment: { settlementId: string; commitmentId: string } }).payment.commitmentId, commitmentId);
  } finally {
    if (paymentId) await prisma.financialDocument.deleteMany({ where: { paymentId } });
    if (settlementId) await prisma.financialDocument.deleteMany({ where: { settlementId } });
    if (commitmentId) await prisma.financialDocument.deleteMany({ where: { commitmentId } });
    const sourceIds = [commitmentId, settlementId].filter(Boolean);
    if (sourceIds.length) {
      const transactions = await prisma.accountingTransaction.findMany({ where: { sourceId: { in: sourceIds } }, select: { id: true } });
      if (transactions.length) {
        await prisma.accountingEntry.deleteMany({ where: { transactionId: { in: transactions.map((transaction) => transaction.id) } } });
        await prisma.accountingTransaction.deleteMany({ where: { id: { in: transactions.map((transaction) => transaction.id) } } });
      }
    }
    if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
    if (settlementId) await prisma.settlement.deleteMany({ where: { id: settlementId } });
    if (obrasServiceId) await prisma.obrasServico.updateMany({ where: { id: obrasServiceId, commitmentId }, data: { commitmentId: null } });
    if (commitmentId) await prisma.commitment.deleteMany({ where: { id: commitmentId } });
    if (obrasServiceId) await prisma.obrasServico.deleteMany({ where: { id: obrasServiceId } });
    if (reservationId) await prisma.budgetReservation.deleteMany({ where: { id: reservationId } });
    if (expenseId) await prisma.expense.deleteMany({ where: { id: expenseId } });
    if (previousAccountingMode === undefined) delete process.env.CELERIFLOW_ACCOUNTING_MODE;
    else process.env.CELERIFLOW_ACCOUNTING_MODE = previousAccountingMode;
  }
});
