"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertHealthUnitAccess, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { dispatchHealthStockTransfer, dispensePrescriptionItem, postHealthStockReceipt, receiveHealthStockTransfer, writeOffHealthStock } from "@/lib/saude/health-stock-service";
import { executeConfiguredHealthHttp } from "@/lib/integrations/runtime";
import type { IntegrationOperation } from "@/lib/integrations/registry";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();
const number = (data: FormData, name: string) => Number(data.get(name));

export async function createHealthProductAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const kind = text(data, "productKind");
  const name = text(data, "name");
  if (!name || !["MEDICINE", "CONTROLLED", "MANIPULATED", "CORRELATE", "IMMUNOBIOLOGICAL", "SPECIALIZED"].includes(kind)) throw new Error("Informe nome e tipo válidos.");
  await context.prisma.$transaction(async tx => {
    const material = await tx.material.create({ data: { code: text(data, "code"), name, categoryId: text(data, "categoryId"), unitOfMeasure: text(data, "unitOfMeasure") || "UN", isPerishable: true }, select: { id: true } });
    await tx.healthMaterialProfile.create({ data: { materialId: material.id, productKind: kind, subgroup: text(data, "subgroup") || null, packaging: text(data, "packaging") || null, dcbCode: text(data, "dcbCode") || null, classification: text(data, "classification") || null, barcode: text(data, "barcode") || null } });
    if (["MEDICINE", "CONTROLLED", "MANIPULATED"].includes(kind)) {
      const existing = await tx.medicine.findFirst({ where: { name: { equals: name, mode: "insensitive" }, materialId: null }, select: { id: true } });
      if (existing) await tx.medicine.update({ where: { id: existing.id }, data: { materialId: material.id, isControlled: kind === "CONTROLLED", presentation: text(data, "packaging") || null, activePrinciple: text(data, "activePrinciple") || null, concentration: text(data, "concentration") || null } });
      else await tx.medicine.create({ data: { name, materialId: material.id, isControlled: kind === "CONTROLLED", presentation: text(data, "packaging") || null, activePrinciple: text(data, "activePrinciple") || null, concentration: text(data, "concentration") || null } });
    }
    if (kind === "IMMUNOBIOLOGICAL") {
      const existing = await tx.vaccine.findFirst({ where: { name: { equals: name, mode: "insensitive" }, materialId: null }, select: { id: true } });
      if (existing) await tx.vaccine.update({ where: { id: existing.id }, data: { materialId: material.id } });
      else await tx.vaccine.create({ data: { name, materialId: material.id } });
    }
  });
  revalidatePath("/saude/farmacia");
  revalidatePath("/saude/vacinacao");
}

export async function createHealthWarehouseAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const unitId = text(data, "healthUnitId");
  const unit = await context.prisma.healthUnit.findFirst({ where: { id: unitId, isActive: true }, select: { id: true } });
  if (!unit) throw new Error("Unidade de saúde ativa não encontrada.");
  assertHealthUnitAccess(context.user, unit.id);
  await context.prisma.warehouse.create({ data: { name: text(data, "name"), type: "Assistencial", healthUnitId: unit.id } });
  revalidatePath("/saude/farmacia");
}

export async function dispatchPharmacyIntegrationAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  const code = text(data, "code");
  const operations: Record<string, IntegrationOperation> = { HORUS: "EXPORT_HORUS", SIGAF: "EXPORT_SIGAF", TRANSPARENCIA_SAUDE: "EXPORT_HEALTH_STOCK_TRANSPARENCY" };
  const operation = operations[code];
  if (!operation) throw new Error("Conector farmacêutico inválido.");
  const unitIds = context.user.hasHealthAccessScope ? context.user.allowedHealthUnitIds || [] : undefined;
  const stocks = await context.prisma.materialStock.findMany({ where: { quantity: { gt: 0 }, material: { healthProfile: { isActive: true } }, warehouse: { healthUnitId: unitIds ? { in: unitIds } : { not: null } } }, select: { quantity: true, batchNumber: true, expirationDate: true, material: { select: { code: true, name: true } }, warehouse: { select: { name: true, healthUnit: { select: { cnes: true } } } } } });
  const payload = code === "TRANSPARENCIA_SAUDE" ? stocks.map(({ material, warehouse, quantity }) => ({ productCode: material.code, productName: material.name, unit: warehouse.name, quantity })) : stocks;
  await executeConfiguredHealthHttp(context.prisma, { code, operation, payload: { generatedAt: new Date().toISOString(), stocks: payload } });
  revalidatePath("/saude/farmacia");
}

export async function saveMedicineInteractionAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const originMedicineId = text(data, "originMedicineId"); const targetMedicineId = text(data, "targetMedicineId");
  if (originMedicineId === targetMedicineId) throw new Error("Selecione medicamentos diferentes.");
  await context.prisma.medicineInteraction.upsert({ where: { originMedicineId_targetMedicineId: { originMedicineId, targetMedicineId } }, create: { originMedicineId, targetMedicineId, description: text(data, "description"), severity: text(data, "severity") || null, source: text(data, "source") }, update: { description: text(data, "description"), severity: text(data, "severity") || null, source: text(data, "source"), isActive: true } });
  revalidatePath("/saude/farmacia");
}

