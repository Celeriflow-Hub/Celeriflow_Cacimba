import { Prisma, type PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { calculateItbi, canDeleteDteMessage, dteDeadline, nextPowerOfAttorneyStatus, TributarioS3Error } from "./s3-engine";
import { generateTaxGuide, type TaxActor } from "./index";

type Db = PrismaClient | Prisma.TransactionClient;

function required(value: string, label: string) {
  const text = value.trim();
  if (!text) throw new TributarioS3Error(`${label} é obrigatório.`);
  return text;
}

async function nextDocumentNumber(tx: Prisma.TransactionClient, documentType: string, prefix: string) {
  const year = new Date().getUTCFullYear();
  const sequence = await tx.taxDocumentSequence.upsert({
    where: { year_documentType: { year, documentType } },
    create: { year, documentType, currentValue: 1 },
    update: { currentValue: { increment: 1 } },
  });
  return `${prefix}-${year}-${String(sequence.currentValue).padStart(7, "0")}`;
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function secretHash(value: string) { return createHash("sha256").update(value).digest("hex"); }

export async function ensureTributarioS3Defaults(db: PrismaClient) {
  await Promise.all([
    db.itbiTransactionType.upsert({
      where: { code: "COMPRA_VENDA" },
      create: { code: "COMPRA_VENDA", name: "Compra e venda", rate: 2, damStage: "APROVACAO", cadastralUpdateMode: "CONFIGURAVEL", legalBasis: "Parâmetro demonstrativo: alíquota persistida de 2%." },
      update: {},
    }),
    db.itbiTransactionType.upsert({
      where: { code: "CESSAO_DIREITOS" },
      create: { code: "CESSAO_DIREITOS", name: "Cessão de direitos", rate: 2, damStage: "APROVACAO", cadastralUpdateMode: "MANUAL", legalBasis: "Regra demonstrativa sujeita à legislação municipal." },
      update: {},
    }),
    db.dteCategory.upsert({ where: { code: "INTIMACAO" }, create: { code: "INTIMACAO", name: "Intimação fiscal", retentionRequired: true, defaultDeadlineDays: 5 }, update: {} }),
    db.dteCategory.upsert({ where: { code: "AVISO" }, create: { code: "AVISO", name: "Aviso informativo", retentionRequired: false, defaultDeadlineDays: 5 }, update: {} }),
    db.dteCategory.upsert({ where: { code: "DOCUMENTO" }, create: { code: "DOCUMENTO", name: "Documento fiscal", retentionRequired: true, defaultDeadlineDays: 5 }, update: {} }),
  ]);
}

async function propertyDebts(db: Db, realEstateId: string) {
  const assessments = await db.taxAssessment.findMany({
    where: { realEstateId, status: { not: "Cancelado" } },
    include: { guides: { where: { status: { not: "Cancelada" } }, include: { payments: { where: { status: "Confirmado" } } } } },
  });
  const blockingTaxDebt = assessments.reduce((total, assessment) => {
    const constituted = new Prisma.Decimal(assessment.finalValueDecimal ?? assessment.originalValueDecimal ?? assessment.originalValue);
    const paid = assessment.guides.flatMap((guide) => guide.payments).reduce((sum, payment) => sum.plus(payment.amountPaidDecimal ?? payment.amountPaid), new Prisma.Decimal(0));
    return total.plus(Prisma.Decimal.max(constituted.minus(paid), 0));
  }, new Prisma.Decimal(0));
  const entries = await db.taxRegistryEntry.findMany({ where: { entityType: "REAL_ESTATE", entityId: realEstateId, category: "NON_TAX_PROPERTY_DEBT", status: { in: ["ATIVO", "PENDENTE"] } } });
  const nonTaxDebtAmount = entries.reduce((total, entry) => {
    const data = entry.data && typeof entry.data === "object" && !Array.isArray(entry.data) ? entry.data as Record<string, Prisma.JsonValue> : {};
    return total.plus(Number(data.amount ?? 0));
  }, new Prisma.Decimal(0));
  return { blockingTaxDebt, nonTaxDebtAmount };
}

export async function createItbiDeclaration(db: PrismaClient, actor: TaxActor, input: {
  transactionTypeId: string; realEstateId: string; processId: string; registryOffice: string; transmittedFractionPercent: number;
  declaredPropertyValue: number; sellerTaxpayerId: string; buyers: { taxpayerId: string; sharePercent: number }[];
  responsibleTaxpayerId?: string; responsibilityType?: "SOLIDARIO" | "SUBSIDIARIO"; isLeasehold?: boolean; leaseholdDetails?: string;
  cadastralUpdateMode: "MANUAL" | "AUTO_ON_APPROVAL";
}) {
  return db.$transaction(async (tx) => {
    const [transactionType, property, process] = await Promise.all([
      tx.itbiTransactionType.findFirst({ where: { id: input.transactionTypeId, isActive: true } }),
      tx.realEstate.findUnique({ where: { id: input.realEstateId } }),
      tx.process.findUnique({ where: { id: input.processId } }),
    ]);
    if (!transactionType) throw new TributarioS3Error("Selecione um tipo de transmissão ativo.");
    if (!property) throw new TributarioS3Error("Imóvel não encontrado.");
    if (!process) throw new TributarioS3Error("Selecione um processo/protocolo existente.");
    const partyIds = [input.sellerTaxpayerId, ...input.buyers.map((buyer) => buyer.taxpayerId), input.responsibleTaxpayerId].filter(Boolean) as string[];
    const taxpayers = await tx.taxpayer.count({ where: { id: { in: [...new Set(partyIds)] }, status: "Ativo" } });
    if (taxpayers !== new Set(partyIds).size) throw new TributarioS3Error("Uma das partes não é contribuinte ativo.");
    if (input.buyers.some((buyer) => buyer.taxpayerId === input.sellerTaxpayerId)) throw new TributarioS3Error("Transmitente e adquirente devem ser partes distintas.");
    const calculation = calculateItbi({ propertyValue: input.declaredPropertyValue, transmittedFractionPercent: input.transmittedFractionPercent, ratePercent: transactionType.rate, buyerSharesPercent: input.buyers.map((buyer) => buyer.sharePercent) });
    const debts = await propertyDebts(tx, property.id);
    const declarationNumber = await nextDocumentNumber(tx, "ITBI_DECLARATION", "ITBI");
    const declaration = await tx.itbiDeclaration.create({ data: {
      declarationNumber, transactionTypeId: transactionType.id, realEstateId: property.id, processId: process.id, protocolNumber: process.protocolNumber,
      registryOffice: required(input.registryOffice, "Cartório"), transmissionScope: calculation.fraction.equals(100) ? "INTEGRAL" : "PARCIAL",
      transmittedFraction: calculation.fraction, declaredPropertyValue: calculation.propertyValue, taxableBase: calculation.taxableBase,
      appliedRate: calculation.rate, taxAmount: calculation.taxAmount, blockingTaxDebt: debts.blockingTaxDebt, nonTaxDebtAmount: debts.nonTaxDebtAmount,
      calculationSnapshot: json({ formula: "valorImovel × fracaoTransmitida × aliquota", propertyValue: calculation.propertyValue.toFixed(2), fractionPercent: calculation.fraction.toString(), taxableBase: calculation.taxableBase.toFixed(2), ratePercent: calculation.rate.toString(), taxAmount: calculation.taxAmount.toFixed(2), allocations: calculation.allocations.map((allocation, index) => ({ taxpayerId: input.buyers[index].taxpayerId, sharePercent: allocation.sharePercent.toString(), transmittedValue: allocation.transmittedValue.toFixed(2), taxAmount: allocation.taxAmount.toFixed(2) })) }),
      isLeasehold: Boolean(input.isLeasehold), leaseholdDetails: input.leaseholdDetails?.trim() || null, cadastralUpdateMode: input.cadastralUpdateMode,
      createdByUsuarioId: actor.usuarioId,
      parties: { create: [
        { taxpayerId: input.sellerTaxpayerId, role: "TRANSMITENTE", participationPercent: 100, sortOrder: 0 },
        ...input.buyers.map((buyer, index) => ({ taxpayerId: buyer.taxpayerId, role: "ADQUIRENTE", participationPercent: buyer.sharePercent, sortOrder: index + 1 })),
        ...(input.responsibleTaxpayerId ? [{ taxpayerId: input.responsibleTaxpayerId, role: "RESPONSAVEL", liabilityType: input.responsibilityType ?? "SOLIDARIO", sortOrder: 99 }] : []),
      ] },
      events: { create: { eventType: "DECLARACAO_CRIADA", description: "Declaração criada com cálculo persistido.", actorUsuarioId: actor.usuarioId, payload: json({ protocolNumber: process.protocolNumber }) } },
    }, include: { parties: true } });
    return declaration;
  });
}

export async function transmitItbiDeclaration(db: PrismaClient, actor: TaxActor, declarationId: string) {
  return db.$transaction(async (tx) => {
    const declaration = await tx.itbiDeclaration.findUnique({ where: { id: declarationId }, include: { transactionType: true, parties: true } });
    if (!declaration || declaration.status !== "RASCUNHO") throw new TributarioS3Error("Somente declaração em rascunho pode ser transmitida.");
    if (!declaration.processId) throw new TributarioS3Error("A transmissão exige processo/protocolo vinculado.");
    if (declaration.transactionType.requiresDebtClearance && declaration.blockingTaxDebt.greaterThan(0)) throw new TributarioS3Error(`O imóvel possui ${declaration.blockingTaxDebt.toFixed(2)} em débitos tributários pendentes.`);
    const buyer = declaration.parties.find((party) => party.role === "ADQUIRENTE");
    if (!buyer) throw new TributarioS3Error("A declaração não possui adquirente.");
    await tx.taxServiceRequest.create({ data: { serviceType: "ITBI", status: "EM_ANALISE_INTERNA", taxpayerId: buyer.taxpayerId, processId: declaration.processId, notes: `Declaração ${declaration.declarationNumber}` } });
    const updated = await tx.itbiDeclaration.update({ where: { id: declaration.id }, data: { status: "PROTOCOLADA", events: { create: { eventType: "DECLARACAO_PROTOCOLADA", description: `Transmitida no protocolo ${declaration.protocolNumber}.`, actorUsuarioId: actor.usuarioId } } } });
    return updated;
  });
}

export async function analyzeItbiDeclaration(db: PrismaClient, actor: TaxActor, input: { declarationId: string; approved: boolean; notes: string }) {
  return db.$transaction(async (tx) => {
    const declaration = await tx.itbiDeclaration.findUnique({ where: { id: input.declarationId }, include: { parties: true, transactionType: true } });
    if (!declaration || !["PROTOCOLADA", "EM_ANALISE"].includes(declaration.status)) throw new TributarioS3Error("A declaração não está disponível para análise.");
    const now = new Date();
    if (!input.approved) return tx.itbiDeclaration.update({ where: { id: declaration.id }, data: { status: "INDEFERIDA", analysisNotes: required(input.notes, "Motivo"), analyzedAt: now, events: { create: { eventType: "ANALISE_INDEFERIDA", description: input.notes.trim(), actorUsuarioId: actor.usuarioId } } } });
    const buyer = declaration.parties.find((party) => party.role === "ADQUIRENTE");
    if (!buyer) throw new TributarioS3Error("A declaração não possui adquirente.");
    const existingTax = await tx.tax.findFirst({ where: { name: { equals: "ITBI", mode: "insensitive" } }, orderBy: { createdAt: "asc" } });
    const tax = existingTax ? await tx.tax.update({ where: { id: existingTax.id }, data: { isActive: true } }) : await tx.tax.create({ data: { name: "ITBI", taxType: "Imposto", isActive: true } });
    const year = now.getUTCFullYear();
    const assessmentNumber = await nextDocumentNumber(tx, "ASSESSMENT", "LAN");
    const assessment = await tx.taxAssessment.create({ data: {
      year, assessmentNumber, competence: now, originalValue: Number(declaration.taxAmount), originalValueDecimal: declaration.taxAmount,
      taxableBaseDecimal: declaration.taxableBase, rate: declaration.appliedRate, discountValueDecimal: 0, interestValueDecimal: 0, penaltyValueDecimal: 0,
      correctionValueDecimal: 0, finalValueDecimal: declaration.taxAmount, status: "Lançado", calculationSnapshot: json(declaration.calculationSnapshot),
      taxId: tax.id, taxpayerId: buyer.taxpayerId, realEstateId: declaration.realEstateId,
    } });
    if (declaration.cadastralUpdateMode === "AUTO_ON_APPROVAL") await tx.realEstate.update({ where: { id: declaration.realEstateId }, data: { taxpayerId: buyer.taxpayerId } });
    return tx.itbiDeclaration.update({ where: { id: declaration.id }, data: {
      status: "APROVADA", assessmentId: assessment.id, analysisNotes: input.notes.trim() || "Análise aprovada.", analyzedAt: now,
      cadastralUpdatedAt: declaration.cadastralUpdateMode === "AUTO_ON_APPROVAL" ? now : null,
      events: { create: { eventType: "ANALISE_APROVADA", description: "Análise aprovada e crédito tributário constituído.", actorUsuarioId: actor.usuarioId, payload: json({ assessmentId: assessment.id, cadastralUpdateMode: declaration.cadastralUpdateMode }) } },
    } });
  });
}

export async function issueItbiDam(db: PrismaClient, actor: TaxActor, declarationId: string) {
  const declaration = await db.itbiDeclaration.findUnique({ where: { id: declarationId } });
  if (!declaration?.assessmentId || declaration.guideId) throw new TributarioS3Error("A declaração deve estar aprovada e sem DAM ativo.");
  const year = new Date().getUTCFullYear();
  const dueDate = new Date(Date.UTC(year, 11, 31, 12));
  const guide = await generateTaxGuide(db, actor, { assessmentId: declaration.assessmentId, dueDate });
  await db.itbiDeclaration.update({ where: { id: declaration.id }, data: { guideId: guide.id, status: "DAM_EMITIDO", events: { create: { eventType: "DAM_EMITIDO", description: `DAM ${guide.guideNumber ?? guide.id} emitido.`, actorUsuarioId: actor.usuarioId, payload: json({ guideId: guide.id }) } } } });
  return guide;
}

export async function generateItbiDocument(db: PrismaClient, actor: TaxActor, declarationId: string) {
  return db.$transaction(async (tx) => {
    const declaration = await tx.itbiDeclaration.findUnique({ where: { id: declarationId } });
    if (!declaration || !["APROVADA", "DAM_EMITIDO", "DOCUMENTO_EMITIDO"].includes(declaration.status)) throw new TributarioS3Error("O documento exige declaração aprovada.");
    if (declaration.documentId) return tx.document.findUniqueOrThrow({ where: { id: declaration.documentId } });
    const document = await tx.document.create({ data: { title: `Documento de transmissão ${declaration.declarationNumber}`, documentType: "ITBI", fileUrl: `/tributacao/itbi/${declaration.id}/documento`, status: "Válido", publicLabel: "Documento interno de ITBI", notes: "Documento municipal. Não substitui o registro civil da propriedade." } });
    await tx.itbiDeclaration.update({ where: { id: declaration.id }, data: { documentId: document.id, status: "DOCUMENTO_EMITIDO", events: { create: { eventType: "DOCUMENTO_EMITIDO", description: "Documento de transmissão registrado no GED.", actorUsuarioId: actor.usuarioId, payload: json({ documentId: document.id }) } } } });
    return document;
  });
}

export async function createDteMailbox(db: PrismaClient, input: { taxpayerId: string; establishmentCnpj?: string; emailNoticeEnabled: boolean; smsNoticeEnabled: boolean }) {
  const taxpayer = await db.taxpayer.findFirst({ where: { id: input.taxpayerId, status: "Ativo" }, include: { company: true } });
  if (!taxpayer) throw new TributarioS3Error("Contribuinte ativo não encontrado.");
  const cnpj = input.establishmentCnpj?.replace(/\D/g, "") || taxpayer.company?.cnpj || null;
  const existing = await db.dteMailbox.findFirst({ where: { taxpayerId: taxpayer.id, establishmentCnpj: cnpj } });
  if (existing?.confirmedAt && existing.status === "ATIVA") return { mailbox: await db.dteMailbox.update({ where: { id: existing.id }, data: { emailNoticeEnabled: input.emailNoticeEnabled, smsNoticeEnabled: input.smsNoticeEnabled } }), confirmationToken: null };
  const confirmationToken = randomBytes(24).toString("base64url");
  const confirmationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const mailbox = existing
    ? await db.dteMailbox.update({ where: { id: existing.id }, data: { status: "PENDENTE_CONFIRMACAO", emailNoticeEnabled: input.emailNoticeEnabled, smsNoticeEnabled: input.smsNoticeEnabled, confirmationTokenHash: secretHash(confirmationToken), confirmationExpiresAt } })
    : await db.dteMailbox.create({ data: { taxpayerId: taxpayer.id, establishmentCnpj: cnpj, status: "PENDENTE_CONFIRMACAO", emailNoticeEnabled: input.emailNoticeEnabled, smsNoticeEnabled: input.smsNoticeEnabled, confirmationTokenHash: secretHash(confirmationToken), confirmationExpiresAt } });
  return { mailbox, confirmationToken };
}

export async function confirmDteMailbox(db: PrismaClient, token: string) {
  const tokenHash = secretHash(required(token, "Token de confirmação"));
  const mailbox = await db.dteMailbox.findFirst({ where: { confirmationTokenHash: tokenHash } });
  if (!mailbox?.confirmationExpiresAt || mailbox.confirmationExpiresAt < new Date()) throw new TributarioS3Error("Token de confirmação inválido ou expirado.");
  return db.dteMailbox.update({ where: { id: mailbox.id }, data: { status: "ATIVA", confirmedAt: new Date(), confirmationTokenHash: null, confirmationExpiresAt: null } });
}

export async function createDteAccessGrant(db: PrismaClient, actor: TaxActor, input: { mailboxId: string; authorizedTaxpayerId: string; validUntil: Date }) {
  const [mailbox, authorized] = await Promise.all([
    db.dteMailbox.findFirst({ where: { id: input.mailboxId, status: "ATIVA" } }),
    db.taxpayer.findFirst({ where: { id: input.authorizedTaxpayerId, status: "Ativo" } }),
  ]);
  if (!mailbox) throw new TributarioS3Error("A caixa postal deve estar ativa e confirmada.");
  if (!authorized) throw new TributarioS3Error("Usuário autorizado não encontrado como contribuinte ativo.");
  if (input.validUntil <= new Date()) throw new TributarioS3Error("A validade do código deve ser futura.");
  const accessCode = randomBytes(12).toString("base64url");
  const grant = await db.dteAccessGrant.create({ data: { mailboxId: mailbox.id, authorizedTaxpayerId: authorized.id, codeHash: secretHash(accessCode), codeLast4: accessCode.slice(-4), validUntil: input.validUntil, createdByUsuarioId: actor.usuarioId } });
  return { grant, accessCode };
}

export async function validateDteAccessGrant(db: PrismaClient, input: { accessCode: string; authorizedTaxpayerId: string }) {
  const grant = await db.dteAccessGrant.findFirst({ where: { codeHash: secretHash(required(input.accessCode, "Código de acesso")), authorizedTaxpayerId: input.authorizedTaxpayerId }, include: { mailbox: true } });
  if (!grant || grant.status !== "ATIVO" || grant.revokedAt || grant.validUntil < new Date() || grant.mailbox.status !== "ATIVA") throw new TributarioS3Error("Código inválido, expirado ou revogado para este usuário.");
  return grant.mailbox;
}

export async function revokeDteAccessGrant(db: PrismaClient, id: string) {
  const grant = await db.dteAccessGrant.findUnique({ where: { id } });
  if (!grant || grant.status !== "ATIVO") throw new TributarioS3Error("Código de acesso não está ativo.");
  return db.dteAccessGrant.update({ where: { id }, data: { status: "REVOGADO", revokedAt: new Date() } });
}

export async function sendDteMessages(db: PrismaClient, actor: TaxActor, input: {
  mailboxIds: string[]; categoryId: string; subject: string; body: string; idempotencyBase: string; processId?: string; documentId?: string; signatureRequired?: boolean;
}) {
  const mailboxIds = [...new Set(input.mailboxIds.filter(Boolean))];
  if (!mailboxIds.length) throw new TributarioS3Error("Selecione ao menos uma caixa postal.");
  return db.$transaction(async (tx) => {
    const [category, mailboxes, process, document] = await Promise.all([
      tx.dteCategory.findFirst({ where: { id: input.categoryId, isActive: true } }),
      tx.dteMailbox.findMany({ where: { id: { in: mailboxIds }, status: "ATIVA" } }),
      input.processId ? tx.process.findUnique({ where: { id: input.processId } }) : null,
      input.documentId ? tx.document.findUnique({ where: { id: input.documentId } }) : null,
    ]);
    if (!category) throw new TributarioS3Error("Categoria DTE ativa não encontrada.");
    if (mailboxes.length !== mailboxIds.length) throw new TributarioS3Error("Uma das caixas postais não está ativa.");
    if (input.processId && !process) throw new TributarioS3Error("Processo não encontrado.");
    if (input.documentId && !document) throw new TributarioS3Error("Documento GED não encontrado.");
    if (input.signatureRequired && !document) throw new TributarioS3Error("A pendência de assinatura exige documento GED.");
    const availableAt = new Date();
    const batchKey = mailboxIds.length > 1 ? required(input.idempotencyBase, "Chave do lote") : null;
    const results = [];
    for (const mailbox of mailboxes) {
      const idempotencyKey = `DTE:${required(input.idempotencyBase, "Chave de envio")}:${mailbox.id}`;
      const existing = await tx.dteMessage.findUnique({ where: { idempotencyKey } });
      if (existing) { results.push(existing); continue; }
      const message = await tx.dteMessage.create({ data: {
        mailboxId: mailbox.id, categoryId: category.id, subject: required(input.subject, "Assunto"), body: required(input.body, "Mensagem"), processId: input.processId,
        documentId: input.documentId, batchKey, idempotencyKey, availableAt, deadlineAt: dteDeadline(availableAt, category.defaultDeadlineDays),
        emailNoticeAt: mailbox.emailNoticeEnabled ? availableAt : null, smsNoticeAt: mailbox.smsNoticeEnabled ? availableAt : null,
        signatureRequired: Boolean(input.signatureRequired), signatureStatus: input.signatureRequired ? "PENDENTE" : null, createdByUsuarioId: actor.usuarioId,
        events: { create: [
          { eventType: "DISPONIBILIZADA", description: "Comunicação disponibilizada na caixa postal.", actorUsuarioId: actor.usuarioId },
          ...((mailbox.emailNoticeEnabled || mailbox.smsNoticeEnabled) ? [{ eventType: "AVISO_EXTERNO", description: "Aviso externo registrado sem produzir leitura ou ciência.", actorUsuarioId: actor.usuarioId }] : []),
        ] },
      } });
      results.push(message);
    }
    return results;
  });
}

export async function registerDteReading(db: PrismaClient, actor: TaxActor, messageId: string) {
  return db.$transaction(async (tx) => {
    const message = await tx.dteMessage.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) throw new TributarioS3Error("Mensagem indisponível.");
    if (message.readAt) return message;
    const now = new Date();
    return tx.dteMessage.update({ where: { id: message.id }, data: { readAt: now, status: "LIDA", events: { create: { eventType: "LEITURA", description: "Leitura efetiva registrada no DTE.", actorUsuarioId: actor.usuarioId } } } });
  });
}

export async function acknowledgeDteMessage(db: PrismaClient, actor: TaxActor, messageId: string) {
  return db.$transaction(async (tx) => {
    const message = await tx.dteMessage.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) throw new TributarioS3Error("Mensagem indisponível.");
    if (message.acknowledgedAt || message.tacitAcknowledgedAt) return message;
    const now = new Date();
    return tx.dteMessage.update({ where: { id: message.id }, data: { readAt: message.readAt ?? now, acknowledgedAt: now, status: "CIENCIA_EXPRESSA", events: { create: { eventType: "CIENCIA_EXPRESSA", description: "Ciência expressa registrada.", actorUsuarioId: actor.usuarioId } } } });
  });
}

