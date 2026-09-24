import { Prisma, type PrismaClient } from "@prisma/client";
import { FinanceError, recordConfirmedRevenue, type FinanceActor } from "@/lib/financeiro";

type Db = PrismaClient | Prisma.TransactionClient;

export type TaxActor = FinanceActor;

export class TaxError extends Error {}

function amount(value: Prisma.Decimal | string | number, allowZero = false) {
  const decimal = new Prisma.Decimal(String(value)).toDecimalPlaces(2);
  if (!decimal.isFinite() || (allowZero ? decimal.lessThan(0) : decimal.lessThanOrEqualTo(0))) {
    throw new TaxError(allowZero ? "Informe um valor monetário válido." : "Informe um valor monetário maior que zero.");
  }
  return decimal;
}

function legacyAmount(value: Prisma.Decimal) {
  return Number(value.toString());
}

function requiredAmount(value: Prisma.Decimal | null, field: string) {
  if (!value) throw new TaxError(`O campo Decimal ${field} ainda não foi conciliado. Execute o backfill financeiro antes de continuar.`);
  return value;
}

async function audit(tx: Db, actor: TaxActor, action: string, entityType: string, entityId: string, payload: Prisma.InputJsonValue) {
  await tx.taxAuditLog.create({
    data: { action, entityType, entityId, payload, authorUsuarioId: actor.usuarioId, authorEmployeeId: actor.employeeId },
  });
}

async function assertAssessmentYearOpen(tx: Db, year: number) {
  const financialYear = await tx.financialYear.findUnique({ where: { year } });
  if (!financialYear) throw new TaxError(`O exercício financeiro ${year} não está configurado.`);
  if (financialYear.status !== "Aberto") throw new TaxError(`O exercício financeiro ${year} não está aberto para operação tributária.`);
  return financialYear;
}

async function nextNumber(tx: Prisma.TransactionClient, year: number, documentType: "ASSESSMENT" | "GUIDE") {
  const sequence = await tx.taxDocumentSequence.upsert({
    where: { year_documentType: { year, documentType } },
    create: { year, documentType, currentValue: 1 },
    update: { currentValue: { increment: 1 } },
  });
  return `${documentType === "GUIDE" ? "DAM" : "LAN"}-${year}-${String(sequence.currentValue).padStart(7, "0")}`;
}

export function calculateTaxAssessment(input: {
  taxableBase: Prisma.Decimal | string | number;
  rate: Prisma.Decimal | string | number;
  discount?: Prisma.Decimal | string | number;
  interest?: Prisma.Decimal | string | number;
  penalty?: Prisma.Decimal | string | number;
  correction?: Prisma.Decimal | string | number;
}) {
  const taxableBase = amount(input.taxableBase, true);
  const rate = new Prisma.Decimal(String(input.rate));
  if (!rate.isFinite() || rate.lessThan(0)) throw new TaxError("Informe uma alíquota válida.");
  const discount = amount(input.discount ?? 0, true);
  const interest = amount(input.interest ?? 0, true);
  const penalty = amount(input.penalty ?? 0, true);
  const correction = amount(input.correction ?? 0, true);
  const principal = taxableBase.mul(rate).div(100).toDecimalPlaces(2);
  const finalValue = principal.plus(interest).plus(penalty).plus(correction).minus(discount).toDecimalPlaces(2);
  if (finalValue.lessThanOrEqualTo(0)) throw new TaxError("O cálculo tributário deve resultar em valor positivo.");
  return { taxableBase, rate, principal, discount, interest, penalty, correction, finalValue };
}

