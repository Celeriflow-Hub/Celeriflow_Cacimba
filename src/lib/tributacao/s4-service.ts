import { Prisma, type PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { calculateNfse, validateCorrectionChanges, TributarioS4Error } from "./s4-engine";
import { generateTaxGuide, type TaxActor } from "./index";

const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const required = (value: string, label: string) => { const result = value.trim(); if (!result) throw new TributarioS4Error(`${label} é obrigatório.`); return result; };
const money = (value: string | number | Prisma.Decimal) => new Prisma.Decimal(String(value)).toDecimalPlaces(2);

async function nextNumber(tx: Prisma.TransactionClient, type: string, prefix: string) {
  const year = new Date().getUTCFullYear();
  const row = await tx.taxDocumentSequence.upsert({ where: { year_documentType: { year, documentType: type } }, create: { year, documentType: type, currentValue: 1 }, update: { currentValue: { increment: 1 } } });
  return `${prefix}-${year}-${String(row.currentValue).padStart(7, "0")}`;
}

export async function ensureTributarioS4Defaults(db: PrismaClient) {
  let tax = await db.tax.findFirst({ where: { name: { equals: "ISS", mode: "insensitive" } }, orderBy: { createdAt: "asc" } });
  tax = tax ? (tax.isActive ? tax : await db.tax.update({ where: { id: tax.id }, data: { isActive: true } })) : await db.tax.create({ data: { name: "ISS", taxType: "Imposto", isActive: true } });
  let parameter = await db.taxParameter.findFirst({ where: { taxId: tax.id, code: "NFSE_DEMO_3", isActive: true }, orderBy: { effectiveFrom: "desc" } });
  if (!parameter) parameter = await db.taxParameter.create({ data: { taxId: tax.id, code: "NFSE_DEMO_3", name: "ISS demonstrativo 3%", calculationType: "PERCENTUAL_BASE", configuration: { formula: "PERCENTUAL_BASE", rate: 3, version: 1, reference: "NFS-e demonstrativa" }, effectiveFrom: new Date("2026-01-01T00:00:00.000Z") } });
  let activity = await db.taxServiceActivity.findUnique({ where: { taxId_code: { taxId: tax.id, code: "NFSE-DEMO" } } });
  activity = activity ? (activity.isActive && activity.issRate?.equals(3) ? activity : await db.taxServiceActivity.update({ where: { id: activity.id }, data: { isActive: true, issRate: 3 } })) : await db.taxServiceActivity.create({ data: { taxId: tax.id, code: "NFSE-DEMO", name: "Serviços demonstrativos", issRate: 3 } });
  return { tax, parameter, activity };
}

export async function requestNfseCredential(db: PrismaClient, actor: TaxActor, input: { taxpayerId: string; economicRegistrationId: string; serviceActivityId: string }) {
  const [taxpayer, registration, activity] = await Promise.all([
    db.taxpayer.findFirst({ where: { id: input.taxpayerId, status: "Ativo" } }),
    db.economicRegistration.findUnique({ where: { id: input.economicRegistrationId } }),
    db.taxServiceActivity.findFirst({ where: { id: input.serviceActivityId, isActive: true } }),
  ]);
  if (!taxpayer || !registration || registration.taxpayerId !== taxpayer.id || !activity) throw new TributarioS4Error("Prestador, inscrição municipal ou atividade inválidos.");
  return db.nfseCredentialRequest.create({ data: { taxpayerId: taxpayer.id, economicRegistrationId: registration.id, serviceActivityId: activity.id, termsAcceptedAt: new Date(), createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "SOLICITADO", description: "Solicitação de credenciamento recebida.", actorUsuarioId: actor.usuarioId } } } });
}

