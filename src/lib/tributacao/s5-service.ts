import { Prisma, type PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import type { TaxActor } from "./index";
import { buildExclusionExport, calculateSimplesCrossCheck, classifySimplesDivergences, TributarioS5Error } from "./s5-engine";

const sources = new Set(["PGDAS", "DASN_DEFIS", "DAF607", "PERIODOS_OPCAO", "PARCELAMENTOS", "PGFN", "OUTROS", "PGDAS_RETIFICACAO"]);
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const required = (value: string, label: string) => { const text = value.trim(); if (!text) throw new TributarioS5Error(`${label} é obrigatório.`); return text; };
const decimal = (value: unknown) => new Prisma.Decimal(String(value ?? 0)).toDecimalPlaces(2);
function competenceDate(value: string) { const match = value.match(/^(0[1-9]|1[0-2])\/(\d{4})$/); if (!match) throw new TributarioS5Error("Competência deve estar no formato MM/AAAA."); return new Date(Date.UTC(Number(match[2]), Number(match[1]) - 1, 1, 12)); }

export type SimplesImportRow = { taxpayerId: string; competence?: string; recordType?: string; nationalRevenue?: number; declaredService?: number; taxableBase?: number; rate?: number; municipalIss?: number; confirmedPayment?: number; nationalDasTotal?: number; activityCode?: string; paymentCode?: string; isEstimate?: boolean; regime?: string; startDate?: string; endDate?: string; raw?: unknown };

export async function importSimplesBatch(db: PrismaClient, actor: TaxActor, input: { sourceType: string; fileName: string; competence?: string; rows: SimplesImportRow[] }) {
  const sourceType = required(input.sourceType, "Origem"); if (!sources.has(sourceType)) throw new TributarioS5Error("Origem de importação não suportada."); if (!input.rows.length) throw new TributarioS5Error("O lote deve conter registros.");
  if (input.competence) competenceDate(input.competence);
  const normalized = { sourceType, fileName: required(input.fileName, "Nome do arquivo"), competence: input.competence || null, rows: input.rows };
  const checksum = createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
  const existing = await db.simplesImportBatch.findUnique({ where: { checksum } }); if (existing) return existing;
  const taxpayerIds = [...new Set(input.rows.map((row) => row.taxpayerId))]; const taxpayers = await db.taxpayer.findMany({ where: { id: { in: taxpayerIds }, status: "Ativo" }, select: { id: true } }); const validIds = new Set(taxpayers.map((row) => row.id));
  const accepted = input.rows.filter((row) => validIds.has(row.taxpayerId)); const rejected = input.rows.length - accepted.length;
  return db.$transaction(async (tx) => {
    const batch = await tx.simplesImportBatch.create({ data: { sourceType, fileName: normalized.fileName, checksum, competence: input.competence || null, totalRows: input.rows.length, acceptedRows: accepted.length, rejectedRows: rejected, status: rejected ? "PROCESSADO_COM_REJEICOES" : "PROCESSADO", payload: json(normalized), errorSummary: rejected ? { rejectedRows: rejected, reason: "Contribuinte não localizado ou inativo." } : undefined, createdByUsuarioId: actor.usuarioId } });
    for (const row of accepted) {
      const competence = row.competence || input.competence || ""; competenceDate(competence);
      await tx.simplesFiscalRecord.create({ data: { importBatchId: batch.id, taxpayerId: row.taxpayerId, competence, recordType: row.recordType || sourceType, nationalRevenueDecimal: decimal(row.nationalRevenue), declaredServiceDecimal: decimal(row.declaredService), taxableBaseDecimal: decimal(row.taxableBase ?? row.declaredService), rate: row.rate == null ? null : new Prisma.Decimal(String(row.rate)), municipalIssDecimal: decimal(row.municipalIss), confirmedPaymentDecimal: decimal(row.confirmedPayment), activityCode: row.activityCode?.trim() || null, paymentCode: row.paymentCode?.trim() || null, isEstimate: Boolean(row.isEstimate), rawData: json(row.raw ?? row) } });
      if (sourceType === "PERIODOS_OPCAO") {
        const startDate = row.startDate ? new Date(`${row.startDate}T12:00:00.000Z`) : competenceDate(competence); const endDate = row.endDate ? new Date(`${row.endDate}T12:00:00.000Z`) : null; const regime = row.regime || "Simples Nacional";
        await tx.simplesOptionPeriod.upsert({ where: { taxpayerId_regime_startDate: { taxpayerId: row.taxpayerId, regime, startDate } }, create: { taxpayerId: row.taxpayerId, regime, startDate, endDate, sourceBatchId: batch.id }, update: { endDate, sourceBatchId: batch.id, status: "ATIVO" } });
        await tx.economicRegistration.updateMany({ where: { taxpayerId: row.taxpayerId }, data: { taxRegime: regime } });
      }
      if (sourceType === "DAF607") {
        const cross = calculateSimplesCrossCheck({ nfseService: 0, declaredService: 0, municipalIssDeclared: row.municipalIss ?? 0, daf607Confirmed: row.confirmedPayment ?? 0, nationalDasTotal: row.nationalDasTotal ?? row.nationalRevenue ?? 0 });
        await tx.simplesPaymentAllocation.create({ data: { importBatchId: batch.id, taxpayerId: row.taxpayerId, competence, revenueCode: row.paymentCode?.trim() || "ISS_SN", taxpayerRegime: row.regime || "SIMPLES_NACIONAL", nationalDasDecimal: cross.nationalDasTotal, municipalComponentDecimal: cross.municipalIssDeclared, confirmedDecimal: cross.daf607Confirmed, differenceDecimal: cross.paymentDifference } });
      }
    }
    return batch;
  }, { timeout: 20_000 });
}

export async function processSimplesDivergences(db: PrismaClient, actor: TaxActor, competence: string) {
  competenceDate(competence);
  const [records, invoices, opted, registrations] = await Promise.all([
    db.simplesFiscalRecord.findMany({ where: { competence, status: "VALIDO" }, include: { importBatch: true }, orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ where: { competence, status: "Emitida" }, select: { id: true, providerId: true, serviceValueDecimal: true, serviceValue: true } }),
    db.simplesOptionPeriod.findMany({ where: { status: "ATIVO" } }),
    db.economicRegistration.findMany({ where: { OR: [{ taxRegime: { contains: "Simples", mode: "insensitive" } }, { taxRegime: { contains: "SIMEI", mode: "insensitive" } }] } }),
  ]);
  const fiscal = await db.nfseInvoiceData.findMany({ where: { invoiceId: { in: invoices.map((row) => row.id) } } }); const fiscalMap = new Map(fiscal.map((row) => [row.invoiceId, row]));
  const newestByTaxpayerType = new Map<string, typeof records[number]>(); for (const record of records) { const key = `${record.taxpayerId}:${record.recordType}`; if (!newestByTaxpayerType.has(key)) newestByTaxpayerType.set(key, record); }
  const taxpayerIds = new Set([...records.map((row) => row.taxpayerId), ...invoices.map((row) => row.providerId), ...opted.map((row) => row.taxpayerId), ...registrations.map((row) => row.taxpayerId)]);
  const activeTypes = new Map<string, Set<string>>(); let processed = 0;
  for (const taxpayerId of taxpayerIds) {
    const declaration = ["PGDAS_RETIFICACAO", "PGDAS", "DASN_DEFIS"].map((type) => newestByTaxpayerType.get(`${taxpayerId}:${type}`)).find(Boolean);
    const payment = newestByTaxpayerType.get(`${taxpayerId}:DAF607`); const taxpayerInvoices = invoices.filter((row) => row.providerId === taxpayerId);
    const nfseService = taxpayerInvoices.reduce((sum, row) => sum.plus(row.serviceValueDecimal ?? row.serviceValue), new Prisma.Decimal(0)); const declaredService = declaration?.declaredServiceDecimal ?? new Prisma.Decimal(0); const municipalIss = declaration?.municipalIssDecimal ?? new Prisma.Decimal(0); const confirmed = payment?.confirmedPaymentDecimal ?? new Prisma.Decimal(0);
    const cross = calculateSimplesCrossCheck({ nfseService, declaredService, municipalIssDeclared: municipalIss, daf607Confirmed: confirmed, nationalDasTotal: payment?.nationalRevenueDecimal ?? 0 });
    const expectedRate = taxpayerInvoices.length ? taxpayerInvoices.map((row) => fiscalMap.get(row.id)?.rate).find(Boolean) : null;
    const types = classifySimplesDivergences({ expected: opted.some((row) => row.taxpayerId === taxpayerId) || registrations.some((row) => row.taxpayerId === taxpayerId), nfseService: Number(cross.nfseService), declaredService: Number(cross.declaredService), revenueDifference: Number(cross.revenueDifference), municipalIssDeclared: Number(cross.municipalIssDeclared), paymentDifference: Number(cross.paymentDifference), declaredRate: declaration?.rate ? Number(declaration.rate) : null, expectedRate: expectedRate ? Number(expectedRate) : null, activityCode: declaration?.activityCode, isEstimate: declaration?.isEstimate });
    activeTypes.set(taxpayerId, new Set(types));
    for (const divergenceType of types) {
      await db.simplesDivergence.upsert({ where: { taxpayerId_competence_divergenceType: { taxpayerId, competence, divergenceType } }, create: { taxpayerId, competence, divergenceType, nfseServiceDecimal: cross.nfseService, declaredServiceDecimal: cross.declaredService, revenueDifferenceDecimal: cross.revenueDifference, municipalIssDecimal: cross.municipalIssDeclared, confirmedPaymentDecimal: cross.daf607Confirmed, paymentDifferenceDecimal: cross.paymentDifference, details: json({ paymentBasis: cross.paymentBasis, nationalDasTotal: cross.nationalDasTotal.toFixed(2), activityCode: declaration?.activityCode ?? null, declaredRate: declaration?.rate?.toString() ?? null, expectedRate: expectedRate?.toString() ?? null }), events: { create: { eventType: "IDENTIFICADA", description: `Malha ${divergenceType} processada para ${competence}.`, actorUsuarioId: actor.usuarioId } } }, update: { status: "ABERTA", resolvedAt: null, nfseServiceDecimal: cross.nfseService, declaredServiceDecimal: cross.declaredService, revenueDifferenceDecimal: cross.revenueDifference, municipalIssDecimal: cross.municipalIssDeclared, confirmedPaymentDecimal: cross.daf607Confirmed, paymentDifferenceDecimal: cross.paymentDifference, details: json({ paymentBasis: cross.paymentBasis, nationalDasTotal: cross.nationalDasTotal.toFixed(2), activityCode: declaration?.activityCode ?? null, declaredRate: declaration?.rate?.toString() ?? null, expectedRate: expectedRate?.toString() ?? null }), lastProcessedAt: new Date(), events: { create: { eventType: "REPROCESSADA", description: `Malha reprocessada para ${competence}.`, actorUsuarioId: actor.usuarioId } } } }); processed++;
    }
  }
  const existing = await db.simplesDivergence.findMany({ where: { competence, status: { not: "RESOLVIDA" } } });
  for (const divergence of existing) if (!activeTypes.get(divergence.taxpayerId)?.has(divergence.divergenceType)) await db.simplesDivergence.update({ where: { id: divergence.id }, data: { status: "RESOLVIDA", resolvedAt: new Date(), lastProcessedAt: new Date(), events: { create: { eventType: "RESOLVIDA", description: "Divergência não foi reproduzida no reprocessamento.", actorUsuarioId: actor.usuarioId } } } });
  return { processed, taxpayers: taxpayerIds.size };
}

export async function communicateSimplesDivergence(db: PrismaClient, actor: TaxActor, divergenceId: string) {
  const divergence = await db.simplesDivergence.findUnique({ where: { id: divergenceId } }); if (!divergence || divergence.status === "RESOLVIDA") throw new TributarioS5Error("Divergência não está disponível para comunicação.");
  const mailbox = await db.dteMailbox.findFirst({ where: { taxpayerId: divergence.taxpayerId, status: "ATIVA" } }); if (!mailbox) throw new TributarioS5Error("Contribuinte sem caixa DTE ativa; configure-a na revisão final ou envie por canal formal externo.");
  let category = await db.dteCategory.findUnique({ where: { code: "AUTORREGULARIZACAO_SN" } }); if (!category) category = await db.dteCategory.create({ data: { code: "AUTORREGULARIZACAO_SN", name: "Autorregularização do Simples Nacional", retentionRequired: true, defaultDeadlineDays: 15 } });
  const key = `SN-DIVERGENCIA:${divergence.id}`; let message = await db.dteMessage.findUnique({ where: { idempotencyKey: key } });
  if (!message) { const deadline = new Date(); deadline.setUTCDate(deadline.getUTCDate() + category.defaultDeadlineDays); message = await db.dteMessage.create({ data: { mailboxId: mailbox.id, categoryId: category.id, subject: `Autorregularização ${divergence.competence}`, body: `Foi identificada a divergência ${divergence.divergenceType}. Revise a declaração e apresente retificação pelos canais municipais.`, idempotencyKey: key, deadlineAt: deadline, createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "DISPONIBILIZADA", description: "Comunicação de autorregularização disponibilizada no DTE.", actorUsuarioId: actor.usuarioId } } } }); }
  await db.simplesDivergence.update({ where: { id: divergence.id }, data: { status: "COMUNICADA", dteMessageId: message.id, events: { create: { eventType: "COMUNICADA", description: "Comunicação registrada no DTE.", actorUsuarioId: actor.usuarioId, payload: { dteMessageId: message.id } } } } }); return message;
}

