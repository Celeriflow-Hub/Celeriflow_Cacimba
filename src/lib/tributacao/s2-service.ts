import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { calculateAccountBalance, evaluateFiscalRule, parseFiscalRuleConfiguration } from "./fiscal-engine";
import { confirmTaxPayment, TaxError, type TaxActor } from "./index";

type Db = PrismaClient | Prisma.TransactionClient;

function money(value: Prisma.Decimal | string | number, label = "Valor") {
  const parsed = new Prisma.Decimal(String(value)).toDecimalPlaces(2);
  if (!parsed.isFinite() || parsed.lessThanOrEqualTo(0)) throw new TaxError(`${label} deve ser maior que zero.`);
  return parsed;
}

function jsonObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
}

async function audit(db: Db, actor: TaxActor, action: string, entityType: string, entityId: string, payload: Prisma.InputJsonValue) {
  await db.taxAuditLog.create({ data: { action, entityType, entityId, payload, authorUsuarioId: actor.usuarioId, authorEmployeeId: actor.employeeId } });
}

async function nextNumber(tx: Prisma.TransactionClient, year: number, documentType: string) {
  const sequence = await tx.taxDocumentSequence.upsert({
    where: { year_documentType: { year, documentType } },
    create: { year, documentType, currentValue: 1 },
    update: { currentValue: { increment: 1 } },
  });
  const prefix = documentType === "GUIDE" ? "DAM" : "LAN";
  return `${prefix}-${year}-${String(sequence.currentValue).padStart(7, "0")}`;
}

export async function resolveFiscalRule(db: Db, input: { taxId: string; parameterId?: string; effectiveAt: Date }) {
  const parameter = input.parameterId
    ? await db.taxParameter.findUnique({ where: { id: input.parameterId }, include: { tax: true } })
    : await db.taxParameter.findFirst({
        where: { taxId: input.taxId, isActive: true, effectiveFrom: { lte: input.effectiveAt }, OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: input.effectiveAt } }] },
        include: { tax: true }, orderBy: { effectiveFrom: "desc" },
      });
  if (!parameter || parameter.taxId !== input.taxId || !parameter.isActive) throw new TaxError("Não há regra fiscal ativa para o tributo e a vigência informados.");
  if (parameter.effectiveFrom > input.effectiveAt || (parameter.effectiveUntil && parameter.effectiveUntil < input.effectiveAt)) throw new TaxError("A regra fiscal não está vigente na competência informada.");
  return { parameter, configuration: parseFiscalRuleConfiguration(parameter.configuration) };
}

export async function simulateParametrizedAssessment(db: Db, input: { taxId: string; parameterId?: string; taxableBase: string | number; effectiveAt: Date }) {
  const { parameter, configuration } = await resolveFiscalRule(db, input);
  const calculation = evaluateFiscalRule({ taxableBase: input.taxableBase, configuration });
  return { parameter, calculation, effect: "SIMULACAO_SEM_EFEITO" as const };
}

export async function createParametrizedAssessment(
  db: PrismaClient,
  actor: TaxActor,
  input: {
    taxId: string; parameterId?: string; taxpayerId: string; taxableBase: string | number; competence: Date;
    realEstateId?: string; economicRegistrationId?: string; originKey: string;
  },
) {
  if (!input.originKey.trim()) throw new TaxError("Informe a chave de origem do lançamento.");
  const { parameter, configuration } = await resolveFiscalRule(db, { taxId: input.taxId, parameterId: input.parameterId, effectiveAt: input.competence });
  const calculation = evaluateFiscalRule({ taxableBase: input.taxableBase, configuration });
  return db.$transaction(async (tx) => {
    const existing = await tx.taxIntegrationEvent.findUnique({ where: { idempotencyKey: `ASSESSMENT:${input.originKey.trim()}` } });
    const existingId = jsonObject(existing?.result).assessmentId;
    if (typeof existingId === "string") return tx.taxAssessment.findUniqueOrThrow({ where: { id: existingId } });
    const year = input.competence.getUTCFullYear();
    const [financialYear, taxpayer, property, registration] = await Promise.all([
      tx.financialYear.findUnique({ where: { year } }),
      tx.taxpayer.findUnique({ where: { id: input.taxpayerId } }),
      input.realEstateId ? tx.realEstate.findUnique({ where: { id: input.realEstateId } }) : null,
      input.economicRegistrationId ? tx.economicRegistration.findUnique({ where: { id: input.economicRegistrationId } }) : null,
    ]);
    if (!financialYear || financialYear.status !== "Aberto") throw new TaxError(`O exercício financeiro ${year} deve estar aberto.`);
    if (!taxpayer || taxpayer.status !== "Ativo") throw new TaxError("Selecione um contribuinte ativo.");
    if (property && property.taxpayerId !== taxpayer.id) throw new TaxError("O imóvel não pertence ao contribuinte selecionado.");
    if (registration && registration.taxpayerId !== taxpayer.id) throw new TaxError("A inscrição econômica não pertence ao contribuinte selecionado.");
    const assessmentNumber = await nextNumber(tx, year, "ASSESSMENT");
    const rate = configuration.formula === "PERCENTUAL_BASE" ? new Prisma.Decimal(String(configuration.rate ?? 0)) : calculation.principal.div(new Prisma.Decimal(String(input.taxableBase || 1))).mul(100);
    const assessment = await tx.taxAssessment.create({ data: {
      year, assessmentNumber, competence: input.competence, originalValue: Number(calculation.principal), originalValueDecimal: calculation.principal,
      taxableBaseDecimal: new Prisma.Decimal(String(input.taxableBase)), rate, discountValueDecimal: 0, interestValueDecimal: 0,
      penaltyValueDecimal: 0, correctionValueDecimal: 0, finalValueDecimal: calculation.principal, status: "Lançado",
      calculationSnapshot: { ...calculation.memory, parameterId: parameter.id, parameterCode: parameter.code, effectiveFrom: parameter.effectiveFrom.toISOString(), schedule: calculation.schedule.map((item) => ({ ...item, amount: item.amount.toFixed(2) })) },
      taxId: input.taxId, taxpayerId: input.taxpayerId, realEstateId: input.realEstateId, economicRegistrationId: input.economicRegistrationId,
    } });
    await tx.taxIntegrationEvent.create({ data: {
      integrationCode: "FISCAL_ENGINE", eventType: "ASSESSMENT_CREATED", idempotencyKey: `ASSESSMENT:${input.originKey.trim()}`,
      status: "PROCESSADO", evidenceLevel: "L1", taxpayerId: input.taxpayerId,
      payload: { originKey: input.originKey.trim(), parameterId: parameter.id, taxableBase: String(input.taxableBase) },
      result: { assessmentId: assessment.id, assessmentNumber, principal: calculation.principal.toFixed(2) }, processedAt: new Date(),
    } });
    await audit(tx, actor, "CREATE_PARAMETRIZED", "TaxAssessment", assessment.id, { parameterId: parameter.id, originKey: input.originKey.trim(), principal: calculation.principal.toFixed(2) });
    return assessment;
  });
}