export async function decideNfseCredential(db: PrismaClient, actor: TaxActor, input: { id: string; approved: boolean; reason: string }) {
  const item = await db.nfseCredentialRequest.findUnique({ where: { id: input.id } });
  if (!item || item.status !== "SOLICITADO") throw new TributarioS4Error("O credenciamento não está disponível para análise.");
  const status = input.approved ? "HABILITADO" : "REJEITADO";
  return db.nfseCredentialRequest.update({ where: { id: item.id }, data: { status, analyzedAt: new Date(), enabledAt: input.approved ? new Date() : null, decisionReason: required(input.reason, "Fundamentação"), analyzedByUsuarioId: actor.usuarioId, events: { create: { eventType: status, description: input.reason.trim(), actorUsuarioId: actor.usuarioId } } } });
}

export async function emitNfse(db: PrismaClient, actor: TaxActor, input: {
  providerId: string; takerId?: string; economicRegistrationId: string; serviceActivityId: string; competence: string;
  serviceDescription: string; serviceLocation?: string; serviceValue: string | number; manualDeductions?: string | number;
  retained: boolean; creditUsages?: { creditId: string; amount: string | number }[]; source?: string; occasionalRequestId?: string; rpsItemId?: string;
}) {
  const defaults = await ensureTributarioS4Defaults(db);
  return db.$transaction(async (tx) => {
    const [provider, registration, activity] = await Promise.all([
      tx.taxpayer.findFirst({ where: { id: input.providerId, status: "Ativo" } }),
      tx.economicRegistration.findUnique({ where: { id: input.economicRegistrationId } }),
      tx.taxServiceActivity.findFirst({ where: { id: input.serviceActivityId, isActive: true }, include: { tax: true } }),
    ]);
    if (!provider || !registration || registration.taxpayerId !== provider.id || !activity) throw new TributarioS4Error("Prestador, inscrição ou atividade não conferem.");
    if (!input.occasionalRequestId) {
      const credential = await tx.nfseCredentialRequest.findFirst({ where: { taxpayerId: provider.id, economicRegistrationId: registration.id, serviceActivityId: activity.id, status: "HABILITADO" } });
      if (!credential) throw new TributarioS4Error("O prestador precisa de credenciamento habilitado para emitir NFS-e.");
    }
    if (input.takerId) {
      const taker = await tx.taxpayer.findFirst({ where: { id: input.takerId, status: "Ativo" } });
      if (!taker) throw new TributarioS4Error("Tomador ativo não encontrado.");
    }
    const usages = input.creditUsages ?? [];
    let creditTotal = new Prisma.Decimal(0);
    const credits: { id: string; amount: Prisma.Decimal; available: Prisma.Decimal }[] = [];
    for (const usage of usages) {
      await tx.$queryRaw`SELECT id FROM "NfseDeductionCredit" WHERE id = ${usage.creditId} FOR UPDATE`;
      const credit = await tx.nfseDeductionCredit.findUnique({ where: { id: usage.creditId } });
      const amount = money(usage.amount);
      if (!credit || credit.taxpayerId !== provider.id || credit.status !== "DISPONIVEL" || amount.lessThanOrEqualTo(0) || amount.greaterThan(credit.availableAmountDecimal)) throw new TributarioS4Error("Crédito de dedução indisponível ou saldo insuficiente.");
      creditTotal = creditTotal.plus(amount); credits.push({ id: credit.id, amount, available: credit.availableAmountDecimal });
    }
    const deductions = money(input.manualDeductions ?? 0).plus(creditTotal);
    const rate = activity.issRate ?? new Prisma.Decimal(String((defaults.parameter.configuration as Record<string, unknown>).rate ?? 0));
    const calc = calculateNfse({ serviceValue: input.serviceValue, deductions, ratePercent: rate, retained: input.retained });
    const verificationCode = randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
    const invoice = await tx.invoice.create({ data: { verificationCode, serviceValue: Number(calc.serviceValue), serviceValueDecimal: calc.serviceValue, deductions: Number(calc.deductions), deductionsDecimal: calc.deductions, issRetained: input.retained, issValue: Number(calc.iss), issValueDecimal: calc.iss, competence: required(input.competence, "Competência"), status: "Emitida", providerId: provider.id, takerId: input.takerId || null } });
    const authenticityUrl = `/portal/nfse/${verificationCode}`;
    const snapshot = { formula: "(valorServico - deducoes) × aliquota", serviceValue: calc.serviceValue.toFixed(2), deductions: calc.deductions.toFixed(2), taxableBase: calc.taxableBase.toFixed(2), rate: calc.rate.toString(), iss: calc.iss.toFixed(2), ownIss: calc.ownIss.toFixed(2), retainedIss: calc.retainedIss.toFixed(2), parameterId: defaults.parameter.id };
    await tx.nfseInvoiceData.create({ data: { invoiceId: invoice.id, economicRegistrationId: registration.id, serviceActivityId: activity.id, parameterId: defaults.parameter.id, serviceDescription: required(input.serviceDescription, "Descrição do serviço"), serviceLocation: input.serviceLocation?.trim() || null, taxableBaseDecimal: calc.taxableBase, rate: calc.rate, ownIssDecimal: calc.ownIss, retainedIssDecimal: calc.retainedIss, retentionType: input.retained ? "RETIDO" : "PROPRIO", calculationSnapshot: asJson(snapshot), source: input.source ?? "WEB", authenticityUrl, qrPayload: authenticityUrl, occasionalRequestId: input.occasionalRequestId, rpsItemId: input.rpsItemId } });
    await tx.nfseEvent.create({ data: { invoiceId: invoice.id, eventType: "EMITIDA", description: "NFS-e emitida com cálculo fiscal persistido.", actorUsuarioId: actor.usuarioId, payload: asJson(snapshot) } });
    await tx.taxDeclaration.create({ data: { taxpayerId: provider.id, economicRegistrationId: registration.id, activityId: activity.id, competence: parseCompetence(input.competence), serviceValueDecimal: calc.serviceValue, deductionValueDecimal: calc.deductions, issValueDecimal: calc.iss, status: input.retained ? "ISS_RETIDO" : "ISS_PROPRIO", calculationSnapshot: asJson({ ...snapshot, invoiceId: invoice.id }) } });
    for (const credit of credits) {
      const remaining = credit.available.minus(credit.amount);
      await tx.nfseDeductionCredit.update({ where: { id: credit.id }, data: { availableAmountDecimal: remaining, status: remaining.equals(0) ? "ESGOTADO" : "DISPONIVEL", consumptions: { create: { invoiceId: invoice.id, amountDecimal: credit.amount } } } });
    }
    if (input.rpsItemId) await tx.nfseRpsItem.update({ where: { id: input.rpsItemId }, data: { status: "CONVERTIDO", invoiceId: invoice.id } });
    if (input.occasionalRequestId) await tx.nfseOccasionalRequest.update({ where: { id: input.occasionalRequestId }, data: { status: "EMITIDA", invoiceId: invoice.id, releasedAt: new Date() } });
    return invoice;
  }, { timeout: 20_000 });
}

