import "dotenv/config";
import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { prisma } from "../../prisma";
import {
  createExpenseRequest,
  approveExpenseRequest,
  createBudgetReservation,
  createCommitment,
  createCommitmentMovement,
  createSettlement,
  createPayment,
  updatePaymentStatus,
  reversePayment,
  settleWithholdingPayable,
  createTreasuryTransfer,
  getBankAccountBalance,
  importBankStatementCsv,
  matchBankStatementItemToTreasuryMovement,
  FinanceActor,
} from "../index";
import {
  generateRREO,
  generateRGF,
  generateBalancoOrcamentario,
  generateBalancoPatrimonial,
} from "../relatorios-legais";
import { addActionPPA, addGoalPPA, addIndicatorPPA, addObjectivePPA, addProgramPPA, createAnnualBudgetLaw, createBudgetAppropriationFromFixation, createBudgetGuideline, createMultiYearPlan, createPlanningAmendment, getAnnualBudgetScheduleCompletion, saveBimonthlyRevenueTarget, saveMonthlyDisbursementSchedule, transitionPlanningLegalWorkflow } from "../planejamento";

describe("Lagoa Seca/PB - Validação Integrada e Regras Fiscais/Financeiras Estritas", () => {
  const pocAccountingEvents = [
    "EMPENHO_EMITIDO",
    "LIQUIDACAO_REGISTRADA",
    "PAGAMENTO_EFETIVADO",
    "RETENCAO_RECOLHIDA",
    "PAGAMENTO_ESTORNADO",
  ];

  async function getActor(): Promise<FinanceActor> {
    const user = await prisma.usuario.findFirst();
    const emp = await prisma.employee.findFirst();
    return {
      usuarioId: user?.id ?? "usr-admin-lagoaseca",
      employeeId: emp?.id ?? "emp-servidor-lagoaseca",
      allowedBudgetUnitIds: [],
    };
  }

  async function assertPocAccountingRulesConfigured() {
    const events = await prisma.accountingEventCatalog.findMany({
      where: { code: { in: pocAccountingEvents } },
      include: { rules: { where: { isActive: true } } },
    });
    assert.equal(events.length, pocAccountingEvents.length, "A seed POC deve configurar todos os eventos contábeis financeiros");
    for (const code of pocAccountingEvents) {
      const event = events.find((candidate) => candidate.code === code);
      assert.ok(event, `Evento contábil ${code} deve existir`);
      assert.equal(event.rules.length, 1, `Evento contábil ${code} deve possuir exatamente uma regra ativa`);
    }
  }

  async function assertAccountingTransaction(eventType: string, sourceId: string) {
    const transaction = await prisma.accountingTransaction.findFirst({
      where: { eventType, sourceId },
      include: { entries: true },
    });
    assert.ok(transaction, `Deve criar a transação contábil ${eventType}`);
    assert.equal(transaction.sourceId, sourceId);
    assert.equal(transaction.entries.length, 2, `A transação ${eventType} deve ter as duas partidas`);
  }

  async function cleanupAccountingTransactions(sourceIds: string[]) {
    if (!sourceIds.length) return;
    const transactions = await prisma.accountingTransaction.findMany({
      where: { sourceId: { in: sourceIds } },
      select: { id: true },
    });
    const transactionIds = transactions.map((transaction) => transaction.id);
    if (!transactionIds.length) return;
    await prisma.accountingEntry.deleteMany({ where: { transactionId: { in: transactionIds } } });
    await prisma.accountingTransaction.deleteMany({ where: { id: { in: transactionIds } } });
  }

  test("1. Deve rejeitar pagamento sem liquidação (fluxo estrito obrigatório)", async () => {
    const actor = await getActor();
    await assert.rejects(
      async () => {
        await createPayment(prisma, actor, {
          orderNumber: "OP-FAIL-01",
          date: new Date("2026-04-01T00:00:00.000Z"),
          value: "1000.00",
          commitmentId: "invalid-id",
          settlementId: "", // Vazio!
          bankAccountId: "poc-robonuvem-checking-10001",
          supplierId: "supp-lagoaseca-01",
          paymentMethod: "Transferência",
        });
      },
      (err: Error) => {
        assert.match(err.message, /fluxo obrigatório exige liquidação prévia/i);
        return true;
      },
    );
  });

  test("2. Ciclo de Vida Real: Bloqueio de retenção em 'Emitida', Efetivação, Recolhimento e Trava de Estorno (com Limpeza)", async () => {
    const actor = await getActor();
    const timestamp = Date.now().toString().slice(-6);
    const testDate = new Date("2026-04-15T10:00:00.000Z");
    const accountingMode = process.env.CELERIFLOW_ACCOUNTING_MODE;
    process.env.CELERIFLOW_ACCOUNTING_MODE = "POC";

    const dotacaoPref = await prisma.budgetAppropriation.findFirst({
      where: { code: "0101.04.122.0001.2002.3.3.90.30.00" },
    });
    assert.ok(dotacaoPref, "Dotação da Prefeitura deve existir");

    let expenseId = "";
    let reservationId = "";
    let commitmentId = "";
    let settlementId = "";
    const paymentIds: string[] = [];
    const payableIds: string[] = [];

    try {
      await assertPocAccountingRulesConfigured();
      // a) Solicitação de despesa
      const expense = await createExpenseRequest(prisma, actor, {
        date: testDate,
        description: `Teste Integrado Lagoa Seca - ${timestamp}`,
        value: "1000.00",
        appropriationId: dotacaoPref.id,
        supplierId: "supp-lagoaseca-01",
        secretariatId: "sec-fin-01",
        sourceModule: "TEST",
        sourceType: "EXPENSE_REQUEST",
        eventType: "TEST",
      });
      expenseId = expense.id;
      assert.ok(expenseId);

      const approver = await prisma.usuario.findFirst({
        where: { id: { not: actor.usuarioId }, ativo: true },
        select: { id: true, employeeId: true },
      });
      assert.ok(approver, "A base de teste deve possuir um aprovador diferente do solicitante");
      await assert.rejects(
        () => approveExpenseRequest(prisma, actor, expense.id),
        /solicitante não pode aprovar a própria solicitação/i,
      );
      await approveExpenseRequest(prisma, { ...actor, usuarioId: approver.id, employeeId: approver.employeeId }, expense.id);

      // b) Reserva de dotação
      const reservation = await createBudgetReservation(prisma, actor, {
        number: `RES-${timestamp}`,
        date: testDate,
        value: "1000.00",
        appropriationId: dotacaoPref.id,
        expenseId: expense.id,
      });
      reservationId = reservation.id;
      assert.ok(reservationId);

      // c) Empenho
      const commitment = await createCommitment(prisma, actor, {
        number: `EMP-${timestamp}`,
        date: testDate,
        value: "1000.00",
        type: "Ordinário",
        history: "Empenho de teste integrado",
        appropriationId: dotacaoPref.id,
        supplierId: "supp-lagoaseca-01",
        reservationId: reservation.id,
      });
      commitmentId = commitment.id;
      assert.ok(commitmentId);
      await assertAccountingTransaction("EMPENHO_EMITIDO", commitment.id);

      // d) Liquidação com documento GED
      const inssRule = await prisma.retentionRule.findUnique({ where: { code: "INSS_11" } });
      assert.ok(inssRule);
      const settlement = await createSettlement(prisma, actor, {
        date: testDate,
        value: "1000.00",
        commitmentId: commitment.id,
        documentId: "doc-nf-lagoaseca-01",
        authorId: actor.employeeId ?? "emp-servidor-lagoaseca",
        fiscalDocumentNumber: "1452",
        fiscalDocumentSeries: "1",
        fiscalDocumentIssueDate: testDate,
        fiscalDocumentAccessKey: "12345678901234567890123456789012345678901234",
        retentionRuleIds: [inssRule.id],
      });
      settlementId = settlement.id;
      assert.ok(settlementId);
      await assertAccountingTransaction("LIQUIDACAO_REGISTRADA", settlement.id);
      const settlementRetention = await prisma.settlementRetention.findUniqueOrThrow({
        where: { settlementId_retentionRuleId: { settlementId, retentionRuleId: inssRule.id } },
      });
      assert.equal(settlementRetention.valueDecimal.toString(), "110");

      // e) Efetiva e estorna um pagamento sem retenções para validar o evento de estorno.
      const initialBankBalance = await getBankAccountBalance(prisma, "poc-robonuvem-checking-10001");
      const paymentForReversal = await createPayment(prisma, actor, {
        orderNumber: `OP-ESTORNO-${timestamp}`,
        date: testDate,
        value: "1000.00",
        commitmentId: commitment.id,
        settlementId: settlement.id,
        bankAccountId: "poc-robonuvem-checking-10001",
        supplierId: "supp-lagoaseca-01",
        paymentMethod: "Transferência",
      });
      paymentIds.push(paymentForReversal.id);
      await updatePaymentStatus(prisma, actor, paymentForReversal.id, "Paga");
      await assertAccountingTransaction("PAGAMENTO_EFETIVADO", paymentForReversal.id);
      await reversePayment(prisma, actor, paymentForReversal.id, "Estorno de teste");
      await assertAccountingTransaction("PAGAMENTO_ESTORNADO", paymentForReversal.id);
      const bankBalanceAfterReversal = await getBankAccountBalance(prisma, "poc-robonuvem-checking-10001");
      assert.equal(Number(bankBalanceAfterReversal.minus(initialBankBalance).toFixed(2)), 0);

      // f) Emissão de pagamento com retenção INSS já apurada na liquidação (R$ 110,00)
      const payment = await createPayment(prisma, actor, {
        orderNumber: `OP-${timestamp}`,
        date: testDate,
        value: "1000.00",
        commitmentId: commitment.id,
        settlementId: settlement.id,
        bankAccountId: "poc-robonuvem-checking-10001",
        supplierId: "supp-lagoaseca-01",
        paymentMethod: "Transferência",
        retentionRuleIds: [inssRule.id],
      });
      paymentIds.push(payment.id);
      assert.equal(payment.status, "Emitida");

      // g) Busca retenção criada
      const payable = await prisma.withholdingPayable.findFirst({
        where: { retention: { paymentId: payment.id, settlementRetentionId: settlementRetention.id } },
      });
      assert.ok(payable, "Devia ter criado a retenção");
      payableIds.push(payable.id);

      // h) Tenta recolher retenção de pagamento ainda 'Emitida' -> DEVE FALHAR
      await assert.rejects(
        async () => {
          await settleWithholdingPayable(prisma, actor, {
            withholdingPayableId: payable.id,
            bankAccountId: "poc-robonuvem-checking-10001",
            receiptDocumentId: "doc-nf-lagoaseca-01",
            paymentDate: testDate,
          });
        },
        (err: Error) => {
          assert.match(err.message, /só pode ser recolhida após a efetivação \(status Paga\)/i);
          return true;
        },
      );

      // i) Efetiva o pagamento -> Status vira 'Paga'
      const bankBalanceBeforePayment = await getBankAccountBalance(prisma, "poc-robonuvem-checking-10001", testDate);
      await updatePaymentStatus(prisma, actor, payment.id, "Paga");
      await assertAccountingTransaction("PAGAMENTO_EFETIVADO", payment.id);

      const bankBalanceAfterPayment = await getBankAccountBalance(prisma, "poc-robonuvem-checking-10001", testDate);
      // Saída deve ser apenas o valor LÍQUIDO R$ 890,00 (1000 - 110)
      assert.equal(Number(bankBalanceBeforePayment.minus(bankBalanceAfterPayment).toFixed(2)), 890.00);

      // j) Recolhe a retenção INSS -> Status vira 'Recolhida'
        await settleWithholdingPayable(prisma, actor, {
          withholdingPayableId: payable.id,
          bankAccountId: "poc-robonuvem-checking-10001",
          receiptDocumentId: "doc-nf-lagoaseca-01",
          paymentDate: testDate,
        });
        await assertAccountingTransaction("RETENCAO_RECOLHIDA", payable.id);
        const withholdingDocument = await prisma.financialDocument.findUniqueOrThrow({ where: { withholdingPayableId: payable.id } });
        assert.equal(withholdingDocument.documentType, "COMPROVANTE_RECOLHIMENTO_RETENCAO");
        assert.equal((withholdingDocument.snapshot as { receiptDocument: { id: string }; sourcePayment: { id: string } }).receiptDocument.id, "doc-nf-lagoaseca-01");
        assert.equal((withholdingDocument.snapshot as { receiptDocument: { id: string }; sourcePayment: { id: string } }).sourcePayment.id, payment.id);

      const bankBalanceAfterRetention = await getBankAccountBalance(prisma, "poc-robonuvem-checking-10001", testDate);
      // Saída adicional da retenção de R$ 110,00 -> Total acumulado = 890 + 110 = 1000,00!
      assert.equal(Number(bankBalanceAfterPayment.minus(bankBalanceAfterRetention).toFixed(2)), 110.00);

      // k) Tenta estornar pagamento com retenção recolhida -> DEVE FALHAR (Trava ativada)
      await assert.rejects(
        async () => {
          await reversePayment(prisma, actor, payment.id, "Estorno indevido");
        },
        (err: Error) => {
          assert.match(err.message, /retenções tributárias já recolhidas/i);
          return true;
        },
      );
    } finally {
      // A auditoria financeira e append-only; os fatos temporarios sao limpos, mas seus logs permanecem como evidencia.
      if (paymentIds.length) await prisma.financialDocument.deleteMany({ where: { paymentId: { in: paymentIds } } });
      if (payableIds.length) await prisma.financialDocument.deleteMany({ where: { withholdingPayableId: { in: payableIds } } });
      if (settlementId) await prisma.financialDocument.deleteMany({ where: { settlementId } });
      if (commitmentId) await prisma.financialDocument.deleteMany({ where: { commitmentId } });
      await cleanupAccountingTransactions([commitmentId, settlementId, ...paymentIds, ...payableIds].filter(Boolean));
      if (paymentIds.length) {
        await prisma.treasuryMovement.deleteMany({ where: { sourceId: { in: paymentIds } } });
        const retentions = await prisma.paymentRetention.findMany({ where: { paymentId: { in: paymentIds } }, select: { id: true } });
        const retIds = retentions.map((r) => r.id);
        const payables = await prisma.withholdingPayable.findMany({ where: { retentionId: { in: retIds } }, select: { id: true } });
        const payIds = payables.map((p) => p.id);
        await prisma.treasuryMovement.deleteMany({ where: { sourceId: { in: payIds } } });
        await prisma.withholdingPayable.deleteMany({ where: { retentionId: { in: retIds } } });
        await prisma.paymentRetention.deleteMany({ where: { paymentId: { in: paymentIds } } });
        await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
      }
      if (settlementId) await prisma.settlementRetention.deleteMany({ where: { settlementId } });
      if (settlementId) await prisma.settlement.deleteMany({ where: { id: settlementId } });
      if (commitmentId) await prisma.commitment.deleteMany({ where: { id: commitmentId } });
      if (reservationId) await prisma.budgetReservation.deleteMany({ where: { id: reservationId } });
      if (expenseId) await prisma.expense.deleteMany({ where: { id: expenseId } });
      if (accountingMode === undefined) delete process.env.CELERIFLOW_ACCOUNTING_MODE;
      else process.env.CELERIFLOW_ACCOUNTING_MODE = accountingMode;
    }
  });

  test("3. Deve bloquear empenhos e reforços que excedem o teto do contrato", async () => {
    const actor = await getActor();
    const suffix = Date.now().toString();
    const testDate = new Date("2026-04-20T10:00:00.000Z");
    const accountingMode = process.env.CELERIFLOW_ACCOUNTING_MODE;
    process.env.CELERIFLOW_ACCOUNTING_MODE = "POC";
    let contractId = "";
    let firstExpenseId = "";
    let firstReservationId = "";
    let commitmentId = "";
    let secondExpenseId = "";
    let secondReservationId = "";

    try {
      const [appropriation, approver] = await Promise.all([
        prisma.budgetAppropriation.findFirst({ where: { code: "0101.04.122.0001.2002.3.3.90.30.00" } }),
        prisma.usuario.findFirst({
          where: { id: { not: actor.usuarioId }, ativo: true },
          select: { id: true, employeeId: true },
        }),
      ]);
      assert.ok(appropriation, "Dotação da Prefeitura deve existir");
      assert.ok(approver, "A base de teste deve possuir um aprovador diferente do solicitante");

      const contract = await prisma.contract.create({
        data: {
          number: `CONT-TETO-${suffix}`,
          object: "Contrato temporário para validação de teto",
          initialValue: 1000,
          updatedValue: 1000,
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2026-12-31T23:59:59.999Z"),
          status: "Vigente",
          processId: "proc-licita-01",
          supplierId: "supp-lagoaseca-01",
          secretariatId: "sec-fin-01",
        },
      });
      contractId = contract.id;

      const firstExpense = await createExpenseRequest(prisma, actor, {
        date: testDate,
        description: `Despesa de teto contratual ${suffix}`,
        value: "800.00",
        appropriationId: appropriation.id,
        supplierId: "supp-lagoaseca-01",
        secretariatId: "sec-fin-01",
        sourceModule: "TEST",
        sourceType: "EXPENSE_REQUEST",
        eventType: "TEST",
      });
      firstExpenseId = firstExpense.id;
      await approveExpenseRequest(prisma, { ...actor, usuarioId: approver.id, employeeId: approver.employeeId }, firstExpense.id);
      const firstReservation = await createBudgetReservation(prisma, actor, {
        number: `RES-TETO-1-${suffix}`,
        date: testDate,
        value: "800.00",
        appropriationId: appropriation.id,
        expenseId: firstExpense.id,
      });
      firstReservationId = firstReservation.id;
      const commitment = await createCommitment(prisma, actor, {
        number: `EMP-TETO-1-${suffix}`,
        date: testDate,
        value: "800.00",
        type: "Ordinário",
        history: "Empenho dentro do teto contratual",
        appropriationId: appropriation.id,
        supplierId: "supp-lagoaseca-01",
        reservationId: firstReservation.id,
        contractId,
      });
      commitmentId = commitment.id;

      const secondExpense = await createExpenseRequest(prisma, actor, {
        date: testDate,
        description: `Despesa excedente de teto contratual ${suffix}`,
        value: "300.00",
        appropriationId: appropriation.id,
        supplierId: "supp-lagoaseca-01",
        secretariatId: "sec-fin-01",
        sourceModule: "TEST",
        sourceType: "EXPENSE_REQUEST",
        eventType: "TEST",
      });
      secondExpenseId = secondExpense.id;
      await approveExpenseRequest(prisma, { ...actor, usuarioId: approver.id, employeeId: approver.employeeId }, secondExpense.id);
      const secondReservation = await createBudgetReservation(prisma, actor, {
        number: `RES-TETO-2-${suffix}`,
        date: testDate,
        value: "300.00",
        appropriationId: appropriation.id,
        expenseId: secondExpense.id,
      });
      secondReservationId = secondReservation.id;

      await assert.rejects(
        () => createCommitment(prisma, actor, {
          number: `EMP-TETO-2-${suffix}`,
          date: testDate,
          value: "300.00",
          type: "Ordinário",
          history: "Empenho que excede o teto contratual",
          appropriationId: appropriation.id,
          supplierId: "supp-lagoaseca-01",
          reservationId: secondReservation.id,
          contractId,
        }),
        /saldo do contrato/i,
      );
      await assert.rejects(
        () => createCommitmentMovement(prisma, actor, {
          commitmentId,
          date: testDate,
          type: "Reforço",
          value: "200.01",
          justification: "Reforço que excede o teto contratual",
        }),
        /saldo do contrato/i,
      );
    } finally {
      await cleanupAccountingTransactions([commitmentId].filter(Boolean));
      if (commitmentId) await prisma.commitmentMovement.deleteMany({ where: { commitmentId } });
      if (commitmentId) await prisma.financialDocument.deleteMany({ where: { commitmentId } });
      if (commitmentId) await prisma.commitment.deleteMany({ where: { id: commitmentId } });
      if (firstReservationId) await prisma.budgetReservation.deleteMany({ where: { id: firstReservationId } });
      if (secondReservationId) await prisma.budgetReservation.deleteMany({ where: { id: secondReservationId } });
      if (firstExpenseId) await prisma.expense.deleteMany({ where: { id: firstExpenseId } });
      if (secondExpenseId) await prisma.expense.deleteMany({ where: { id: secondExpenseId } });
      if (contractId) await prisma.contract.deleteMany({ where: { id: contractId } });
      if (accountingMode === undefined) delete process.env.CELERIFLOW_ACCOUNTING_MODE;
      else process.env.CELERIFLOW_ACCOUNTING_MODE = accountingMode;
    }
  });

  test("4. Deve validar integridade e alinhamento dos dados da seed da POC", async () => {
    const year = await prisma.financialYear.findUnique({ where: { year: 2026 } });
    assert.ok(year, "Exercício 2026 deve existir");

    const bankAccPref = await prisma.bankAccount.findUnique({ where: { id: "poc-robonuvem-revenue-20001" } });
    assert.ok(bankAccPref, "Conta da Prefeitura deve existir");
    assert.ok(bankAccPref.resourceSourceId, "Conta bancária deve ter fonte vinculada");

    const balance = await getBankAccountBalance(prisma, bankAccPref.id);
    assert.ok(balance.greaterThanOrEqualTo(150000), "Saldo inicial da conta de receitas deve ser R$ 150.000,00 ou maior");
  });

  test("3.1. Deve importar CSV de forma idempotente e conciliar manualmente em relação um-para-um", async () => {
    const [account, year] = await Promise.all([
      prisma.bankAccount.findFirst({ where: { isActive: true }, select: { id: true, budgetUnitId: true } }),
      prisma.financialYear.findFirst({ select: { id: true } }),
    ]);
    assert.ok(account, "A base de teste deve possuir uma conta bancária ativa");
    assert.ok(year, "A base de teste deve possuir um exercício financeiro");

    const actor = { ...await getActor(), allowedBudgetUnitIds: account.budgetUnitId ? [account.budgetUnitId] : undefined };
    const suffix = Date.now().toString();
    const firstContent = `date,description,amount,reference\n2026-06-15,Conciliação ${suffix},125.50,REF-${suffix}`;
    const secondContent = `date,description,amount,reference\n2026-06-16,Conciliação duplicada ${suffix},125.50,REF-2-${suffix}`;
    const importIds: string[] = [];
    let movementId = "";
    let oppositeMovementId = "";

    try {
      const firstImport = await importBankStatementCsv(prisma, actor, {
        bankAccountId: account.id,
        content: firstContent,
        fileName: `extrato-${suffix}.csv`,
      });
      importIds.push(firstImport.id);
      const replay = await importBankStatementCsv(prisma, actor, {
        bankAccountId: account.id,
        content: firstContent,
        fileName: `extrato-${suffix}.csv`,
      });
      assert.equal(replay.id, firstImport.id, "O mesmo arquivo não deve criar uma segunda importação");
      assert.equal(await prisma.bankStatementItem.count({ where: { statementImportId: firstImport.id } }), 1);

      const secondImport = await importBankStatementCsv(prisma, actor, {
        bankAccountId: account.id,
        content: secondContent,
        fileName: `extrato-2-${suffix}.csv`,
      });
      importIds.push(secondImport.id);
      const [firstItem, secondItem] = await Promise.all([
        prisma.bankStatementItem.findFirstOrThrow({ where: { statementImportId: firstImport.id } }),
        prisma.bankStatementItem.findFirstOrThrow({ where: { statementImportId: secondImport.id } }),
      ]);
      const movement = await prisma.treasuryMovement.create({
        data: {
          date: new Date("2026-06-15T12:00:00.000Z"),
          type: "Teste de conciliação",
          direction: "Entrada",
          valueDecimal: "125.50",
          history: `Movimento de teste ${suffix}`,
          bankAccountId: account.id,
          financialYearId: year.id,
          sourceModule: "TEST",
          sourceType: "BANK_RECONCILIATION_TEST",
          eventType: "TEST",
        },
      });
      movementId = movement.id;
      const oppositeMovement = await prisma.treasuryMovement.create({
        data: {
          date: new Date("2026-06-15T12:00:00.000Z"),
          type: "Teste de conciliação com sentido oposto",
          direction: "Saída",
          valueDecimal: "125.50",
          history: `Movimento de sentido oposto ${suffix}`,
          bankAccountId: account.id,
          financialYearId: year.id,
          sourceModule: "TEST",
          sourceType: "BANK_RECONCILIATION_TEST",
          eventType: "TEST",
        },
      });
      oppositeMovementId = oppositeMovement.id;
      await assert.rejects(
        () => matchBankStatementItemToTreasuryMovement(prisma, actor, {
          statementItemId: firstItem.id,
          treasuryMovementId: oppositeMovement.id,
        }),
        /mesmo sentido/i,
      );

      const matched = await matchBankStatementItemToTreasuryMovement(prisma, actor, {
        statementItemId: firstItem.id,
        treasuryMovementId: movement.id,
      });
      assert.equal(matched.status, "Conciliado");
      assert.equal(matched.treasuryMovementId, movement.id);
      await assert.rejects(
        () => matchBankStatementItemToTreasuryMovement(prisma, actor, {
          statementItemId: secondItem.id,
          treasuryMovementId: movement.id,
        }),
        /já está vinculado a outro item de extrato/i,
      );
    } finally {
      if (importIds.length) {
        await prisma.bankStatementItem.deleteMany({ where: { statementImportId: { in: importIds } } });
        await prisma.bankStatementImport.deleteMany({ where: { id: { in: importIds } } });
      }
      if (oppositeMovementId) await prisma.treasuryMovement.deleteMany({ where: { id: oppositeMovementId } });
      if (movementId) await prisma.treasuryMovement.deleteMany({ where: { id: movementId } });
    }
  });

  test("5. Deve gerar RREO, RGF, Balanço Orçamentário e Balanço Patrimonial sem inconsistências", async () => {
    const year = await prisma.financialYear.findUnique({ where: { year: 2026 } });
    assert.ok(year);

    const filter = { financialYearId: year.id };

    const rreo = await generateRREO(prisma, filter);
    assert.ok(rreo.expenseSummary);
    assert.ok(Array.isArray(rreo.revenueSummary), "O RREO deve expor o resumo de receitas publicadas");

    const rgf = await generateRGF(prisma, filter);
    assert.ok(rgf.receitaCorrenteLiquida >= 0);
    assert.ok(["REGULAR", "ALERTA", "EXCEDIDO"].includes(rgf.situacao));

    const balancoOrc = await generateBalancoOrcamentario(prisma, filter);
    assert.equal(balancoOrc.totais.totalReceitaPrevista, 0, "LOAs legadas em DRAFT não podem compor o balanço orçamentário");

    const balancoPat = await generateBalancoPatrimonial(prisma, filter);
    assert.ok(balancoPat.totais);
    assert.ok(balancoPat.patrimonioLiquido, "Patrimônio Líquido deve estar separado do Passivo");
  });

  test("6. Deve rastrear PPA, LDO e LOA e aceitar publicação no exercício anterior", async () => {
    const actor = await getActor();
    const planningActor = { ...actor, allowedBudgetUnitIds: undefined };
    const suffix = Date.now().toString();
    let financialYearId = "";
    let planId = "";
    let guidelineId = "";
    let loaId = "";
    let appropriationId = "";
    let expenseId = "";
    let reservationId = "";

    try {
      const financialYear = await prisma.financialYear.create({
        data: {
          year: 2031,
          status: "Preparação",
          startDate: new Date("2031-01-01T00:00:00.000Z"),
          endDate: new Date("2031-12-31T23:59:59.999Z"),
        },
      });
      financialYearId = financialYear.id;
      const plan = await createMultiYearPlan(prisma, actor, {
        code: `PPA-${suffix}`,
        name: "PPA de rastreabilidade",
        startYear: 2030,
        endYear: 2034,
      });
      planId = plan.id;
      const program = await addProgramPPA(prisma, actor, { multiYearPlanId: plan.id, code: `PRG-${suffix}`, name: "Programa de rastreabilidade" });
      const action = await addActionPPA(prisma, actor, { programId: program.id, code: `ACO-${suffix}`, name: "Acao de rastreabilidade" });
      const objective = await addObjectivePPA(prisma, actor, { programId: program.id, code: `OBJ-${suffix}`, description: "Ampliar a cobertura do programa" });
      const indicator = await addIndicatorPPA(prisma, actor, { objectiveId: objective.id, name: "Cobertura", unit: "%", baselineValue: 40, targetValue: 60 });
      const goal = await addGoalPPA(prisma, actor, { actionId: action.id, year: 2031, physical: 60, financial: 100 });
      const amendment = await createPlanningAmendment(prisma, actor, {
        entityType: "PPA",
        entityId: plan.id,
        reason: "Revisão interna de metas",
        amendedSnapshot: { code: plan.code, name: "PPA de rastreabilidade revisado" },
      });
      assert.equal(amendment.version, 1);
      assert.match(JSON.stringify(amendment.originalSnapshot), /PPA de rastreabilidade/);
      assert.match(JSON.stringify(amendment.amendedSnapshot), /revisado/);
      const guideline = await createBudgetGuideline(prisma, actor, {
        financialYearId,
        multiYearPlanId: plan.id,
        priorities: [{ description: "Prioridade de teste", targetValue: 100 }],
        risks: [{ description: "Risco de teste", estimatedImpact: 10, mitigation: "Monitorar execução" }],
      });
      guidelineId = guideline.id;
      const guidelineAmendment = await createPlanningAmendment(prisma, actor, {
        entityType: "LDO",
        entityId: guideline.id,
        reason: "Revisão interna de prioridades",
        amendedSnapshot: { financialYear: 2031, priorities: [{ description: "Prioridade revisada" }] },
      });
      assert.equal(guidelineAmendment.version, 1);
      assert.match(JSON.stringify(guidelineAmendment.originalSnapshot), /Prioridade de teste/);
      const loa = await createAnnualBudgetLaw(prisma, actor, {
        lawNumber: `LOA-${suffix}`,
        publicationDate: new Date("2030-12-20T00:00:00.000Z"),
        financialYearId,
        budgetGuidelineId: guideline.id,
        totalRevenue: 100,
        totalExpense: 100,
        revenueForecasts: [{ code: "1.0.0", name: "Receita de teste A", estimatedValue: 40 }, { code: "1.1.0", name: "Receita de teste B", estimatedValue: 60 }],
        expenseFixations: [{ code: "3.3.9", name: "Despesa de teste A", fixedValue: 50 }, { code: "4.4.9", name: "Despesa de teste B", fixedValue: 50 }],
      });
      loaId = loa.id;
      const lawAmendment = await createPlanningAmendment(prisma, actor, {
        entityType: "LOA",
        entityId: loa.id,
        reason: "Revisão interna de previsão",
        amendedSnapshot: { lawNumber: loa.lawNumber, totalRevenue: "110.00", totalExpense: "110.00" },
      });
      assert.equal(lawAmendment.version, 1);
      assert.match(JSON.stringify(lawAmendment.originalSnapshot), /Receita de teste A/);
      const [budgetUnit, expenseNature, resourceSource, supplier] = await Promise.all([
        prisma.budgetUnit.findFirst({ select: { id: true, secretariatId: true } }),
        prisma.expenseNature.findFirst({ select: { id: true } }),
        prisma.resourceSource.findFirst({ select: { id: true } }),
        prisma.supplier.findFirst({ where: { status: "Ativo" }, select: { id: true } }),
      ]);
      assert.ok(budgetUnit && expenseNature && resourceSource && supplier, "Cadastros orcamentarios de apoio devem existir");
      const appropriation = await createBudgetAppropriationFromFixation(prisma, planningActor, {
        annualBudgetExpenseFixationId: loa.expenseFixations[0].id,
        programPPAId: program.id,
        actionPPAId: action.id,
        code: `DOT-${suffix}`,
        budgetUnitId: budgetUnit.id,
        expenseNatureId: expenseNature.id,
        resourceSourceId: resourceSource.id,
        initialValue: 50,
      });
      appropriationId = appropriation.id;
      await prisma.financialYear.update({ where: { id: financialYearId }, data: { status: "Aberto" } });
      const expense = await prisma.expense.create({
        data: {
          date: new Date("2031-01-15T00:00:00.000Z"),
          description: "Despesa para validar CMD",
          value: 50,
          valueDecimal: 50,
          appropriationId: appropriation.id,
          secretariatId: budgetUnit.secretariatId,
          supplierId: supplier.id,
          status: "Aprovada",
        },
      });
      expenseId = expense.id;
      await assert.rejects(
        () => createBudgetReservation(prisma, planningActor, {
          number: `RES-CMD-INCOMPLETO-${suffix}`,
          date: new Date("2031-01-15T00:00:00.000Z"),
          value: 50,
          appropriationId: appropriation.id,
          expenseId: expense.id,
        }),
        /CMD completo/i,
      );
      for (let month = 1; month <= 12; month += 1) {
        await saveMonthlyDisbursementSchedule(prisma, planningActor, {
          annualBudgetLawId: loa.id,
          month,
          budgetUnitId: budgetUnit.id,
          limitValue: 60,
        });
      }
      for (let bimonth = 1; bimonth <= 6; bimonth += 1) {
        await saveBimonthlyRevenueTarget(prisma, planningActor, {
          annualBudgetLawId: loa.id,
          bimonth,
          targetValue: 100,
        });
      }
      const completion = await getAnnualBudgetScheduleCompletion(prisma, loa.id, budgetUnit.id);
      assert.equal(completion.cmdComplete, true);
      assert.equal(completion.mbaComplete, true);
      assert.deepEqual(completion.missingCmdMonths, []);
      assert.deepEqual(completion.missingMbaBimesters, []);
      const reservation = await createBudgetReservation(prisma, planningActor, {
        number: `RES-CMD-${suffix}`,
        date: new Date("2031-01-15T00:00:00.000Z"),
        value: 50,
        appropriationId: appropriation.id,
        expenseId: expense.id,
      });
      reservationId = reservation.id;
      await saveMonthlyDisbursementSchedule(prisma, planningActor, {
        annualBudgetLawId: loa.id,
        month: 1,
        budgetUnitId: budgetUnit.id,
        limitValue: 40,
      });
      await assert.rejects(
        () => createCommitment(prisma, planningActor, {
          number: `EMP-CMD-${suffix}`,
          date: new Date("2031-01-15T00:00:00.000Z"),
          value: 50,
          type: "Ordinário",
          history: "Empenho para validar CMD",
          appropriationId: appropriation.id,
          supplierId: supplier.id,
          reservationId: reservation.id,
        }),
        /CMD/i,
      );
      await assert.rejects(
        () => createBudgetAppropriationFromFixation(prisma, planningActor, {
          annualBudgetExpenseFixationId: loa.expenseFixations[0].id,
          programPPAId: program.id,
          actionPPAId: action.id,
          code: `DOT-EXCESSO-${suffix}`,
          budgetUnitId: budgetUnit.id,
          expenseNatureId: expenseNature.id,
          resourceSourceId: resourceSource.id,
          initialValue: 1,
        }),
        /excede o saldo disponivel da fixacao/i,
      );

      const trace = await prisma.annualBudgetLaw.findUniqueOrThrow({
        where: { id: loa.id },
        include: { budgetGuideline: { include: { multiYearPlan: true, priorities: true, risks: true } }, revenueForecasts: true, expenseFixations: { include: { appropriations: { include: { programPPA: true, actionPPA: true } } } }, cmdSchedules: true, mbaTargets: true },
      });
      assert.equal(trace.budgetGuideline?.multiYearPlan?.id, plan.id);
      assert.equal(trace.financialYearId, financialYear.id);
      assert.equal(trace.budgetGuideline?.priorities[0]?.description, "Prioridade de teste");
      assert.equal(trace.budgetGuideline?.risks[0]?.mitigation, "Monitorar execução");
      assert.equal(trace.revenueForecasts.reduce((total, forecast) => total + Number(forecast.estimatedValue), 0), Number(trace.totalRevenue));
      assert.equal(trace.expenseFixations.reduce((total, fixation) => total + Number(fixation.fixedValue), 0), Number(trace.totalExpense));
      assert.equal(trace.expenseFixations[0].appropriations[0]?.id, appropriation.id);
      assert.equal(trace.expenseFixations[0].appropriations[0]?.programPPA?.id, program.id);
      assert.equal(trace.expenseFixations[0].appropriations[0]?.actionPPA?.id, action.id);
       assert.equal(trace.cmdSchedules.length, 12);
       assert.equal(trace.mbaTargets.length, 6);
       assert.equal(Number(trace.cmdSchedules.find((schedule) => schedule.month === 1)?.limitValue), 40);
       assert.equal(Number(trace.mbaTargets[0]?.targetValue), 100);
      const hierarchy = await prisma.programPPA.findUniqueOrThrow({ where: { id: program.id }, include: { objectives: { include: { indicators: true } }, actions: { include: { goals: true } } } });
      assert.equal(hierarchy.objectives[0]?.id, objective.id);
      assert.equal(hierarchy.objectives[0]?.indicators[0]?.id, indicator.id);
      assert.equal(hierarchy.actions[0]?.goals[0]?.id, goal.id);
    } finally {
       if (reservationId) await prisma.budgetReservation.delete({ where: { id: reservationId } });
       if (expenseId) await prisma.expense.delete({ where: { id: expenseId } });
       if (appropriationId) await prisma.budgetAppropriation.delete({ where: { id: appropriationId } });
       await prisma.planningAmendment.deleteMany({ where: { entityId: { in: [planId, guidelineId, loaId].filter(Boolean) } } });
      if (loaId) await prisma.annualBudgetLaw.delete({ where: { id: loaId } });
      if (guidelineId) await prisma.budgetGuideline.delete({ where: { id: guidelineId } });
      if (planId) await prisma.multiYearPlan.delete({ where: { id: planId } });
      if (financialYearId) await prisma.financialYear.delete({ where: { id: financialYearId } });
    }
  });

  test("7. Deve registrar transferência de tesouraria em movimentos correspondentes", async () => {
    const actor = await getActor();
    const idempotencyKey = `TEST:TREASURY_TRANSFER:${Date.now()}`;
    const sourceBankAccountId = "poc-robonuvem-checking-10001";
    const destinationBankAccountId = "poc-robonuvem-investment-90001";
    let transferId = "";

    try {
      const [sourceBefore, destinationBefore] = await Promise.all([
        getBankAccountBalance(prisma, sourceBankAccountId),
        getBankAccountBalance(prisma, destinationBankAccountId),
      ]);
      const transfer = await createTreasuryTransfer(prisma, actor, {
        date: new Date("2026-05-01T12:00:00.000Z"),
        value: "150.25",
        sourceBankAccountId,
        destinationBankAccountId,
        history: "Transferência de teste",
        idempotencyKey,
      });
      transferId = transfer.id;

      const [sourceAfter, destinationAfter, movements] = await Promise.all([
        getBankAccountBalance(prisma, sourceBankAccountId),
        getBankAccountBalance(prisma, destinationBankAccountId),
        prisma.treasuryMovement.findMany({ where: { idempotencyKey: { in: [`${idempotencyKey}:OUT`, `${idempotencyKey}:IN`] } } }),
      ]);
      assert.equal(Number(sourceBefore.minus(sourceAfter).toFixed(2)), 150.25);
      assert.equal(Number(destinationAfter.minus(destinationBefore).toFixed(2)), 150.25);
      assert.equal(movements.length, 2);
    } finally {
      if (transferId) await prisma.treasuryTransfer.delete({ where: { id: transferId } });
      await prisma.treasuryMovement.deleteMany({ where: { idempotencyKey: { in: [`${idempotencyKey}:OUT`, `${idempotencyKey}:IN`] } } });
    }
  });

  test("8. Deve exigir etapas legais, atores distintos, GED final e bloquear alterações após a sanção", async () => {
    const suffix = Date.now().toString();
    const users = await prisma.usuario.findMany({ where: { ativo: true }, select: { id: true, employeeId: true }, take: 5 });
    assert.ok(users.length >= 5, "A seed POC deve fornecer cinco atores distintos para o fluxo legal");
    const actors = users.map((user) => ({ usuarioId: user.id, employeeId: user.employeeId, allowedBudgetUnitIds: undefined }));
    let planId = "";
    let guidelineId = "";
    let loaId = "";
    let financialYearId = "";
    let documentId = "";

    try {
      const document = await prisma.document.create({
        data: { title: `Ato legal ${suffix}`, documentType: "Lei Municipal", fileUrl: `https://example.test/legal-${suffix}.pdf`, status: "Válido" },
      });
      documentId = document.id;
      await prisma.documentVersion.create({
        data: { documentId, versionNumber: 1, fileUrl: document.fileUrl, hashSha256: `legal-${suffix}`, status: "FINAL" },
      });
      const financialYear = await prisma.financialYear.create({
        data: { year: 2400 + Number(suffix.slice(-2)), status: "Preparação", startDate: new Date("2400-01-01T00:00:00.000Z"), endDate: new Date("2400-12-31T23:59:59.999Z") },
      });
      financialYearId = financialYear.id;
      const plan = await createMultiYearPlan(prisma, actors[0], { code: `PPA-LEGAL-${suffix}`, name: "PPA legal", startYear: financialYear.year, endYear: financialYear.year + 3 });
      planId = plan.id;
      await transitionPlanningLegalWorkflow(prisma, actors[1], { entityType: "PPA", entityId: plan.id, stage: "SUBMITTED" });
      await assert.rejects(
        () => transitionPlanningLegalWorkflow(prisma, actors[1], { entityType: "PPA", entityId: plan.id, stage: "APPROVED" }),
        /Segregação de funções/i,
      );
      await transitionPlanningLegalWorkflow(prisma, actors[2], { entityType: "PPA", entityId: plan.id, stage: "APPROVED" });
      await transitionPlanningLegalWorkflow(prisma, actors[3], {
        entityType: "PPA", entityId: plan.id, stage: "SANCTIONED",
        legalEvidence: { legalActNumber: `Lei ${suffix}`, legalActDate: new Date("2400-01-01T00:00:00.000Z"), legalDocumentId: documentId },
      });
      await assert.rejects(
        () => addProgramPPA(prisma, actors[0], { multiYearPlanId: plan.id, code: "BLOQUEADO", name: "Não pode incluir" }),
        /não pode ser alterado após a sanção/i,
      );
      await transitionPlanningLegalWorkflow(prisma, actors[4], {
        entityType: "PPA", entityId: plan.id, stage: "PUBLISHED",
        publication: { publicationDate: new Date("2400-01-02T00:00:00.000Z"), publicationReference: `DOM ${suffix}` },
      });

      const guideline = await createBudgetGuideline(prisma, actors[0], { financialYearId, multiYearPlanId: plan.id });
      guidelineId = guideline.id;
      for (const [index, stage] of (["SUBMITTED", "APPROVED", "SANCTIONED", "PUBLISHED"] as const).entries()) {
        await transitionPlanningLegalWorkflow(prisma, actors[index + 1], {
          entityType: "LDO", entityId: guideline.id, stage,
          ...(stage === "SANCTIONED" ? { legalEvidence: { legalActNumber: `Lei LDO ${suffix}`, legalActDate: new Date("2400-01-01T00:00:00.000Z"), legalDocumentId: documentId } } : {}),
          ...(stage === "PUBLISHED" ? { publication: { publicationDate: new Date("2400-01-02T00:00:00.000Z"), publicationReference: `DOM LDO ${suffix}` } } : {}),
        });
      }
      const loa = await createAnnualBudgetLaw(prisma, actors[0], {
        lawNumber: `LOA-LEGAL-${suffix}`, publicationDate: new Date("2400-01-02T00:00:00.000Z"), financialYearId, budgetGuidelineId: guideline.id,
        totalRevenue: 10, totalExpense: 10,
        revenueForecasts: [{ code: "1", name: "Receita", estimatedValue: 10 }],
        expenseFixations: [{ code: "3", name: "Despesa", fixedValue: 10 }],
      });
      loaId = loa.id;
      for (const [index, stage] of (["SUBMITTED", "APPROVED", "SANCTIONED", "PUBLISHED"] as const).entries()) {
        await transitionPlanningLegalWorkflow(prisma, actors[index + 1], {
          entityType: "LOA", entityId: loa.id, stage,
          ...(stage === "SANCTIONED" ? { legalEvidence: { legalActNumber: `Lei LOA ${suffix}`, legalActDate: new Date("2400-01-01T00:00:00.000Z"), legalDocumentId: documentId } } : {}),
          ...(stage === "PUBLISHED" ? { publication: { publicationDate: new Date("2400-01-02T00:00:00.000Z"), publicationReference: `DOM LOA ${suffix}` } } : {}),
        });
      }
      assert.equal((await prisma.annualBudgetLaw.findUniqueOrThrow({ where: { id: loa.id } })).status, "PUBLISHED");
    } finally {
      if (loaId) await prisma.annualBudgetLaw.delete({ where: { id: loaId } });
      if (guidelineId) await prisma.budgetGuideline.delete({ where: { id: guidelineId } });
      if (planId) await prisma.multiYearPlan.delete({ where: { id: planId } });
      if (financialYearId) await prisma.financialYear.delete({ where: { id: financialYearId } });
      if (documentId) {
        await prisma.documentVersion.deleteMany({ where: { documentId } });
        await prisma.document.delete({ where: { id: documentId } });
      }
    }
  });
});