export async function reviseTaxAssessment(db: PrismaClient, actor: TaxActor, input: {
  assessmentId: string; taxableBase?: string | number; imposedValue?: string | number; reason: string; processId?: string; documentId?: string; idempotencyKey: string;
}) {
  if (!input.reason.trim() || !input.idempotencyKey.trim()) throw new TaxError("Motivo e chave da revisão são obrigatórios.");
  return db.$transaction(async (tx) => {
    const priorEvent = await tx.taxIntegrationEvent.findUnique({ where: { idempotencyKey: `REVISION:${input.idempotencyKey}` } });
    const priorId = jsonObject(priorEvent?.result).registryEntryId;
    if (typeof priorId === "string") return tx.taxRegistryEntry.findUniqueOrThrow({ where: { id: priorId } });
    await tx.$queryRaw`SELECT id FROM "TaxAssessment" WHERE id = ${input.assessmentId} FOR UPDATE`;
    const assessment = await tx.taxAssessment.findUnique({ where: { id: input.assessmentId } });
    if (!assessment || ["Cancelado", "Dívida Ativa"].includes(assessment.status)) throw new TaxError("O lançamento não está disponível para revisão.");
    const oldValue = assessment.finalValueDecimal ?? assessment.originalValueDecimal;
    if (!oldValue) throw new TaxError("O lançamento não possui valor decimal conciliado.");
    let newValue: Prisma.Decimal;
    let memory: Prisma.InputJsonObject;
    if (input.imposedValue !== undefined) {
      newValue = money(input.imposedValue, "Valor da decisão");
      memory = { mode: "DECISAO", imposedValue: newValue.toFixed(2) };
    } else {
      const snapshot = jsonObject(assessment.calculationSnapshot);
      const parameterId = snapshot.parameterId;
      if (typeof parameterId !== "string" || input.taxableBase === undefined) throw new TaxError("A revisão calculada exige regra fiscal e nova base.");
      const { calculation } = await simulateParametrizedAssessment(tx, { taxId: assessment.taxId, parameterId, taxableBase: input.taxableBase, effectiveAt: assessment.competence ?? new Date(Date.UTC(assessment.year, 0, 1)) });
      newValue = calculation.principal;
      memory = { mode: "MOTOR", ...calculation.memory, parameterId };
    }
    const delta = newValue.minus(oldValue).toDecimalPlaces(2);
    const version = await tx.taxRegistryEntry.count({ where: { entityType: "TAX_ASSESSMENT", entityId: assessment.id, category: "CREDIT_EVENT" } }) + 1;
    const entry = await tx.taxRegistryEntry.create({ data: {
      entityType: "TAX_ASSESSMENT", entityId: assessment.id, category: "CREDIT_EVENT", title: `Revisão ${version}`,
      data: { eventType: "REVISAO", oldValue: oldValue.toFixed(2), newValue: newValue.toFixed(2), amount: delta.toFixed(2), reason: input.reason.trim(), memory },
      status: "ATIVO", source: input.imposedValue === undefined ? "MOTOR_FISCAL" : "DECISAO", processId: input.processId, documentId: input.documentId,
      actorUsuarioId: actor.usuarioId, version,
    } });
    await tx.taxAssessment.update({ where: { id: assessment.id }, data: { finalValueDecimal: newValue, taxableBaseDecimal: input.taxableBase === undefined ? undefined : new Prisma.Decimal(String(input.taxableBase)), calculationSnapshot: { ...jsonObject(assessment.calculationSnapshot), currentVersion: version + 1, currentValue: newValue.toFixed(2), lastRevisionEntryId: entry.id }, status: "Revisado" } });
    await tx.taxIntegrationEvent.create({ data: { integrationCode: "FISCAL_ENGINE", eventType: "ASSESSMENT_REVISED", idempotencyKey: `REVISION:${input.idempotencyKey}`, status: "PROCESSADO", evidenceLevel: "L1", taxpayerId: assessment.taxpayerId, payload: { assessmentId: assessment.id }, result: { registryEntryId: entry.id, delta: delta.toFixed(2) }, processedAt: new Date() } });
    await audit(tx, actor, "REVISE", "TaxAssessment", assessment.id, { entryId: entry.id, oldValue: oldValue.toFixed(2), newValue: newValue.toFixed(2), delta: delta.toFixed(2) });
    return entry;
  });
}