export async function configureTaxFinancialMapping(
  db: PrismaClient,
  actor: TaxActor,
  input: { taxId: string; revenueNatureId: string; resourceSourceId: string; defaultBankAccountId: string; isActive?: boolean },
) {
  return db.$transaction(async (tx) => {
    const [tax, nature, source, account] = await Promise.all([
      tx.tax.findUnique({ where: { id: input.taxId }, select: { id: true } }),
      tx.revenueNature.findUnique({ where: { id: input.revenueNatureId }, select: { id: true } }),
      tx.resourceSource.findUnique({ where: { id: input.resourceSourceId }, select: { id: true } }),
      tx.bankAccount.findUnique({ where: { id: input.defaultBankAccountId }, select: { id: true, isActive: true } }),
    ]);
    if (!tax || !nature || !source || !account?.isActive) throw new TaxError("Tributo, natureza, fonte e conta bancária ativa são obrigatórios para o mapeamento.");
    const mapping = await tx.taxFinancialMapping.upsert({
      where: { taxId: input.taxId },
      create: { taxId: input.taxId, revenueNatureId: input.revenueNatureId, resourceSourceId: input.resourceSourceId, defaultBankAccountId: input.defaultBankAccountId, isActive: input.isActive ?? true },
      update: { revenueNatureId: input.revenueNatureId, resourceSourceId: input.resourceSourceId, defaultBankAccountId: input.defaultBankAccountId, isActive: input.isActive ?? true },
    });
    await audit(tx, actor, "UPSERT", "TaxFinancialMapping", mapping.id, { taxId: input.taxId, revenueNatureId: input.revenueNatureId, resourceSourceId: input.resourceSourceId, defaultBankAccountId: input.defaultBankAccountId });
    return mapping;
  });
}

export async function createTaxAssessment(
  db: PrismaClient,
  actor: TaxActor,
  input: { year: number; taxId: string; taxpayerId: string; taxableBase: Prisma.Decimal | string | number; rate: Prisma.Decimal | string | number; discount?: Prisma.Decimal | string | number; interest?: Prisma.Decimal | string | number; penalty?: Prisma.Decimal | string | number; correction?: Prisma.Decimal | string | number; competence?: Date; realEstateId?: string; economicRegistrationId?: string },
) {
  const calculation = calculateTaxAssessment(input);
  return db.$transaction(async (tx) => {
    await assertAssessmentYearOpen(tx, input.year);
    const [tax, taxpayer] = await Promise.all([
      tx.tax.findUnique({ where: { id: input.taxId }, select: { id: true, isActive: true } }),
      tx.taxpayer.findUnique({ where: { id: input.taxpayerId }, select: { id: true, status: true } }),
    ]);
    if (!tax?.isActive || taxpayer?.status !== "Ativo") throw new TaxError("Tributo ativo e contribuinte ativo são obrigatórios para o lançamento.");
    if (input.realEstateId) {
      const property = await tx.realEstate.findUnique({ where: { id: input.realEstateId }, select: { taxpayerId: true } });
      if (!property || property.taxpayerId !== input.taxpayerId) throw new TaxError("O imóvel deve pertencer ao contribuinte do lançamento.");
    }
    if (input.economicRegistrationId) {
      const registration = await tx.economicRegistration.findUnique({ where: { id: input.economicRegistrationId }, select: { taxpayerId: true, status: true } });
      if (!registration || registration.taxpayerId !== input.taxpayerId || registration.status !== "Ativo") throw new TaxError("A inscrição econômica deve estar ativa e pertencer ao contribuinte.");
    }
    const assessmentNumber = await nextNumber(tx, input.year, "ASSESSMENT");
    const assessment = await tx.taxAssessment.create({
      data: {
        year: input.year,
        assessmentNumber,
        competence: input.competence,
        originalValue: legacyAmount(calculation.principal),
        originalValueDecimal: calculation.principal,
        taxableBaseDecimal: calculation.taxableBase,
        rate: calculation.rate,
        discountValueDecimal: calculation.discount,
        interestValueDecimal: calculation.interest,
        penaltyValueDecimal: calculation.penalty,
        correctionValueDecimal: calculation.correction,
        finalValueDecimal: calculation.finalValue,
        calculationSnapshot: { taxableBase: calculation.taxableBase.toFixed(2), rate: calculation.rate.toString(), discount: calculation.discount.toFixed(2), interest: calculation.interest.toFixed(2), penalty: calculation.penalty.toFixed(2), correction: calculation.correction.toFixed(2), finalValue: calculation.finalValue.toFixed(2) },
        taxId: input.taxId,
        taxpayerId: input.taxpayerId,
        realEstateId: input.realEstateId,
        economicRegistrationId: input.economicRegistrationId,
      },
    });
    await audit(tx, actor, "CREATE", "TaxAssessment", assessment.id, { assessmentNumber, finalValue: calculation.finalValue.toFixed(2) });
    return assessment;
  });
}