function parseCompetence(value: string) {
  const match = value.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if (!match) throw new TributarioS4Error("Competência deve estar no formato MM/AAAA.");
  return new Date(Date.UTC(Number(match[2]), Number(match[1]) - 1, 1, 12));
}

export async function substituteNfse(db: PrismaClient, actor: TaxActor, input: { invoiceId: string; reason: string; serviceDescription: string; serviceValue: number; deductions: number; retained: boolean }) {
  const old = await db.invoice.findUnique({ where: { id: input.invoiceId } });
  const data = await db.nfseInvoiceData.findUnique({ where: { invoiceId: input.invoiceId } });
  if (!old || !data || old.status !== "Emitida") throw new TributarioS4Error("Somente NFS-e emitida pode ser substituída.");
  const created = await emitNfse(db, actor, { providerId: old.providerId, takerId: old.takerId ?? undefined, economicRegistrationId: data.economicRegistrationId, serviceActivityId: data.serviceActivityId, competence: old.competence, serviceDescription: input.serviceDescription, serviceLocation: data.serviceLocation ?? undefined, serviceValue: input.serviceValue, manualDeductions: input.deductions, retained: input.retained, source: "SUBSTITUICAO" });
  await db.$transaction([
    db.invoice.update({ where: { id: old.id }, data: { status: "Substituída" } }),
    db.nfseInvoiceData.update({ where: { invoiceId: old.id }, data: { replacementInvoiceId: created.id } }),
    db.nfseInvoiceData.update({ where: { invoiceId: created.id }, data: { replacedInvoiceId: old.id } }),
    db.nfseEvent.create({ data: { invoiceId: old.id, eventType: "SUBSTITUIDA", description: required(input.reason, "Motivo"), actorUsuarioId: actor.usuarioId, payload: { replacementInvoiceId: created.id } } }),
    db.nfseEvent.create({ data: { invoiceId: created.id, eventType: "SUBSTITUTA", description: `Substitui a NFS-e ${old.invoiceNumber}.`, actorUsuarioId: actor.usuarioId, payload: { replacedInvoiceId: old.id } } }),
  ]);
  return created;
}

