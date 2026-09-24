import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { randomUUID } from "node:crypto";

export class RegulationError extends Error {}

const quotaSchema = z.object({
  providerSupplierId: z.string().min(1),
  unitId: z.string().min(1).nullable().optional(),
  specialtyId: z.string().min(1).nullable().optional(),
  serviceId: z.string().min(1).nullable().optional(),
  procedureId: z.string().min(1).nullable().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  totalQuantity: z.number().int().positive().max(9999),
  unitValue: z.number().nonnegative().nullable().optional(),
  convenioId: z.string().min(1).nullable().optional(),
}).strict();

const requestSchema = z.object({
  patientId: z.string().min(1),
  requestUnitId: z.string().min(1).nullable().optional(),
  professionalId: z.string().min(1).nullable().optional(),
  specialtyId: z.string().min(1).nullable().optional(),
  serviceId: z.string().min(1).nullable().optional(),
  procedureId: z.string().min(1).nullable().optional(),
  sectorId: z.string().min(1).nullable().optional(),
  cidReferenceId: z.string().min(1).nullable().optional(),
  priority: z.enum(["Alta","Media","Normal"]).default("Normal"),
  description: z.string().trim().max(2000).nullable().optional(),
  origin: z.enum(["DIRECT","PEP_REFERRAL","PEP_EXAM"]).default("DIRECT"),
  referralId: z.string().min(1).nullable().optional(),
  examRequestId: z.string().min(1).nullable().optional(),
  patientCondition: z.string().trim().max(60).nullable().optional(),
  executorNotes: z.string().trim().max(2000).nullable().optional(),
  transportNotes: z.string().trim().max(2000).nullable().optional(),
  isExternal: z.boolean().default(false),
  observations: z.string().trim().max(2000).nullable().optional(),
  preparation: z.string().trim().max(2000).nullable().optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
}).strict();

const VALID_TRANSITIONS: Record<string, string[]> = {
  RECEBIDA: ["EM_ANALISE","AUTORIZADA","DEVOLVIDA","CANCELADA"],
  EM_ANALISE: ["AUTORIZADA","DEVOLVIDA","CANCELADA"],
  AUTORIZADA: ["AGENDADA","EXECUTADA","CANCELADA","DEVOLVIDA"],
  AGENDADA: ["EXECUTADA","CANCELADA"],
  EXECUTADA: ["CONCLUIDA","DEVOLVIDA"],
  DEVOLVIDA: ["RECEBIDA","ARQUIVADA"],
  CANCELADA: ["ARQUIVADA"],
  CONCLUIDA: ["ARQUIVADA"],
  ARQUIVADA: ["RECEBIDA"],
};

async function nextProtocolNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `REG-${year}-${randomUUID().slice(0, 6).toUpperCase()}`;
    if (!await tx.healthRegulationRequest.findUnique({ where: { protocolNumber: candidate }, select: { id: true } })) return candidate;
  }
  throw new RegulationError("Não foi possível gerar o protocolo.");
}

async function ensureQuotaTx(tx: Prisma.TransactionClient, quotaId: string, adjust: { reserved?: number; realized?: number }) {
  const quota = await tx.healthRegulationQuota.findUnique({ where: { id: quotaId } });
  if (!quota) throw new RegulationError("Cota não encontrada.");
  const reserved = quota.reservedQuantity + (adjust.reserved ?? 0);
  const realized = quota.realizedQuantity + (adjust.realized ?? 0);
  if (reserved < 0 || realized < 0) throw new RegulationError("Saldo de cota incoerente.");
  if (reserved + realized > quota.totalQuantity) throw new RegulationError("Cota sem saldo disponível.");
  return tx.healthRegulationQuota.update({ where: { id: quotaId }, data: { reservedQuantity: reserved, realizedQuantity: realized } });
}

