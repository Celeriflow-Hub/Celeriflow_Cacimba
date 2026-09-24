"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { addSpecializedPlanEntry, createSpecializedPlan, distributeSpecializedMaterial, saveSpecializedCatalogItem, saveSpecializedQuota, saveSpecializedSchedule } from "@/lib/saude/specialized-care-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const nullableNumber = (data: FormData, name: string) => text(data, name) ? Number(data.get(name)) : null;
const refresh = () => revalidatePath("/saude/centro-especializado");

export async function saveCatalogAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveSpecializedCatalogItem(context, { category: text(data, "category"), code: text(data, "code"), name: text(data, "name"), referenceValue: nullableNumber(data, "referenceValue"), materialId: text(data, "materialId") || null }); refresh();
}

export async function saveScheduleAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await saveSpecializedSchedule(context, { teamId: text(data, "teamId"), unitId: text(data, "unitId"), month: text(data, "month"), patientCapacity: Number(data.get("patientCapacity")) }); refresh();
}

export async function createPlanAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await createSpecializedPlan(context, { patientId: text(data, "patientId"), unitId: text(data, "unitId"), teamId: text(data, "teamId"), initialMedicalRecordId: text(data, "initialMedicalRecordId") || null, goals: text(data, "goals"), carePlan: text(data, "carePlan"), plannedConsultations: Number(data.get("plannedConsultations")) }); refresh();
}

export async function addEntryAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await addSpecializedPlanEntry(context, { planId: text(data, "planId"), specialtyId: text(data, "specialtyId") || null, healthServiceId: text(data, "healthServiceId") || null, kind: text(data, "kind"), content: text(data, "content"), diagnosisSummary: text(data, "diagnosisSummary") || null, weight: nullableNumber(data, "weight"), height: nullableNumber(data, "height") }); refresh();
}

export async function saveQuotaAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await saveSpecializedQuota(context, { patientId: text(data, "patientId"), materialId: text(data, "materialId"), period: text(data, "period"), allowedQuantity: Number(data.get("allowedQuantity")) }); refresh();
}

export async function distributeAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await distributeSpecializedMaterial(context, { planId: text(data, "planId"), quotaId: text(data, "quotaId") || null, warehouseId: text(data, "warehouseId"), materialId: text(data, "materialId"), batchNumber: text(data, "batchNumber"), quantity: Number(data.get("quantity")), notes: text(data, "notes") || null }); refresh();
}