export async function generateTaxGuide(
  db: PrismaClient,
  actor: TaxActor,
  input: { assessmentId: string; dueDate: Date; documentId?: string },
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "TaxAssessment" WHERE id = ${input.assessmentId} FOR UPDATE`;
    const assessment = await tx.taxAssessment.findUnique({ where: { id: input.assessmentId }, include: { guides: { where: { status: { not: "Cancelada" } } } } });
    if (!assessment || assessment.status === "Cancelado") throw new TaxError("O lançamento tributário não está disponível para geração de guia.");
    await assertAssessmentYearOpen(tx, assessment.year);
    if (input.dueDate.getFullYear() !== assessment.year) throw new TaxError("O vencimento da guia deve pertencer ao exercício do lançamento.");
    if (assessment.guides.length) throw new TaxError("O lançamento já possui guia ativa. Cancele-a formalmente antes de emitir outra.");
    if (input.documentId) {
      const document = await tx.document.findUnique({ where: { id: input.documentId }, select: { status: true } });
      if (document?.status !== "Válido") throw new TaxError("O documento GED da guia deve estar válido.");
    }
    const total = assessment.finalValueDecimal ?? requiredAmount(assessment.originalValueDecimal, "TaxAssessment.originalValueDecimal");
    const guideNumber = await nextNumber(tx, assessment.year, "GUIDE");
    const guide = await tx.taxGuide.create({
      data: { assessmentId: assessment.id, guideNumber, totalValue: legacyAmount(total), totalValueDecimal: total, dueDate: input.dueDate, documentId: input.documentId, calculationSnapshot: assessment.calculationSnapshot ?? undefined, status: "Emitida" },
    });
    await tx.taxAssessment.update({ where: { id: assessment.id }, data: { status: "Emitido" } });
    await audit(tx, actor, "CREATE", "TaxGuide", guide.id, { guideNumber, assessmentId: assessment.id, totalValue: total.toFixed(2), documentId: input.documentId ?? null });
    return guide;
  });
}

export async function confirmTaxPayment(
  db: PrismaClient,
  actor: TaxActor,
  input: { guideId: string; amountPaid: Prisma.Decimal | string | number; paymentDate: Date; paymentMethod: string; idempotencyKey: string; bankAccountId?: string; proofDocumentId?: string },
) {
  const paidAmount = amount(input.amountPaid);
  if (!input.idempotencyKey.trim()) throw new TaxError("A confirmação de pagamento exige chave de idempotência.");
  return db.$transaction(async (tx) => {
    const existing = await tx.taxPayment.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { guide: true } });
    if (existing) return existing.guide;
    await tx.$queryRaw`SELECT id FROM "TaxGuide" WHERE id = ${input.guideId} FOR UPDATE`;
    const guide = await tx.taxGuide.findUnique({ where: { id: input.guideId }, include: { assessment: { include: { tax: { include: { financialMapping: true } } } }, payments: { where: { status: "Confirmado" }, select: { amountPaidDecimal: true } } } });
    if (!guide || ["Cancelada", "Paga"].includes(guide.status)) throw new TaxError("A guia não está disponível para baixa.");
    const year = await assertAssessmentYearOpen(tx, guide.assessment.year);
    if (input.paymentDate < year.startDate || input.paymentDate > year.endDate) throw new TaxError("A data de pagamento está fora do exercício financeiro do lançamento.");
    const mapping = guide.assessment.tax.financialMapping;
    if (!mapping?.isActive) throw new TaxError("O tributo não possui mapeamento financeiro ativo.");
    const bankAccountId = input.bankAccountId ?? mapping.defaultBankAccountId;
    const account = await tx.bankAccount.findUnique({ where: { id: bankAccountId }, select: { isActive: true } });
    if (!account?.isActive) throw new TaxError("A baixa exige uma conta bancária ativa.");
    if (input.proofDocumentId) {
      const proof = await tx.document.findUnique({ where: { id: input.proofDocumentId }, select: { status: true } });
      if (proof?.status !== "Válido") throw new TaxError("O comprovante GED deve estar válido.");
    }
    const paidBefore = guide.payments.reduce((total, payment) => total.plus(requiredAmount(payment.amountPaidDecimal, "TaxPayment.amountPaidDecimal")), new Prisma.Decimal(0));
    const total = requiredAmount(guide.totalValueDecimal, "TaxGuide.totalValueDecimal");
    if (paidBefore.plus(paidAmount).greaterThan(total)) throw new TaxError("O pagamento acumulado excede o valor da guia.");
    const payment = await tx.taxPayment.create({
      data: { guideId: guide.id, amountPaid: legacyAmount(paidAmount), amountPaidDecimal: paidAmount, paymentDate: input.paymentDate, paymentMethod: input.paymentMethod.trim(), bankAccountId, proofDocumentId: input.proofDocumentId, idempotencyKey: input.idempotencyKey.trim(), sourceId: guide.id, status: "Confirmado" },
    });
    const integrationKey = `TRIBUTARIO:TAX_PAYMENT:${payment.id}:REVENUE`;
    let revenue;
    try {
      revenue = await recordConfirmedRevenue(tx, actor, {
        date: input.paymentDate,
        value: paidAmount,
        revenueNatureId: mapping.revenueNatureId,
        resourceSourceId: mapping.resourceSourceId,
        bankAccountId,
        history: `Arrecadação tributária ${guide.guideNumber ?? guide.id}`,
        sourceModule: "TRIBUTARIO",
        sourceType: "TAX_PAYMENT",
        sourceId: payment.id,
        eventType: "TAX_PAYMENT_CONFIRMED",
        idempotencyKey: integrationKey,
      });
    } catch (error) {
      if (error instanceof FinanceError) throw new TaxError(error.message);
      throw error;
    }
    await tx.taxRevenueIntegrationEvent.create({ data: { taxPaymentId: payment.id, revenueId: revenue.id, idempotencyKey: integrationKey } });
    const paidAfter = paidBefore.plus(paidAmount);
    const guideStatus = paidAfter.equals(total) ? "Paga" : "Parcial";
    await tx.taxGuide.update({ where: { id: guide.id }, data: { status: guideStatus } });
    const assessmentPayments = await tx.taxPayment.findMany({
      where: { guide: { assessmentId: guide.assessmentId }, status: "Confirmado" },
      select: { amountPaidDecimal: true },
    });
    const assessmentPaidValue = assessmentPayments.reduce((sum, current) => sum.plus(requiredAmount(current.amountPaidDecimal, "TaxPayment.amountPaidDecimal")), new Prisma.Decimal(0));
    const assessmentTotal = guide.assessment.finalValueDecimal ?? requiredAmount(guide.assessment.originalValueDecimal, "TaxAssessment.originalValueDecimal");
    const assessmentPaid = assessmentPaidValue.greaterThanOrEqualTo(assessmentTotal);
    await tx.taxAssessment.update({ where: { id: guide.assessmentId }, data: { status: assessmentPaid ? "Pago" : "Parcial" } });
    if (!revenue.treasuryMovement) throw new TaxError("A integração financeira não gerou movimento de tesouraria.");
    await audit(tx, actor, "CONFIRM_PAYMENT", "TaxPayment", payment.id, { guideId: guide.id, amountPaid: paidAmount.toFixed(2), revenueId: revenue.id, treasuryMovementId: revenue.treasuryMovement.id, proofDocumentId: input.proofDocumentId ?? null });
    return tx.taxGuide.findUniqueOrThrow({ where: { id: guide.id } });
  });
}

export async function cancelTaxGuide(db: PrismaClient, actor: TaxActor, guideId: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "TaxGuide" WHERE id = ${guideId} FOR UPDATE`;
    const guide = await tx.taxGuide.findUnique({ where: { id: guideId }, include: { assessment: true, payments: { where: { status: "Confirmado" }, select: { id: true } } } });
    if (!guide) throw new TaxError("Guia não encontrada.");
    await assertAssessmentYearOpen(tx, guide.assessment.year);
    if (guide.status === "Cancelada") throw new TaxError("A guia já está cancelada.");
    if (guide.payments.length) throw new TaxError("Guia com pagamento confirmado exige estorno, não cancelamento.");
    const cancelled = await tx.taxGuide.update({ where: { id: guide.id }, data: { status: "Cancelada" } });
    await tx.taxAssessment.update({ where: { id: guide.assessmentId }, data: { status: "Lançado" } });
    await audit(tx, actor, "CANCEL", "TaxGuide", guide.id, { assessmentId: guide.assessmentId });
    return cancelled;
  });
}