export async function rectifySimplesDivergence(db: PrismaClient, actor: TaxActor, input: { divergenceId: string; declaredService: number; municipalIss: number; rate: number; activityCode: string }) {
  const divergence = await db.simplesDivergence.findUnique({ where: { id: input.divergenceId } }); if (!divergence || divergence.status === "RESOLVIDA") throw new TributarioS5Error("Divergência indisponível para retificação.");
  const batch = await importSimplesBatch(db, actor, { sourceType: "PGDAS_RETIFICACAO", fileName: `retificacao-${divergence.id}.json`, competence: divergence.competence, rows: [{ taxpayerId: divergence.taxpayerId, competence: divergence.competence, recordType: "PGDAS_RETIFICACAO", declaredService: input.declaredService, taxableBase: input.declaredService, municipalIss: input.municipalIss, rate: input.rate, activityCode: input.activityCode, raw: { source: "AUTORREGULARIZACAO_INTERNA", divergenceId: divergence.id } }] });
  await db.simplesDivergence.update({ where: { id: divergence.id }, data: { status: "RETIFICADA", events: { create: { eventType: "RETIFICADA", description: "Retificação interna protocolada; aguardando reprocessamento.", actorUsuarioId: actor.usuarioId, payload: { batchId: batch.id } } } } }); await processSimplesDivergences(db, actor, divergence.competence); return batch;
}