export async function registerCreditEvent(db: PrismaClient, actor: TaxActor, input: {
  assessmentId: string; eventType: "IMPUGNACAO" | "DECISAO" | "SUSPENSAO" | "EXTINCAO_NAO_FINANCEIRA" | "COMPENSACAO";
  amount?: string | number; reason: string; processId?: string; documentId?: string; idempotencyKey: string;
}) {
  return db.$transaction(async (tx) => {
    const key = `CREDIT_EVENT:${input.idempotencyKey}`;
    const existing = await tx.taxIntegrationEvent.findUnique({ where: { idempotencyKey: key } });
    const existingId = jsonObject(existing?.result).registryEntryId;
    if (typeof existingId === "string") return tx.taxRegistryEntry.findUniqueOrThrow({ where: { id: existingId } });
    const assessment = await tx.taxAssessment.findUnique({ where: { id: input.assessmentId } });
    if (!assessment) throw new TaxError("Lançamento não encontrado.");
    const amountValue = input.amount === undefined ? null : money(input.amount);
    const entry = await tx.taxRegistryEntry.create({ data: {
      entityType: "TAX_ASSESSMENT", entityId: assessment.id, category: "CREDIT_EVENT", title: input.eventType.replaceAll("_", " "),
      data: { eventType: input.eventType, amount: amountValue?.toFixed(2) ?? null, reason: input.reason.trim() }, status: "ATIVO", source: "INTERNO",
      processId: input.processId, documentId: input.documentId, actorUsuarioId: actor.usuarioId,
    } });
    if (input.eventType === "SUSPENSAO") await tx.taxAssessment.update({ where: { id: assessment.id }, data: { status: "Suspenso" } });
    await tx.taxIntegrationEvent.create({ data: { integrationCode: "FISCAL_ENGINE", eventType: input.eventType, idempotencyKey: key, status: "PROCESSADO", evidenceLevel: "L1", taxpayerId: assessment.taxpayerId, payload: { assessmentId: assessment.id }, result: { registryEntryId: entry.id }, processedAt: new Date() } });
    await audit(tx, actor, input.eventType, "TaxAssessment", assessment.id, { registryEntryId: entry.id, amount: amountValue?.toFixed(2) ?? null });
    return entry;
  });
}

async function assessmentPosition(tx: Db, assessmentId: string) {
  const assessment = await tx.taxAssessment.findUnique({ where: { id: assessmentId }, include: { guides: { where: { status: { not: "Cancelada" } }, include: { payments: { where: { status: "Confirmado" } } } } } });
  if (!assessment) throw new TaxError("Lançamento não encontrado.");
  const total = assessment.finalValueDecimal ?? assessment.originalValueDecimal;
  if (!total) throw new TaxError("O lançamento não possui valor decimal conciliado.");
  const paid = assessment.guides.flatMap((guide) => guide.payments).reduce((sum, payment) => sum.plus(payment.amountPaidDecimal ?? 0), new Prisma.Decimal(0));
  const openGuides = assessment.guides.reduce<Prisma.Decimal>((sum, guide) => {
    const paidOnGuide = guide.payments.reduce((value, payment) => value.plus(payment.amountPaidDecimal ?? 0), new Prisma.Decimal(0));
    const guideTotal = guide.totalValueDecimal ?? new Prisma.Decimal(guide.totalValue);
    return sum.plus(Prisma.Decimal.max(guideTotal.minus(paidOnGuide), 0));
  }, new Prisma.Decimal(0));
  return { assessment, total, paid, balance: Prisma.Decimal.max(total.minus(paid), 0), availableForGuide: Prisma.Decimal.max(total.minus(paid).minus(openGuides), 0) };
}

