"use server";

import { TaxError, configureTaxFinancialMapping, configureTaxParameter, configureTaxServiceActivity, createTaxAssessment, createTaxServiceRequest, enrollAssessmentInActiveDebt, evaluateTaxCertificateSituation, generateTaxGuide, recordIssDeclaration } from "@/lib/tributacao";
import {
  approveRefundRequest,
  closeReconciliation,
  configureCollectionAgreement,
  createParametrizedAssessment,
  createPixCharge,
  createReconciliation,
  generateGroupedTaxGuides,
  generatePartialTaxGuide,
  processCollectionReturn,
  registerCreditEvent,
  resolveReconciliation,
  reviseTaxAssessment,
  sendAccountingReference,
  simulateParametrizedAssessment,
  applyTaxCredit,
} from "@/lib/tributacao/s2-service";
import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };
const message = (error: unknown) => error instanceof TaxError ? error.message : "Nao foi possivel concluir a operacao tributaria interna.";

export async function saveTaxParameter(data: { taxId: string; code: string; name: string; calculationType: string; configuration: string; effectiveFrom: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    let configuration: object;
    try { configuration = JSON.parse(data.configuration); } catch { return { error: "A configuracao deve ser um JSON valido." }; }
    await configureTaxParameter(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { ...data, configuration, effectiveFrom: new Date(data.effectiveFrom) });
    revalidatePath("/tributacao/operacoes");
    return {};
  } catch (error) { return { error: message(error) }; }
}

export async function saveTaxServiceRequest(data: { serviceType: string; taxpayerId: string; processId: string; documentId?: string; assessmentId?: string; notes?: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await createTaxServiceRequest(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidatePath("/tributacao/operacoes");
    return {};
  } catch (error) { return { error: message(error) }; }
}

export async function saveServiceActivity(data: { taxId: string; code: string; name: string; issRate: number }): Promise<ActionResult> {
  try {
    const readContext = await getTenantContextForModule("TRIBUTACAO");
    const existingActivity = await readContext.prisma.taxServiceActivity.findUnique({
      where: { taxId_code: { taxId: data.taxId, code: data.code.trim() } },
      select: { id: true },
    });
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", existingActivity ? "update" : "create");
    await configureTaxServiceActivity(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidatePath("/tributacao/operacoes");
    return {};
  } catch (error) { return { error: message(error) }; }
}

export async function saveIssDeclaration(data: { taxpayerId: string; activityId: string; competence: string; serviceValue: number; deductionValue: number }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await recordIssDeclaration(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { ...data, competence: new Date(data.competence) });
    revalidatePath("/tributacao/operacoes");
    return {};
  } catch (error) { return { error: message(error) }; }
}

export async function createAssessmentGuideAction(data: { year: number; taxId: string; taxpayerId: string; taxableBase: number; rate: number; dueDate: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const assessment = await createTaxAssessment(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    await generateTaxGuide(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { assessmentId: assessment.id, dueDate: new Date(`${data.dueDate}T12:00:00.000Z`) });
    revalidatePath("/tributacao/operacoes");
    revalidatePath("/tributacao/guias");
    revalidatePath("/tributacao");
    return {};
  } catch (error) { return { error: message(error) }; }
}

export async function enrollAssessment(assessmentId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await enrollAssessmentInActiveDebt(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, assessmentId);
    revalidatePath("/tributacao/operacoes");
    return {};
  } catch (error) { return { error: message(error) }; }
}

export async function evaluateCertificate(taxpayerId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await evaluateTaxCertificateSituation(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, taxpayerId);
    revalidatePath("/tributacao/operacoes");
    return {};
  } catch (error) { return { error: message(error) }; }
}

function refreshS2() {
  revalidatePath("/tributacao/operacoes");
  revalidatePath("/tributacao/guias");
  revalidatePath("/tributacao");
}

export async function saveFiscalRuleAction(data: {
  taxId: string; code: string; name: string; formula: "PERCENTUAL_BASE" | "VALOR_FIXO" | "UNIDADE_FISCAL";
  effectiveFrom: string; effectiveUntil?: string; rate?: number; fixedValue?: number; fiscalUnitValue?: number; fiscalUnits?: number;
  indexFactor?: number; minimumValue?: number; installments?: number; dueDay?: number; reference?: string; legalBasis?: string;
}): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    await configureTaxParameter(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, {
      taxId: data.taxId, code: data.code, name: data.name, calculationType: data.formula,
      effectiveFrom: new Date(`${data.effectiveFrom}T12:00:00.000Z`), effectiveUntil: data.effectiveUntil ? new Date(`${data.effectiveUntil}T12:00:00.000Z`) : undefined,
      configuration: { formula: data.formula, rate: data.rate, fixedValue: data.fixedValue, fiscalUnitValue: data.fiscalUnitValue, fiscalUnits: data.fiscalUnits, indexFactor: data.indexFactor ?? 1, minimumValue: data.minimumValue ?? 0, installments: data.installments ?? 1, dueDay: data.dueDay, reference: data.reference || null, legalBasis: data.legalBasis || null, version: 1, status: "ATIVA" },
    });
    refreshS2(); return {};
  } catch (error) { return { error: message(error) }; }
}