export async function prepareSimplesExclusion(db: PrismaClient, actor: TaxActor, input: { taxpayerId: string; competence: string; reason: string; calendarRevenue: number; legalLimit: number }) {
  competenceDate(input.competence); const taxpayer = await db.taxpayer.findUnique({ where: { id: input.taxpayerId }, include: { person: true, company: true } }); if (!taxpayer) throw new TributarioS5Error("Contribuinte não encontrado.");
  const documentNumber = taxpayer.company?.cnpj ?? taxpayer.person?.cpf ?? ""; const exportContent = buildExclusionExport({ taxpayerDocument: documentNumber, competence: input.competence, reason: required(input.reason, "Motivo"), calendarRevenue: decimal(input.calendarRevenue).toFixed(2), legalLimit: decimal(input.legalLimit).toFixed(2) });
  return db.$transaction(async (tx) => { const item = await tx.simplesExclusionCase.create({ data: { taxpayerId: taxpayer.id, competence: input.competence, reason: input.reason.trim(), calendarRevenueDecimal: decimal(input.calendarRevenue), legalLimitDecimal: decimal(input.legalLimit), exportContent, createdByUsuarioId: actor.usuarioId } }); const document = await tx.document.create({ data: { title: `Preparação de exclusão do Simples ${input.competence}`, documentType: "SIMPLES_NACIONAL_EXCLUSAO", fileUrl: `/tributacao/simples-nacional/exclusoes/${item.id}/documento`, status: "Válido", publicLabel: "Preparação interna para análise", notes: "Não representa exclusão efetivada na Receita Federal." } }); return tx.simplesExclusionCase.update({ where: { id: item.id }, data: { documentId: document.id, status: "DOCUMENTO_GERADO" } }); });
}

