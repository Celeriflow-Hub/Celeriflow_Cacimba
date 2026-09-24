import "dotenv/config";
import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import { prisma } from "../../prisma";
import {
  authorizeAccountingMonthClose,
  authorizeAccountingMonthReopen,
  cancelPayableCarryForward,
  finalizeAnnualAccountingClose,
  FinanceActor,
  prepareAnnualAccountingClose,
  reregisterPayableCarryForward,
  requestAccountingMonthClose,
  requestAccountingMonthReopen,
} from "../index";

describe("accounting close workflow", () => {
  const yearNumber = 2099;
  let financialYearId = "";
  let reregisteredFinancialYearId = "";
  let requester: FinanceActor;
  let authorizer: FinanceActor;

  test("requires separate authorization and retains monthly reopening evidence", async () => {
    const users = await prisma.usuario.findMany({ where: { ativo: true }, select: { id: true, employeeId: true }, take: 2 });
    assert.equal(users.length, 2, "A base de teste deve possuir dois usuarios ativos");
    requester = { usuarioId: users[0].id, employeeId: users[0].employeeId };
    authorizer = { usuarioId: users[1].id, employeeId: users[1].employeeId };
    const existing = await prisma.financialYear.findUnique({ where: { year: yearNumber } });
    assert.equal(existing, null, `O exercicio de teste ${yearNumber} ja existe`);
    const year = await prisma.financialYear.create({ data: { year: yearNumber, status: "Aberto", startDate: new Date(`${yearNumber}-01-01T00:00:00.000Z`), endDate: new Date(`${yearNumber}-12-31T23:59:59.999Z`) } });
    financialYearId = year.id;
    const january = new Date(`${yearNumber}-01-01T00:00:00.000Z`);

    await requestAccountingMonthClose(prisma, requester, financialYearId, january);
    await assert.rejects(() => authorizeAccountingMonthClose(prisma, requester, financialYearId, january), /solicitante nao pode autorizar/i);
    await authorizeAccountingMonthClose(prisma, authorizer, financialYearId, january);
    await requestAccountingMonthReopen(prisma, requester, financialYearId, january, "Correcao contabil documentada.");
    await assert.rejects(() => authorizeAccountingMonthReopen(prisma, requester, financialYearId, january), /solicitante nao pode autorizar/i);
    await authorizeAccountingMonthReopen(prisma, authorizer, financialYearId, january);

    const reopened = await prisma.monthlyAccountingClose.findUniqueOrThrow({ where: { financialYearId_competence: { financialYearId, competence: january } }, include: { events: { orderBy: { createdAt: "asc" } } } });
    assert.equal(reopened.status, "ABERTO");
    assert.equal(reopened.events.filter((event) => event.action === "CLOSE_AUTHORIZED").length, 1);
    assert.equal(reopened.events.find((event) => event.action === "REOPEN_REQUESTED")?.justification, "Correcao contabil documentada.");
    assert.ok(reopened.events.find((event) => event.action === "REOPEN_REQUESTED")?.closureEvidence, "A reabertura deve registrar a evidencia do fechamento anterior");
  });

  test("finalizes an annual close only after twelve current closed months", async () => {
    assert.ok(financialYearId);
    for (let month = 0; month < 12; month += 1) {
      const competence = new Date(Date.UTC(yearNumber, month, 1));
      const close = await prisma.monthlyAccountingClose.findUnique({ where: { financialYearId_competence: { financialYearId, competence } } });
      if (close?.status === "ABERTO") await requestAccountingMonthClose(prisma, requester, financialYearId, competence);
      else if (!close) await requestAccountingMonthClose(prisma, requester, financialYearId, competence);
      await authorizeAccountingMonthClose(prisma, authorizer, financialYearId, competence);
    }
    await prepareAnnualAccountingClose(prisma, requester, financialYearId);
    await assert.rejects(() => finalizeAnnualAccountingClose(prisma, requester, financialYearId), /quem preparou.*nao pode conclui-lo/i);
    await finalizeAnnualAccountingClose(prisma, authorizer, financialYearId);
    const year = await prisma.financialYear.findUniqueOrThrow({ where: { id: financialYearId } });
    const annual = await prisma.annualAccountingClose.findUniqueOrThrow({ where: { financialYearId } });
    assert.equal(year.status, "Encerrado");
    assert.equal(annual.status, "ENCERRADO");
    assert.equal(annual.closedByUsuarioId, authorizer.usuarioId);
    assert.ok(annual.closedAt);
  });

  test("records RAP cancellation and re-registration without creating a payment", async () => {
    assert.ok(financialYearId);
    const commitment = await prisma.commitment.findFirst({ select: { id: true } });
    assert.ok(commitment, "A base de teste deve possuir um empenho para a relação do RAP");
    const paymentCountBefore = await prisma.payment.count({ where: { commitmentId: commitment.id } });
    const targetYear = await prisma.financialYear.create({ data: { year: 2100, status: "Aberto", startDate: new Date("2100-01-01T00:00:00.000Z"), endDate: new Date("2100-12-31T23:59:59.999Z") } });
    reregisteredFinancialYearId = targetYear.id;
    const [cancelledCandidate, reregisteredCandidate] = await Promise.all([
      prisma.payableCarryForward.create({ data: { financialYearId, originFinancialYearId: financialYearId, commitmentId: commitment.id, valueDecimal: "10.00", type: "PROCESSADO" } }),
      prisma.payableCarryForward.create({ data: { financialYearId, originFinancialYearId: financialYearId, commitmentId: commitment.id, valueDecimal: "20.00", type: "NAO_PROCESSADO" } }),
    ]);

    await cancelPayableCarryForward(prisma, requester, { payableCarryForwardId: cancelledCandidate.id, justification: "Cancelamento interno de teste." });
    const cancelled = await prisma.payableCarryForward.findUniqueOrThrow({ where: { id: cancelledCandidate.id }, include: { events: true } });
    assert.equal(cancelled.status, "CANCELADO");
    assert.equal(cancelled.events[0]?.action, "CANCELAMENTO_REGISTRADO");

    const successor = await reregisterPayableCarryForward(prisma, requester, { payableCarryForwardId: reregisteredCandidate.id, targetFinancialYearId: targetYear.id, justification: "Reinscrição interna de teste." });
    const source = await prisma.payableCarryForward.findUniqueOrThrow({ where: { id: reregisteredCandidate.id }, include: { events: true, successorPayableCarryForward: true } });
    const persistedSuccessor = await prisma.payableCarryForward.findUniqueOrThrow({ where: { id: successor.id }, include: { events: true } });
    assert.equal(source.status, "REINSCRITO");
    assert.equal(source.successorPayableCarryForward?.id, successor.id);
    assert.equal(persistedSuccessor.originFinancialYearId, financialYearId);
    assert.equal(persistedSuccessor.events[0]?.action, "REINSCRICAO_RECEBIDA");
    assert.equal(await prisma.payment.count({ where: { commitmentId: commitment.id } }), paymentCountBefore);
  });

  after(async () => {
    if (!financialYearId) return;
    const financialYearIds = reregisteredFinancialYearId ? [financialYearId, reregisteredFinancialYearId] : [financialYearId];
    await prisma.payableCarryForwardEvent.deleteMany({ where: { payableCarryForward: { financialYearId: { in: financialYearIds } } } });
    await prisma.payableCarryForward.deleteMany({ where: { financialYearId: { in: financialYearIds } } });
    await prisma.annualAccountingClose.deleteMany({ where: { financialYearId } });
    await prisma.monthlyAccountingClose.deleteMany({ where: { financialYearId } });
    await prisma.financialYear.deleteMany({ where: { id: { in: financialYearIds } } });
  });
});
