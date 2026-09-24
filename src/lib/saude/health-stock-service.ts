import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { applyStockMovement } from "@/lib/patrimonio/stock-service";
import { parseHealthSusImport } from "./sus-import-contract";

type Tx = Prisma.TransactionClient;

export class HealthStockError extends Error {}

const positive = z.number().positive();
const receiptSchema = z.object({
  warehouseId: z.string().min(1),
  supplierId: z.string().min(1).nullable().optional(),
  entryType: z.string().trim().min(2).max(60),
  fundingSource: z.string().trim().max(120).nullable().optional(),
  invoiceNumber: z.string().trim().max(60).nullable().optional(),
  invoiceKey: z.string().trim().max(60).nullable().optional(),
  invoiceXmlHash: z.string().trim().max(128).nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(180),
  items: z.array(z.object({
    materialId: z.string().min(1),
    batchNumber: z.string().trim().min(1).max(80),
    productionDate: z.coerce.date().nullable().optional(),
    expirationDate: z.coerce.date().nullable().optional(),
    quantity: positive,
    unitCost: z.number().min(0),
  })).min(1),
}).strict();

const transferSchema = z.object({
  originWarehouseId: z.string().min(1),
  destinationWarehouseId: z.string().min(1),
  requestNumber: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(180),
  items: z.array(z.object({
    materialId: z.string().min(1),
    batchNumber: z.string().trim().min(1).max(80),
    quantity: positive,
  })).min(1),
}).strict();

const dispenseSchema = z.object({
  prescriptionItemId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: positive,
  batchNumber: z.string().trim().max(80).nullable().optional(),
  observation: z.string().trim().max(500).nullable().optional(),
  nextWithdrawalAt: z.coerce.date().nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(180),
}).strict();

async function scopedWarehouse(tx: Tx, context: AppContext, warehouseId: string) {
  const warehouse = await tx.warehouse.findFirst({
    where: { id: warehouseId, isActive: true },
    select: { id: true, healthUnitId: true },
  });
  if (!warehouse?.healthUnitId) throw new HealthStockError("Estoque assistencial não encontrado ou sem unidade de saúde vinculada.");
  assertHealthUnitAccess(context.user, warehouse.healthUnitId);
  return { id: warehouse.id, unitId: warehouse.healthUnitId };
}

async function currentProfessional(tx: Tx, context: AppContext) {
  if (!context.user.employeeId) throw new HealthStockError("Vincule o usuário autenticado a um profissional de saúde.");
  const professional = await tx.healthProfessional.findFirst({
    where: { employeeId: context.user.employeeId, isActive: true },
    select: { id: true },
  });
  if (!professional) throw new HealthStockError("Profissional de saúde ativo não encontrado.");
  return professional;
}

export async function postHealthStockReceipt(context: AppContext, raw: unknown) {
  const input = receiptSchema.parse(raw);
  return context.prisma.$transaction(async (tx) => {
    const existing = await tx.healthStockReceipt.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, status: true } });
    if (existing) return existing;
    await scopedWarehouse(tx, context, input.warehouseId);
    const receipt = await tx.healthStockReceipt.create({
      data: {
        warehouseId: input.warehouseId,
        supplierId: input.supplierId,
        entryType: input.entryType,
        fundingSource: input.fundingSource,
        invoiceNumber: input.invoiceNumber,
        invoiceKey: input.invoiceKey,
        invoiceXmlHash: input.invoiceXmlHash,
        idempotencyKey: input.idempotencyKey,
        createdByUsuarioId: context.user.id,
        items: { create: input.items },
      },
      include: { items: true },
    });
    for (const item of receipt.items) {
      const { movement, stock } = await applyStockMovement(tx, {
        kind: "ENTRY",
        sourceType: "HEALTH_RECEIPT",
        warehouseId: receipt.warehouseId,
        materialId: item.materialId,
        batchNumber: item.batchNumber,
        expirationDate: item.expirationDate,
        quantity: item.quantity,
        unitCost: item.unitCost,
        supplierId: receipt.supplierId,
        reason: `RECEBIMENTO_ASSISTENCIAL:${receipt.id}`,
        actor: { usuarioId: context.user.id, employeeId: context.user.employeeId },
      });
      if (item.productionDate) await tx.materialStock.update({ where: { id: stock.id }, data: { productionDate: item.productionDate } });
      await tx.healthStockReceiptItem.update({ where: { id: item.id }, data: { movementId: movement.id } });
    }
    return tx.healthStockReceipt.update({ where: { id: receipt.id }, data: { status: "POSTED", postedAt: new Date() }, select: { id: true, status: true } });
  });
}