export async function applyDteTacitAcknowledgement(db: PrismaClient, actor: TaxActor, messageId: string, now = new Date()) {
  return db.$transaction(async (tx) => {
    const message = await tx.dteMessage.findUnique({ where: { id: messageId } });
    if (!message?.deadlineAt || message.deletedAt) throw new TributarioS3Error("Mensagem indisponível ou sem prazo.");
    if (message.readAt || message.acknowledgedAt || message.tacitAcknowledgedAt) throw new TributarioS3Error("A mensagem já possui leitura ou ciência registrada.");
    if (now < message.deadlineAt) throw new TributarioS3Error("O prazo para ciência tácita ainda não expirou.");
    return tx.dteMessage.update({ where: { id: message.id }, data: { tacitAcknowledgedAt: message.deadlineAt, status: "CIENCIA_TACITA", events: { create: { eventType: "CIENCIA_TACITA", description: "Ciência tácita registrada após expiração do prazo configurado.", actorUsuarioId: actor.usuarioId } } } });
  });
}

export async function deleteDteMessage(db: PrismaClient, actor: TaxActor, messageId: string) {
  return db.$transaction(async (tx) => {
    const message = await tx.dteMessage.findUnique({ where: { id: messageId }, include: { category: true } });
    if (!message || message.deletedAt) throw new TributarioS3Error("Mensagem indisponível.");
    if (!canDeleteDteMessage({ retentionRequired: message.category.retentionRequired, acknowledged: Boolean(message.acknowledgedAt || message.tacitAcknowledgedAt), signatureRequired: message.signatureRequired })) throw new TributarioS3Error("A classificação, ciência ou assinatura exige preservação desta mensagem.");
    return tx.dteMessage.update({ where: { id: message.id }, data: { deletedAt: new Date(), status: "EXCLUIDA", events: { create: { eventType: "EXCLUSAO_LOGICA", description: "Mensagem dispensável removida da caixa; histórico preservado.", actorUsuarioId: actor.usuarioId } } } });
  });
}

