"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertHealthUnitAccess, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { recordVaccination } from "@/lib/saude/vaccination-service";
import { writeOffHealthStock } from "@/lib/saude/health-stock-service";
import { executeConfiguredHealthHttp } from "@/lib/integrations/runtime";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();

export async function recordVaccinationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await recordVaccination(context, { vaccineId: text(data, "vaccineId"), patientId: text(data, "patientId"), warehouseId: text(data, "warehouseId"), batchNumber: text(data, "batchNumber"), doseNumber: Number(data.get("doseNumber")), quantity: Number(data.get("quantity") || 1), citizenCondition: text(data, "citizenCondition") || "NONE", strategy: text(data, "strategy"), applicationSite: text(data, "applicationSite"), applicationReason: text(data, "applicationReason"), administrationRoute: text(data, "administrationRoute"), shift: text(data, "shift"), idempotencyKey: randomUUID() });
  revalidatePath("/saude/vacinacao");
}

export async function recordVaccineLossAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await writeOffHealthStock(context, { stockId: text(data, "stockId"), quantity: Number(data.get("quantity")), reason: `IMUNOBIOLOGICO:${text(data, "reason")}` });
  revalidatePath("/saude/vacinacao");
}

export async function exportVaccinationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  const record = await context.prisma.vaccinationRecord.findUnique({ where: { id: text(data, "recordId") }, include: { vaccine: true, patient: true, professional: true, unit: true } });
  if (!record) throw new Error("Ficha de vacinação não encontrada.");
  assertHealthUnitAccess(context.user, record.unitId);
  await executeConfiguredHealthHttp(context.prisma, { code: "ESUS_VACINACAO", operation: "EXPORT_ESUS_VACCINATION", payload: { version: "LOCAL-1", record } });
  revalidatePath("/saude/vacinacao");
}
