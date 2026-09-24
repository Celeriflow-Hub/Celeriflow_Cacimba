import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { allocateInstallmentPayment, calculateBenefit, collectionRanking, executeDeterministicDraw, splitInstallmentAmount, TributarioS8Error } from "./s8-engine";

type Actor = { usuarioId: string };
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const code = (prefix: string) => `${prefix}-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
const money = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(String(value)).toDecimalPlaces(2);
const plusMonths = (date: Date, amount: number, day: number) => { const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12)); result.setUTCDate(Math.min(day, new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate())); return result; };

export async function ensureS8Defaults(db: PrismaClient, actor: Actor) {
  const now = new Date();
  await Promise.all([
    db.taxCollectionProfile.upsert({ where: { code: "INADIMPLENTE_PADRAO" }, update: {}, create: { code: "INADIMPLENTE_PADRAO", name: "Inadimplência administrativa", description: "Débitos vencidos para cobrança administrativa controlada.", criteria: { overdueDays: 1, excludedStatuses: ["Pago", "Cancelado"] }, priority: 10, createdByUsuarioId: actor.usuarioId } }),
    db.taxInstallmentRule.upsert({ where: { code_effectiveFrom: { code: "PARC_DEMO", effectiveFrom: new Date("2026-01-01T12:00:00.000Z") } }, update: {}, create: { code: "PARC_DEMO", name: "Parcelamento demonstrativo controlado", legalReference: "Configuração interna de demonstração — validar legislação municipal", minInstallments: 1, maxInstallments: 60, minQuotaDecimal: 10, discountConfiguration: { allowed: true, modes: ["FIXED", "PERCENT"] }, feeConfiguration: { fees: true, honoraria: true }, breakConfiguration: { overdueQuotas: 3, manualReview: true }, dueDayOptions: [5, 10, 15, 20, 25], effectiveFrom: new Date("2026-01-01T12:00:00.000Z") } }),
    db.taxCollectionRule.upsert({ where: { code_effectiveFrom: { code: "REGUA_PADRAO", effectiveFrom: new Date("2026-01-01T12:00:00.000Z") } }, update: {}, create: { code: "REGUA_PADRAO", name: "Régua administrativa padrão", steps: [{ day: 1, action: "AVISO" }, { day: 15, action: "CONTATO" }, { day: 30, action: "NEGOCIACAO" }], allowedChannels: ["DTE", "EMAIL", "SMS", "WHATSAPP", "TELEFONE", "CARTA"], allowedModalities: ["ADMINISTRATIVA", "CONCILIACAO"], effectiveFrom: new Date("2026-01-01T12:00:00.000Z") } }),
  ]);
  return now;
}

export async function createCollectionPortfolio(db: PrismaClient, actor: Actor, input: { name: string; profileId?: string; taxpayerIds?: string[] }) {
  const assessments = await db.taxAssessment.findMany({ where: { ...(input.taxpayerIds?.length ? { taxpayerId: { in: input.taxpayerIds } } : {}), status: { notIn: ["Pago", "Cancelado"] } }, orderBy: { createdAt: "asc" }, take: 200 });
  const debts = await db.activeDebt.findMany({ where: { ...(input.taxpayerIds?.length ? { taxpayerId: { in: input.taxpayerIds } } : {}), status: { notIn: ["Paga", "Cancelada"] } }, orderBy: { createdAt: "asc" }, take: 200 });
  const activeAssessmentIds = new Set(debts.map((row) => row.assessmentId).filter(Boolean));
  const items = [
    ...assessments.filter((row) => !activeAssessmentIds.has(row.id)).map((row) => ({ taxpayerId: row.taxpayerId, sourceType: "LANCAMENTO", sourceId: row.id, originalDecimal: row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue, outstandingDecimal: row.finalValueDecimal ?? row.originalValueDecimal ?? row.originalValue, dueDate: row.competence })),
    ...debts.map((row) => ({ taxpayerId: row.taxpayerId, sourceType: "DIVIDA_ATIVA_LEITURA", sourceId: row.id, originalDecimal: row.originalValueDecimal ?? row.originalValue, outstandingDecimal: row.updatedValueDecimal ?? row.updatedValue, dueDate: null })),
  ];
  if (!items.length) throw new TributarioS8Error("Nenhum débito elegível foi encontrado para a seleção.");
  return db.taxCollectionPortfolio.create({ data: { name: input.name.trim() || "Carteira de cobrança", profileId: input.profileId || null, selectionMode: input.taxpayerIds?.length ? "CONTRIBUINTES" : "AUTOMATICA", selectionSnapshot: json({ taxpayerIds: input.taxpayerIds ?? [], selectedAt: new Date(), sources: { assessments: assessments.length, activeDebtReadOnly: debts.length } }), createdByUsuarioId: actor.usuarioId, items: { create: items } }, include: { items: true } });
}

export async function scheduleCollectionAction(db: PrismaClient, actor: Actor, input: { portfolioId: string; portfolioItemId?: string; taxpayerId: string; actionType: string; modality: string; channel: string; scheduledAt?: Date }) {
  const action = await db.taxCollectionAction.create({ data: { portfolioId: input.portfolioId, portfolioItemId: input.portfolioItemId || null, taxpayerId: input.taxpayerId, actionType: input.actionType, modality: input.modality, channel: input.channel, scheduledAt: input.scheduledAt ?? new Date(), createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "AGENDADA", description: `Ação ${input.actionType} agendada pelo canal ${input.channel}.`, actorUsuarioId: actor.usuarioId, payload: json({ externalDelivery: input.channel === "DTE" ? "INTERNAL_ADAPTER" : "PENDING_PROVIDER" }) } } } });
  return action;
}

export async function completeCollectionAction(db: PrismaClient, actor: Actor, input: { actionId: string; resultCode: string; description: string; nextActionAt?: Date }) {
  return db.taxCollectionAction.update({ where: { id: input.actionId }, data: { status: "REALIZADA", performedAt: new Date(), resultCode: input.resultCode, resultDescription: input.description, nextActionAt: input.nextActionAt || null, events: { create: { eventType: "RESULTADO", description: input.description, payload: json({ resultCode: input.resultCode, nextActionAt: input.nextActionAt }), actorUsuarioId: actor.usuarioId } } } });
}

export async function collectionDashboard(db: PrismaClient) {
  const items = await db.taxCollectionPortfolioItem.findMany({ include: { actions: { where: { status: "REALIZADA" } } } });
  const grouped = new Map<string, { outstanding: number; overdueDays: number; successfulContacts: number }>(); const today = Date.now();
  for (const item of items) { const current = grouped.get(item.taxpayerId) ?? { outstanding: 0, overdueDays: 0, successfulContacts: 0 }; current.outstanding += Number(item.outstandingDecimal); current.overdueDays = Math.max(current.overdueDays, item.dueDate ? Math.floor((today - item.dueDate.getTime()) / 86400000) : 0); current.successfulContacts += item.actions.filter((action) => ["ACORDO", "CONTATO", "PAGAMENTO"].includes(action.resultCode ?? "")).length; grouped.set(item.taxpayerId, current); }
  return collectionRanking([...grouped].map(([taxpayerId, values]) => ({ taxpayerId, ...values })));
}

export function simulateInstallment(input: { total: number | string | Prisma.Decimal; count: number; discount?: number | string | Prisma.Decimal; fees?: number | string | Prisma.Decimal; dueDay: number }) {
  const original = money(input.total); const discount = money(input.discount ?? 0); const fees = money(input.fees ?? 0); const total = original.minus(discount).plus(fees).toDecimalPlaces(2);
  if (total.lessThanOrEqualTo(0)) throw new TributarioS8Error("O total do acordo deve ser positivo.");
  return { original, discount, fees, total, quotas: splitInstallmentAmount(total, input.count), dueDay: input.dueDay };
}

export async function createInstallmentAgreement(db: PrismaClient, actor: Actor, input: { taxpayerId: string; ruleId: string; total: number; count: number; dueDay: number; discount?: number; fees?: number; sourceType?: string; sourceId?: string; originLabel?: string }) {
  const [taxpayer, rule] = await Promise.all([db.taxpayer.findUnique({ where: { id: input.taxpayerId } }), db.taxInstallmentRule.findUnique({ where: { id: input.ruleId } })]);
  if (!taxpayer || !rule?.active) throw new TributarioS8Error("Contribuinte ou regra de parcelamento indisponível.");
  if (input.count < rule.minInstallments || input.count > rule.maxInstallments) throw new TributarioS8Error("Quantidade de parcelas fora da regra vigente.");
  const simulation = simulateInstallment(input); const firstDue = new Date(); const agreementNumber = code("PARC");
  return db.taxInstallmentAgreement.create({ data: { agreementNumber, taxpayerId: taxpayer.id, ruleId: rule.id, installmentCount: input.count, dueDay: input.dueDay, originalDebtDecimal: simulation.original, discountDecimal: simulation.discount, feesDecimal: simulation.fees, totalAgreementDecimal: simulation.total, balanceDecimal: simulation.total, simulationSnapshot: json({ ...simulation, quotas: simulation.quotas.map(String), rule: { id: rule.id, legalReference: rule.legalReference } }), createdByUsuarioId: actor.usuarioId, debts: { create: { sourceType: input.sourceType ?? "DEMO_FISCAL", sourceId: input.sourceId ?? `DEMO-${agreementNumber}`, originLabel: input.originLabel ?? "Cenário controlado de demonstração", originalAmountDecimal: simulation.original } }, quotas: { create: simulation.quotas.map((amount, index) => ({ quotaNumber: index + 1, dueDate: plusMonths(firstDue, index + 1, input.dueDay), originalDecimal: amount, balanceDecimal: amount })) }, events: { create: { eventType: "ADESAO", description: `${input.count} cotas geradas com distribuição exata dos centavos.`, actorUsuarioId: actor.usuarioId, payload: json({ total: simulation.total, quotas: simulation.quotas.map(String) }) } } }, include: { quotas: { orderBy: { quotaNumber: "asc" } }, debts: true, events: true } });
}

export async function applyInstallmentPayment(db: PrismaClient, actor: Actor, input: { agreementId: string; paymentKey: string; amount: number; paymentMode?: string }) {
  const agreement = await db.taxInstallmentAgreement.findUnique({ where: { id: input.agreementId }, include: { quotas: { orderBy: { quotaNumber: "asc" } }, allocations: { where: { paymentKey: input.paymentKey } } } });
  if (!agreement || !["ATIVO", "REATIVADO"].includes(agreement.status)) throw new TributarioS8Error("Parcelamento indisponível para pagamento.");
  if (agreement.allocations.length) return agreement;
  const allocation = allocateInstallmentPayment(agreement.quotas.map((row) => ({ id: row.id, quotaNumber: row.quotaNumber, balance: row.balanceDecimal })), input.amount);
  return db.$transaction(async (tx) => { for (const row of allocation.allocations.filter((item) => item.allocated.greaterThan(0))) { await tx.taxInstallmentQuota.update({ where: { id: row.id! }, data: { paidDecimal: { increment: row.allocated }, balanceDecimal: row.balanceAfter, status: row.status } }); await tx.taxInstallmentPaymentAllocation.create({ data: { agreementId: agreement.id, quotaId: row.id!, paymentKey: input.paymentKey, amountDecimal: row.allocated, paymentDate: new Date(), paymentMode: input.paymentMode ?? "FORA_DA_PARCELA" } }); } const paid = agreement.totalAgreementDecimal.minus(allocation.totalBalance); return tx.taxInstallmentAgreement.update({ where: { id: agreement.id }, data: { paidDecimal: paid, balanceDecimal: allocation.totalBalance, status: allocation.totalBalance.equals(0) ? "QUITADO" : agreement.status, events: { create: { eventType: "PAGAMENTO", description: `Pagamento de R$ ${money(input.amount).toFixed(2)} alocado nas cotas mais antigas.`, actorUsuarioId: actor.usuarioId, payload: json({ paymentKey: input.paymentKey, allocation: allocation.allocations.map((row) => ({ quota: row.quotaNumber, allocated: row.allocated, balance: row.balanceAfter })) }) } } }, include: { quotas: { orderBy: { quotaNumber: "asc" } }, allocations: true, events: true } }); });
}

export async function reviseInstallmentOrigin(db: PrismaClient, actor: Actor, input: { agreementId: string; debtId: string; revisedAmount: number; reason: string }) {
  const agreement = await db.taxInstallmentAgreement.findUnique({ where: { id: input.agreementId }, include: { debts: true, quotas: { orderBy: { quotaNumber: "desc" } } } });
  const debt = agreement?.debts.find((row) => row.id === input.debtId); if (!agreement || !debt) throw new TributarioS8Error("Origem do parcelamento não encontrada."); if (!input.reason.trim()) throw new TributarioS8Error("Informe a justificativa da revisão.");
  const previous = debt.revisedAmountDecimal ?? debt.originalAmountDecimal; const revised = money(input.revisedAmount); const delta = revised.minus(previous); const lastOpen = agreement.quotas.find((row) => row.status !== "QUITADA"); if (!lastOpen || lastOpen.balanceDecimal.plus(delta).lessThan(0)) throw new TributarioS8Error("A revisão é incompatível com o saldo das cotas.");
  return db.$transaction(async (tx) => { await tx.taxInstallmentDebt.update({ where: { id: debt.id }, data: { revisedAmountDecimal: revised } }); await tx.taxInstallmentQuota.update({ where: { id: lastOpen.id }, data: { originalDecimal: lastOpen.originalDecimal.plus(delta), balanceDecimal: lastOpen.balanceDecimal.plus(delta) } }); return tx.taxInstallmentAgreement.update({ where: { id: agreement.id }, data: { originalDebtDecimal: agreement.originalDebtDecimal.plus(delta), totalAgreementDecimal: agreement.totalAgreementDecimal.plus(delta), balanceDecimal: agreement.balanceDecimal.plus(delta), events: { create: { eventType: "REVISAO_ORIGEM", description: input.reason.trim(), actorUsuarioId: actor.usuarioId, payload: json({ debtId: debt.id, previous, revised, delta }) } } }, include: { quotas: { orderBy: { quotaNumber: "asc" } }, debts: true } }); });
}

export async function reparcelInstallment(db: PrismaClient, actor: Actor, input: { agreementId: string; count: number; dueDay: number }) {
  const parent = await db.taxInstallmentAgreement.findUnique({ where: { id: input.agreementId } }); if (!parent || parent.balanceDecimal.lessThanOrEqualTo(0) || parent.status === "CANCELADO") throw new TributarioS8Error("Acordo sem saldo elegível para reparcelamento.");
  const child = await createInstallmentAgreement(db, actor, { taxpayerId: parent.taxpayerId, ruleId: parent.ruleId, total: Number(parent.balanceDecimal), count: input.count, dueDay: input.dueDay, sourceType: "REPARCELAMENTO", sourceId: parent.id, originLabel: `Saldo do acordo ${parent.agreementNumber}` });
  await db.$transaction([db.taxInstallmentAgreement.update({ where: { id: child.id }, data: { parentAgreementId: parent.id, agreementType: "REPARCELAMENTO", events: { create: { eventType: "ORIGEM_REPARCELAMENTO", description: `Reparcelamento do saldo de ${parent.agreementNumber}.`, actorUsuarioId: actor.usuarioId } } } }), db.taxInstallmentAgreement.update({ where: { id: parent.id }, data: { status: "REPARCELADO", events: { create: { eventType: "REPARCELAMENTO", description: `Saldo transferido para ${child.agreementNumber}.`, actorUsuarioId: actor.usuarioId } } } })]); return child;
}

export async function changeInstallmentStatus(db: PrismaClient, actor: Actor, input: { agreementId: string; action: "ROMPER" | "REATIVAR" | "CANCELAR"; reason: string }) {
  if (!input.reason.trim()) throw new TributarioS8Error("Informe a justificativa."); const now = new Date(); const status = input.action === "ROMPER" ? "ROMPIDO" : input.action === "REATIVAR" ? "REATIVADO" : "CANCELADO";
  return db.taxInstallmentAgreement.update({ where: { id: input.agreementId }, data: { status, brokenAt: input.action === "ROMPER" ? now : undefined, reactivatedAt: input.action === "REATIVAR" ? now : undefined, cancelledAt: input.action === "CANCELAR" ? now : undefined, events: { create: { eventType: input.action, description: input.reason.trim(), actorUsuarioId: actor.usuarioId } } } });
}

export async function grantPortalAccess(db: PrismaClient, actor: Actor, taxpayerId: string) { await db.taxpayer.findUniqueOrThrow({ where: { id: taxpayerId } }); return db.taxpayerPortalAccess.upsert({ where: { usuarioId_taxpayerId: { usuarioId: actor.usuarioId, taxpayerId } }, update: { status: "ATIVO", revokedAt: null, scopes: json(["EXTRATO", "DAM", "CERTIDOES", "IPTU", "PARCELAMENTO", "DIVIDA", "PROCESSOS", "EMPRESA", "IMOVEL", "ITBI", "NOTIFICACOES", "PAGAMENTOS", "DOCUMENTOS", "ALVARAS", "AUTENTICIDADE"]) }, create: { usuarioId: actor.usuarioId, taxpayerId, grantedByUsuarioId: actor.usuarioId, scopes: json(["EXTRATO", "DAM", "CERTIDOES", "IPTU", "PARCELAMENTO", "DIVIDA", "PROCESSOS", "EMPRESA", "IMOVEL", "ITBI", "NOTIFICACOES", "PAGAMENTOS", "DOCUMENTOS", "ALVARAS", "AUTENTICIDADE"]) } }); }

export async function createBenefitRule(db: PrismaClient, actor: Actor, input: { code: string; name: string; benefitType: "CREDITO" | "REDUCAO" | "RENUNCIA"; legalReference: string; value: number; valueMode: "PERCENT" | "FIXED"; effectiveFrom: Date; effectiveUntil?: Date }) {
  if (!input.legalReference.trim()) throw new TributarioS8Error("A referência legal é obrigatória."); return db.taxBenefitRule.create({ data: { code: input.code, name: input.name, benefitType: input.benefitType, legalReference: input.legalReference, eligibility: { mode: "ANALISE_INDIVIDUAL" }, calculation: { value: input.value, valueMode: input.valueMode }, effectiveFrom: input.effectiveFrom, effectiveUntil: input.effectiveUntil || null, createdByUsuarioId: actor.usuarioId } });
}

export async function grantBenefit(db: PrismaClient, actor: Actor, input: { ruleId: string; taxpayerId: string; sourceType: string; sourceId: string; originalAmount: number }) {
  const rule = await db.taxBenefitRule.findUnique({ where: { id: input.ruleId } }); const now = new Date(); if (!rule?.active || rule.effectiveFrom > now || (rule.effectiveUntil && rule.effectiveUntil < now)) throw new TributarioS8Error("Regra de benefício fora da vigência."); const config = rule.calculation as { value?: number; valueMode?: "PERCENT" | "FIXED" }; const result = calculateBenefit({ amount: input.originalAmount, type: rule.benefitType as "CREDITO" | "REDUCAO" | "RENUNCIA", value: config.value ?? 0, valueMode: config.valueMode ?? "FIXED" });
  return db.taxBenefitGrant.create({ data: { ruleId: rule.id, taxpayerId: input.taxpayerId, sourceType: input.sourceType, sourceId: input.sourceId, originalAmountDecimal: result.amount, creditDecimal: result.credit, reductionDecimal: result.reduction, renunciationDecimal: result.renunciation, finalAmountDecimal: result.finalAmount, calculationSnapshot: json({ rule: { code: rule.code, legalReference: rule.legalReference }, result }), grantedByUsuarioId: actor.usuarioId } });
}

export async function createPrizeDraw(db: PrismaClient, actor: Actor, input: { name: string; year: number; drawNumber: number; scheduledAt: Date; winnerCount: number; technicalSeed: string; requiresPayment?: boolean; officialActReference?: string }) { return db.taxPrizeDraw.create({ data: { slug: `${input.year}-${input.drawNumber}-${randomUUID().slice(0, 6)}`, name: input.name, year: input.year, drawNumber: input.drawNumber, scheduledAt: input.scheduledAt, eligibilityRules: { sourceRequired: true, status: "CONFIGURADA" }, requiresPayment: input.requiresPayment ?? false, taxpayerTypes: ["PF", "PJ"], winnerCount: input.winnerCount, technicalSeed: input.technicalSeed, officialActReference: input.officialActReference || null, createdByUsuarioId: actor.usuarioId } }); }

export async function issuePrizeCoupon(db: PrismaClient, input: { drawId: string; taxpayerId: string; sourceDocumentType: "GUIA" | "DOCUMENTO"; sourceDocumentId: string }) {
  const draw = await db.taxPrizeDraw.findUnique({ where: { id: input.drawId }, include: { coupons: true } }); if (!draw) throw new TributarioS8Error("Sorteio não encontrado.");
  if (input.sourceDocumentType === "GUIA") { const guide = await db.taxGuide.findUnique({ where: { id: input.sourceDocumentId }, include: { assessment: true, payments: true } }); if (!guide || guide.assessment.taxpayerId !== input.taxpayerId) throw new TributarioS8Error("DAM não pertence ao contribuinte."); if (draw.requiresPayment && guide.status !== "Paga" && !guide.payments.some((p) => p.status === "Confirmado")) throw new TributarioS8Error("O regulamento exige pagamento confirmado."); } else if (!await db.document.findUnique({ where: { id: input.sourceDocumentId } })) throw new TributarioS8Error("Documento de origem não encontrado.");
  const couponNumber = `${draw.year}${String(draw.drawNumber).padStart(3, "0")}${String(draw.coupons.length + 1).padStart(7, "0")}`;
  return db.taxPrizeCoupon.create({ data: { drawId: draw.id, couponNumber, taxpayerId: input.taxpayerId, sourceDocumentType: input.sourceDocumentType, sourceDocumentId: input.sourceDocumentId, eligibilitySnapshot: json({ checkedAt: new Date(), requiresPayment: draw.requiresPayment, sourceValidated: true }) } });
}

export async function executePrizeDraw(db: PrismaClient, actor: Actor, drawId: string) {
  const existing = await db.taxPrizeExecution.findUnique({ where: { drawId_executionNumber: { drawId, executionNumber: 1 } }, include: { winners: { include: { coupon: true } } } }); if (existing) return existing;
  const draw = await db.taxPrizeDraw.findUnique({ where: { id: drawId }, include: { coupons: { where: { status: "ELEGIVEL" } } } }); if (!draw) throw new TributarioS8Error("Sorteio não encontrado."); const result = executeDeterministicDraw(draw.coupons, draw.technicalSeed, draw.winnerCount);
  return db.$transaction(async (tx) => { const execution = await tx.taxPrizeExecution.create({ data: { drawId: draw.id, executionNumber: 1, algorithm: result.algorithm, seedHash: result.seedHash, inputHash: result.inputHash, resultHash: result.resultHash, status: draw.officialActReference ? "ATO_CADASTRADO" : "DEMONSTRACAO_TECNICA", executedByUsuarioId: actor.usuarioId, winners: { create: result.winners.map((winner, index) => ({ couponId: winner.coupon.id, position: index + 1, resultKey: winner.resultKey })) } }, include: { winners: { include: { coupon: true } } } }); await tx.taxPrizeDraw.update({ where: { id: draw.id }, data: { status: draw.officialActReference ? "EXECUTADO_COM_ATO_CADASTRADO" : "DEMONSTRACAO_EXECUTADA", executedAt: new Date() } }); return execution; });
}
