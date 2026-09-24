import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { uploadFile } from "@/lib/platform/blob";
import { ingestGedDocument } from "@/lib/documents/document-flow-service";

export class LaboratoryError extends Error {}

const scheduleSchema = z.object({ orderId: z.string().min(1), collectionUnitId: z.string().min(1), scheduledAt: z.coerce.date(), providerSupplierId: z.string().min(1).nullable().optional() }).strict();
const collectSchema = z.object({ orderId: z.string().min(1), sampleBarcode: z.string().trim().min(3).max(120), collectionByThirdParty: z.boolean().default(false) }).strict();
const resultSchema = z.object({ orderId: z.string().min(1), status: z.enum(["PARTIAL", "FINAL"]), values: z.record(z.string(), z.unknown()), interpretation: z.string().trim().max(4000).nullable().optional(), source: z.enum(["MANUAL", "DEVICE"]).default("MANUAL"), deviceCorrelationId: z.string().trim().max(180).nullable().optional() }).strict();

async function professionalForUser(context: AppContext) {
  if (!context.user.employeeId) throw new LaboratoryError("Vincule o usuário autenticado a um profissional de saúde.");
  const professional = await context.prisma.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, isActive: true }, select: { id: true } });
  if (!professional) throw new LaboratoryError("Profissional de saúde ativo não encontrado.");
  return professional;
}

export async function scheduleLabOrder(context: AppContext, raw: unknown) {
  const input = scheduleSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.collectionUnitId);
  return context.prisma.$transaction(async (tx) => {
    const order = await tx.healthLabOrder.findUnique({ where: { id: input.orderId }, select: { id: true, status: true, patientId: true, requestUnitId: true, collectionUnitId: true, examModelId: true, examModel: { select: { deliveryDays: true, duplicateWindowDays: true } } } });
    if (!order || !["REQUESTED", "RECOLLECT"].includes(order.status)) throw new LaboratoryError("A solicitação não está disponível para agendamento.");
    assertHealthUnitAccess(context.user, order.collectionUnitId || order.requestUnitId || "");
    if (order.examModel?.duplicateWindowDays) {
      const duplicateSince = new Date(input.scheduledAt);
      duplicateSince.setDate(duplicateSince.getDate() - order.examModel.duplicateWindowDays);
      const duplicate = await tx.healthLabOrder.findFirst({ where: { id: { not: order.id }, patientId: order.patientId, examModelId: order.examModelId, scheduledAt: { gte: duplicateSince, lte: input.scheduledAt }, status: { notIn: ["CANCELLED", "RECOLLECT"] } }, select: { id: true } });
      if (duplicate) throw new LaboratoryError("Há exame do paciente dentro da janela de repetição configurada.");
    }
    const expectedResultAt = new Date(input.scheduledAt);
    expectedResultAt.setDate(expectedResultAt.getDate() + (order.examModel?.deliveryDays ?? 0));
    if (order.examModelId) {
      const dayStart = new Date(input.scheduledAt); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(input.scheduledAt); dayEnd.setHours(23, 59, 59, 999);
      const schedule = await tx.healthLabSchedule.findFirst({ where: { unitId: input.collectionUnitId, examModelId: order.examModelId, isActive: true, OR: [{ date: { gte: dayStart, lte: dayEnd } }, { date: null, weekday: input.scheduledAt.getDay() }] }, orderBy: { date: "desc" } });
      if (schedule) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${schedule.id}:${dayStart.toISOString()}`}))`;
        const occupied = await tx.healthLabOrder.count({ where: { id: { not: order.id }, collectionUnitId: input.collectionUnitId, examModelId: order.examModelId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } } });
        if (occupied >= schedule.capacity) throw new LaboratoryError("Não há vaga disponível no cronograma do exame para esta data.");
      }
      if (input.providerSupplierId && order.status !== "RECOLLECT") {
        const period = input.scheduledAt.toISOString().slice(0, 7);
        const allowedQuantity = await providerQuotaLimit(tx, input.providerSupplierId, input.collectionUnitId, order.examModelId, period);
        const quota = await tx.healthLabProviderQuota.updateMany({ where: { providerSupplierId: input.providerSupplierId, unitId: input.collectionUnitId, examModelId: order.examModelId, period, consumedQuantity: { lt: allowedQuantity } }, data: { consumedQuantity: { increment: 1 } } });
        if (quota.count !== 1) throw new LaboratoryError("A cota do prestador para o exame está indisponível ou esgotada.");
      }
    }
    const updated = await tx.healthLabOrder.update({ where: { id: order.id }, data: { collectionUnitId: input.collectionUnitId, providerSupplierId: input.providerSupplierId, scheduledAt: input.scheduledAt, expectedResultAt, status: "SCHEDULED", authorizationKey: input.providerSupplierId ? randomUUID() : null }, select: { id: true, status: true, authorizationKey: true } });
    await tx.healthLabOrderEvent.create({ data: { orderId: order.id, eventType: "SCHEDULED", fromStatus: order.status, toStatus: "SCHEDULED", actorUsuarioId: context.user.id } });
    return updated;
  });
}