export async function simulateFiscalAction(data: { taxId: string; parameterId?: string; taxableBase: number; effectiveAt: string }) {
  try {
    const context = await getTenantContextForModule("TRIBUTACAO");
    const result = await simulateParametrizedAssessment(context.prisma, { ...data, effectiveAt: new Date(`${data.effectiveAt}T12:00:00.000Z`) });
    return { data: { principal: result.calculation.principal.toFixed(2), memory: result.calculation.memory, schedule: result.calculation.schedule.map((item) => ({ number: item.number, amount: item.amount.toFixed(2), dueDate: item.dueDate })), parameterId: result.parameter.id } };
  } catch (error) { return { error: message(error) }; }
}

export async function launchFiscalAction(data: { taxId: string; parameterId?: string; taxpayerId: string; taxableBase: number; competence: string; realEstateId?: string; economicRegistrationId?: string; originKey: string }) {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create");
    const assessment = await createParametrizedAssessment(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { ...data, competence: new Date(`${data.competence}T12:00:00.000Z`) });
    refreshS2(); return { data: { id: assessment.id, number: assessment.assessmentNumber } };
  } catch (error) { return { error: message(error) }; }
}

export async function reviseAssessmentAction(data: { assessmentId: string; taxableBase?: number; imposedValue?: number; reason: string; processId?: string; documentId?: string; idempotencyKey: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await reviseTaxAssessment(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function registerCreditEventAction(data: { assessmentId: string; eventType: "IMPUGNACAO" | "DECISAO" | "SUSPENSAO" | "EXTINCAO_NAO_FINANCEIRA" | "COMPENSACAO"; amount?: number; reason: string; processId?: string; documentId?: string; idempotencyKey: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await registerCreditEvent(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function issuePartialDamAction(data: { assessmentId: string; amount: number; dueDate: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create"); await generatePartialTaxGuide(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { ...data, dueDate: new Date(`${data.dueDate}T12:00:00.000Z`) }); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function issueGroupedDamAction(data: { assessmentIds: string[]; dueDate: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create"); await generateGroupedTaxGuides(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { ...data, dueDate: new Date(`${data.dueDate}T12:00:00.000Z`) }); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function createPixChargeAction(guideId: string): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create"); await createPixCharge(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { guideId, idempotencyKey: guideId }); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function processBankReturnAction(data: { idempotencyKey: string; guideNumber?: string; amount: number; occurredAt: string; status: "CONFIRMADO" | "INVALIDO" | "REJEITADO"; bankAccountId?: string; externalReference?: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create"); const actor = { usuarioId: context.user.id, employeeId: context.user.employeeId };
    const event = await processCollectionReturn(context.prisma, actor, { ...data, occurredAt: new Date(`${data.occurredAt}T12:00:00.000Z`) });
    if (event.status === "PROCESSADO") await sendAccountingReference(context.prisma, actor, { sourceType: "ARRECADACAO", sourceId: event.id, amount: data.amount, competence: new Date(`${data.occurredAt}T12:00:00.000Z`) });
    refreshS2(); return {};
  } catch (error) { return { error: message(error) }; }
}

export async function saveCollectionAgreementAction(data: { code: string; name: string; bankAccountId?: string; automaticRelease?: boolean; paymentUrl?: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create"); await configureCollectionAgreement(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function saveTaxFinancialMappingAction(data: { taxId: string; revenueNatureId: string; resourceSourceId: string; defaultBankAccountId: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await configureTaxFinancialMapping(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function applyTaxCreditAction(data: { creditId: string; operation: "COMPENSAR" | "TRANSFERIR" | "RESTITUIR"; amount: number; assessmentId?: string; destinationTaxpayerId?: string; reason: string; idempotencyKey: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await applyTaxCredit(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function decideRefundAction(data: { requestId: string; approved: boolean; reason: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await approveRefundRequest(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function createReconciliationAction(data: { agreementId: string; date: string; paymentTotal: number; remittanceTotal: number; reason?: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "create"); await createReconciliation(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { ...data, date: new Date(`${data.date}T12:00:00.000Z`) }); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function resolveReconciliationAction(data: { id: string; adjustment: number; reason: string }): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await resolveReconciliation(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}

export async function closeReconciliationAction(id: string): Promise<ActionResult> {
  try { const context = await getTenantContextForModuleOperation("TRIBUTACAO", "update"); await closeReconciliation(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id); refreshS2(); return {}; } catch (error) { return { error: message(error) }; }
}