export async function generatePartialTaxGuide(db: PrismaClient, actor: TaxActor, input: { assessmentId: string; amount: string | number; dueDate: Date; documentId?: string }) {
  const requested = money(input.amount, "Valor do DAM");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "TaxAssessment" WHERE id = ${input.assessmentId} FOR UPDATE`;
    const position = await assessmentPosition(tx, input.assessmentId);
    if (["Cancelado", "Pago"].includes(position.assessment.status)) throw new TaxError("O lançamento não está disponível para emissão.");
    if (requested.greaterThan(position.availableForGuide)) throw new TaxError(`O valor disponível para novos DAMs é ${position.availableForGuide.toFixed(2)}.`);
    const guideNumber = await nextNumber(tx, position.assessment.year, "GUIDE");
    const guide = await tx.taxGuide.create({ data: { assessmentId: position.assessment.id, guideNumber, totalValue: Number(requested), totalValueDecimal: requested, dueDate: input.dueDate, documentId: input.documentId, status: "Emitida", calculationSnapshot: { assessmentId: position.assessment.id, amount: requested.toFixed(2), effect: "EMISSAO_SEM_BAIXA" } } });
    await tx.taxAssessment.update({ where: { id: position.assessment.id }, data: { status: "Emitido" } });
    await audit(tx, actor, "ISSUE_PARTIAL_DAM", "TaxGuide", guide.id, { assessmentId: position.assessment.id, amount: requested.toFixed(2), balanceBeforePayment: position.balance.toFixed(2) });
    return guide;
  });
}

export async function generateGroupedTaxGuides(db: PrismaClient, actor: TaxActor, input: { assessmentIds: string[]; dueDate: Date }) {
  const ids = [...new Set(input.assessmentIds.filter(Boolean))];
  if (ids.length < 2) throw new TaxError("Selecione pelo menos dois lançamentos para o DAM agrupado.");
  return db.$transaction(async (tx) => {
    const assessments = await tx.taxAssessment.findMany({ where: { id: { in: ids } } });
    if (assessments.length !== ids.length) throw new TaxError("Um dos lançamentos selecionados não foi encontrado.");
    if (new Set(assessments.map((item) => item.taxpayerId)).size !== 1) throw new TaxError("O DAM agrupado aceita apenas débitos do mesmo contribuinte.");
    const groupId = randomUUID();
    const guides = [];
    for (const assessment of assessments) {
      await tx.$queryRaw`SELECT id FROM "TaxAssessment" WHERE id = ${assessment.id} FOR UPDATE`;
      const position = await assessmentPosition(tx, assessment.id);
      if (position.availableForGuide.lessThanOrEqualTo(0)) throw new TaxError(`O lançamento ${assessment.assessmentNumber ?? assessment.id} não possui saldo livre para emissão.`);
      const guideNumber = await nextNumber(tx, assessment.year, "GUIDE");
      const guide = await tx.taxGuide.create({ data: { assessmentId: assessment.id, guideNumber, totalValue: Number(position.availableForGuide), totalValueDecimal: position.availableForGuide, dueDate: input.dueDate, status: "Emitida", calculationSnapshot: { groupId, assessmentId: assessment.id, amount: position.availableForGuide.toFixed(2), effect: "EMISSAO_SEM_BAIXA" } } });
      guides.push(guide);
      await tx.taxAssessment.update({ where: { id: assessment.id }, data: { status: "Emitido" } });
    }
    const total = guides.reduce((sum, guide) => sum.plus(guide.totalValueDecimal ?? 0), new Prisma.Decimal(0));
    const group = await tx.taxRegistryEntry.create({ data: { entityType: "DAM_GROUP", entityId: groupId, category: "DAM_AGRUPADO", title: `DAM agrupado ${groupId.slice(0, 8).toUpperCase()}`, data: { guideIds: guides.map((guide) => guide.id), guideNumbers: guides.map((guide) => guide.guideNumber), assessmentIds: ids, total: total.toFixed(2), dueDate: input.dueDate.toISOString() }, status: "EMITIDO", source: "INTERNO", actorUsuarioId: actor.usuarioId } });
    await audit(tx, actor, "ISSUE_GROUPED_DAM", "TaxRegistryEntry", group.id, { groupId, guideIds: guides.map((guide) => guide.id), total: total.toFixed(2) });
    return { group, guides, total };
  });
}

export async function createPixCharge(db: PrismaClient, actor: TaxActor, input: { guideId: string; idempotencyKey: string }) {
  const key = `PIX_CHARGE:${input.idempotencyKey.trim()}`;
  const existing = await db.taxIntegrationEvent.findUnique({ where: { idempotencyKey: key } });
  if (existing) return existing;
  const guide = await db.taxGuide.findUnique({ where: { id: input.guideId }, include: { assessment: true } });
  if (!guide || ["Cancelada", "Paga"].includes(guide.status)) throw new TaxError("O DAM não está disponível para cobrança.");
  const reference = `PIX-${guide.guideNumber ?? guide.id}`;
  const event = await db.taxIntegrationEvent.create({ data: { integrationCode: "PIX_ADAPTER", eventType: "CHARGE_CREATED", idempotencyKey: key, externalReference: reference, status: "AGUARDANDO_CONFIRMACAO", evidenceLevel: "L1", taxpayerId: guide.assessment.taxpayerId, payload: { guideId: guide.id, guideNumber: guide.guideNumber, amount: guide.totalValueDecimal?.toFixed(2) ?? String(guide.totalValue) }, result: { reference, copyAndPaste: reference, paid: false } } });
  await audit(db, actor, "CREATE_CHARGE", "TaxIntegrationEvent", event.id, { guideId: guide.id, reference, status: event.status });
  return event;
}

export async function processCollectionReturn(db: PrismaClient, actor: TaxActor, input: {
  idempotencyKey: string; guideNumber?: string; amount: string | number; occurredAt: Date; status: "CONFIRMADO" | "INVALIDO" | "REJEITADO"; bankAccountId?: string; externalReference?: string;
}) {
  const key = `BANK_RETURN:${input.idempotencyKey.trim()}`;
  const existing = await db.taxIntegrationEvent.findUnique({ where: { idempotencyKey: key } });
  if (existing) return existing;
  const receivedAmount = money(input.amount, "Valor recebido");
  const guide = input.guideNumber ? await db.taxGuide.findFirst({ where: { OR: [{ guideNumber: input.guideNumber }, { id: input.guideNumber }] }, include: { assessment: true, payments: { where: { status: "Confirmado" } } } }) : null;
  if (input.status !== "CONFIRMADO" || !guide) {
    const reason = input.status === "REJEITADO" ? "Arquivo rejeitado" : !guide ? "Referência não localizada" : "Registro inválido";
    const rejected = await db.taxIntegrationEvent.create({ data: { integrationCode: "BANK_RETURN", eventType: "COLLECTION_RETURN", idempotencyKey: key, externalReference: input.externalReference, status: "REJEITADO", evidenceLevel: "L1", payload: { guideNumber: input.guideNumber ?? null, amount: receivedAmount.toFixed(2), occurredAt: input.occurredAt.toISOString() }, result: { reason, applied: "0.00" }, processedAt: new Date() } });
    await audit(db, actor, "REJECT_BANK_RETURN", "TaxIntegrationEvent", rejected.id, { reason });
    return rejected;
  }
  const guideTotal = guide.totalValueDecimal ?? new Prisma.Decimal(String(guide.totalValue));
  const paidBefore = guide.payments.reduce((sum, payment) => sum.plus(payment.amountPaidDecimal ?? 0), new Prisma.Decimal(0));
  const outstanding = Prisma.Decimal.max(guideTotal.minus(paidBefore), 0);
  if (outstanding.lessThanOrEqualTo(0)) throw new TaxError("O DAM já está integralmente pago.");
  const applied = Prisma.Decimal.min(receivedAmount, outstanding);
  await confirmTaxPayment(db, actor, { guideId: guide.id, amountPaid: applied, paymentDate: input.occurredAt, paymentMethod: "Retorno bancário", idempotencyKey: key, bankAccountId: input.bankAccountId });
  const excess = receivedAmount.minus(applied).toDecimalPlaces(2);
  let creditEntryId: string | null = null;
  if (excess.greaterThan(0)) {
    const credit = await db.taxRegistryEntry.create({ data: { entityType: "TAXPAYER", entityId: guide.assessment.taxpayerId, category: "TAX_CREDIT", title: `Crédito de arrecadação ${input.externalReference ?? input.idempotencyKey}`, data: { amount: excess.toFixed(2), available: excess.toFixed(2), originGuideId: guide.id, originEventKey: key }, status: "DISPONIVEL", source: "RETORNO_BANCARIO", actorUsuarioId: actor.usuarioId } });
    creditEntryId = credit.id;
  }
  const event = await db.taxIntegrationEvent.create({ data: { integrationCode: "BANK_RETURN", eventType: "COLLECTION_RETURN", idempotencyKey: key, externalReference: input.externalReference, status: "PROCESSADO", evidenceLevel: "L1", taxpayerId: guide.assessment.taxpayerId, payload: { guideId: guide.id, guideNumber: guide.guideNumber, amount: receivedAmount.toFixed(2), occurredAt: input.occurredAt.toISOString() }, result: { applied: applied.toFixed(2), excess: excess.toFixed(2), creditEntryId }, processedAt: new Date() } });
  await audit(db, actor, "PROCESS_BANK_RETURN", "TaxIntegrationEvent", event.id, { guideId: guide.id, applied: applied.toFixed(2), excess: excess.toFixed(2) });
  return event;
}

export async function applyTaxCredit(db: PrismaClient, actor: TaxActor, input: {
  creditId: string; operation: "COMPENSAR" | "TRANSFERIR" | "RESTITUIR"; amount: string | number; assessmentId?: string; destinationTaxpayerId?: string; reason: string; idempotencyKey: string;
}) {
  const requested = money(input.amount);
  return db.$transaction(async (tx) => {
    const key = `TAX_CREDIT:${input.idempotencyKey.trim()}`;
    const prior = await tx.taxIntegrationEvent.findUnique({ where: { idempotencyKey: key } });
    if (prior) return prior;
    await tx.$queryRaw`SELECT id FROM "TaxRegistryEntry" WHERE id = ${input.creditId} FOR UPDATE`;
    const credit = await tx.taxRegistryEntry.findUnique({ where: { id: input.creditId } });
    if (!credit || credit.category !== "TAX_CREDIT") throw new TaxError("Crédito tributário disponível não encontrado.");
    const data = jsonObject(credit.data);
    const available = new Prisma.Decimal(String(data.available ?? 0));
    if (requested.greaterThan(available)) throw new TaxError(`O crédito disponível é ${available.toFixed(2)}.`);
    if (input.operation === "COMPENSAR" && !input.assessmentId) throw new TaxError("Selecione o débito de destino da compensação.");
    if (input.operation === "TRANSFERIR" && !input.destinationTaxpayerId) throw new TaxError("Selecione o contribuinte de destino.");
    const remaining = available.minus(requested).toDecimalPlaces(2);
    await tx.taxRegistryEntry.update({ where: { id: credit.id }, data: { data: { ...data, available: remaining.toFixed(2) }, status: remaining.equals(0) ? "UTILIZADO" : "DISPONIVEL" } });
    const targetType = input.operation === "COMPENSAR" ? "TAX_ASSESSMENT" : "TAXPAYER";
    const targetId = input.assessmentId ?? input.destinationTaxpayerId ?? credit.entityId;
    const movement = await tx.taxRegistryEntry.create({ data: { entityType: targetType, entityId: targetId, category: input.operation === "RESTITUIR" ? "REFUND_REQUEST" : "CREDIT_MOVEMENT", title: input.operation, data: { operation: input.operation, sourceCreditId: credit.id, sourceTaxpayerId: credit.entityId, destinationId: targetId, amount: requested.toFixed(2), reason: input.reason.trim(), status: input.operation === "RESTITUIR" ? "PENDENTE_APROVACAO" : "EFETIVADO" }, status: input.operation === "RESTITUIR" ? "PENDENTE_APROVACAO" : "EFETIVADO", source: "INTERNO", actorUsuarioId: actor.usuarioId } });
    if (input.operation === "TRANSFERIR") await tx.taxRegistryEntry.create({ data: { entityType: "TAXPAYER", entityId: targetId, category: "TAX_CREDIT", title: `Crédito transferido de ${credit.entityId}`, data: { amount: requested.toFixed(2), available: requested.toFixed(2), sourceCreditId: credit.id, movementId: movement.id }, status: "DISPONIVEL", source: "TRANSFERENCIA", actorUsuarioId: actor.usuarioId } });
    const event = await tx.taxIntegrationEvent.create({ data: { integrationCode: "TAX_CREDIT", eventType: input.operation, idempotencyKey: key, status: input.operation === "RESTITUIR" ? "PENDENTE" : "PROCESSADO", evidenceLevel: "L1", taxpayerId: credit.entityId, payload: { creditId: credit.id, amount: requested.toFixed(2), targetId }, result: { movementId: movement.id, remaining: remaining.toFixed(2) }, processedAt: input.operation === "RESTITUIR" ? null : new Date() } });
    await audit(tx, actor, input.operation, "TaxRegistryEntry", movement.id, { creditId: credit.id, amount: requested.toFixed(2), remaining: remaining.toFixed(2), targetId });
    return event;
  });
}

export async function createReconciliation(db: PrismaClient, actor: TaxActor, input: { agreementId: string; date: Date; paymentTotal: string | number; remittanceTotal: string | number; reason?: string }) {
  const payments = money(input.paymentTotal, "Total de pagamentos");
  const remittance = new Prisma.Decimal(String(input.remittanceTotal)).toDecimalPlaces(2);
  if (!remittance.isFinite() || remittance.lessThan(0)) throw new TaxError("O total repassado não pode ser negativo.");
  const difference = remittance.minus(payments).toDecimalPlaces(2);
  const entry = await db.taxRegistryEntry.create({ data: { entityType: "COLLECTION_AGREEMENT", entityId: input.agreementId, category: "RECONCILIATION", title: `Conciliação ${input.date.toISOString().slice(0, 10)}`, data: { date: input.date.toISOString(), paymentTotal: payments.toFixed(2), remittanceTotal: remittance.toFixed(2), difference: difference.toFixed(2), surplus: Prisma.Decimal.max(difference, 0).toFixed(2), reason: input.reason?.trim() || null, status: difference.equals(0) ? "PRONTA_PARA_LIBERAR" : "DIVERGENTE" }, status: difference.equals(0) ? "PRONTA_PARA_LIBERAR" : "DIVERGENTE", source: "INTERNO", actorUsuarioId: actor.usuarioId } });
  await audit(db, actor, "RECONCILE", "TaxRegistryEntry", entry.id, { agreementId: input.agreementId, difference: difference.toFixed(2) });
  return entry;
}

export async function configureCollectionAgreement(db: PrismaClient, actor: TaxActor, input: { code: string; name: string; bankAccountId?: string; automaticRelease?: boolean; paymentUrl?: string }) {
  if (!input.code.trim() || !input.name.trim()) throw new TaxError("Código e nome do agente arrecadador são obrigatórios.");
  const entityId = input.code.trim().toUpperCase();
  const previous = await db.taxRegistryEntry.findFirst({ where: { entityType: "COLLECTION_AGREEMENT", entityId, category: "AGREEMENT", status: "ATIVO" }, orderBy: { version: "desc" } });
  const version = (previous?.version ?? 0) + 1;
  if (previous) await db.taxRegistryEntry.update({ where: { id: previous.id }, data: { status: "SUBSTITUIDO", effectiveUntil: new Date() } });
  const entry = await db.taxRegistryEntry.create({ data: { entityType: "COLLECTION_AGREEMENT", entityId, category: "AGREEMENT", title: input.name.trim(), data: { code: entityId, name: input.name.trim(), bankAccountId: input.bankAccountId || null, automaticRelease: Boolean(input.automaticRelease), paymentUrl: input.paymentUrl?.trim() || null }, status: "ATIVO", source: "INTERNO", actorUsuarioId: actor.usuarioId, version } });
  await audit(db, actor, "CONFIGURE_AGREEMENT", "TaxRegistryEntry", entry.id, { entityId, version });
  return entry;
}

export async function resolveReconciliation(db: PrismaClient, actor: TaxActor, input: { id: string; adjustment: string | number; reason: string }) {
  const adjustment = new Prisma.Decimal(String(input.adjustment)).toDecimalPlaces(2);
  if (!adjustment.isFinite() || adjustment.equals(0) || !input.reason.trim()) throw new TaxError("Informe ajuste diferente de zero e motivo.");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "TaxRegistryEntry" WHERE id = ${input.id} FOR UPDATE`;
    const entry = await tx.taxRegistryEntry.findUnique({ where: { id: input.id } });
    if (!entry || entry.category !== "RECONCILIATION" || entry.status === "FECHADA") throw new TaxError("Conciliação não está disponível para saneamento.");
    const data = jsonObject(entry.data);
    const previousDifference = new Prisma.Decimal(String(data.difference ?? 0));
    const difference = previousDifference.plus(adjustment).toDecimalPlaces(2);
    const history = Array.isArray(data.adjustments) ? data.adjustments : [];
    const updated = await tx.taxRegistryEntry.update({ where: { id: entry.id }, data: { status: difference.equals(0) ? "PRONTA_PARA_LIBERAR" : "DIVERGENTE", data: { ...data, difference: difference.toFixed(2), status: difference.equals(0) ? "PRONTA_PARA_LIBERAR" : "DIVERGENTE", adjustments: [...history, { amount: adjustment.toFixed(2), reason: input.reason.trim(), at: new Date().toISOString(), actorUsuarioId: actor.usuarioId }] } } });
    await audit(tx, actor, "RESOLVE_RECONCILIATION", "TaxRegistryEntry", entry.id, { previousDifference: previousDifference.toFixed(2), adjustment: adjustment.toFixed(2), difference: difference.toFixed(2), reason: input.reason.trim() });
    return updated;
  });
}

