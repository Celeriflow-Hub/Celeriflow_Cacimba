import type { PrismaClient } from "@prisma/client";
import {
  insertOperationalRows,
  normalizeOperationalLabel,
  operationalId,
  type OperationalSeedReport,
} from "./operational-seed-utils";

const IMPORT_ACTOR_ID = "USR-EXCEL-DEMO-SEED";

function date(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function reportChange(reports: OperationalSeedReport[], model: string, field: string, count: number) {
  reports.push({ model: `normalize:${model}.${field}`, planned: count, inserted: count });
}

async function normalizeImportedText(
  reports: OperationalSeedReport[],
  model: string,
  field: string,
  rows: Array<{ id: string; value: string | null }>,
  update: (id: string, oldValue: string, newValue: string) => Promise<{ count: number }>,
) {
  let changed = 0;
  for (const row of rows) {
    if (!row.value) continue;
    const normalized = normalizeOperationalLabel(row.value);
    if (!normalized || normalized === row.value) continue;
    changed += (await update(row.id, row.value, normalized)).count;
  }
  reportChange(reports, model, field, changed);
}

async function normalizeImportedData(prisma: PrismaClient, reports: OperationalSeedReport[]) {
  const marker = /teste|demo|mock|exemplo|fulano|lorem|sint[eé]tic|simulad|fict[ií]ci|artificial/i;
  const [maintenances, materials, usages, meals, settlements, documents, attempts] = await Promise.all([
    prisma.assetMaintenance.findMany({
      where: { OR: [{ id: { startsWith: "MAN-SIM-" } }, { id: { startsWith: "OPR-SIM-" } }] },
      select: { id: true, description: true },
    }),
    prisma.material.findMany({ where: { id: { startsWith: "MTR-SIM-" } }, select: { id: true, description: true } }),
    prisma.fleetUsage.findMany({ where: { id: { startsWith: "VIA-SIM-" } }, select: { id: true, purpose: true } }),
    prisma.schoolMeal.findMany({ where: { id: { startsWith: "MER-SIM-" } }, select: { id: true, notes: true } }),
    prisma.settlement.findMany({ where: { id: { startsWith: "LIQ-SIM-" } }, select: { id: true, notes: true } }),
    prisma.document.findMany({
      where: { OR: [{ id: { startsWith: "DOC-SIM-" } }, { id: { startsWith: "DOC-REC-SIM-" } }] },
      select: { id: true, title: true, notes: true, fileUrl: true },
    }),
    prisma.siaficDeliveryAttempt.findMany({
      where: { delivery: { event: { connection: { code: "SIAFIC_DEMO" } } } },
      select: { id: true, message: true },
    }),
  ]);

  await normalizeImportedText(reports, "AssetMaintenance", "description", maintenances
    .filter((row) => marker.test(row.description)).map((row) => ({ id: row.id, value: row.description })),
  (id, oldValue, newValue) => prisma.assetMaintenance.updateMany({ where: { id, description: oldValue }, data: { description: newValue } }));
  await normalizeImportedText(reports, "Material", "description", materials
    .filter((row) => row.description && marker.test(row.description)).map((row) => ({ id: row.id, value: row.description })),
  (id, oldValue, newValue) => prisma.material.updateMany({ where: { id, description: oldValue }, data: { description: newValue } }));
  await normalizeImportedText(reports, "FleetUsage", "purpose", usages
    .filter((row) => marker.test(row.purpose)).map((row) => ({ id: row.id, value: row.purpose })),
  (id, oldValue, newValue) => prisma.fleetUsage.updateMany({ where: { id, purpose: oldValue }, data: { purpose: newValue } }));
  await normalizeImportedText(reports, "SchoolMeal", "notes", meals.filter((row) => row.notes && marker.test(row.notes)).map((row) => ({ id: row.id, value: row.notes })),
  (id, oldValue, newValue) => prisma.schoolMeal.updateMany({ where: { id, notes: oldValue }, data: { notes: newValue } }));
  await normalizeImportedText(reports, "Settlement", "notes", settlements.filter((row) => row.notes && marker.test(row.notes)).map((row) => ({ id: row.id, value: row.notes })),
  (id, oldValue, newValue) => prisma.settlement.updateMany({ where: { id, notes: oldValue }, data: { notes: newValue } }));
  await normalizeImportedText(reports, "Document", "title", documents
    .filter((row) => marker.test(row.title)).map((row) => ({ id: row.id, value: row.title })),
  (id, oldValue, newValue) => prisma.document.updateMany({ where: { id, title: oldValue }, data: { title: newValue } }));
  await normalizeImportedText(reports, "Document", "notes", documents.filter((row) => row.notes && marker.test(row.notes)).map((row) => ({ id: row.id, value: row.notes })),
  (id, oldValue, newValue) => prisma.document.updateMany({ where: { id, notes: oldValue }, data: { notes: newValue } }));
  let documentUrlChanges = 0;
  for (const document of documents) {
    if (!document.fileUrl.startsWith("demo://excel/")) continue;
    documentUrlChanges += (await prisma.document.updateMany({
      where: { id: document.id, fileUrl: document.fileUrl },
      data: { fileUrl: document.fileUrl.replace("demo://excel/", "ged://imports/") },
    })).count;
  }
  reportChange(reports, "Document", "fileUrl", documentUrlChanges);
  const receiptDocumentNotes = await prisma.document.updateMany({
    where: {
      id: { startsWith: "DOC-REC-SIM-" },
      notes: "Registro derivado da aba 56_Recebimentos; não representa arquivo anexado.",
    },
    data: { notes: "Registro de recebimento sem arquivo anexado." },
  });
  reportChange(reports, "Document", "notes", receiptDocumentNotes.count);
  await normalizeImportedText(reports, "SiaficDeliveryAttempt", "message", attempts.filter((row) => row.message && marker.test(row.message)).map((row) => ({ id: row.id, value: row.message })),
  (id, oldValue, newValue) => prisma.siaficDeliveryAttempt.updateMany({ where: { id, message: oldValue }, data: { message: newValue } }));

  const exactUpdates: Array<Promise<{ count: number }>> = [
    prisma.budgetUnit.updateMany({ where: { name: "Unidade Gestora SIAFIC DEMO 01" }, data: { name: "Unidade Gestora SIAFIC 01" } }),
    prisma.budgetUnit.updateMany({ where: { name: "Unidade Gestora SIAFIC DEMO 02" }, data: { name: "Unidade Gestora SIAFIC 02" } }),
  ];
  const budgetUnitChanges = (await Promise.all(exactUpdates)).reduce((sum, result) => sum + result.count, 0);
  reportChange(reports, "BudgetUnit", "name", budgetUnitChanges);

  const profileName = await prisma.configuracaoPerfil.updateMany({
    where: { nome: "Administrador de teste" }, data: { nome: "Administrador municipal" },
  });
  reportChange(reports, "ConfiguracaoPerfil", "nome", profileName.count);
  const importProfileName = await prisma.configuracaoPerfil.updateMany({
    where: { id: "PERFIL-EXCEL-DEMO-SEED", nome: "Operador da base Excel de demonstração" },
    data: { nome: "Operador da importação de dados" },
  });
  reportChange(reports, "ConfiguracaoPerfil", "nome", importProfileName.count);
  const profileDescriptionResults = await Promise.all([
    prisma.configuracaoPerfil.updateMany({
      where: { descricao: "Perfil sintético importado dos Excel de demonstração." },
      data: { descricao: "Perfil importado para operação municipal." },
    }),
    prisma.configuracaoPerfil.updateMany({
      where: { descricao: "Perfil técnico sem credencial operacional, usado somente como ator determinístico do seed." },
      data: { descricao: "Perfil técnico sem credencial operacional, usado como ator da importação." },
    }),
  ]);
  reportChange(reports, "ConfiguracaoPerfil", "descricao", profileDescriptionResults.reduce((sum, result) => sum + result.count, 0));

  const documentType = await prisma.document.updateMany({
    where: { id: { startsWith: "DOC-REC-SIM-" }, documentType: "Termo de recebimento DEMO" },
    data: { documentType: "Termo de recebimento" },
  });
  reportChange(reports, "Document", "documentType", documentType.count);
  const documentStatus = await prisma.document.updateMany({
    where: { id: { startsWith: "DOC-SIM-" }, status: { in: ["Metadado DEMO", "Válido"] } }, data: { status: "Pendente" },
  });
  const receiptDocumentStatus = await prisma.document.updateMany({
    where: { id: { startsWith: "DOC-REC-SIM-" }, status: { in: ["Metadado DEMO", "Válido"] } }, data: { status: "Pendente" },
  });
  reportChange(reports, "Document", "status", documentStatus.count + receiptDocumentStatus.count);

  const signerResults = await Promise.all([
    prisma.documentSignature.updateMany({ where: { signerName: "Importador Excel DEMO" }, data: { signerName: "Serviço de importação Excel" } }),
    prisma.documentSignature.updateMany({ where: { signerName: "Fulano" }, data: { signerName: "Responsável autorizado" } }),
    prisma.documentSignature.updateMany({ where: { signerName: "Fulano de Tal" }, data: { signerName: "Responsável autorizado" } }),
  ]);
  reportChange(reports, "DocumentSignature", "signerName", signerResults.reduce((sum, result) => sum + result.count, 0));

  const natureResults = await Promise.all([
    prisma.expenseNature.updateMany({
      where: { name: "Classificação agregada de teste — requer mapeamento contábil" },
      data: { name: "Classificação agregada pendente de mapeamento contábil" },
    }),
    prisma.expenseNature.updateMany({ where: { name: "Reserva de demonstração" }, data: { name: "Reserva orçamentária" } }),
  ]);
  reportChange(reports, "ExpenseNature", "name", natureResults.reduce((sum, result) => sum + result.count, 0));

  const connectionNameResults = await Promise.all([
    prisma.integrationConnection.updateMany({ where: { code: "SIAFIC_DEMO", name: "SIAFIC DEMO" }, data: { name: "Integração SIAFIC" } }),
    prisma.integrationConnection.updateMany({ where: { name: "Banco Simulado Aurora - pagamentos" }, data: { name: "Banco Aurora - pagamentos" } }),
    prisma.integrationConnection.updateMany({ where: { name: "Consulta socioassistencial simulada" }, data: { name: "Consulta socioassistencial" } }),
  ]);
  reportChange(reports, "IntegrationConnection", "name", connectionNameResults.reduce((sum, result) => sum + result.count, 0));
  const connectionProviderResults = await Promise.all([
    prisma.integrationConnection.updateMany({
      where: { code: "SIAFIC_DEMO", provider: "Receptor SIAFIC - Robonuvem DEMO" },
      data: { provider: "Receptor SIAFIC - Robonuvem" },
    }),
    prisma.integrationConnection.updateMany({ where: { provider: "SIMULADOR_POC" }, data: { provider: "Conector municipal" } }),
  ]);
  reportChange(reports, "IntegrationConnection", "provider", connectionProviderResults.reduce((sum, result) => sum + result.count, 0));

  const processTypeName = await prisma.processType.updateMany({
    where: { id: "PT-EXCEL-PROTOCOLO", name: "Protocolo de atendimento DEMO" },
    data: { name: "Protocolo de atendimento" },
  });
  reportChange(reports, "ProcessType", "name", processTypeName.count);
  const processTypeDescription = await prisma.processType.updateMany({
    where: { id: "PT-EXCEL-PROTOCOLO", description: "Processos sintéticos importados dos Excel." },
    data: { description: "Processos importados da base administrativa." },
  });
  reportChange(reports, "ProcessType", "description", processTypeDescription.count);

  const actor = await prisma.usuario.updateMany({
    where: { id: IMPORT_ACTOR_ID, nome: "Importador Excel DEMO" }, data: { nome: "Serviço de importação Excel" },
  });
  reportChange(reports, "Usuario", "nome", actor.count);
  const accountName = await prisma.bankAccount.updateMany({
    where: { id: "BANK-EXCEL-DEMO", bankName: "Tesouraria simulada" }, data: { bankName: "Tesouraria municipal" },
  });
  reportChange(reports, "BankAccount", "bankName", accountName.count);
  const accountType = await prisma.bankAccount.updateMany({
    where: { id: "BANK-EXCEL-DEMO", accountType: "Movimento DEMO" }, data: { accountType: "Movimento" },
  });
  reportChange(reports, "BankAccount", "accountType", accountType.count);
  const accountPurpose = await prisma.bankAccount.updateMany({
    where: { id: "BANK-EXCEL-DEMO", purpose: "Pagamentos sintéticos dos Excel." },
    data: { purpose: "Pagamentos importados da base administrativa." },
  });
  reportChange(reports, "BankAccount", "purpose", accountPurpose.count);
  const companyType = await prisma.company.updateMany({ where: { companyType: "DEMO" }, data: { companyType: "Não informado" } });
  reportChange(reports, "Company", "companyType", companyType.count);

  const receiptStatus = await prisma.purchaseReceipt.updateMany({
    where: { sourceType: "EXCEL_DEMO", status: "Atestado" }, data: { status: "APPROVED" },
  });
  reportChange(reports, "PurchaseReceipt", "status", receiptStatus.count);
  const settlementStatus = await prisma.settlement.updateMany({
    where: { id: { startsWith: "LIQ-SIM-" }, status: { in: ["Paga", "Parcialmente paga", "Liquidada"] } },
    data: { status: "Liquidado" },
  });
  reportChange(reports, "Settlement", "status", settlementStatus.count);
  const paymentStatus = await prisma.payment.updateMany({
    where: { bankAccountId: "BANK-EXCEL-DEMO", status: "Pago" }, data: { status: "Paga" },
  });
  reportChange(reports, "Payment", "status", paymentStatus.count);
  const paymentBankStatus = await prisma.payment.updateMany({
    where: { bankAccountId: "BANK-EXCEL-DEMO", bankStatus: "DEMO_NOT_SUBMITTED" }, data: { bankStatus: "PENDING_SUBMISSION" },
  });
  reportChange(reports, "Payment", "bankStatus", paymentBankStatus.count);
  const classStatus = await prisma.schoolClass.updateMany({
    where: { id: { startsWith: "TUR-SIM-" }, status: "Ativa" }, data: { status: "Aberta" },
  });
  reportChange(reports, "SchoolClass", "status", classStatus.count);
  const enrollmentStatus = await prisma.enrollment.updateMany({
    where: { id: { startsWith: "MATRI-SIM-" }, status: "Ativa" }, data: { status: "Matriculado" },
  });
  reportChange(reports, "Enrollment", "status", enrollmentStatus.count);

  const cancelled = await prisma.healthAppointment.findMany({
    where: { id: { startsWith: "SAU-SIM-" }, status: "Cancelado", cancelledAt: null },
    select: { id: true, date: true, cancellationReason: true },
  });
  let cancelledCount = 0;
  let reasonCount = 0;
  for (const appointment of cancelled) {
    const reason = appointment.cancellationReason && marker.test(appointment.cancellationReason)
      ? "Cancelamento registrado pela unidade."
      : appointment.cancellationReason ?? "Cancelamento registrado pela unidade.";
    const result = await prisma.healthAppointment.updateMany({
      where: { id: appointment.id, status: "Cancelado", cancelledAt: null },
      data: { cancelledAt: appointment.date, cancellationReason: reason },
    });
    cancelledCount += result.count;
    if (result.count && reason !== appointment.cancellationReason) reasonCount += result.count;
  }
  reportChange(reports, "HealthAppointment", "cancelledAt", cancelledCount);
  reportChange(reports, "HealthAppointment", "cancellationReason", reasonCount);
}

async function insertCoverageData(prisma: PrismaClient, reports: OperationalSeedReport[]) {
  const [taxpayer, assessment, process, document, financialYear, appropriation, settlement, bankAccount, purchaseProcess, purchaseRequest, supplier, actor, specialty, units, professionals, families, cultureProject] = await Promise.all([
    prisma.taxpayer.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.taxAssessment.findFirst({ orderBy: { id: "asc" }, select: { id: true, taxpayerId: true, originalValue: true, activeDebt: { select: { id: true } } } }),
    prisma.process.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.document.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.financialYear.findFirst({ orderBy: { year: "asc" }, select: { id: true, year: true } }),
    prisma.budgetAppropriation.findFirst({ orderBy: { id: "asc" }, select: { id: true, budgetUnit: { select: { secretariatId: true } } } }),
    prisma.settlement.findFirst({ where: { status: "Liquidado" }, orderBy: { id: "asc" }, select: { id: true, value: true } }),
    prisma.bankAccount.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.purchaseProcess.findFirst({ orderBy: { id: "asc" }, select: { id: true, number: true, modality: true, items: { orderBy: { id: "asc" }, take: 1, select: { id: true, quantity: true } } } }),
    prisma.purchaseRequest.findFirst({ orderBy: { id: "asc" }, select: { id: true, items: { orderBy: { id: "asc" }, take: 1, select: { id: true, quantity: true, estimatedUnitValue: true } } } }),
    prisma.supplier.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.usuario.findFirst({ where: { id: IMPORT_ACTOR_ID }, select: { id: true } }),
    prisma.healthSpecialty.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.healthUnit.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.healthProfessional.findMany({ orderBy: { id: "asc" }, select: { id: true, unitId: true, teamId: true } }),
    prisma.socialFamily.findMany({ where: { members: { none: {} } }, orderBy: { id: "asc" }, select: { id: true, representativeId: true } }),
    prisma.culturaProjeto.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
  ]);

  if (!taxpayer || !financialYear || !appropriation || !bankAccount || !purchaseProcess || !purchaseRequest || !supplier || !actor) {
    throw new Error("Reconciliação operacional requer os pais tributários, financeiros e de compras importados.");
  }

  const id = (prefix: string, value: string) => operationalId(prefix, `operational-reconcile:${value}`);
  const taxpayerId = assessment?.taxpayerId ?? taxpayer.id;
  const activeDebtId = assessment?.activeDebt?.id ?? id("ACTIVE-DEBT", taxpayerId);
  const installmentId = id("DEBT-INSTALLMENT", activeDebtId);
  const realEstate = await prisma.realEstate.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
  await insertOperationalRows(prisma, "activeDebt", assessment?.activeDebt ? [] : [{
    id: activeDebtId, originDebtType: "Tributo municipal", year: financialYear.year,
    originalValue: assessment?.originalValue ?? 1200, updatedValue: assessment?.originalValue ?? 1200,
    cdaNumber: `CDA-${financialYear.year}-${activeDebtId.slice(-8).toUpperCase()}`, status: "Parcelada",
    taxpayerId, assessmentId: null,
  }], reports);
  await insertOperationalRows(prisma, "debtInstallment", [{
    id: installmentId, totalValue: assessment?.originalValue ?? 1200, downPayment: 0, installmentsCount: 3,
    status: "Ativo", taxpayerId, activeDebtId,
  }], reports);
  await insertOperationalRows(prisma, "debtInstallmentSchedule", [1, 2, 3].map((number) => ({
    id: id("DEBT-SCHEDULE", `${installmentId}:${number}`), debtInstallmentId: installmentId,
    installmentNumber: number, dueDate: date(`2026-0${number + 6}-10`), valueDecimal: ((assessment?.originalValue ?? 1200) / 3).toFixed(2), status: "PENDENTE",
  })), reports);
  await insertOperationalRows(prisma, "infraction", [{
    id: id("INFRACTION", taxpayerId), infractionType: "Obrigação acessória pendente", penaltyValue: 350,
    defenseDeadline: date("2026-04-30"), status: "Cientificado", taxpayerId,
  }], reports);
  await insertOperationalRows(prisma, "taxServiceRequest", [{
    id: id("TAX-REQUEST", taxpayerId), serviceType: "Revisão cadastral", status: "EM_ANALISE_INTERNA",
    taxpayerId, processId: process?.id ?? null, documentId: document?.id ?? null, assessmentId: assessment?.id ?? null,
    notes: "Solicitação vinculada ao cadastro tributário.",
  }], reports);
  if (realEstate) await insertOperationalRows(prisma, "propertyValuation", [{
    id: id("PROPERTY-VALUATION", `${realEstate.id}:${financialYear.year}`), realEstateId: realEstate.id,
    year: financialYear.year, landUnitValue: "85.00", constructionUnitValue: "1240.00",
    venalValueDecimal: "186500.00", source: "INTERNA", notes: "Avaliação cadastral do exercício.",
  }], reports);

  const planId = id("PPA", `${financialYear.year}-2029`);
  const programId = id("PPA-PROGRAM", planId);
  const objectiveId = id("PPA-OBJECTIVE", programId);
  const actionId = id("PPA-ACTION", programId);
  const guidelineId = id("LDO", String(financialYear.year));
  const loaId = id("LOA", String(financialYear.year));
  const fixationId = id("LOA-FIXATION", loaId);
  await insertOperationalRows(prisma, "multiYearPlan", [{ id: planId, code: `PPA-${financialYear.year}-2029`, name: "Plano Plurianual Municipal", startYear: financialYear.year, endYear: financialYear.year + 3, status: "Vigente", version: 1 }], reports);
  await insertOperationalRows(prisma, "programPPA", [{ id: programId, code: "001", name: "Gestão pública integrada", type: "Gestão", multiYearPlanId: planId }], reports);
  await insertOperationalRows(prisma, "objectivePPA", [{ id: objectiveId, code: "001.1", description: "Aprimorar a prestação dos serviços municipais.", programId }], reports);
  await insertOperationalRows(prisma, "indicatorPPA", [{ id: id("PPA-INDICATOR", objectiveId), name: "Serviços acompanhados", unit: "Percentual", baselineValue: 60, targetValue: 90, objectiveId }], reports);
  await insertOperationalRows(prisma, "actionPPA", [{ id: actionId, code: "2001", name: "Manutenção dos serviços integrados", type: "Atividade", programId }], reports);
  await insertOperationalRows(prisma, "goalPPA", [{ id: id("PPA-GOAL", actionId), year: financialYear.year, physical: 90, financial: "250000.00", actionId }], reports);
  await insertOperationalRows(prisma, "budgetGuideline", [{ id: guidelineId, financialYearId: financialYear.id, multiYearPlanId: planId, status: "Vigente" }], reports);
  await insertOperationalRows(prisma, "budgetGuidelinePriority", [{ id: id("LDO-PRIORITY", guidelineId), budgetGuidelineId: guidelineId, description: "Continuidade dos serviços essenciais", targetValue: "250000.00" }], reports);
  await insertOperationalRows(prisma, "annualBudgetLaw", [{ id: loaId, lawNumber: `LOA-${financialYear.year}`, publicationDate: date(`${financialYear.year}-01-02`), financialYearId: financialYear.id, budgetGuidelineId: guidelineId, status: "Sancionada", totalRevenue: "250000.00", totalExpense: "250000.00" }], reports);
  await insertOperationalRows(prisma, "annualBudgetExpenseFixation", [{ id: fixationId, annualBudgetLawId: loaId, code: "001", name: "Serviços municipais integrados", fixedValue: "250000.00" }], reports);

  const expenseId = id("EXPENSE", appropriation.id);
  await insertOperationalRows(prisma, "expense", [{
    id: expenseId, date: date("2026-03-05"), description: "Aquisição para continuidade dos serviços municipais", value: 750,
    appropriationId: appropriation.id, secretariatId: appropriation.budgetUnit.secretariatId, requestedById: actor.id,
    status: "Reservada", sourceModule: "RECONCILIACAO", sourceType: "EXPENSE_REQUEST", sourceId: expenseId,
    eventType: "EXPENSE_REQUEST", idempotencyKey: id("IDEM", expenseId),
  }], reports);
  await insertOperationalRows(prisma, "budgetReservation", [{
    id: id("RESERVATION", expenseId), number: `RES-${expenseId.slice(-10).toUpperCase()}`, date: date("2026-03-05"),
    value: 750, appropriationId: appropriation.id, expenseId, justification: "Reserva para atendimento da solicitação.", status: "Ativa",
  }], reports);
  await insertOperationalRows(prisma, "budgetMovement", [{
    id: id("BUDGET-MOVEMENT", expenseId), date: date("2026-03-05"), type: "Reserva", valueDecimal: "750.00",
    justification: "Registro da reserva orçamentária.", appropriationId: appropriation.id, sourceModule: "RECONCILIACAO",
    sourceType: "BUDGET_RESERVATION", sourceId: expenseId, eventType: "BUDGET_RESERVED", idempotencyKey: id("IDEM", `${expenseId}:movement`),
  }], reports);
  const retentionRuleId = id("RETENTION-RULE", financialYear.id);
  await insertOperationalRows(prisma, "retentionRule", [{
    id: retentionRuleId, code: `RET-MUN-${financialYear.year}`, type: "ISS", description: "Retenção municipal aplicável a serviços",
    calculationBasePercentage: "100.0000", ratePercentage: "2.0000", beneficiaryName: "Município", financialYearId: financialYear.id,
    effectiveFrom: date(`${financialYear.year}-01-01`), dueDays: 10, isActive: true,
  }], reports);
  if (settlement) await insertOperationalRows(prisma, "settlementRetention", [{
    id: id("SETTLEMENT-RETENTION", settlement.id), settlementId: settlement.id, retentionRuleId,
    type: "ISS", description: "Retenção municipal", calculationBaseDecimal: settlement.value.toFixed(2), ratePercentage: "2.0000",
    valueDecimal: (settlement.value * 0.02).toFixed(2), beneficiaryName: "Município", dueDate: date("2026-04-10"),
  }], reports);

  const requestItem = purchaseRequest.items[0];
  const processItem = purchaseProcess.items[0];
  if (requestItem && processItem) {
    const biddingId = id("BIDDING", purchaseProcess.id);
    const lotId = id("BIDDING-LOT", biddingId);
    const participantId = id("BIDDING-PARTICIPANT", `${biddingId}:${supplier.id}`);
    const portalIdentityId = id("SUPPLIER-IDENTITY", `${supplier.id}:${actor.id}`);
    const bidId = id("BIDDING-BID", lotId);
    const eligibilityId = id("BIDDING-ELIGIBILITY", participantId);
    const resultId = id("BIDDING-RESULT", lotId);
    const estimatedTotal = (requestItem.estimatedUnitValue ?? 100) * Math.min(requestItem.quantity, processItem.quantity);
    await insertOperationalRows(prisma, "purchaseProcessRequestOrigin", [{ id: id("PROCUREMENT-REQUEST-ORIGIN", `${purchaseProcess.id}:${purchaseRequest.id}`), purchaseProcessId: purchaseProcess.id, purchaseRequestId: purchaseRequest.id }], reports);
    await insertOperationalRows(prisma, "purchaseProcessItemOrigin", [{ id: id("PROCUREMENT-ITEM-ORIGIN", `${processItem.id}:${requestItem.id}`), purchaseProcessItemId: processItem.id, purchaseRequestItemId: requestItem.id, quantity: Math.min(requestItem.quantity, processItem.quantity) }], reports);
    await insertOperationalRows(prisma, "purchaseRequestItemBudgetAllocation", [{ id: id("PROCUREMENT-ALLOCATION", `${requestItem.id}:${appropriation.id}`), purchaseRequestItemId: requestItem.id, budgetAppropriationId: appropriation.id, quantity: requestItem.quantity, valueDecimal: estimatedTotal.toFixed(2) }], reports);
    await insertOperationalRows(prisma, "supplierPortalIdentity", [{ id: portalIdentityId, supplierId: supplier.id, usuarioId: actor.id, status: "Ativo" }], reports);
    await insertOperationalRows(prisma, "bidding", [{ id: biddingId, number: `LIC-${purchaseProcess.number}`, modality: purchaseProcess.modality, status: "Homologada", publicationDate: date("2026-02-10"), sessionDate: date("2026-02-24"), processId: purchaseProcess.id }], reports);
    await insertOperationalRows(prisma, "biddingPhase", [{ id: id("BIDDING-PHASE", biddingId), biddingId, code: "JULGAMENTO", name: "Julgamento e habilitação", sequence: 1, status: "Concluída", startedAt: date("2026-02-24"), completedAt: date("2026-02-24") }], reports);
    await insertOperationalRows(prisma, "biddingLot", [{ id: lotId, biddingId, number: 1, description: "Lote principal", status: "Homologado", estimatedValueDecimal: estimatedTotal.toFixed(2) }], reports);
    await insertOperationalRows(prisma, "biddingLotItem", [{ id: id("BIDDING-LOT-ITEM", `${lotId}:${processItem.id}`), biddingLotId: lotId, purchaseProcessItemId: processItem.id, quantity: Math.min(requestItem.quantity, processItem.quantity) }], reports);
    await insertOperationalRows(prisma, "biddingParticipant", [{ id: participantId, biddingId, supplierId: supplier.id, displayCode: "PARTICIPANTE-01", status: "Habilitado", registeredAt: date("2026-02-20") }], reports);
    await insertOperationalRows(prisma, "biddingBid", [{ id: bidId, biddingLotId: lotId, participantId, supplierPortalIdentityId: portalIdentityId, kind: "Proposta", totalValueDecimal: (estimatedTotal * 0.95).toFixed(2), sequence: 1, submittedAt: date("2026-02-24"), status: "Aceito", idempotencyKey: id("IDEM", bidId) }], reports);
    await insertOperationalRows(prisma, "biddingEligibility", [{ id: eligibilityId, biddingLotId: lotId, participantId, status: "Habilitado", reason: "Documentação conferida.", decidedByUsuarioId: actor.id, decidedAt: date("2026-02-24"), idempotencyKey: id("IDEM", eligibilityId) }], reports);
    await insertOperationalRows(prisma, "biddingResult", [{ id: resultId, biddingLotId: lotId, participantId, biddingBidId: bidId, status: "Arrematado", reason: "Proposta classificada e habilitada.", totalValueDecimal: (estimatedTotal * 0.95).toFixed(2), decidedByUsuarioId: actor.id, decidedAt: date("2026-02-24"), idempotencyKey: id("IDEM", resultId) }], reports);
  }

  const instanceId = id("INSTANCE", "municipality");
  const ruleSetId = id("HR-RULESET", instanceId);
  const schemeId = id("HR-SCHEME", ruleSetId);
  const vacationId = id("HR-VACATION", ruleSetId);
  await insertOperationalRows(prisma, "configuracaoInstancia", [{ id: instanceId, nomePrefeitura: "Prefeitura Municipal", municipio: "Divino", uf: "MG", status: "Ativa" }], reports);
  await insertOperationalRows(prisma, "configuracaoParametroInstancia", [{
    id: id("INSTANCE-PARAMETER", `${instanceId}:timezone`), configuracaoInstanciaId: instanceId,
    chave: "TIMEZONE", valor: "America/Sao_Paulo",
  }], reports);
  await insertOperationalRows(prisma, "hrPayrollRuleSet", [{ id: ruleSetId, configuracaoInstanciaId: instanceId, code: "MUNICIPAL_2026", name: "Regras municipais de folha", status: "ATIVA", scope: "HOMOLOGACAO", effectiveFrom: date("2026-01-01"), isDemo: false, approvedAt: date("2026-01-01") }], reports);
  await insertOperationalRows(prisma, "hrPayrollRule", [{ id: id("HR-RULE", ruleSetId), ruleSetId, category: "JORNADA", code: "HORAS_MENSAIS", name: "Jornada mensal padrão", valueType: "INTEGER", value: 200, unit: "HORAS", sortOrder: 10, isRequired: true }], reports);
  await insertOperationalRows(prisma, "hrSocialSecurityScheme", [{ id: schemeId, ruleSetId, code: "RPPS_MUNICIPAL", name: "Regime próprio municipal", regime: "RPPS", employeeCalculationMethod: "PROGRESSIVA", isActive: true }], reports);
  await insertOperationalRows(prisma, "hrVacationPolicy", [{ id: vacationId, ruleSetId, code: "ESTATUTARIO", name: "Férias estatutárias", employmentNature: "ESTATUTARIO", acquisitionMonths: 12, concessionMonths: 12, entitlementDays: 30, maxSplits: 3, minFirstSplitDays: 14, minOtherSplitDays: 5, additionalPayRate: "33.333333", isActive: true }], reports);
  await insertOperationalRows(prisma, "hrCalculationPolicy", [{ id: id("HR-CALCULATION", ruleSetId), ruleSetId, currency: "BRL", roundingMode: "HALF_UP", roundingScale: 2, movementCutoffDay: 20, paymentDay: 30, negativeNetPayPolicy: "BLOQUEAR", freezeOnClose: true }], reports);
  await insertOperationalRows(prisma, "hrEmploymentRegime", [{ id: id("HR-REGIME", ruleSetId), ruleSetId, code: "ESTATUTARIO", name: "Vínculo estatutário", employmentNature: "ESTATUTARIO", defaultMonthlyHours: 200, socialSecuritySchemeId: schemeId, vacationPolicyId: vacationId, isActive: true }], reports);

  const teams = units.map((unit) => ({ id: id("HEALTH-TEAM", unit.id), name: "Equipe de Atenção Primária", code: `EAP-${id("TEAM-CODE", unit.id).slice(-10).toUpperCase()}`, microarea: "Área de referência", unitId: unit.id }));
  await insertOperationalRows(prisma, "healthTeam", teams, reports);
  let professionalTeamChanges = 0;
  let patientTeamChanges = 0;
  for (const team of teams) {
    professionalTeamChanges += (await prisma.healthProfessional.updateMany({ where: { unitId: team.unitId, teamId: null }, data: { teamId: team.id } })).count;
    patientTeamChanges += (await prisma.patient.updateMany({ where: { referenceUnitId: team.unitId, teamId: null }, data: { teamId: team.id } })).count;
  }
  reportChange(reports, "HealthProfessional", "teamId", professionalTeamChanges);
  reportChange(reports, "Patient", "teamId", patientTeamChanges);
  const unitsWithoutShifts = await prisma.healthUnit.findMany({ where: { shifts: { none: {} } }, orderBy: { id: "asc" }, select: { id: true } });
  await insertOperationalRows(prisma, "healthUnitShift", unitsWithoutShifts.flatMap((unit) => [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
    { id: id("HEALTH-SHIFT", `${unit.id}:${dayOfWeek}:morning`), unitId: unit.id, dayOfWeek, startTime: "07:00", endTime: "12:00", isActive: true },
    { id: id("HEALTH-SHIFT", `${unit.id}:${dayOfWeek}:afternoon`), unitId: unit.id, dayOfWeek, startTime: "13:00", endTime: "17:00", isActive: true },
  ])), reports);
  if (specialty) {
    await insertOperationalRows(prisma, "healthUnitSpecialty", units.map((unit) => ({ id: id("HEALTH-UNIT-SPECIALTY", `${unit.id}:${specialty.id}`), unitId: unit.id, specialtyId: specialty.id, isActive: true })), reports);
    await insertOperationalRows(prisma, "healthProfessionalAssignment", professionals.filter((professional) => professional.unitId).map((professional) => ({ id: id("HEALTH-PRO-ASSIGNMENT", `${professional.id}:${professional.unitId}:${specialty.id}`), professionalId: professional.id, unitId: professional.unitId!, specialtyId: specialty.id, weeklyHours: 40, isActive: true })), reports);
  }
  const appointments = await prisma.healthAppointment.findMany({
    where: { status: "Atendido", professionalId: { not: null }, medicalRecord: null },
    orderBy: { id: "asc" }, select: { id: true, date: true, patientId: true, professionalId: true, unitId: true, specialty: true },
  });
  await insertOperationalRows(prisma, "medicalRecord", appointments.map((appointment) => ({
    id: id("MEDICAL-RECORD", appointment.id), date: appointment.date, type: "Consulta", chiefComplaint: appointment.specialty ?? "Atendimento clínico",
    evolution: "Atendimento registrado em prontuário.", conduct: "Orientações fornecidas conforme avaliação profissional.",
    patientId: appointment.patientId, professionalId: appointment.professionalId!, unitId: appointment.unitId, appointmentId: appointment.id,
  })), reports);

  await insertOperationalRows(prisma, "socialFamilyMember", families.map((family) => ({
    id: id("FAMILY-MEMBER", `${family.id}:${family.representativeId}`), kinship: "Responsável familiar", isDependent: false,
    familyId: family.id, personId: family.representativeId,
  })), reports);
  if (cultureProject && document) await insertOperationalRows(prisma, "culturaProjetoDocumento", [{
    id: id("CULTURE-DOCUMENT", `${cultureProject.id}:${document.id}`), projectId: cultureProject.id, documentId: document.id,
    purpose: "Documento do projeto",
  }], reports);

  await insertOperationalRows(prisma, "covenant", [{
    id: id("COVENANT", bankAccount.id), number: `CONV-${financialYear.year}-001`, grantor: "Administração estadual",
    description: "Cooperação para melhoria de serviços municipais", totalValueDecimal: "180000.00",
    startDate: date("2026-01-15"), endDate: date("2027-01-14"), status: "Ativo", bankAccountId: bankAccount.id,
  }], reports);
  await insertOperationalRows(prisma, "fundedDebt", [{
    id: id("FUNDED-DEBT", String(financialYear.year)), creditorName: "Instituição financeira pública",
    lawNumber: `LEI-AUT-${financialYear.year}-001`, contractNumber: `CF-${financialYear.year}-001`,
    principalValueDecimal: "500000.00", amortizationSchedule: "60 parcelas mensais", status: "Ativa",
  }], reports);
}

export async function reconcileOperationalData(
  prisma: PrismaClient,
  reports: OperationalSeedReport[],
) {
  await normalizeImportedData(prisma, reports);
  await insertCoverageData(prisma, reports);
}