export async function cancelNfse(db: PrismaClient, actor: TaxActor, input: { invoiceId: string; reason: string; approve?: boolean }) {
  const invoice = await db.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice || !["Emitida", "Cancelamento pendente"].includes(invoice.status)) throw new TributarioS4Error("NFS-e indisponível para cancelamento.");
  const automatic = Date.now() - invoice.createdAt.getTime() <= 7 * 86400000;
  const approved = automatic || input.approve === true;
  const status = approved ? "Cancelada" : "Cancelamento pendente";
  await db.invoice.update({ where: { id: invoice.id }, data: { status } });
  await db.nfseEvent.create({ data: { invoiceId: invoice.id, eventType: approved ? "CANCELADA" : "CANCELAMENTO_SOLICITADO", description: required(input.reason, "Motivo"), actorUsuarioId: actor.usuarioId, payload: { automatic, approved } } });
  return { status, automatic };
}

export async function createCorrectionLetter(db: PrismaClient, actor: TaxActor, input: { invoiceId: string; reason: string; changes: Record<string, string> }) {
  const invoice = await db.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice || invoice.status !== "Emitida") throw new TributarioS4Error("Carta de correção exige NFS-e emitida.");
  const changes = validateCorrectionChanges(input.changes);
  const letter = await db.nfseCorrectionLetter.create({ data: { invoiceId: invoice.id, reason: required(input.reason, "Motivo"), changes, createdByUsuarioId: actor.usuarioId } });
  await db.nfseEvent.create({ data: { invoiceId: invoice.id, eventType: "CARTA_CORRECAO", description: input.reason.trim(), actorUsuarioId: actor.usuarioId, payload: asJson({ letterId: letter.id, changes }) } });
  return letter;
}

export async function receiveRpsBatch(db: PrismaClient, actor: TaxActor | null, input: { batchNumber: string; providerTaxpayerId: string; source: "UPLOAD" | "WEBSERVICE"; items: { rpsNumber: string; payload: unknown }[] }) {
  if (!input.items.length) throw new TributarioS4Error("O lote deve conter ao menos um RPS.");
  const payloadHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const existing = await db.nfseRpsBatch.findUnique({ where: { batchNumber: input.batchNumber } });
  if (existing) { if (existing.payloadHash !== payloadHash) throw new TributarioS4Error("Número de lote já recebido com conteúdo diferente."); return existing; }
  const provider = await db.taxpayer.findFirst({ where: { id: input.providerTaxpayerId, status: "Ativo" } });
  if (!provider) throw new TributarioS4Error("Prestador ativo não encontrado.");
  return db.nfseRpsBatch.create({ data: { batchNumber: required(input.batchNumber, "Número do lote"), providerTaxpayerId: provider.id, source: input.source, payloadHash, protocol: `RPS-${randomUUID().slice(0, 8).toUpperCase()}`, createdByUsuarioId: actor?.usuarioId, items: { create: input.items.map((item) => ({ rpsNumber: required(item.rpsNumber, "Número do RPS"), payload: asJson(item.payload) })) } }, include: { items: true } });
}