export async function configureTaxParameter(
  db: PrismaClient,
  actor: TaxActor,
  input: { taxId: string; code: string; name: string; calculationType: string; configuration: Prisma.InputJsonValue; effectiveFrom: Date; effectiveUntil?: Date; isActive?: boolean },
) {
  if (!input.code.trim() || !input.name.trim() || !input.calculationType.trim()) throw new TaxError("Codigo, nome e tipo de calculo sao obrigatorios.");
  if (input.effectiveUntil && input.effectiveUntil < input.effectiveFrom) throw new TaxError("A vigencia final nao pode ser anterior a inicial.");
  return db.$transaction(async (tx) => {
    const tax = await tx.tax.findUnique({ where: { id: input.taxId }, select: { id: true, isActive: true } });
    if (!tax?.isActive) throw new TaxError("Selecione um tributo ativo para parametrizacao.");
    const parameter = await tx.taxParameter.create({
      data: { taxId: input.taxId, code: input.code.trim(), name: input.name.trim(), calculationType: input.calculationType.trim(), configuration: input.configuration, effectiveFrom: input.effectiveFrom, effectiveUntil: input.effectiveUntil, isActive: input.isActive ?? true },
    });
    await audit(tx, actor, "CREATE", "TaxParameter", parameter.id, { taxId: input.taxId, code: parameter.code, calculationType: parameter.calculationType, effectiveFrom: parameter.effectiveFrom.toISOString() });
    return parameter;
  });
}