export async function saveRegulationQuota(context: AppContext, raw: unknown) {
  const input = quotaSchema.parse(raw);
  if (input.unitId) assertHealthUnitAccess(context.user, input.unitId);
  if (!input.unitId && context.user.hasHealthAccessScope) throw new RegulationError("Informe a unidade para configurar cota.");
  // Upsert by provider+unit+specialty+service+procedure+period (simplified: provider+unit+period when specialty/service/procedure empty)
  const existing = await context.prisma.healthRegulationQuota.findFirst({
    where: {
      providerSupplierId: input.providerSupplierId,
      unitId: input.unitId || null,
      specialtyId: input.specialtyId || null,
      serviceId: input.serviceId || null,
      procedureId: input.procedureId || null,
      period: input.period,
    },
    select: { id: true },
  });
  if (input.convenioId && !await context.prisma.covenant.findUnique({ where: { id: input.convenioId }, select: { id: true } })) throw new RegulationError("Convênio não encontrado.");
  if (existing) {
    return context.prisma.healthRegulationQuota.update({ where: { id: existing.id }, data: { totalQuantity: input.totalQuantity, unitValue: input.unitValue ?? undefined, convenioId: input.convenioId || null, isActive: true }, select: { id: true } });
  }
  return context.prisma.healthRegulationQuota.create({ data: {
    providerSupplierId: input.providerSupplierId,
    unitId: input.unitId || null,
    specialtyId: input.specialtyId || null,
    serviceId: input.serviceId || null,
    procedureId: input.procedureId || null,
    period: input.period,
    totalQuantity: input.totalQuantity,
    unitValue: input.unitValue ?? null,
    convenioId: input.convenioId || null,
  }, select: { id: true } });
}

export async function createRegulationRequest(context: AppContext, raw: unknown) {
  const input = requestSchema.parse(raw);
  const unitId = input.requestUnitId || null;
  if (unitId) assertHealthUnitAccess(context.user, unitId);
  else if (context.user.hasHealthAccessScope) throw new RegulationError("Informe a unidade solicitante.");
  const patient = await context.prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } });
  if (!patient) throw new RegulationError("Paciente não encontrado.");
  if (input.sectorId && !await context.prisma.healthRegulationSector.findFirst({ where: { id: input.sectorId, isActive: true }, select: { id: true } })) throw new RegulationError("Setor de regulação inválido.");
  return context.prisma.$transaction(async tx => {
    const request = await tx.healthRegulationRequest.create({
      data: {
        patientId: input.patientId,
        requestUnitId: unitId,
        professionalId: input.professionalId || null,
        specialtyId: input.specialtyId || null,
        serviceId: input.serviceId || null,
        procedureId: input.procedureId || null,
        sectorId: input.sectorId || null,
        cidReferenceId: input.cidReferenceId || null,
        priority: input.priority,
        origin: input.origin,
        referralId: input.referralId || null,
        examRequestId: input.examRequestId || null,
        description: input.description || null,
        patientCondition: input.patientCondition || null,
        executorNotes: input.executorNotes || null,
        transportNotes: input.transportNotes || null,
        isExternal: input.isExternal,
        observations: input.observations || null,
        preparation: input.preparation || null,
        contactPhone: input.contactPhone || null,
        protocolNumber: await nextProtocolNumber(tx),
        createdByUsuarioId: context.user.id,
      },
      select: { id: true },
    });
    await tx.healthRegulationEvent.create({ data: { requestId: request.id, fromStatus: "RECEBIDA", toStatus: "RECEBIDA", eventType: "CRIADA", actorUsuarioId: context.user.id } });
    return request;
  });
}