export async function dispatchHealthStockTransfer(context: AppContext, raw: unknown) {
  const input = transferSchema.parse(raw);
  if (input.originWarehouseId === input.destinationWarehouseId) throw new HealthStockError("Os estoques de origem e destino devem ser diferentes.");
  return context.prisma.$transaction(async (tx) => {
    const existing = await tx.healthStockTransfer.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, status: true } });
    if (existing) return existing;
    await scopedWarehouse(tx, context, input.originWarehouseId);
    await scopedWarehouse(tx, context, input.destinationWarehouseId);
    const transfer = await tx.healthStockTransfer.create({
      data: { originWarehouseId: input.originWarehouseId, destinationWarehouseId: input.destinationWarehouseId, requestNumber: input.requestNumber, notes: input.notes, idempotencyKey: input.idempotencyKey, status: "DRAFT", createdByUsuarioId: context.user.id, items: { create: input.items } },
      include: { items: true },
    });
    for (const item of transfer.items) {
      const stock = await tx.materialStock.findUnique({
        where: { warehouseId_materialId_batchNumber: { warehouseId: input.originWarehouseId, materialId: item.materialId, batchNumber: item.batchNumber } },
        select: { expirationDate: true, blockedAt: true },
      });
      if (!stock || stock.blockedAt) throw new HealthStockError("Lote de origem indisponível ou bloqueado.");
      const { movement } = await applyStockMovement(tx, { kind: "EXIT", warehouseId: input.originWarehouseId, materialId: item.materialId, batchNumber: item.batchNumber, quantity: item.quantity, reason: `TRANSFERENCIA_EM_TRANSITO:${transfer.id}`, actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
      await tx.healthStockTransferItem.update({ where: { id: item.id }, data: { departureMovementId: movement.id, expirationDate: stock.expirationDate } });
    }
    return tx.healthStockTransfer.update({ where: { id: transfer.id }, data: { status: "IN_TRANSIT", dispatchedAt: new Date() }, select: { id: true, status: true } });
  });
}

