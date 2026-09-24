import { type Prisma, type PrismaClient } from "@prisma/client";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export class StockServiceError extends Error {}

export type StockMovementKind = "ENTRY" | "EXIT" | "ADJUSTMENT";

export type StockActor = {
  usuarioId: string;
  employeeId?: string | null;
};

export type StockMovementInput = {
  kind: StockMovementKind;
  warehouseId: string;
  materialId: string;
  quantity: number;
  batchNumber?: string | null;
  expirationDate?: Date | null;
  unitCost?: number | null;
  reason?: string | null;
  supplierId?: string | null;
  departmentId?: string | null;
  obrasServicoId?: string | null;
  /** Optional financial proof of delivery. Never required for Obras service issues. */
  settlementId?: string | null;
  /** Reserved for the approved inventory-close workflow. */
  inventorySessionId?: string | null;
  /** Stock entries are reserved for a receipt already approved by procurement. */
  sourceType?: "APPROVED_PURCHASE_RECEIPT" | "MATERIAL_REQUEST_ISSUE" | "ASSET_ACQUISITION" | "HEALTH_RECEIPT" | "STOCK_TRANSFER_RECEIPT";
  materialRequestItemId?: string | null;
  actor: StockActor;
};

type ValidStockMovementInput = StockMovementInput & { batchNumber: string };

function required(value: string, label: string) {
  if (!value.trim()) throw new StockServiceError(`${label} é obrigatório.`);
  return value.trim();
}

export function normalizeStockMovement(input: StockMovementInput): ValidStockMovementInput {
  const warehouseId = required(input.warehouseId, "Almoxarifado");
  const materialId = required(input.materialId, "Material");
  const batchNumber = input.batchNumber?.trim() ?? "";
  const actorUsuarioId = required(input.actor.usuarioId, "Usuário responsável");

  if (!Number.isFinite(input.quantity) || input.quantity === 0) {
    throw new StockServiceError("Informe uma quantidade diferente de zero.");
  }
  if (input.kind !== "ENTRY" && input.kind !== "EXIT" && input.kind !== "ADJUSTMENT") {
    throw new StockServiceError("Tipo de movimentação inválido.");
  }
  if ((input.kind === "ENTRY" || input.kind === "EXIT") && input.quantity < 0) {
    throw new StockServiceError("Entrada e saída devem informar quantidade positiva.");
  }
  if (input.kind === "ENTRY" && !["APPROVED_PURCHASE_RECEIPT", "HEALTH_RECEIPT", "STOCK_TRANSFER_RECEIPT"].includes(input.sourceType || "")) {
    throw new StockServiceError("Entradas de estoque exigem recebimento aprovado ou aceite de transferência.");
  }
  if (input.sourceType === "MATERIAL_REQUEST_ISSUE" && input.kind !== "EXIT") {
    throw new StockServiceError("A requisição de material pode originar somente uma saída de estoque.");
  }
  if (input.sourceType === "ASSET_ACQUISITION" && input.kind !== "EXIT") {
    throw new StockServiceError("O tombamento patrimonial pode originar somente uma saída de estoque.");
  }
  if (input.unitCost !== undefined && input.unitCost !== null && (!Number.isFinite(input.unitCost) || input.unitCost < 0)) {
    throw new StockServiceError("O custo unitário deve ser maior ou igual a zero.");
  }
  if (input.expirationDate && Number.isNaN(input.expirationDate.valueOf())) {
    throw new StockServiceError("Data de validade inválida.");
  }
  if (input.settlementId?.trim() && input.kind !== "EXIT") {
    throw new StockServiceError("A liquidação pode ser vinculada somente a uma saída de estoque.");
  }
  if (input.kind === "EXIT" && (input.reason?.trim() === "CONSUMO_ORCAMENTARIO" || input.reason?.trim() === "CONSUMO_ORCAMENTARIO_DIRETO")) {
    if (!input.settlementId?.trim()) {
      throw new StockServiceError("Saída de estoque por consumo orçamentário exige o vínculo de uma liquidação ativa.");
    }
  }

  return { ...input, warehouseId, materialId, batchNumber, actor: { ...input.actor, usuarioId: actorUsuarioId } };
}

function updateMetadata(input: ValidStockMovementInput) {
  return {
    ...(input.expirationDate !== undefined ? { expirationDate: input.expirationDate } : {}),
    ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
  };
}