export async function createDtePowerOfAttorney(db: PrismaClient, actor: TaxActor, input: {
  actorTaxpayerId: string; grantorTaxpayerId: string; attorneyTaxpayerId: string; establishmentCnpjs: string[]; validUntil?: Date; documentId?: string; legitimacyMode: "AUTHENTICATED_INTERNAL" | "ICP_VALIDATED"; officialCertificateValidated?: boolean; legitimacyEvidence?: string;
}) {
  if (input.actorTaxpayerId !== input.grantorTaxpayerId) throw new TributarioS3Error("Procurador não pode criar nova procuração por substabelecimento.");
  if (input.grantorTaxpayerId === input.attorneyTaxpayerId) throw new TributarioS3Error("Outorgante e procurador devem ser diferentes.");
  if (input.legitimacyMode === "ICP_VALIDATED" && !input.officialCertificateValidated) throw new TributarioS3Error("Não há validação ICP-Brasil oficial para este ato.");
  const cnpjs = [...new Set(input.establishmentCnpjs.map((cnpj) => cnpj.replace(/\D/g, "")).filter((cnpj) => cnpj.length === 14))];
  if (!cnpjs.length) throw new TributarioS3Error("Informe ao menos um CNPJ completo para o escopo.");
  return db.$transaction(async (tx) => {
    const taxpayers = await tx.taxpayer.count({ where: { id: { in: [input.grantorTaxpayerId, input.attorneyTaxpayerId] }, status: "Ativo" } });
    if (taxpayers !== 2) throw new TributarioS3Error("Outorgante ou procurador não está ativo.");
    if (input.documentId && !(await tx.document.findUnique({ where: { id: input.documentId } }))) throw new TributarioS3Error("Instrumento GED não encontrado.");
    return tx.dtePowerOfAttorney.create({ data: {
      grantorTaxpayerId: input.grantorTaxpayerId, attorneyTaxpayerId: input.attorneyTaxpayerId, establishmentCnpjs: json(cnpjs), validUntil: input.validUntil,
      documentId: input.documentId, legitimacyMode: input.legitimacyMode, officialCertificateValidated: Boolean(input.officialCertificateValidated), legitimacyEvidence: input.legitimacyEvidence?.trim() || null,
      createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "CRIADA", description: "Procuração criada e pendente de aceite do procurador.", actorUsuarioId: actor.usuarioId } },
    } });
  });
}

export async function transitionDtePowerOfAttorney(db: PrismaClient, actor: TaxActor, id: string, action: "ACEITAR" | "RECUSAR" | "REVOGAR") {
  return db.$transaction(async (tx) => {
    const power = await tx.dtePowerOfAttorney.findUnique({ where: { id } });
    if (!power) throw new TributarioS3Error("Procuração não encontrada.");
    const status = nextPowerOfAttorneyStatus(power.status, action);
    const now = new Date();
    return tx.dtePowerOfAttorney.update({ where: { id }, data: {
      status, acceptedAt: action === "ACEITAR" ? now : power.acceptedAt, refusedAt: action === "RECUSAR" ? now : power.refusedAt, revokedAt: action === "REVOGAR" ? now : power.revokedAt,
      events: { create: { eventType: action, description: `Procuração ${status.toLowerCase()}; escopo e histórico preservados.`, actorUsuarioId: actor.usuarioId } },
    } });
  });
}