export async function updateRpsItem(db: PrismaClient, input: { id: string; action: "CANCELAR" | "SUBSTITUIR"; replacedRpsNumber?: string }) {
  const item = await db.nfseRpsItem.findUnique({ where: { id: input.id } });
  if (!item || !["RECEBIDO", "CONVERTIDO"].includes(item.status)) throw new TributarioS4Error("RPS indisponível para esta operação.");
  return db.nfseRpsItem.update({ where: { id: item.id }, data: input.action === "CANCELAR" ? { status: "CANCELADO", cancelledAt: new Date() } : { status: "SUBSTITUIDO", replacedRpsNumber: required(input.replacedRpsNumber ?? "", "RPS substituto") } });
}

export async function createDmsDeclaration(db: PrismaClient, actor: TaxActor | null, input: { taxpayerId: string; economicRegistrationId?: string; competence: string; direction: string; channel: string; detailMode: string; noMovement: boolean; rectifiesDeclarationId?: string; serviceValue: number; deductions: number; ownIss: number; retainedIss: number; payload?: unknown }) {
  const taxpayer = await db.taxpayer.findFirst({ where: { id: input.taxpayerId, status: "Ativo" } });
  if (!taxpayer) throw new TributarioS4Error("Contribuinte ativo não encontrado.");
  const values = input.noMovement ? [0, 0, 0, 0] : [input.serviceValue, input.deductions, input.ownIss, input.retainedIss];
  if (values.some((value) => value < 0)) throw new TributarioS4Error("Os valores da DMS não podem ser negativos.");
  return db.nfseDmsDeclaration.create({ data: { protocol: `DMS-${randomUUID().slice(0, 8).toUpperCase()}`, taxpayerId: taxpayer.id, economicRegistrationId: input.economicRegistrationId || null, competence: required(input.competence, "Competência"), direction: required(input.direction, "Direção"), channel: required(input.channel, "Canal"), detailMode: required(input.detailMode, "Detalhamento"), noMovement: input.noMovement, rectifiesDeclarationId: input.rectifiesDeclarationId || null, serviceValueDecimal: values[0], deductionValueDecimal: values[1], ownIssDecimal: values[2], retainedIssDecimal: values[3], payload: asJson(input.payload ?? {}), createdByUsuarioId: actor?.usuarioId } });
}

export async function createDeductionCredit(db: PrismaClient, actor: TaxActor, input: { taxpayerId: string; economicRegistrationId?: string; creditType: string; originDocument: string; constructionReference?: string; amount: number }) {
  const amount = money(input.amount);
  if (amount.lessThanOrEqualTo(0)) throw new TributarioS4Error("O crédito deve ser maior que zero.");
  return db.nfseDeductionCredit.create({ data: { taxpayerId: input.taxpayerId, economicRegistrationId: input.economicRegistrationId || null, creditType: required(input.creditType, "Tipo"), originDocument: required(input.originDocument, "Documento de origem"), constructionReference: input.constructionReference?.trim() || null, originalAmountDecimal: amount, availableAmountDecimal: amount, createdByUsuarioId: actor.usuarioId } });
}