async function ensureStockTarget(tx: Prisma.TransactionClient, input: ValidStockMovementInput) {
  const [warehouse, material, settlement] = await Promise.all([
    tx.warehouse.findFirst({ where: { id: input.warehouseId, isActive: true }, select: { id: true } }),
    tx.material.findUnique({ where: { id: input.materialId }, select: { id: true, isActive: true } }),
    input.settlementId?.trim()
      ? tx.settlement.findFirst({ where: { id: input.settlementId.trim(), status: "Liquidado" }, select: { id: true } })
      : null,
  ]);
  if (!warehouse) throw new StockServiceError("Almoxarifado não encontrado ou inativo.");
  const continuingLifecycle = ["APPROVED_PURCHASE_RECEIPT", "MATERIAL_REQUEST_ISSUE", "ASSET_ACQUISITION", "HEALTH_RECEIPT", "STOCK_TRANSFER_RECEIPT"].includes(input.sourceType || "")
    || (input.kind === "ADJUSTMENT" && Boolean(input.inventorySessionId?.trim()));
  if (!material || (material.isActive === false && !continuingLifecycle)) throw new StockServiceError("Material não encontrado ou inativo.");
  if (input.settlementId?.trim() && !settlement) throw new StockServiceError("Liquidação não encontrada ou não está ativa.");
}

async function ensureWarehouseIsNotCounting(tx: Prisma.TransactionClient, input: ValidStockMovementInput) {
  const lockedSession = await tx.inventorySession.findFirst({
    where: {
      warehouseId: input.warehouseId,
      lockMovements: true,
      status: { in: ["COUNTING", "PENDING_APPROVAL"] },
    },
    select: { id: true },
  });
  if (lockedSession && (input.inventorySessionId !== lockedSession.id || input.kind !== "ADJUSTMENT")) {
    throw new StockServiceError("Movimentações estão bloqueadas enquanto o inventário deste almoxarifado está em andamento.");
  }
}

async function increaseStock(tx: Prisma.TransactionClient, input: ValidStockMovementInput, quantity: number) {
  return tx.materialStock.upsert({
    where: {
      warehouseId_materialId_batchNumber: {
        warehouseId: input.warehouseId,
        materialId: input.materialId,
        batchNumber: input.batchNumber,
      },
    },
    create: {
      warehouseId: input.warehouseId,
      materialId: input.materialId,
      batchNumber: input.batchNumber,
      quantity,
      expirationDate: input.expirationDate ?? null,
      unitCost: input.unitCost ?? null,
    },
    update: {
      quantity: { increment: quantity },
      ...updateMetadata(input),
    },
    select: { id: true, unitCost: true },
  });
}

async function decreaseStock(tx: Prisma.TransactionClient, input: ValidStockMovementInput, quantity: number) {
  const stock = await tx.materialStock.findUnique({
    where: {
      warehouseId_materialId_batchNumber: {
        warehouseId: input.warehouseId,
        materialId: input.materialId,
        batchNumber: input.batchNumber,
      },
    },
    select: { id: true, unitCost: true },
  });
  if (!stock) throw new StockServiceError("Estoque não encontrado para o lote informado.");

  const updated = await tx.materialStock.updateMany({
    where: { id: stock.id, quantity: { gte: quantity } },
    data: { quantity: { decrement: quantity } },
  });
  if (updated.count !== 1) throw new StockServiceError("Estoque insuficiente para atender a solicitação.");
  return stock;
}

/** Applies a movement inside an existing transaction so callers can add domain records atomically. */
export async function applyStockMovement(tx: Prisma.TransactionClient, rawInput: StockMovementInput) {
  const input = normalizeStockMovement(rawInput);
  await ensureStockTarget(tx, input);
  await ensureWarehouseIsNotCounting(tx, input);

  const stock = input.kind === "ENTRY" || (input.kind === "ADJUSTMENT" && input.quantity > 0)
    ? await increaseStock(tx, input, input.quantity)
    : await decreaseStock(tx, input, Math.abs(input.quantity));

  const type = input.kind === "ENTRY" ? "Entrada" : input.kind === "EXIT" ? "Saída" : "Ajuste";
  const movement = await tx.materialMovement.create({
    data: {
      type,
      quantity: input.quantity,
      unitValue: input.unitCost ?? stock.unitCost,
      reason: input.reason?.trim() || null,
      warehouseId: input.warehouseId,
      materialId: input.materialId,
      stockId: stock.id,
      supplierId: input.supplierId?.trim() || null,
      departmentId: input.departmentId?.trim() || null,
      obrasServicoId: input.obrasServicoId?.trim() || null,
      settlementId: input.settlementId?.trim() || null,
      inventorySessionId: input.inventorySessionId?.trim() || null,
      materialRequestItemId: input.materialRequestItemId?.trim() || null,
      actorUsuarioId: input.actor.usuarioId,
      actorEmployeeId: input.actor.employeeId ?? null,
    },
  });
  return { stock, movement };
}

export async function recordStockMovement(db: PrismaClient, input: StockMovementInput) {
  return db.$transaction(async (tx) => {
    const result = await applyStockMovement(tx, input);
    if (input.kind === "ADJUSTMENT" && !input.inventorySessionId?.trim()) {
      await writeAuditEvent(tx, {
        actorUsuarioId: input.actor.usuarioId,
        eventType: auditEventTypes.stockManuallyAdjusted,
        targetType: "MATERIAL_MOVEMENT",
        targetId: result.movement.id,
      });
    }
    return result;
  });
}
