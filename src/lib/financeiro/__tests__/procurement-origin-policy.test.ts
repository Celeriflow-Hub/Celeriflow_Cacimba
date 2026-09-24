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

test("enforces the expense nature procurement-origin policy on commitments", async (t) => {
  const [user, employee, year, budgetUnit, resourceSource, secretariat, alternateSupplier] = await Promise.all([
    prisma.usuario.findFirst({ select: { id: true } }),
    prisma.employee.findFirst({ select: { id: true } }),
    prisma.financialYear.findUnique({ where: { year: 2026 }, select: { id: true } }),
    prisma.budgetUnit.findFirst({ select: { id: true } }),
    prisma.resourceSource.findFirst({ select: { id: true } }),
    prisma.secretariat.findFirst({ select: { id: true } }),
    prisma.supplier.findFirst({ where: { id: { not: "supp-lagoaseca-01" } }, select: { id: true } }),
  ] as const);
  if (!user || !employee || !year || !budgetUnit || !resourceSource || !secretariat) {
    t.skip("A base POC financeira não possui os cadastros necessários.");
    return;
  }
  const approver = await prisma.usuario.findFirst({
    where: { ativo: true, id: { not: user.id } },
    select: { id: true, employeeId: true },
  });
  if (!approver) {
    t.skip("A base POC financeira não possui um aprovador diferente do solicitante.");
    return;
  }

  const actor: FinanceActor = { usuarioId: user.id, employeeId: employee.id };
  const date = new Date("2026-04-20T10:00:00.000Z");
  const suffix = Date.now().toString();
  const previousAccountingMode = process.env.CELERIFLOW_ACCOUNTING_MODE;
  const expenseNatureIds: string[] = [];
  const appropriationIds: string[] = [];
  const expenseIds: string[] = [];
  const reservationIds: string[] = [];
  const commitmentIds: string[] = [];
  const contractIds: string[] = [];
  let purchaseProcessId = "";

  process.env.CELERIFLOW_ACCOUNTING_MODE = "POC";
  try {
    const purchaseProcess = await prisma.purchaseProcess.create({
      data: {
        number: `PROC-POL-${suffix}`,
        object: "Processo temporário para política de origem",
        type: "Comum",
        secretariatId: secretariat.id,
      },
    });
    purchaseProcessId = purchaseProcess.id;
    const createAppropriation = async (policy: "NONE" | "PROCUREMENT_SOURCE" | "CONTRACT") => {
      const expenseNature = await prisma.expenseNature.create({
        data: { code: `POL-${policy}-${suffix}`, name: `Política ${policy}`, procurementOriginPolicy: policy },
      });
      expenseNatureIds.push(expenseNature.id);
      const appropriation = await prisma.budgetAppropriation.create({
        data: {
          code: `DOT-POL-${policy}-${suffix}`,
          financialYearId: year.id,
          budgetUnitId: budgetUnit.id,
          expenseNatureId: expenseNature.id,
          resourceSourceId: resourceSource.id,
          initialValue: 1000,
          initialValueDecimal: "1000.00",
          updatedValue: 1000,
          updatedValueDecimal: "1000.00",
        },
      });
      appropriationIds.push(appropriation.id);
      return appropriation.id;
    };
    const reserve = async (appropriationId: string, supplierId = "supp-lagoaseca-01") => {
      const expense = await createExpenseRequest(prisma, actor, {
        date,
        description: `Despesa de política de origem ${suffix}`,
        value: "100.00",
        appropriationId,
        supplierId,
        secretariatId: secretariat.id,
        sourceModule: "TEST",
        sourceType: "PROCUREMENT_ORIGIN_POLICY",
        eventType: "TEST",
      });
      expenseIds.push(expense.id);
      await approveExpenseRequest(prisma, { usuarioId: approver.id, employeeId: approver.employeeId }, expense.id);
      const reservation = await createBudgetReservation(prisma, actor, {
        number: `RES-POL-${reservationIds.length}-${suffix}`,
        date,
        value: "100.00",
        appropriationId,
        expenseId: expense.id,
      });
      reservationIds.push(reservation.id);
      return reservation.id;
    };
    const createContract = async (status = "Vigente") => {
      const contract = await prisma.contract.create({
        data: {
          number: `CONT-POL-${contractIds.length}-${suffix}`,
          object: "Contrato temporário para política de origem",
          initialValue: 1000,
          updatedValue: 1000,
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2026-12-31T23:59:59.999Z"),
          status,
          processId: purchaseProcessId,
          supplierId: "supp-lagoaseca-01",
          secretariatId: secretariat.id,
        },
      });
      contractIds.push(contract.id);
      return contract;
    };

    const noneAppropriationId = await createAppropriation("NONE");
    const noneReservationId = await reserve(noneAppropriationId);
    const noPolicyCommitment = await createCommitment(prisma, actor, {
      number: `EMP-POL-NONE-${suffix}`,
      date,
      value: "100.00",
      type: "Ordinário",
      history: "Empenho sem exigência de origem",
      appropriationId: noneAppropriationId,
      supplierId: "supp-lagoaseca-01",
      reservationId: noneReservationId,
    });
    commitmentIds.push(noPolicyCommitment.id);

    const contractAppropriationId = await createAppropriation("CONTRACT");
    const contractReservationId = await reserve(contractAppropriationId);
    await assert.rejects(
      () => createCommitment(prisma, actor, {
        number: `EMP-POL-CONTRACT-MISSING-${suffix}`,
        date,
        value: "100.00",
        type: "Ordinário",
        history: "Empenho sem contrato obrigatório",
        appropriationId: contractAppropriationId,
        supplierId: "supp-lagoaseca-01",
        reservationId: contractReservationId,
      }),
      /exige um contrato vigente/i,
    );
    const draftContract = await createContract("Minuta");
    await assert.rejects(
      () => createCommitment(prisma, actor, {
        number: `EMP-POL-CONTRACT-DRAFT-${suffix}`,
        date,
        value: "100.00",
        type: "Ordinário",
        history: "Empenho com contrato não vigente",
        appropriationId: contractAppropriationId,
        supplierId: "supp-lagoaseca-01",
        reservationId: contractReservationId,
        contractId: draftContract.id,
      }),
      /não está vigente/i,
    );
    await prisma.contract.update({ where: { id: draftContract.id }, data: { status: "Vigente" } });
    const contractCommitment = await createCommitment(prisma, actor, {
      number: `EMP-POL-CONTRACT-${suffix}`,
      date,
      value: "100.00",
      type: "Ordinário",
      history: "Empenho com contrato vigente",
      appropriationId: contractAppropriationId,
      supplierId: "supp-lagoaseca-01",
      reservationId: contractReservationId,
      contractId: draftContract.id,
    });
    commitmentIds.push(contractCommitment.id);

    const sourceAppropriationId = await createAppropriation("PROCUREMENT_SOURCE");
    const sourceReservationId = await reserve(sourceAppropriationId);
    await assert.rejects(
      () => createCommitment(prisma, actor, {
        number: `EMP-POL-SOURCE-MISSING-${suffix}`,
        date,
        value: "100.00",
        type: "Ordinário",
        history: "Empenho sem origem de contratação",
        appropriationId: sourceAppropriationId,
        supplierId: "supp-lagoaseca-01",
        reservationId: sourceReservationId,
      }),
      /exige uma origem de contratação válida/i,
    );
    if (alternateSupplier) {
      await assert.rejects(
        () => createCommitment(prisma, actor, {
          number: `EMP-POL-SOURCE-SUPPLIER-${suffix}`,
          date,
          value: "100.00",
          type: "Ordinário",
          history: "Empenho com fornecedor divergente",
          appropriationId: sourceAppropriationId,
          supplierId: alternateSupplier.id,
          reservationId: sourceReservationId,
          contractId: draftContract.id,
        }),
        /não pertence ao fornecedor/i,
      );
    }
    const sourceCommitment = await createCommitment(prisma, actor, {
      number: `EMP-POL-SOURCE-${suffix}`,
      date,
      value: "100.00",
      type: "Ordinário",
      history: "Empenho com origem contratual válida",
      appropriationId: sourceAppropriationId,
      supplierId: "supp-lagoaseca-01",
      reservationId: sourceReservationId,
      contractId: draftContract.id,
    });
    commitmentIds.push(sourceCommitment.id);
  } finally {
    const transactions = commitmentIds.length
      ? await prisma.accountingTransaction.findMany({ where: { sourceId: { in: commitmentIds } }, select: { id: true } })
      : [];
    if (transactions.length) {
      await prisma.accountingEntry.deleteMany({ where: { transactionId: { in: transactions.map((transaction) => transaction.id) } } });
      await prisma.accountingTransaction.deleteMany({ where: { id: { in: transactions.map((transaction) => transaction.id) } } });
    }
    if (commitmentIds.length) await prisma.financialDocument.deleteMany({ where: { commitmentId: { in: commitmentIds } } });
    if (commitmentIds.length) await prisma.commitment.deleteMany({ where: { id: { in: commitmentIds } } });
    if (reservationIds.length) await prisma.budgetReservation.deleteMany({ where: { id: { in: reservationIds } } });
    if (expenseIds.length) await prisma.expense.deleteMany({ where: { id: { in: expenseIds } } });
    if (contractIds.length) await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
    if (purchaseProcessId) await prisma.purchaseProcess.deleteMany({ where: { id: purchaseProcessId } });
    if (appropriationIds.length) await prisma.budgetAppropriation.deleteMany({ where: { id: { in: appropriationIds } } });
    if (expenseNatureIds.length) await prisma.expenseNature.deleteMany({ where: { id: { in: expenseNatureIds } } });
    if (previousAccountingMode === undefined) delete process.env.CELERIFLOW_ACCOUNTING_MODE;
    else process.env.CELERIFLOW_ACCOUNTING_MODE = previousAccountingMode;
  }
});