export async function collectLabSample(context: AppContext, raw: unknown) {
  const input = collectSchema.parse(raw);
  const professional = await professionalForUser(context);
  return context.prisma.$transaction(async (tx) => {
    const order = await tx.healthLabOrder.findUnique({ where: { id: input.orderId }, select: { id: true, status: true, collectionUnitId: true } });
    if (!order?.collectionUnitId || !["SCHEDULED", "RECOLLECT"].includes(order.status)) throw new LaboratoryError("O exame não está disponível para coleta.");
    assertHealthUnitAccess(context.user, order.collectionUnitId);
    const updated = await tx.healthLabOrder.update({ where: { id: order.id }, data: { status: "COLLECTED", collectedAt: new Date(), sampleBarcode: input.sampleBarcode, collectionByThirdParty: input.collectionByThirdParty, collectorProfessionalId: professional.id }, select: { id: true, status: true } });
    await tx.healthLabOrderEvent.create({ data: { orderId: order.id, eventType: "COLLECTED", fromStatus: order.status, toStatus: "COLLECTED", actorUsuarioId: context.user.id } });
    return updated;
  });
}

export async function requestLabRecollection(context: AppContext, orderId: string, reason: string) {
  if (reason.trim().length < 3) throw new LaboratoryError("Informe o motivo da recoleta.");
  const order = await context.prisma.healthLabOrder.findUnique({ where: { id: orderId }, select: { id: true, collectionUnitId: true, status: true } });
  if (!order?.collectionUnitId || !["COLLECTED", "RECEIVED", "ENTERED"].includes(order.status)) throw new LaboratoryError("A etapa atual não permite recoleta.");
  assertHealthUnitAccess(context.user, order.collectionUnitId);
  return context.prisma.$transaction(async tx => {
    const updated = await tx.healthLabOrder.update({ where: { id: order.id }, data: { status: "RECOLLECT", sampleBarcode: null, collectedAt: null }, select: { id: true, status: true } });
    await tx.healthLabOrderEvent.create({ data: { orderId: order.id, eventType: "RECOLLECTION_REQUESTED", fromStatus: order.status, toStatus: "RECOLLECT", reason: reason.trim(), actorUsuarioId: context.user.id } });
    return updated;
  });
}

export async function enterLabResult(context: AppContext, raw: unknown) {
  const input = resultSchema.parse(raw);
  return context.prisma.$transaction(async (tx) => {
    const order = await tx.healthLabOrder.findUnique({ where: { id: input.orderId }, select: { id: true, status: true, collectionUnitId: true, results: { orderBy: { version: "desc" }, take: 1, select: { version: true } } } });
    if (!order?.collectionUnitId || !["COLLECTED", "RECEIVED", "ENTERED"].includes(order.status)) throw new LaboratoryError("O exame não está disponível para digitação de resultado.");
    assertHealthUnitAccess(context.user, order.collectionUnitId);
    const result = await tx.healthLabResult.create({ data: { orderId: order.id, version: (order.results[0]?.version ?? 0) + 1, status: input.status, source: input.source, values: input.values as Prisma.InputJsonValue, interpretation: input.interpretation, deviceCorrelationId: input.deviceCorrelationId, enteredByUsuarioId: context.user.id }, select: { id: true, status: true } });
    await tx.healthLabOrder.update({ where: { id: order.id }, data: { status: "ENTERED" } });
    await tx.healthLabOrderEvent.create({ data: { orderId: order.id, eventType: input.status === "FINAL" ? "FINAL_RESULT_ENTERED" : "PARTIAL_RESULT_ENTERED", fromStatus: order.status, toStatus: "ENTERED", actorUsuarioId: context.user.id } });
    return result;
  });
}

export async function createLabReport(context: AppContext, input: { orderId: string; title: string; file: File }) {
  const order = await context.prisma.healthLabOrder.findUnique({ where: { id: input.orderId }, select: { id: true, collectionUnitId: true, results: { where: { status: "FINAL" }, take: 1, select: { id: true } } } });
  if (!order?.collectionUnitId || order.results.length === 0) throw new LaboratoryError("O laudo exige um resultado final registrado.");
  assertHealthUnitAccess(context.user, order.collectionUnitId);
  const blob = await uploadFile(input.file);
  const content = new Uint8Array(await input.file.arrayBuffer());
  return ingestGedDocument(context.prisma, { title: input.title, documentType: "LAUDO_LABORATORIAL", documentClassCode: "SAUDE_DOCUMENTO_PADRAO", fileUrl: blob.url, content, actorUsuarioId: context.user.id, afterCreate: async (tx, documentId) => { await tx.healthLabReport.create({ data: { orderId: order.id, documentId } }); } });
}