export async function transitionRegulationRequest(context: AppContext, requestId: string, toStatus: string, options?: { quotaId?: string | null; notes?: string | null; scheduledAt?: string | null }) {
  const target = toStatus.toUpperCase();
  return context.prisma.$transaction(async tx => {
    const request = await tx.healthRegulationRequest.findUnique({ where: { id: requestId }, select: { id: true, status: true, requestUnitId: true, quotaId: true } });
    if (!request) throw new RegulationError("Solicitação não encontrada.");
    if (request.requestUnitId) assertHealthUnitAccess(context.user, request.requestUnitId);
    const allowed = VALID_TRANSITIONS[request.status] || [];
    if (!allowed.includes(target) && request.status !== target) throw new RegulationError(`Transição de ${request.status} para ${target} não permitida.`);
    // Quota handling
    let quotaId = request.quotaId;
    if (target === "AUTORIZADA") {
      const qId = options?.quotaId || quotaId;
      if (!qId) throw new RegulationError("Selecione a cota para autorizar.");
      const quota = await tx.healthRegulationQuota.findUnique({ where: { id: qId }, select: { id: true, unitId: true } });
      if (!quota) throw new RegulationError("Cota não encontrada.");
      if (quota.unitId) assertHealthUnitAccess(context.user, quota.unitId);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${qId}))`;
      await ensureQuotaTx(tx, qId, { reserved: 1 });
      quotaId = qId;
    }
    if (request.status === "AUTORIZADA" && ["CANCELADA","DEVOLVIDA"].includes(target) && quotaId) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${quotaId}))`;
      await ensureQuotaTx(tx, quotaId, { reserved: -1 });
      if (target === "CANCELADA") quotaId = null;
    }
    if (target === "EXECUTADA" && quotaId) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${quotaId}))`;
      await ensureQuotaTx(tx, quotaId, { reserved: -1, realized: 1 });
    }
    if (target === "CONCLUIDA" && options?.notes && options.notes.length < 3) throw new RegulationError("Informe observações do retorno.");
    if (target === "ARQUIVADA" && !(options?.notes || "").trim()) throw new RegulationError("Arquivamento exige motivo.");
    const guideNumber = target === "AUTORIZADA" && !request.quotaId ? `GUI-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,6).toUpperCase()}` : undefined;
    const validationCode = target === "AUTORIZADA" ? randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase() : undefined;
    const data: Prisma.HealthRegulationRequestUpdateInput = {
      status: target,
      quota: quotaId ? { connect: { id: quotaId } } : request.quotaId && target === "CANCELADA" ? { disconnect: true } : undefined,
      guideNumber: guideNumber || undefined,
      guideIssuedAt: guideNumber ? new Date() : undefined,
      validationCode: validationCode || undefined,
      scheduledAt: options?.scheduledAt ? new Date(options.scheduledAt) : undefined,
      executedAt: target === "EXECUTADA" ? new Date() : undefined,
      returnedAt: target === "CONCLUIDA" ? new Date() : undefined,
      feedback: target === "CONCLUIDA" ? (options?.notes || null) : undefined,
    };
    const updated = await tx.healthRegulationRequest.update({ where: { id: requestId }, data, select: { id: true, status: true, guideNumber: true } });
    await tx.healthRegulationEvent.create({ data: { requestId, fromStatus: request.status, toStatus: target, eventType: target, notes: options?.notes || null, actorUsuarioId: context.user.id } });
    return updated;
  });
}

export async function saveSector(context: AppContext, name: string) {
  const normalized = name.trim();
  if (normalized.length < 2) throw new RegulationError("Informe o nome do setor.");
  const existing = await context.prisma.healthRegulationSector.findUnique({ where: { name: normalized }, select: { id: true } });
  if (existing) return context.prisma.healthRegulationSector.update({ where: { id: existing.id }, data: { isActive: true }, select: { id: true } });
  return context.prisma.healthRegulationSector.create({ data: { name: normalized }, select: { id: true } });
}

export async function reclassifyRequest(context: AppContext, requestId: string, raw: unknown) {
  const input = z.object({ specialtyId: z.string().min(1).nullable().optional(), serviceId: z.string().min(1).nullable().optional(), notes: z.string().trim().min(3).max(2000) }).strict().parse(raw);
  const request = await context.prisma.healthRegulationRequest.findUnique({ where: { id: requestId }, select: { id: true, status: true, requestUnitId: true } });
  if (!request) throw new RegulationError("Solicitação não encontrada.");
  if (request.requestUnitId) assertHealthUnitAccess(context.user, request.requestUnitId);
  if (["EXECUTADA", "CONCLUIDA", "CANCELADA", "ARQUIVADA"].includes(request.status)) throw new RegulationError("Solicitação encerrada não pode ser reclassificada.");
  return context.prisma.$transaction(async tx => {
    await tx.healthRegulationRequest.update({ where: { id: requestId }, data: { specialtyId: input.specialtyId || null, serviceId: input.serviceId || null } });
    await tx.healthRegulationEvent.create({ data: { requestId, fromStatus: request.status, toStatus: request.status, eventType: "RECLASSIFICADA", notes: input.notes, actorUsuarioId: context.user.id } });
    return { id: requestId };
  });
}

export async function transferAuthorization(context: AppContext, requestId: string, quotaId: string) {
  return context.prisma.$transaction(async tx => {
    const request = await tx.healthRegulationRequest.findUnique({ where: { id: requestId }, select: { id: true, status: true, requestUnitId: true, quotaId: true } });
    if (!request) throw new RegulationError("Solicitação não encontrada.");
    if (request.status !== "AUTORIZADA") throw new RegulationError("Somente autorizações vigentes podem ser transferidas.");
    if (request.requestUnitId) assertHealthUnitAccess(context.user, request.requestUnitId);
    const quota = await tx.healthRegulationQuota.findUnique({ where: { id: quotaId }, select: { id: true, unitId: true } });
    if (!quota) throw new RegulationError("Cota destino não encontrada.");
    if (quota.unitId) assertHealthUnitAccess(context.user, quota.unitId);
    if (request.quotaId) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${request.quotaId}))`;
      await ensureQuotaTx(tx, request.quotaId, { reserved: -1 });
    }
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${quotaId}))`;
    await ensureQuotaTx(tx, quotaId, { reserved: 1 });
    await tx.healthRegulationRequest.update({ where: { id: requestId }, data: { quotaId } });
    await tx.healthRegulationEvent.create({ data: { requestId, fromStatus: "AUTORIZADA", toStatus: "AUTORIZADA", eventType: "AUTORIZACAO_TRANSFERIDA", actorUsuarioId: context.user.id } });
    return { id: requestId };
  });
}

export async function grantProviderAccess(context: AppContext, raw: unknown) {
  const input = z.object({ supplierId: z.string().min(1), usuarioId: z.string().min(1) }).strict().parse(raw);
  const supplier = await context.prisma.supplier.findFirst({ where: { id: input.supplierId, status: "Ativo" }, select: { id: true } });
  if (!supplier) throw new RegulationError("Prestador ativo não encontrado.");
  const usuario = await context.prisma.usuario.findUnique({ where: { id: input.usuarioId }, select: { id: true } });
  if (!usuario) throw new RegulationError("Usuário não encontrado.");
  return context.prisma.healthProviderAccess.upsert({ where: { supplierId_usuarioId: { supplierId: input.supplierId, usuarioId: input.usuarioId } }, create: { supplierId: input.supplierId, usuarioId: input.usuarioId }, update: { isActive: true }, select: { id: true } });
}

export async function addRequestAttachment(context: AppContext, input: { requestId: string; file: File }) {
  const request = await context.prisma.healthRegulationRequest.findUnique({ where: { id: input.requestId }, select: { id: true, requestUnitId: true } });
  if (!request) throw new RegulationError("Solicitação não encontrada.");
  if (request.requestUnitId) assertHealthUnitAccess(context.user, request.requestUnitId);
  if (!(input.file instanceof File) || input.file.size === 0) throw new RegulationError("Selecione o arquivo do anexo.");
  const { ingestGedDocument } = await import("@/lib/documents/document-flow-service");
  const content = new Uint8Array(await input.file.arrayBuffer());
  const { uploadFile } = await import("@/lib/platform/blob");
  const blob = await uploadFile(input.file);
  const result = await ingestGedDocument(context.prisma, { title: `Anexo regulação ${request.id.slice(0, 8)}`, documentType: "Anexo", documentClassCode: "SAUDE_DOCUMENTO_PADRAO", fileUrl: blob.url, content, actorUsuarioId: context.user.id });
  return context.prisma.healthRegulationAttachment.create({ data: { requestId: request.id, documentId: result.documentId, uploadedByUsuarioId: context.user.id }, select: { id: true } });
}

export async function validateGuideCode(context: AppContext, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new RegulationError("Informe o código de validação.");
  const request = await context.prisma.healthRegulationRequest.findFirst({ where: { validationCode: normalized }, include: { patient: { include: { person: { select: { fullName: true } } } }, specialty: true, service: true, quota: { select: { providerSupplierId: true } } } });
  if (!request) throw new RegulationError("Código de validação não localizado.");
  return { id: request.id, status: request.status, guideNumber: request.guideNumber, patient: request.patient.person.fullName, service: request.specialty?.name || request.service?.name || "-", providerSupplierId: request.quota?.providerSupplierId || null };
}

export async function createFromReferralTx(tx: Prisma.TransactionClient, referral: { id: string; patientId: string; specialtyId: string | null; serviceId: string | null; destinationUnitId: string | null; professionalId: string; priority: string; reason: string }, actorUsuarioId: string) {
  const existing = await tx.healthRegulationRequest.findUnique({ where: { referralId: referral.id }, select: { id: true } });
  if (existing) return existing;
  const request = await tx.healthRegulationRequest.create({
    data: {
      patientId: referral.patientId,
      requestUnitId: referral.destinationUnitId,
      professionalId: referral.professionalId,
      specialtyId: referral.specialtyId,
      serviceId: referral.serviceId,
      priority: referral.priority || "Normal",
      origin: "PEP_REFERRAL",
      referralId: referral.id,
      description: referral.reason,
      protocolNumber: await nextProtocolNumber(tx),
      createdByUsuarioId: actorUsuarioId,
    },
    select: { id: true },
  });
  await tx.healthRegulationEvent.create({ data: { requestId: request.id, fromStatus: "RECEBIDA", toStatus: "RECEBIDA", eventType: "CRIADA_VIA_PEP", actorUsuarioId } });
  return request;
}