export async function approveRefundRequest(db: PrismaClient, actor: TaxActor, input: { requestId: string; approved: boolean; reason: string }) {
  return db.$transaction(async (tx) => {
    const request = await tx.taxRegistryEntry.findUnique({ where: { id: input.requestId } });
    if (!request || request.category !== "REFUND_REQUEST" || request.status !== "PENDENTE_APROVACAO") throw new TaxError("Pedido de restituição não está pendente de aprovação.");
    const data = jsonObject(request.data);
    const status = input.approved ? "APROVADA_AGUARDANDO_TESOURARIA" : "REJEITADA";
    if (!input.approved && typeof data.sourceCreditId === "string") {
      await tx.$queryRaw`SELECT id FROM "TaxRegistryEntry" WHERE id = ${data.sourceCreditId} FOR UPDATE`;
      const sourceCredit = await tx.taxRegistryEntry.findUnique({ where: { id: data.sourceCreditId } });
      if (sourceCredit) {
        const sourceData = jsonObject(sourceCredit.data);
        const restored = new Prisma.Decimal(String(sourceData.available ?? 0)).plus(new Prisma.Decimal(String(data.amount ?? 0))).toDecimalPlaces(2);
        await tx.taxRegistryEntry.update({ where: { id: sourceCredit.id }, data: { status: "DISPONIVEL", data: { ...sourceData, available: restored.toFixed(2) } } });
      }
    }
    const updated = await tx.taxRegistryEntry.update({ where: { id: request.id }, data: { status, data: { ...data, status, decisionReason: input.reason.trim(), decidedAt: new Date().toISOString() }, reviewedByUsuarioId: actor.usuarioId, reviewedAt: new Date() } });
    await audit(tx, actor, input.approved ? "APPROVE_REFUND" : "REJECT_REFUND", "TaxRegistryEntry", request.id, { reason: input.reason.trim(), status });
    return updated;
  });
}