export async function reviewLabReport(context: AppContext, reportId: string) {
  const professional = await professionalForUser(context);
  return context.prisma.$transaction(async (tx) => {
    const report = await tx.healthLabReport.findUnique({ where: { id: reportId }, select: { id: true, status: true, order: { select: { id: true, status: true, collectionUnitId: true } } } });
    if (!report?.order.collectionUnitId || report.status !== "DRAFT" || report.order.status !== "ENTERED") throw new LaboratoryError("Laudo indisponível para revisão.");
    assertHealthUnitAccess(context.user, report.order.collectionUnitId);
    await tx.healthLabOrder.update({ where: { id: report.order.id }, data: { status: "REVIEWED" } });
    await tx.healthLabOrderEvent.create({ data: { orderId: report.order.id, eventType: "REPORT_REVIEWED", fromStatus: report.order.status, toStatus: "REVIEWED", actorUsuarioId: context.user.id } });
    return tx.healthLabReport.update({ where: { id: report.id }, data: { status: "REVIEWED", reviewedAt: new Date(), reviewerProfessionalId: professional.id }, select: { id: true, status: true } });
  });
}

export async function releaseLabReport(context: AppContext, reportId: string, publishToPatient: boolean) {
  return context.prisma.$transaction(async (tx) => {
    const report = await tx.healthLabReport.findUnique({ where: { id: reportId }, select: { id: true, status: true, documentId: true, order: { select: { id: true, collectionUnitId: true } } } });
    if (!report?.order.collectionUnitId || report.status !== "REVIEWED") throw new LaboratoryError("Somente laudo revisado pode ser liberado.");
    assertHealthUnitAccess(context.user, report.order.collectionUnitId);
    const configuration = await tx.healthLaboratoryConfiguration.findFirst({ where: { unitId: report.order.collectionUnitId, isActive: true }, orderBy: { createdAt: "desc" } });
    if (configuration?.usesDigitalSignature && !await tx.documentSignature.findFirst({ where: { documentId: report.documentId }, select: { id: true } })) throw new LaboratoryError("A configuração da unidade exige assinatura digital antes da liberação.");
    if (publishToPatient && !configuration?.publishesPatientPortal) throw new LaboratoryError("A publicação ao paciente não está habilitada para a unidade.");
    const now = new Date();
    await tx.healthLabOrder.update({ where: { id: report.order.id }, data: { status: "RELEASED" } });
    await tx.healthLabOrderEvent.create({ data: { orderId: report.order.id, eventType: "REPORT_RELEASED", fromStatus: "REVIEWED", toStatus: "RELEASED", actorUsuarioId: context.user.id } });
    return tx.healthLabReport.update({ where: { id: report.id }, data: { status: "RELEASED", releasedAt: now, publishedAt: publishToPatient ? now : null }, select: { id: true, status: true } });
  });
}

export async function recordDeviceMessage(context: AppContext, input: { deviceId: string; direction: string; correlationId: string; idempotencyKey: string; payload: string; sanitizedData?: unknown }) {
  const existing = await context.prisma.healthDeviceMessage.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, status: true } });
  if (existing) return existing;
  const device = await context.prisma.healthAssistentialDevice.findFirst({ where: { id: input.deviceId, isActive: true }, select: { id: true, operatorUsuarioIds: true } });
  const operators = Array.isArray(device?.operatorUsuarioIds) ? device.operatorUsuarioIds : [];
  if (!device || !operators.includes(context.user.id)) throw new LaboratoryError("Operador sem vínculo ativo com o equipamento.");
  return context.prisma.healthDeviceMessage.create({ data: { deviceId: device.id, direction: input.direction, correlationId: input.correlationId, idempotencyKey: input.idempotencyKey, status: "RECEIVED", payloadHash: createHash("sha256").update(input.payload).digest("hex"), sanitizedData: input.sanitizedData as Prisma.InputJsonValue | undefined }, select: { id: true, status: true } });
}

async function providerQuotaLimit(tx: Prisma.TransactionClient, providerSupplierId: string, unitId: string, examModelId: string, period: string) {
  const quota = await tx.healthLabProviderQuota.findUnique({ where: { providerSupplierId_unitId_examModelId_period: { providerSupplierId, unitId, examModelId, period } }, select: { allowedQuantity: true } });
  return quota?.allowedQuantity ?? -1;
}