export async function saveDosageTemplateAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const medicineId = text(data, "medicineId"); const name = text(data, "name");
  await context.prisma.medicineDosageTemplate.upsert({ where: { medicineId_name: { medicineId, name } }, create: { medicineId, name, dose: text(data, "dose"), route: text(data, "route") || null, frequency: text(data, "frequency"), duration: text(data, "duration") || null, instructions: text(data, "instructions") || null }, update: { dose: text(data, "dose"), route: text(data, "route") || null, frequency: text(data, "frequency"), duration: text(data, "duration") || null, instructions: text(data, "instructions") || null, isActive: true } });
  revalidatePath("/saude/farmacia");
}

export async function createPharmacyRequestAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  const warehouse = await context.prisma.warehouse.findUnique({ where: { id: text(data, "destinationWarehouseId") }, select: { healthUnitId: true } });
  if (!warehouse?.healthUnitId) throw new Error("Estoque assistencial inválido.");
  assertHealthUnitAccess(context.user, warehouse.healthUnitId);
  await context.prisma.pharmacyRequest.create({ data: { patientId: text(data, "patientId") || null, destinationWarehouseId: text(data, "destinationWarehouseId"), createdByUsuarioId: context.user.id, notes: text(data, "notes") || null, items: { create: { materialId: text(data, "materialId"), requestedQuantity: number(data, "quantity") } } } });
  revalidatePath("/saude/farmacia");
}

export async function setStockBlockAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  const stockId = text(data, "stockId"); const blocked = text(data, "blocked") === "true"; const reason = text(data, "reason");
  if (blocked && reason.length < 3) throw new Error("Informe o motivo do bloqueio.");
  const stock = await context.prisma.materialStock.findUnique({ where: { id: stockId }, select: { warehouse: { select: { healthUnitId: true } } } });
  if (!stock?.warehouse.healthUnitId) throw new Error("Lote assistencial inválido.");
  assertHealthUnitAccess(context.user, stock.warehouse.healthUnitId);
  await context.prisma.materialStock.update({ where: { id: stockId }, data: { blockedAt: blocked ? new Date() : null, blockReason: blocked ? reason : null } });
  revalidatePath("/saude/farmacia");
}

export async function toggleControlledBookAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  const warehouseId = text(data, "warehouseId"); const period = text(data, "period"); const close = text(data, "close") === "true";
  const warehouse = await context.prisma.warehouse.findUnique({ where: { id: warehouseId }, select: { healthUnitId: true } });
  if (!warehouse?.healthUnitId) throw new Error("Estoque assistencial inválido.");
  assertHealthUnitAccess(context.user, warehouse.healthUnitId);
  const book = await context.prisma.controlledMedicineBook.upsert({ where: { warehouseId_period: { warehouseId, period } }, create: { warehouseId, period, openedByUsuarioId: context.user.id }, update: {} });
  if (close) await context.prisma.controlledMedicineBook.update({ where: { id: book.id }, data: { status: "CLOSED", closedAt: new Date(), closedByUsuarioId: context.user.id, closingEvidence: text(data, "closingEvidence") || null } });
  revalidatePath("/saude/farmacia");
}

export async function receiveStockAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await postHealthStockReceipt(context, { warehouseId: text(data, "warehouseId"), supplierId: text(data, "supplierId") || null, entryType: text(data, "entryType"), fundingSource: text(data, "fundingSource") || null, invoiceNumber: text(data, "invoiceNumber") || null, invoiceKey: text(data, "invoiceKey") || null, idempotencyKey: randomUUID(), items: [{ materialId: text(data, "materialId"), batchNumber: text(data, "batchNumber"), productionDate: text(data, "productionDate") || null, expirationDate: text(data, "expirationDate") || null, quantity: number(data, "quantity"), unitCost: number(data, "unitCost") }] });
  revalidatePath("/saude/farmacia");
}

export async function dispenseAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await dispensePrescriptionItem(context, { prescriptionItemId: text(data, "prescriptionItemId"), warehouseId: text(data, "warehouseId"), quantity: number(data, "quantity"), batchNumber: text(data, "batchNumber") || null, observation: text(data, "observation") || null, nextWithdrawalAt: text(data, "nextWithdrawalAt") || null, idempotencyKey: randomUUID() });
  revalidatePath("/saude/farmacia");
}

export async function dispatchTransferAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "create");
  await dispatchHealthStockTransfer(context, { originWarehouseId: text(data, "originWarehouseId"), destinationWarehouseId: text(data, "destinationWarehouseId"), requestNumber: text(data, "requestNumber") || null, notes: text(data, "notes") || null, idempotencyKey: randomUUID(), items: [{ materialId: text(data, "materialId"), batchNumber: text(data, "batchNumber"), quantity: number(data, "quantity") }] });
  revalidatePath("/saude/farmacia");
}

export async function receiveTransferAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await receiveHealthStockTransfer(context, text(data, "transferId"));
  revalidatePath("/saude/farmacia");
}

export async function writeOffAction(data: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  await writeOffHealthStock(context, { stockId: text(data, "stockId"), quantity: number(data, "quantity"), reason: text(data, "reason") });
  revalidatePath("/saude/farmacia");
}
