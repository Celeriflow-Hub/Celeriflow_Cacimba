"use server";

import { revalidatePath } from "next/cache";
import { assertHealthUnitAccess, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { collectLabSample, createLabReport, enterLabResult, releaseLabReport, requestLabRecollection, reviewLabReport, scheduleLabOrder } from "@/lib/saude/laboratory-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const refresh = () => revalidatePath("/saude/laboratorio");

export async function saveExamModelAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const code = text(data, "code"); const name = text(data, "name");
  if (!code || !name) throw new Error("Informe código e nome do exame.");
  await context.prisma.healthLabExamModel.upsert({ where: { code }, create: { code, name, procedureId: text(data, "procedureId") || null, bench: text(data, "bench") || null, preparation: text(data, "preparation") || null, performedInternally: data.get("performedInternally") === "on", deliveryDays: Number(data.get("deliveryDays") || 0), duplicateWindowDays: Number(data.get("duplicateWindowDays") || 0), ...(text(data, "materialId") ? { materials: { create: { materialId: text(data, "materialId"), quantity: Number(data.get("materialQuantity") || 1) } } } : {}) }, update: { name, procedureId: text(data, "procedureId") || null, bench: text(data, "bench") || null, preparation: text(data, "preparation") || null, performedInternally: data.get("performedInternally") === "on", deliveryDays: Number(data.get("deliveryDays") || 0), duplicateWindowDays: Number(data.get("duplicateWindowDays") || 0), isActive: true } }); refresh();
}

export async function saveExamScheduleAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  assertHealthUnitAccess(context.user, text(data, "unitId"));
  await context.prisma.healthLabSchedule.create({ data: { examModelId: text(data, "examModelId"), unitId: text(data, "unitId"), date: text(data, "date") ? new Date(`${text(data, "date")}T12:00:00`) : null, weekday: text(data, "weekday") ? Number(data.get("weekday")) : null, capacity: Number(data.get("capacity")) } }); refresh();
}

export async function saveProviderQuotaAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const key = { providerSupplierId: text(data, "providerSupplierId"), unitId: text(data, "unitId"), examModelId: text(data, "examModelId"), period: text(data, "period") };
  assertHealthUnitAccess(context.user, key.unitId);
  await context.prisma.healthLabProviderQuota.upsert({ where: { providerSupplierId_unitId_examModelId_period: key }, create: { ...key, allowedQuantity: Number(data.get("allowedQuantity")) }, update: { allowedQuantity: Number(data.get("allowedQuantity")) } }); refresh();
}

export async function saveAssistentialDeviceAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const code = text(data, "code");
  const unitId = text(data, "unitId");
  const existing = await context.prisma.healthAssistentialDevice.findUnique({ where: { code }, select: { unitId: true } });
  if (existing) assertHealthUnitAccess(context.user, existing.unitId || "");
  assertHealthUnitAccess(context.user, unitId);
  await context.prisma.healthAssistentialDevice.upsert({ where: { code }, create: { code, name: text(data, "name"), domain: "LABORATORY", deviceType: text(data, "deviceType"), protocol: text(data, "protocol"), unitId: unitId || null, operatorUsuarioIds: [context.user.id] }, update: { name: text(data, "name"), deviceType: text(data, "deviceType"), protocol: text(data, "protocol"), unitId: unitId || null, operatorUsuarioIds: [context.user.id], isActive: true } }); refresh();
}

export async function scheduleOrderAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await scheduleLabOrder(context, { orderId: text(data, "orderId"), collectionUnitId: text(data, "collectionUnitId"), scheduledAt: text(data, "scheduledAt"), providerSupplierId: text(data, "providerSupplierId") || null });
  refresh();
}

export async function collectSampleAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await collectLabSample(context, { orderId: text(data, "orderId"), sampleBarcode: text(data, "sampleBarcode"), collectionByThirdParty: data.get("collectionByThirdParty") === "on" });
  refresh();
}

export async function enterResultAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  const value = text(data, "value");
  await enterLabResult(context, { orderId: text(data, "orderId"), status: text(data, "status"), values: { result: value, unit: text(data, "unitOfMeasure") || null }, interpretation: text(data, "interpretation") || null, source: "MANUAL" });
  refresh();
}

export async function recollectAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await requestLabRecollection(context, text(data, "orderId"), text(data, "reason"));
  refresh();
}

export async function createReportAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione o arquivo do laudo.");
  await createLabReport(context, { orderId: text(data, "orderId"), title: text(data, "title"), file });
  refresh();
}

export async function reviewReportAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await reviewLabReport(context, text(data, "reportId"));
  refresh();
}

export async function releaseReportAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await releaseLabReport(context, text(data, "reportId"), data.get("publishToPatient") === "on");
  refresh();
}
