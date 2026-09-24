import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { calculateDesifAssessment, calculatePackageMovement, calculateTrialBalance, canIssueDesifReceipt, TributarioS6Error } from "./s6-engine";

type Actor = { usuarioId: string; employeeId?: string | null };
type AssessmentRow = { agencyId: string; subtitleId: string; revenue: number; deduction?: number; rate?: number; credit?: number; debitAdjustment?: number };
type TrialRow = { agencyId: string; pgccAccountId: string; openingBalance: number; credits: number; debits: number; declaredClose: number; nature: "CREDORA" | "DEVEDORA" };
type PackageRow = { agencyId: string; packageId: string; accountHolders: number; collectedRevenue: number; rate: number };
export type DesifPayload = { assessments?: AssessmentRow[]; trialBalances?: TrialRow[]; packageMovements?: PackageRow[] };

function json(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
function date(value: string) { const result = new Date(`${value}T12:00:00.000Z`); if (Number.isNaN(result.getTime())) throw new TributarioS6Error("Informe uma data válida."); return result; }
function competenceDate(value: string) { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new TributarioS6Error("Competência deve estar no formato AAAA-MM."); return new Date(`${value}-01T12:00:00.000Z`); }
function digits(value: string) { return value.replace(/\D/g, ""); }

export async function createDesifInstitution(db: PrismaClient, input: { taxpayerId?: string; name: string; baseCnpj: string; validFrom: string }) {
  const baseCnpj = digits(input.baseCnpj).slice(0, 8); if (baseCnpj.length !== 8) throw new TributarioS6Error("Informe os oito dígitos do CNPJ base.");
  return db.desifFinancialInstitution.upsert({ where: { baseCnpj }, create: { taxpayerId: input.taxpayerId || null, name: input.name.trim(), baseCnpj, validFrom: date(input.validFrom) }, update: { taxpayerId: input.taxpayerId || null, name: input.name.trim(), status: "ATIVA" } });
}

export async function createDesifAgency(db: PrismaClient, input: { institutionId: string; economicRegistrationId?: string; code: string; name: string; fullCnpj: string; municipalRegistration?: string; validFrom: string }) {
  const fullCnpj = digits(input.fullCnpj); if (fullCnpj.length !== 14) throw new TributarioS6Error("O CNPJ completo da agência deve ter 14 dígitos.");
  const institution = await db.desifFinancialInstitution.findUnique({ where: { id: input.institutionId } }); if (!institution || !fullCnpj.startsWith(institution.baseCnpj)) throw new TributarioS6Error("A agência deve usar o mesmo CNPJ base da instituição.");
  return db.desifAgency.upsert({ where: { fullCnpj }, create: { institutionId: input.institutionId, economicRegistrationId: input.economicRegistrationId || null, code: input.code.trim(), name: input.name.trim(), fullCnpj, municipalRegistration: input.municipalRegistration || null, validFrom: date(input.validFrom) }, update: { economicRegistrationId: input.economicRegistrationId || null, name: input.name.trim(), municipalRegistration: input.municipalRegistration || null, status: "ATIVA" } });
}

export async function createDesifCatalog(db: PrismaClient, input: { institutionId: string; version: string; validFrom: string; pgccCode: string; pgccName: string; cosifCode: string; cosifName: string; subtitleCode: string; subtitleName: string; rate: number; tariffCode: string; tariffName: string; tariffAmount: number; packageCode: string; packageName: string }) {
  const validFrom = date(input.validFrom);
  return db.$transaction(async tx => {
    const plan = await tx.desifPgccPlan.upsert({ where: { institutionId_version: { institutionId: input.institutionId, version: input.version } }, create: { institutionId: input.institutionId, version: input.version, validFrom }, update: { status: "ATIVO" } });
    const pgcc = await tx.desifPgccAccount.upsert({ where: { planId_code: { planId: plan.id, code: input.pgccCode } }, create: { planId: plan.id, code: input.pgccCode, name: input.pgccName, desifTaxCode: "ISS-BANCARIO", serviceItem: "15.01" }, update: { name: input.pgccName, active: true } });
    const cosif = await tx.desifCosifAccount.upsert({ where: { code_validFrom: { code: input.cosifCode, validFrom } }, create: { code: input.cosifCode, name: input.cosifName, level: 4, nature: "CREDORA", validFrom }, update: { name: input.cosifName, active: true } });
    await tx.desifPgccCosifLink.upsert({ where: { pgccAccountId_cosifAccountId_validFrom: { pgccAccountId: pgcc.id, cosifAccountId: cosif.id, validFrom } }, create: { pgccAccountId: pgcc.id, cosifAccountId: cosif.id, validFrom }, update: { validUntil: null } });
    const subtitle = await tx.desifSubtitle.upsert({ where: { pgccAccountId_code_validFrom: { pgccAccountId: pgcc.id, code: input.subtitleCode, validFrom } }, create: { pgccAccountId: pgcc.id, code: input.subtitleCode, name: input.subtitleName, serviceItem: "15.01", taxRate: input.rate, validFrom }, update: { name: input.subtitleName, taxRate: input.rate, active: true } });
    const tariff = await tx.desifTariff.upsert({ where: { institutionId_code_validFrom: { institutionId: input.institutionId, code: input.tariffCode, validFrom } }, create: { institutionId: input.institutionId, code: input.tariffCode, name: input.tariffName, amountDecimal: input.tariffAmount, validFrom }, update: { name: input.tariffName, amountDecimal: input.tariffAmount, active: true } });
    const pack = await tx.desifPackage.upsert({ where: { institutionId_code_validFrom: { institutionId: input.institutionId, code: input.packageCode, validFrom } }, create: { institutionId: input.institutionId, code: input.packageCode, name: input.packageName, validFrom }, update: { name: input.packageName, active: true } });
    await tx.desifPackageItem.upsert({ where: { packageId_tariffId: { packageId: pack.id, tariffId: tariff.id } }, create: { packageId: pack.id, tariffId: tariff.id, quantity: 1 }, update: { quantity: 1 } });
    return { plan, pgcc, cosif, subtitle, tariff, package: pack };
  });
}

export async function receiveDesifImport(db: PrismaClient, actor: Actor, input: { institutionId: string; agencyId?: string; competence: string; moduleType: string; fileName: string; abrasfVersion: string; signaturePolicy?: "NAO_CONFIGURADA" | "ASSINATURA_INTERNA"; payload: DesifPayload }) {
  competenceDate(input.competence); const raw = JSON.stringify(input.payload); const checksum = createHash("sha256").update(`${input.institutionId}:${input.competence}:${input.fileName}:${raw}`).digest("hex");
  const institution = await db.desifFinancialInstitution.findUnique({ where: { id: input.institutionId } }); if (!institution) throw new TributarioS6Error("Instituição financeira não encontrada.");
  if (input.agencyId) { const agency = await db.desifAgency.findUnique({ where: { id: input.agencyId } }); if (!agency || agency.institutionId !== institution.id) throw new TributarioS6Error("A agência informada não pertence à instituição."); }
  return db.desifImportBatch.upsert({ where: { checksum }, create: { institutionId: institution.id, agencyId: input.agencyId || null, competence: input.competence, moduleType: input.moduleType, fileName: input.fileName, checksum, abrasfVersion: input.abrasfVersion, signaturePolicy: input.signaturePolicy ?? "NAO_CONFIGURADA", signatureStatus: input.signaturePolicy === "ASSINATURA_INTERNA" ? "PENDENTE" : "NAO_VERIFICADA", payload: json(input.payload), createdByUsuarioId: actor.usuarioId }, update: {} });
}

export async function validateDesifImport(db: PrismaClient, actor: Actor, batchId: string) {
  const batch = await db.desifImportBatch.findUnique({ where: { id: batchId } }); if (!batch || batch.status === "PROCESSADO") throw new TributarioS6Error("Importação indisponível para validação.");
  const payload = batch.payload as DesifPayload; const issues: string[] = [];
  if (!batch.abrasfVersion.trim()) issues.push("Versão do leiaute não informada.");
  if (!(payload.assessments?.length || payload.trialBalances?.length || payload.packageMovements?.length)) issues.push("Arquivo sem registros reconhecidos.");
  const agencyIds = new Set([...(payload.assessments ?? []).map(row => row.agencyId), ...(payload.trialBalances ?? []).map(row => row.agencyId), ...(payload.packageMovements ?? []).map(row => row.agencyId)]);
  const agencies = await db.desifAgency.findMany({ where: { id: { in: [...agencyIds] } } }); if (agencies.some(row => row.institutionId !== batch.institutionId) || agencies.length !== agencyIds.size) issues.push("Há agência inexistente ou vinculada a outra instituição.");
  const subtitleIds = [...new Set((payload.assessments ?? []).map(row => row.subtitleId))]; if (subtitleIds.length !== await db.desifSubtitle.count({ where: { id: { in: subtitleIds }, active: true } })) issues.push("Há subtítulo inexistente ou inativo.");
  const accountIds = [...new Set((payload.trialBalances ?? []).map(row => row.pgccAccountId))]; if (accountIds.length !== await db.desifPgccAccount.count({ where: { id: { in: accountIds }, active: true } })) issues.push("Há conta PGCC inexistente ou inativa.");
  const packageIds = [...new Set((payload.packageMovements ?? []).map(row => row.packageId))]; if (packageIds.length !== await db.desifPackage.count({ where: { id: { in: packageIds }, active: true } })) issues.push("Há pacote inexistente ou inativo.");
  for (const row of payload.assessments ?? []) { try { calculateDesifAssessment({ revenue: row.revenue, deduction: row.deduction, rate: row.rate ?? 0, credit: row.credit, debitAdjustment: row.debitAdjustment }); } catch (error) { issues.push(error instanceof Error ? error.message : "Apuração inválida."); } }
  const status = issues.length ? "INCONSISTENTE" : "VALIDADO";
  return db.desifImportBatch.update({ where: { id: batch.id }, data: { status, inconsistencies: json(issues), validationSummary: { records: (payload.assessments?.length ?? 0) + (payload.trialBalances?.length ?? 0) + (payload.packageMovements?.length ?? 0), issues: issues.length, validatedBy: actor.usuarioId }, validatedAt: new Date(), signatureStatus: batch.signaturePolicy === "ASSINATURA_INTERNA" ? "ASSINADA_INTERNAMENTE" : "NAO_VERIFICADA" } });
}

export async function processDesifImport(db: PrismaClient, actor: Actor, batchId: string) {
  const batch = await db.desifImportBatch.findUnique({ where: { id: batchId } }); if (!batch || batch.status !== "VALIDADO") throw new TributarioS6Error("Somente arquivo validado e sem inconsistências pode ser processado.");
  const payload = batch.payload as DesifPayload;
  return db.$transaction(async tx => {
    for (const row of payload.assessments ?? []) {
      const subtitle = await tx.desifSubtitle.findUnique({ where: { id: row.subtitleId } }); if (!subtitle) throw new TributarioS6Error("Subtítulo da apuração não encontrado.");
      const calculation = calculateDesifAssessment({ revenue: row.revenue, deduction: row.deduction, rate: row.rate ?? Number(subtitle.taxRate), credit: row.credit, debitAdjustment: row.debitAdjustment });
      await tx.desifAssessment.create({ data: { importBatchId: batch.id, agencyId: row.agencyId, subtitleId: row.subtitleId, competence: batch.competence, revenueDecimal: calculation.revenue, deductionDecimal: calculation.deduction, taxableBaseDecimal: calculation.taxableBase, rate: calculation.rate, grossTaxDecimal: calculation.grossTax, creditDecimal: calculation.credit, debitAdjustmentDecimal: calculation.debitAdjustment, taxDueDecimal: calculation.taxDue, calculationSnapshot: json({ formula: "(receita - dedução) × alíquota + débito - crédito", ...Object.fromEntries(Object.entries(calculation).map(([key, value]) => [key, value.toFixed(2)])), packageDifferenceIncluded: false }) } });
    }
    for (const row of payload.trialBalances ?? []) { const result = calculateTrialBalance(row); await tx.desifTrialBalance.create({ data: { importBatchId: batch.id, agencyId: row.agencyId, pgccAccountId: row.pgccAccountId, competence: batch.competence, openingBalanceDecimal: result.openingBalance, creditsDecimal: result.credits, debitsDecimal: result.debits, calculatedCloseDecimal: result.calculatedClose, declaredCloseDecimal: result.declaredClose, differenceDecimal: result.difference, inconsistency: result.consistent ? null : `Saldo declarado diverge em R$ ${result.difference.toFixed(2)}.` } }); }
    for (const row of payload.packageMovements ?? []) { const pack = await tx.desifPackage.findUnique({ where: { id: row.packageId }, include: { items: { include: { tariff: true } } } }); if (!pack?.items.length) throw new TributarioS6Error("Pacote sem tarifa vigente."); const tariffTotal = pack.items.reduce((sum, item) => sum.plus(item.tariff.amountDecimal.mul(item.quantity)), new Prisma.Decimal(0)); const result = calculatePackageMovement({ accountHolders: row.accountHolders, tariffAmount: tariffTotal, collectedRevenue: row.collectedRevenue, rate: row.rate }); await tx.desifPackageMovement.create({ data: { importBatchId: batch.id, agencyId: row.agencyId, packageId: row.packageId, competence: batch.competence, accountHolderQuantity: row.accountHolders, potentialRevenueDecimal: result.potentialRevenue, collectedRevenueDecimal: result.collectedRevenue, differenceDecimal: result.difference, assessmentImpactDecimal: result.assessmentImpact, details: { policy: "CONFRONTO_INDEPENDENTE_SEM_DUPLA_CONTAGEM_COSIF", tariffTotal: tariffTotal.toFixed(2), rate: row.rate } } }); }
    const processedAt = new Date(); const receiptNumber = `DESIF-${batch.competence.replace("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    return tx.desifImportBatch.update({ where: { id: batch.id }, data: { status: "PROCESSADO", processedAt, receiptNumber, validationSummary: { processedBy: actor.usuarioId, receiptIssuedAfterProcessing: true } } });
  });
}

export async function issueDesifGuide(db: PrismaClient, assessmentId: string) {
  const row = await db.desifAssessment.findUnique({ where: { id: assessmentId }, include: { agency: { include: { institution: true } } } }); if (!row) throw new TributarioS6Error("Apuração não encontrada."); if (row.guideId) return db.taxGuide.findUnique({ where: { id: row.guideId } });
  const taxpayerId = row.agency.institution.taxpayerId; if (!taxpayerId) throw new TributarioS6Error("Vincule a instituição a um contribuinte antes de gerar a guia.");
  return db.$transaction(async tx => {
    let tax = await tx.tax.findFirst({ where: { name: "ISS Bancário" } }); if (!tax) tax = await tx.tax.create({ data: { name: "ISS Bancário", taxType: "Imposto" } });
    const competence = competenceDate(row.competence); const year = Number(row.competence.slice(0, 4));
    const taxAssessment = await tx.taxAssessment.create({ data: { year, competence, originalValue: Number(row.taxDueDecimal), originalValueDecimal: row.taxDueDecimal, taxableBaseDecimal: row.taxableBaseDecimal, rate: row.rate, finalValueDecimal: row.taxDueDecimal, calculationSnapshot: row.calculationSnapshot as Prisma.InputJsonValue, taxId: tax.id, taxpayerId, economicRegistrationId: row.agency.economicRegistrationId, status: "Lançado" } });
    const dueDate = new Date(); dueDate.setUTCDate(dueDate.getUTCDate() + 30); const guide = await tx.taxGuide.create({ data: { guideNumber: `DAM-DESIF-${randomUUID().slice(0, 10).toUpperCase()}`, totalValue: Number(row.taxDueDecimal), totalValueDecimal: row.taxDueDecimal, dueDate, assessmentId: taxAssessment.id, calculationSnapshot: row.calculationSnapshot as Prisma.InputJsonValue } });
    const document = await tx.document.create({ data: { title: `DAM ISS Bancário ${row.competence}`, documentType: "DAM_DESIF", fileUrl: `/tributacao/iss-bancario/guias/${guide.id}`, status: "Válido", publicLabel: "Guia municipal de ISS Bancário" } });
    await tx.taxGuide.update({ where: { id: guide.id }, data: { documentId: document.id } }); await tx.desifAssessment.update({ where: { id: row.id }, data: { taxAssessmentId: taxAssessment.id, guideId: guide.id, status: "GUIA_EMITIDA" } }); return guide;
  });
}

export async function openDesifFiscalCase(db: PrismaClient, actor: Actor, input: { assessmentId: string; findingType: "OMISSAO" | "DIFERENCA" | "SEM_MOVIMENTO"; processId?: string }) {
  let assessment = await db.desifAssessment.findUnique({ where: { id: input.assessmentId }, include: { agency: { include: { institution: true } } } }); if (!assessment) throw new TributarioS6Error("Apuração não encontrada.");
  if (!assessment.guideId && assessment.agency.institution.taxpayerId) { await issueDesifGuide(db, assessment.id); assessment = await db.desifAssessment.findUniqueOrThrow({ where: { id: assessment.id }, include: { agency: { include: { institution: true } } } }); }
  if (input.processId && !await db.process.findUnique({ where: { id: input.processId } })) throw new TributarioS6Error("Processo informado não existe.");
  return db.$transaction(async tx => {
    const item = await tx.desifFiscalCase.create({ data: { institutionId: assessment.agency.institutionId, agencyId: assessment.agencyId, assessmentId: assessment.id, competence: assessment.competence, findingType: input.findingType, findingDescription: `Fiscalização bancária originada da apuração ${assessment.competence}: ${input.findingType}.`, processId: input.processId || null, guideId: assessment.guideId, serviceOrderNumber: `OS-DESIF-${randomUUID().slice(0, 8).toUpperCase()}`, createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "ABERTA", description: "Ordem de serviço de fiscalização bancária aberta.", actorUsuarioId: actor.usuarioId } } } });
    const [tiaf, map] = await Promise.all([tx.document.create({ data: { title: `TIAF ISS Bancário ${assessment.competence}`, documentType: "TIAF_DESIF", fileUrl: `/tributacao/iss-bancario/fiscalizacoes/${item.id}/tiaf`, status: "Válido", publicLabel: "Termo interno de início da ação fiscal" } }), tx.document.create({ data: { title: `Mapa de apuração bancária ${assessment.competence}`, documentType: "MAPA_DESIF", fileUrl: `/tributacao/iss-bancario/fiscalizacoes/${item.id}/mapa`, status: "Válido", publicLabel: "Mapa de apuração do ISS Bancário" } })]);
    if (input.processId) await Promise.all([tx.processDocument.create({ data: { processId: input.processId, documentId: tiaf.id, purpose: "TIAF da fiscalização bancária" } }), tx.processDocument.create({ data: { processId: input.processId, documentId: map.id, purpose: "Mapa de apuração da fiscalização bancária" } })]);
    let infractionId: string | null = null; const taxpayerId = assessment.agency.institution.taxpayerId; if (taxpayerId) infractionId = (await tx.infraction.create({ data: { infractionType: `ISS Bancário — ${input.findingType}`, penaltyValue: Number(assessment.taxDueDecimal), penaltyValueDecimal: assessment.taxDueDecimal, defenseDeadline: new Date(Date.now() + 30 * 86400000), taxpayerId } })).id;
    return tx.desifFiscalCase.update({ where: { id: item.id }, data: { tiafDocumentId: tiaf.id, mapDocumentId: map.id, infractionId, events: { create: { eventType: "DOCUMENTADA", description: "TIAF, mapa e auto vinculados à ação fiscal.", actorUsuarioId: actor.usuarioId } } } });
  });
}

export async function communicateDesifFiscalCase(db: PrismaClient, actor: Actor, id: string) {
  const item = await db.desifFiscalCase.findUnique({ where: { id }, include: { institution: true } }); if (!item?.institution.taxpayerId) throw new TributarioS6Error("Instituição sem contribuinte vinculado.");
  const mailbox = await db.dteMailbox.findFirst({ where: { taxpayerId: item.institution.taxpayerId, status: "ATIVA" } }); if (!mailbox) throw new TributarioS6Error("Contribuinte sem caixa DTE ativa.");
  let category = await db.dteCategory.findUnique({ where: { code: "FISCALIZACAO_DESIF" } }); if (!category) category = await db.dteCategory.create({ data: { code: "FISCALIZACAO_DESIF", name: "Fiscalização ISS Bancário / DES-IF", defaultDeadlineDays: 15 } });
  const key = `DESIF-FISCAL:${item.id}`; let message = await db.dteMessage.findUnique({ where: { idempotencyKey: key } }); if (!message) message = await db.dteMessage.create({ data: { mailboxId: mailbox.id, categoryId: category.id, subject: `Fiscalização bancária ${item.competence}`, body: item.findingDescription, processId: item.processId, documentId: item.tiafDocumentId, idempotencyKey: key, deadlineAt: new Date(Date.now() + category.defaultDeadlineDays * 86400000), createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "DISPONIBILIZADA", description: "Comunicação de fiscalização disponibilizada no DTE.", actorUsuarioId: actor.usuarioId } } } });
  return db.desifFiscalCase.update({ where: { id }, data: { dteMessageId: message.id, status: "COMUNICADA", events: { create: { eventType: "COMUNICADA_DTE", description: "Comunicação disponibilizada no DTE; aviso externo não equivale à ciência.", actorUsuarioId: actor.usuarioId } } } });
}

export function assertDesifReceipt(batch: { status: string; processedAt: Date | null; receiptNumber: string | null }) { if (!canIssueDesifReceipt(batch.status, batch.processedAt) || !batch.receiptNumber) throw new TributarioS6Error("O recibo só existe após validação e processamento pelo CeleriFlow."); }