export async function receiveHealthStockTransfer(context: AppContext, transferId: string) {
  return context.prisma.$transaction(async (tx) => {
    const transfer = await tx.healthStockTransfer.findUnique({ where: { id: transferId }, include: { items: true } });
    if (!transfer) throw new HealthStockError("Transferência não encontrada.");
    await scopedWarehouse(tx, context, transfer.destinationWarehouseId);
    if (transfer.status === "RECEIVED") return { id: transfer.id, status: transfer.status };
    if (transfer.status !== "IN_TRANSIT") throw new HealthStockError("Somente transferências em trânsito podem ser recebidas.");
    for (const item of transfer.items) {
      const { movement } = await applyStockMovement(tx, { kind: "ENTRY", sourceType: "STOCK_TRANSFER_RECEIPT", warehouseId: transfer.destinationWarehouseId, materialId: item.materialId, batchNumber: item.batchNumber, expirationDate: item.expirationDate, quantity: item.quantity, reason: `ACEITE_TRANSFERENCIA:${transfer.id}`, actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
      await tx.healthStockTransferItem.update({ where: { id: item.id }, data: { arrivalMovementId: movement.id } });
    }
    return tx.healthStockTransfer.update({ where: { id: transfer.id }, data: { status: "RECEIVED", receivedAt: new Date(), receivedByUsuarioId: context.user.id }, select: { id: true, status: true } });
  });
}

export async function dispensePrescriptionItem(context: AppContext, raw: unknown) {
  const input = dispenseSchema.parse(raw);
  return context.prisma.$transaction(async (tx) => {
    const existing = await tx.medicineDispensation.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } });
    if (existing) return existing;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.prescriptionItemId}))`;
    const [warehouse, professional, item] = await Promise.all([
      scopedWarehouse(tx, context, input.warehouseId),
      currentProfessional(tx, context),
      tx.healthPrescriptionItem.findUnique({ where: { id: input.prescriptionItemId }, include: { medicine: true, prescription: true, dispensations: { select: { quantity: true } } } }),
    ]);
    if (!item?.medicine?.materialId) throw new HealthStockError("O item prescrito não está vinculado ao cadastro único de material.");
    assertHealthUnitAccess(context.user, item.prescription.unitId || "");
    const alreadyDispensed = item.dispensations.reduce((sum, value) => sum + value.quantity, 0);
    if (item.quantity !== null && alreadyDispensed + input.quantity > item.quantity) throw new HealthStockError("A quantidade supera o saldo da prescrição.");
    const stock = input.batchNumber
      ? await tx.materialStock.findUnique({ where: { warehouseId_materialId_batchNumber: { warehouseId: input.warehouseId, materialId: item.medicine.materialId, batchNumber: input.batchNumber } } })
      : await tx.materialStock.findFirst({ where: { warehouseId: input.warehouseId, materialId: item.medicine.materialId, quantity: { gte: input.quantity }, blockedAt: null, OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }] }, orderBy: [{ expirationDate: "asc" }, { createdAt: "asc" }] });
    if (!stock || stock.blockedAt || (stock.expirationDate && stock.expirationDate < new Date())) throw new HealthStockError("Não há lote válido e desbloqueado para a dispensação.");
    const { movement } = await applyStockMovement(tx, { kind: "EXIT", warehouseId: input.warehouseId, materialId: item.medicine.materialId, batchNumber: stock.batchNumber, quantity: input.quantity, reason: `DISPENSACAO_RECEITA:${item.prescriptionId}`, actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
    return tx.medicineDispensation.create({ data: { quantity: input.quantity, medicineId: item.medicine.id, patientId: item.prescription.patientId, unitId: warehouse.unitId, prescriptionItemId: item.id, warehouseId: input.warehouseId, stockId: stock.id, movementId: movement.id, dispensedByProfessionalId: professional.id, dosageSnapshot: [item.dose, item.frequency, item.duration].filter(Boolean).join(" · "), observation: input.observation, nextWithdrawalAt: input.nextWithdrawalAt, idempotencyKey: input.idempotencyKey }, select: { id: true } });
  });
}

// Carga de catálogo (RENAME e similares) pelo contrato controlado de
// importação (CSV/XML/TXT): codigo, nome, principio_ativo, concentracao,
// apresentacao, embalagem, dcb. Sem vínculo oficial declarado.
export async function importHealthProducts(context: AppContext, content: string, extension: string) {
  const records = parseHealthSusImport(content, extension);
  let created = 0; let updated = 0;
  const issues: Array<{ rowNumber: number; reason: string }> = [];
  const valueOf = (values: Record<string, string>, ...keys: string[]) => {
    const normalized = (key: string) => key.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    for (const key of keys) {
      const value = values[normalized(key)];
      if (value?.trim()) return value.trim();
    }
    return "";
  };
  for (const record of records) {
    const code = valueOf(record.values, "codigo", "codigo_produto");
    const name = valueOf(record.values, "nome", "descricao", "medicamento");
    if (!code || !name) { issues.push({ rowNumber: record.rowNumber, reason: "Informe código e nome do produto." }); continue; }
    const activePrinciple = valueOf(record.values, "principio_ativo", "principio") || null;
    const concentration = valueOf(record.values, "concentracao") || null;
    const packaging = valueOf(record.values, "apresentacao", "embalagem") || null;
    const dcb = valueOf(record.values, "dcb", "codigo_dcb") || null;
    await context.prisma.$transaction(async tx => {
      const existing = await tx.material.findUnique({ where: { code }, select: { id: true } });
      let materialId: string;
      if (existing) {
        materialId = existing.id;
        await tx.healthMaterialProfile.upsert({ where: { materialId }, create: { materialId, productKind: "MEDICINE", packaging, dcbCode: dcb }, update: { packaging: packaging || undefined, dcbCode: dcb || undefined, isActive: true } });
        updated += 1;
      } else {
        const category = await tx.materialCategory.findFirst({ where: { isActive: true }, select: { id: true } });
        if (!category) throw new HealthStockError("Cadastre ao menos um grupo de material antes da carga.");
        const material = await tx.material.create({ data: { code, name, categoryId: category.id, unitOfMeasure: "UN", isPerishable: true }, select: { id: true } });
        materialId = material.id;
        await tx.healthMaterialProfile.create({ data: { materialId, productKind: "MEDICINE", packaging, dcbCode: dcb } });
        created += 1;
      }
      const linked = await tx.medicine.findFirst({ where: { name: { equals: name, mode: "insensitive" }, materialId: null }, select: { id: true } });
      if (linked) await tx.medicine.update({ where: { id: linked.id }, data: { materialId, presentation: packaging, activePrinciple, concentration } });
      else if (!await tx.medicine.findFirst({ where: { materialId }, select: { id: true } })) await tx.medicine.create({ data: { name, materialId, presentation: packaging, activePrinciple, concentration } });
    });
  }
  return { created, updated, issues };
}

// Acerto/balanço: informa o saldo real por lote; a diferença vira
// ajuste auditável. Não gera compra.
export async function reconcileStockBalance(context: AppContext, input: { stockId: string; realQuantity: number; reason?: string | null }) {
  if (!Number.isFinite(input.realQuantity) || input.realQuantity < 0) throw new HealthStockError("Informe o saldo real do lote.");
  return context.prisma.$transaction(async tx => {
    const stock = await tx.materialStock.findUnique({ where: { id: input.stockId }, select: { id: true, quantity: true, warehouseId: true, materialId: true, batchNumber: true } });
    if (!stock) throw new HealthStockError("Lote não encontrado.");
    await scopedWarehouse(tx, context, stock.warehouseId);
    const diff = input.realQuantity - stock.quantity;
    if (diff === 0) return { id: stock.id, adjusted: 0 };
    await applyStockMovement(tx, { kind: "ADJUSTMENT", warehouseId: stock.warehouseId, materialId: stock.materialId, batchNumber: stock.batchNumber, quantity: diff, reason: `ACERTO_BALANCO:${(input.reason || "contagem").trim()}`, actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
    return { id: stock.id, adjusted: diff };
  });
}

export async function saveStockPolicy(context: AppContext, raw: unknown) {
  const input = z.object({ warehouseId: z.string().min(1), materialId: z.string().min(1), minQuantity: z.number().min(0), maxQuantity: z.number().min(0) }).strict().parse(raw);
  if (input.maxQuantity < input.minQuantity) throw new HealthStockError("O máximo não pode ser menor que o mínimo.");
  const warehouse = await context.prisma.warehouse.findUnique({ where: { id: input.warehouseId }, select: { healthUnitId: true } });
  if (!warehouse?.healthUnitId) throw new HealthStockError("Estoque assistencial inválido.");
  assertHealthUnitAccess(context.user, warehouse.healthUnitId);
  return context.prisma.healthStockPolicy.upsert({ where: { warehouseId_materialId: { warehouseId: input.warehouseId, materialId: input.materialId } }, create: input, update: { minQuantity: input.minQuantity, maxQuantity: input.maxQuantity, isActive: true }, select: { id: true } });
}

export async function writeOffHealthStock(context: AppContext, input: { stockId: string; quantity: number; reason: string }) {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.reason.trim().length < 3) throw new HealthStockError("Informe quantidade e motivo da baixa.");
  return context.prisma.$transaction(async (tx) => {
    const stock = await tx.materialStock.findUnique({ where: { id: input.stockId } });
    if (!stock) throw new HealthStockError("Lote não encontrado.");
    await scopedWarehouse(tx, context, stock.warehouseId);
    return applyStockMovement(tx, { kind: "EXIT", warehouseId: stock.warehouseId, materialId: stock.materialId, batchNumber: stock.batchNumber, quantity: input.quantity, reason: `BAIXA_ASSISTENCIAL:${input.reason.trim()}`, actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
  });
}