export async function configureTaxServiceActivity(
  db: PrismaClient,
  actor: TaxActor,
  input: { taxId: string; code: string; name: string; issRate: Prisma.Decimal | string | number },
) {
  const issRate = new Prisma.Decimal(String(input.issRate));
  if (!issRate.isFinite() || issRate.lessThan(0)) throw new TaxError("Informe uma aliquota ISS valida.");
  return db.$transaction(async (tx) => {
    const tax = await tx.tax.findUnique({ where: { id: input.taxId }, select: { id: true, isActive: true } });
    if (!tax?.isActive) throw new TaxError("Selecione um tributo ativo para a atividade de servico.");
    const activity = await tx.taxServiceActivity.upsert({ where: { taxId_code: { taxId: input.taxId, code: input.code.trim() } }, create: { taxId: input.taxId, code: input.code.trim(), name: input.name.trim(), issRate }, update: { name: input.name.trim(), issRate, isActive: true } });
    await audit(tx, actor, "UPSERT", "TaxServiceActivity", activity.id, { taxId: input.taxId, code: activity.code, issRate: activity.issRate?.toString() ?? null });
    return activity;
  });
}

export async function createTaxServiceRequest(
  db: PrismaClient,
  actor: TaxActor,
  input: { serviceType: "ITBI" | "ALVARA" | string; taxpayerId: string; processId: string; documentId?: string; assessmentId?: string; licenseId?: string; notes?: string },
) {
  if (!input.serviceType.trim()) throw new TaxError("Informe o tipo de solicitacao tributaria.");
  return db.$transaction(async (tx) => {
    const [taxpayer, process, document, assessment, license] = await Promise.all([
      tx.taxpayer.findUnique({ where: { id: input.taxpayerId }, select: { id: true, status: true } }),
      tx.process.findUnique({ where: { id: input.processId }, select: { id: true } }),
      input.documentId ? tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, status: true } }) : null,
      input.assessmentId ? tx.taxAssessment.findUnique({ where: { id: input.assessmentId }, select: { id: true, taxpayerId: true, status: true } }) : null,
      input.licenseId ? tx.license.findUnique({ where: { id: input.licenseId }, select: { id: true, taxpayerId: true } }) : null,
    ]);
    if (taxpayer?.status !== "Ativo" || !process) throw new TaxError("Contribuinte ativo e processo do Modulo 3 sao obrigatorios.");
    if (input.documentId && document?.status !== "Válido") throw new TaxError("O documento GED vinculado deve estar valido.");
    if (assessment && assessment.taxpayerId !== input.taxpayerId) throw new TaxError("O lancamento tributario deve pertencer ao contribuinte.");
    if (license && license.taxpayerId !== input.taxpayerId) throw new TaxError("A licenca deve pertencer ao contribuinte.");
    const request = await tx.taxServiceRequest.create({ data: { serviceType: input.serviceType.trim().toUpperCase(), taxpayerId: input.taxpayerId, processId: process.id, documentId: document?.id, assessmentId: assessment?.id, licenseId: license?.id, notes: input.notes?.trim() || undefined } });
    await audit(tx, actor, "CREATE", "TaxServiceRequest", request.id, { serviceType: request.serviceType, processId: request.processId, documentId: request.documentId, assessmentId: request.assessmentId, licenseId: request.licenseId });
    return request;
  });
}