export async function createOccasionalRequest(db: PrismaClient, actor: TaxActor, input: { providerTaxpayerId: string; takerTaxpayerId?: string; serviceActivityId: string; serviceDescription: string; serviceValue: number; deductions: number; paymentRequired: boolean }) {
  const activity = await db.taxServiceActivity.findFirst({ where: { id: input.serviceActivityId, isActive: true } });
  if (!activity?.issRate) throw new TributarioS4Error("Atividade sem alíquota configurada.");
  const calc = calculateNfse({ serviceValue: input.serviceValue, deductions: input.deductions, ratePercent: activity.issRate, retained: false });
  return db.nfseOccasionalRequest.create({ data: { requestNumber: await db.$transaction((tx) => nextNumber(tx, "NFSE_AVULSA", "NSA")), providerTaxpayerId: input.providerTaxpayerId, takerTaxpayerId: input.takerTaxpayerId || null, serviceActivityId: activity.id, serviceDescription: required(input.serviceDescription, "Descrição"), serviceValueDecimal: calc.serviceValue, deductionValueDecimal: calc.deductions, taxAmountDecimal: calc.iss, paymentRequired: input.paymentRequired, createdByUsuarioId: actor.usuarioId } });
}

export async function approveOccasionalRequest(db: PrismaClient, actor: TaxActor, id: string) {
  const request = await db.nfseOccasionalRequest.findUnique({ where: { id } });
  if (!request || request.status !== "SOLICITADA") throw new TributarioS4Error("Solicitação avulsa indisponível.");
  const defaults = await ensureTributarioS4Defaults(db);
  const assessment = await db.$transaction(async (tx) => {
    const number = await nextNumber(tx, "ASSESSMENT", "LAN");
    return tx.taxAssessment.create({ data: { year: new Date().getUTCFullYear(), assessmentNumber: number, competence: new Date(), originalValue: Number(request.taxAmountDecimal), originalValueDecimal: request.taxAmountDecimal, taxableBaseDecimal: request.serviceValueDecimal.minus(request.deductionValueDecimal), rate: 3, discountValueDecimal: 0, interestValueDecimal: 0, penaltyValueDecimal: 0, correctionValueDecimal: 0, finalValueDecimal: request.taxAmountDecimal, calculationSnapshot: { origin: "NFSE_AVULSA", requestId: request.id }, status: "Lançado", taxId: defaults.tax.id, taxpayerId: request.providerTaxpayerId } });
  });
  let guideId: string | null = null;
  if (request.paymentRequired) {
    const guide = await generateTaxGuide(db, actor, { assessmentId: assessment.id, dueDate: new Date(Date.UTC(assessment.year, 11, 31, 12)) }); guideId = guide.id;
  }
  return db.nfseOccasionalRequest.update({ where: { id: request.id }, data: { status: request.paymentRequired ? "AGUARDANDO_PAGAMENTO" : "APROVADA", assessmentId: assessment.id, guideId, approvedAt: new Date() } });
}

export async function releaseOccasionalRequest(db: PrismaClient, actor: TaxActor, id: string, economicRegistrationId: string) {
  const request = await db.nfseOccasionalRequest.findUnique({ where: { id } });
  if (!request || !["APROVADA", "AGUARDANDO_PAGAMENTO"].includes(request.status)) throw new TributarioS4Error("Solicitação avulsa indisponível para liberação.");
  if (request.paymentRequired) {
    const guide = request.guideId ? await db.taxGuide.findUnique({ where: { id: request.guideId }, include: { payments: { where: { status: "Confirmado" } } } }) : null;
    const paid = guide?.payments.reduce((sum, payment) => sum.plus(payment.amountPaidDecimal ?? payment.amountPaid), new Prisma.Decimal(0)) ?? new Prisma.Decimal(0);
    if (!guide || (guide.status !== "Paga" && paid.lessThan(guide.totalValueDecimal ?? guide.totalValue))) throw new TributarioS4Error("A NFS-e avulsa só pode ser liberada após pagamento confirmado.");
  }
  return emitNfse(db, actor, { providerId: request.providerTaxpayerId, takerId: request.takerTaxpayerId ?? undefined, economicRegistrationId, serviceActivityId: request.serviceActivityId, competence: `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`, serviceDescription: request.serviceDescription, serviceValue: Number(request.serviceValueDecimal), manualDeductions: Number(request.deductionValueDecimal), retained: false, source: "AVULSA", occasionalRequestId: request.id });
}