export async function communicateSimplesExclusion(db: PrismaClient, actor: TaxActor, id: string) {
  const item = await db.simplesExclusionCase.findUnique({ where: { id } }); if (!item?.documentId) throw new TributarioS5Error("Gere o documento antes da comunicação."); const mailbox = await db.dteMailbox.findFirst({ where: { taxpayerId: item.taxpayerId, status: "ATIVA" } }); if (!mailbox) throw new TributarioS5Error("Contribuinte sem caixa DTE ativa.");
  let category = await db.dteCategory.findUnique({ where: { code: "SIMPLES_EXCLUSAO" } }); if (!category) category = await db.dteCategory.create({ data: { code: "SIMPLES_EXCLUSAO", name: "Preparação para exclusão do Simples", defaultDeadlineDays: 30 } }); const key = `SN-EXCLUSAO:${item.id}`; let message = await db.dteMessage.findUnique({ where: { idempotencyKey: key } }); if (!message) message = await db.dteMessage.create({ data: { mailboxId: mailbox.id, categoryId: category.id, subject: "Comunicação municipal sobre o Simples Nacional", body: `${item.reason}. Esta comunicação registra preparação municipal e não afirma exclusão efetivada na RFB.`, documentId: item.documentId, idempotencyKey: key, deadlineAt: new Date(Date.now() + category.defaultDeadlineDays * 86400000), createdByUsuarioId: actor.usuarioId, events: { create: { eventType: "DISPONIBILIZADA", description: "Comunicação de preparação para exclusão disponibilizada.", actorUsuarioId: actor.usuarioId } } } }); return db.simplesExclusionCase.update({ where: { id: item.id }, data: { status: "COMUNICADA", dteMessageId: message.id } });
}