export async function recordIssDeclaration(
  db: PrismaClient,
  actor: TaxActor,
  input: { taxpayerId: string; economicRegistrationId?: string; activityId: string; competence: Date; serviceValue: Prisma.Decimal | string | number; deductionValue?: Prisma.Decimal | string | number },
) {
  const serviceValue = amount(input.serviceValue);
  const deductions = amount(input.deductionValue ?? 0, true);
  if (deductions.greaterThan(serviceValue)) throw new TaxError("Deducoes nao podem exceder o valor dos servicos.");
  return db.$transaction(async (tx) => {
    const [taxpayer, activity, registration] = await Promise.all([
      tx.taxpayer.findUnique({ where: { id: input.taxpayerId }, select: { status: true } }),
      tx.taxServiceActivity.findUnique({ where: { id: input.activityId }, include: { tax: { select: { isActive: true, name: true } } } }),
      input.economicRegistrationId ? tx.economicRegistration.findUnique({ where: { id: input.economicRegistrationId }, select: { taxpayerId: true, status: true } }) : null,
    ]);
    if (taxpayer?.status !== "Ativo" || !activity?.isActive || !activity.tax.isActive || !activity.issRate) throw new TaxError("Contribuinte, atividade e aliquota ISS ativos sao obrigatorios.");
    if (registration && (registration.taxpayerId !== input.taxpayerId || registration.status !== "Ativo")) throw new TaxError("A inscricao economica deve estar ativa e pertencer ao contribuinte.");
    const taxable = serviceValue.minus(deductions);
    const issValue = taxable.mul(activity.issRate).div(100).toDecimalPlaces(2);
    const declaration = await tx.taxDeclaration.create({ data: { taxpayerId: input.taxpayerId, economicRegistrationId: input.economicRegistrationId, activityId: input.activityId, competence: input.competence, serviceValueDecimal: serviceValue, deductionValueDecimal: deductions, issValueDecimal: issValue, calculationSnapshot: { tax: activity.tax.name, rate: activity.issRate.toString(), taxableBase: taxable.toFixed(2), issValue: issValue.toFixed(2), scope: "APURACAO_INTERNA" } } });
    await audit(tx, actor, "CREATE", "TaxDeclaration", declaration.id, { activityId: activity.id, competence: input.competence.toISOString(), serviceValue: serviceValue.toFixed(2), issValue: issValue.toFixed(2) });
    return declaration;
  });
}