export async function closeReconciliation(db: PrismaClient, actor: TaxActor, id: string) {
  return db.$transaction(async (tx) => {
    const entry = await tx.taxRegistryEntry.findUnique({ where: { id } });
    if (!entry || entry.category !== "RECONCILIATION") throw new TaxError("Conciliação não encontrada.");
    const data = jsonObject(entry.data);
    if (new Prisma.Decimal(String(data.difference ?? 0)).greaterThan(0) || new Prisma.Decimal(String(data.difference ?? 0)).lessThan(0)) throw new TaxError("Resolva a diferença antes do fechamento.");
    const closed = await tx.taxRegistryEntry.update({ where: { id }, data: { status: "FECHADA", data: { ...data, status: "FECHADA", closedAt: new Date().toISOString() }, reviewedByUsuarioId: actor.usuarioId, reviewedAt: new Date() } });
    await audit(tx, actor, "CLOSE_RECONCILIATION", "TaxRegistryEntry", id, { closedAt: closed.reviewedAt?.toISOString() ?? null });
    return closed;
  });
}

export async function sendAccountingReference(db: PrismaClient, actor: TaxActor, input: { sourceType: string; sourceId: string; amount: string | number; competence: Date }) {
  const idempotencyKey = `ACCOUNTING:${input.sourceType}:${input.sourceId}`;
  const existing = await db.taxIntegrationEvent.findUnique({ where: { idempotencyKey } });
  if (existing?.status === "PROCESSADO") return existing;
  const amountValue = money(input.amount);
  const year = input.competence.getUTCFullYear();
  const [financialYear, eventCatalog] = await Promise.all([
    db.financialYear.findUnique({ where: { year } }),
    db.accountingEventCatalog.findUnique({ where: { code: "TRIBUTARIO_ARRECADACAO" }, include: { rules: { where: { isActive: true }, take: 1 } } }),
  ]);
  const reason = !financialYear ? "Exercício financeiro não configurado" : !eventCatalog?.rules.length ? "Evento ou roteiro contábil não configurado" : !actor.employeeId ? "Usuário sem vínculo funcional para autoria contábil" : null;
  if (reason) {
    return db.taxIntegrationEvent.upsert({ where: { idempotencyKey }, create: { integrationCode: "ACCOUNTING", eventType: input.sourceType, idempotencyKey, status: "PENDENTE", evidenceLevel: "L1", payload: { sourceId: input.sourceId, amount: amountValue.toFixed(2), competence: input.competence.toISOString() }, result: { reason } }, update: { status: "PENDENTE", result: { reason } } });
  }
  const activeFinancialYear = financialYear!;
  const activeEventCatalog = eventCatalog!;
  const activeEmployeeId = actor.employeeId!;
  return db.$transaction(async (tx) => {
    const transactionKey = idempotencyKey;
    const prior = await tx.accountingTransaction.findUnique({ where: { idempotencyKey: transactionKey } });
    const rule = activeEventCatalog.rules[0];
    const transaction = prior ?? await tx.accountingTransaction.create({ data: { financialYearId: activeFinancialYear.id, date: input.competence, history: `Evento tributário ${input.sourceType} ${input.sourceId}`, status: "POSTADO", sourceModule: "TRIBUTARIO", sourceType: input.sourceType, sourceId: input.sourceId, eventType: activeEventCatalog.code, idempotencyKey: transactionKey, authorUsuarioId: actor.usuarioId, authorEmployeeId: activeEmployeeId, postedAt: new Date(), entries: { create: [
      { date: input.competence, value: Number(amountValue), valueDecimal: amountValue, type: "Débito", history: `Evento tributário ${input.sourceId}`, accountId: rule.debitAccountId, authorId: activeEmployeeId },
      { date: input.competence, value: Number(amountValue), valueDecimal: amountValue, type: "Crédito", history: `Evento tributário ${input.sourceId}`, accountId: rule.creditAccountId, authorId: activeEmployeeId },
    ] } } });
    const integration = await tx.taxIntegrationEvent.upsert({ where: { idempotencyKey }, create: { integrationCode: "ACCOUNTING", eventType: input.sourceType, idempotencyKey, status: "PROCESSADO", evidenceLevel: "L1", payload: { sourceId: input.sourceId, amount: amountValue.toFixed(2) }, result: { accountingTransactionId: transaction.id }, processedAt: new Date() }, update: { status: "PROCESSADO", result: { accountingTransactionId: transaction.id }, processedAt: new Date() } });
    await audit(tx, actor, "SEND_ACCOUNTING", "AccountingTransaction", transaction.id, { sourceType: input.sourceType, sourceId: input.sourceId, amount: amountValue.toFixed(2) });
    return integration;
  });
}