export async function enrollAssessmentInActiveDebt(db: PrismaClient, actor: TaxActor, assessmentId: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "TaxAssessment" WHERE id = ${assessmentId} FOR UPDATE`;
    const assessment = await tx.taxAssessment.findUnique({ where: { id: assessmentId }, include: { tax: { select: { name: true } }, activeDebt: true } });
    if (!assessment || ["Pago", "Cancelado"].includes(assessment.status)) throw new TaxError("Somente lancamento tributario pendente pode seguir para base de divida ativa.");
    if (assessment.activeDebt) return assessment.activeDebt;
    const value = assessment.finalValueDecimal ?? requiredAmount(assessment.originalValueDecimal, "TaxAssessment.originalValueDecimal");
    const debt = await tx.activeDebt.create({ data: { taxpayerId: assessment.taxpayerId, assessmentId: assessment.id, year: assessment.year, originDebtType: assessment.tax.name, originalValue: legacyAmount(value), originalValueDecimal: value, updatedValue: legacyAmount(value), updatedValueDecimal: value, status: "PENDENTE_DE_VALIDACAO" } });
    await tx.taxAssessment.update({ where: { id: assessment.id }, data: { status: "Dívida Ativa" } });
    await audit(tx, actor, "CREATE", "ActiveDebt", debt.id, { assessmentId: assessment.id, value: value.toFixed(2), status: debt.status });
    return debt;
  });
}

export async function createDebtInstallmentPlan(
  db: PrismaClient,
  actor: TaxActor,
  input: { activeDebtId: string; installmentsCount: number; firstDueDate: Date; downPayment?: Prisma.Decimal | string | number },
) {
  if (!Number.isInteger(input.installmentsCount) || input.installmentsCount < 1) throw new TaxError("Informe ao menos uma parcela.");
  const downPayment = amount(input.downPayment ?? 0, true);
  return db.$transaction(async (tx) => {
    const debt = await tx.activeDebt.findUnique({ where: { id: input.activeDebtId } });
    if (!debt || !["Inscrita", "PENDENTE_DE_VALIDACAO", "Parcelada"].includes(debt.status)) throw new TaxError("A divida ativa nao esta disponivel para avaliacao de parcelamento.");
    const total = requiredAmount(debt.updatedValueDecimal, "ActiveDebt.updatedValueDecimal");
    if (downPayment.greaterThanOrEqualTo(total)) throw new TaxError("A entrada deve ser menor que o valor atualizado da divida.");
    const balance = total.minus(downPayment);
    const installmentValue = balance.div(input.installmentsCount).toDecimalPlaces(2);
    const adjustment = balance.minus(installmentValue.mul(input.installmentsCount));
    const plan = await tx.debtInstallment.create({ data: { taxpayerId: debt.taxpayerId, activeDebtId: debt.id, totalValue: legacyAmount(total), totalValueDecimal: total, downPayment: legacyAmount(downPayment), downPaymentDecimal: downPayment, installmentsCount: input.installmentsCount, status: "PENDENTE_DE_VALIDACAO", schedules: { create: Array.from({ length: input.installmentsCount }, (_, index) => { const dueDate = new Date(input.firstDueDate); dueDate.setUTCMonth(dueDate.getUTCMonth() + index); return { installmentNumber: index + 1, dueDate, valueDecimal: index === input.installmentsCount - 1 ? installmentValue.plus(adjustment) : installmentValue }; }) } } });
    await tx.activeDebt.update({ where: { id: debt.id }, data: { status: "Parcelada" } });
    await audit(tx, actor, "CREATE", "DebtInstallment", plan.id, { activeDebtId: debt.id, totalValue: total.toFixed(2), installmentsCount: input.installmentsCount, scope: "AVALIACAO_INTERNA" });
    return plan;
  });
}

export async function evaluateTaxCertificateSituation(db: PrismaClient, actor: TaxActor, taxpayerId: string) {
  return db.$transaction(async (tx) => {
    const [taxpayer, assessments, debts] = await Promise.all([
      tx.taxpayer.findUnique({ where: { id: taxpayerId }, select: { id: true } }),
      tx.taxAssessment.findMany({ where: { taxpayerId, status: { in: ["Lançado", "Emitido", "Parcial", "Dívida Ativa"] } }, select: { id: true, assessmentNumber: true, status: true } }),
      tx.activeDebt.findMany({ where: { taxpayerId, status: { notIn: ["Paga", "Cancelada"] } }, select: { id: true, cdaNumber: true, status: true } }),
    ]);
    if (!taxpayer) throw new TaxError("Contribuinte nao encontrado.");
    const pendingCount = assessments.length + debts.length;
    const evaluation = await tx.taxCertificateEvaluation.create({ data: { taxpayerId, result: pendingCount ? "PENDENCIAS_ENCONTRADAS" : "SEM_PENDENCIAS_IDENTIFICADAS", pendingCount, details: { assessments, activeDebts: debts, scope: "AVALIACAO_INTERNA_SEM_EMISSAO_DE_CERTIDAO" } } });
    await audit(tx, actor, "EVALUATE", "TaxCertificateEvaluation", evaluation.id, { taxpayerId, result: evaluation.result, pendingCount });
    return evaluation;
  });
}

export async function linkTaxCaseRecord(db: PrismaClient, actor: TaxActor, input: { taxpayerId: string; entityType: string; entityId: string; processId?: string; documentId?: string; purpose?: string }) {
  return db.$transaction(async (tx) => {
    if (!input.processId && !input.documentId) throw new TaxError("Vincule ao menos um Processo ou documento GED.");
    const [taxpayer, process, document] = await Promise.all([
      tx.taxpayer.findUnique({ where: { id: input.taxpayerId }, select: { id: true } }),
      input.processId ? tx.process.findUnique({ where: { id: input.processId }, select: { id: true } }) : null,
      input.documentId ? tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, status: true } }) : null,
    ]);
    if (!taxpayer || (input.processId && !process) || (input.documentId && document?.status !== "Válido")) throw new TaxError("Contribuinte, Processo e documento GED devem ser validos.");
    const link = await tx.taxCaseLink.create({ data: { taxpayerId: input.taxpayerId, entityType: input.entityType.trim(), entityId: input.entityId.trim(), processId: process?.id, documentId: document?.id, purpose: input.purpose?.trim() || undefined } });
    await audit(tx, actor, "LINK", "TaxCaseLink", link.id, { entityType: link.entityType, entityId: link.entityId, processId: link.processId, documentId: link.documentId });
    return link;
  });
}