export async function getAssessmentAccount(db: Db, assessmentId: string) {
  const assessment = await db.taxAssessment.findUnique({ where: { id: assessmentId }, include: { tax: true, taxpayer: { include: { person: true, company: true } }, guides: { include: { payments: { where: { status: "Confirmado" } } } } } });
  if (!assessment) throw new TaxError("Lançamento não encontrado.");
  const events = await db.taxRegistryEntry.findMany({ where: { entityType: "TAX_ASSESSMENT", entityId: assessment.id, category: "CREDIT_EVENT" }, orderBy: { createdAt: "asc" } });
  const extinct = events.filter((event) => ["EXTINCAO_NAO_FINANCEIRA", "COMPENSACAO"].includes(String(jsonObject(event.data).eventType))).map((event) => String(jsonObject(event.data).amount ?? 0));
  const payments = assessment.guides.flatMap((guide) => guide.payments).map((payment) => ({ idempotencyKey: payment.idempotencyKey ?? payment.id, amount: payment.amountPaidDecimal ?? 0 }));
  const total = assessment.finalValueDecimal ?? assessment.originalValueDecimal ?? new Prisma.Decimal(assessment.originalValue);
  const position = calculateAccountBalance({ constituted: total, payments, nonFinancialExtinctions: extinct });
  return { assessment, events, position };
}
