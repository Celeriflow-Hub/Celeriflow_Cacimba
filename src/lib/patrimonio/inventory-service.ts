import { type Prisma, type PrismaClient } from "@prisma/client";
import { applyStockMovement, type StockActor } from "./stock-service";

export class InventoryServiceError extends Error {}

const OPEN_STATUSES = ["COUNTING", "PENDING_APPROVAL"];
const DIVERGENCE_TYPES = new Set([
  "SEM_DIVERGENCIA",
  "SOBRA",
  "FALTA",
  "VENCIDO",
  "DANIFICADO",
  "DESCARTE",
  "VENCIMENTO",
  "ITEM_INESPERADO",
  "AJUSTE_INVENTARIO",
  "LOTE_DIVERGENTE",
  "VALIDADE_DIVERGENTE",
]);

type InventoryActor = StockActor;

function required(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new InventoryServiceError(`${label} é obrigatório.`);
  return normalized;
}

function validCountedQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new InventoryServiceError("A quantidade contada deve ser maior ou igual a zero.");
  }
  return quantity;
}

export async function createInventorySession(db: PrismaClient, input: { warehouseId: string; actor: InventoryActor }) {
  const warehouseId = required(input.warehouseId, "Almoxarifado");
  const createdByUsuarioId = required(input.actor.usuarioId, "Usuário responsável");

  return db.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, isActive: true }, select: { id: true } });
    if (!warehouse) throw new InventoryServiceError("Almoxarifado não encontrado ou inativo.");

    const openSession = await tx.inventorySession.findFirst({
      where: { warehouseId, lockMovements: true, status: { in: OPEN_STATUSES } },
      select: { id: true },
    });
    if (openSession) throw new InventoryServiceError("Já existe um inventário em andamento para este almoxarifado.");

    const stocks = await tx.materialStock.findMany({
      where: { warehouseId },
      orderBy: { id: "asc" },
      select: { id: true, quantity: true },
    });
    if (stocks.length === 0) throw new InventoryServiceError("O almoxarifado não possui posições de estoque para inventariar.");

    return tx.inventorySession.create({
      data: {
        warehouseId,
        createdByUsuarioId,
        items: { create: stocks.map((stock) => ({ stockId: stock.id, expectedQuantity: stock.quantity })) },
      },
      include: { items: true },
    });
  });
}

export async function recordInventoryCount(db: PrismaClient, input: {
  sessionId: string;
  itemId: string;
  countedQuantity: number;
  divergenceType?: string;
  countEvidence?: string;
  adjustmentReason?: string;
}) {
  const sessionId = required(input.sessionId, "Inventário");
  const itemId = required(input.itemId, "Item do inventário");
  const countedQuantity = validCountedQuantity(input.countedQuantity);
  const requestedType = input.divergenceType?.trim().toUpperCase();
  if (requestedType && !DIVERGENCE_TYPES.has(requestedType)) throw new InventoryServiceError("Tipo de divergência inválido.");

  return db.$transaction(async (tx) => {
    const item = await tx.inventorySessionItem.findFirst({
      where: { id: itemId, sessionId },
      select: { id: true, expectedQuantity: true, session: { select: { status: true } } },
    });
    if (!item) throw new InventoryServiceError("Item do inventário não encontrado.");
    if (item.session.status !== "COUNTING") throw new InventoryServiceError("Este inventário não está aberto para contagem.");

    const quantityType = countedQuantity === item.expectedQuantity
      ? "SEM_DIVERGENCIA"
      : countedQuantity > item.expectedQuantity ? "SOBRA" : "FALTA";
    const divergenceType = requestedType && requestedType !== "SEM_DIVERGENCIA" ? requestedType : quantityType;
    const countEvidence = input.countEvidence?.trim() || null;
    const adjustmentReason = input.adjustmentReason?.trim() || null;
    if (divergenceType !== "SEM_DIVERGENCIA" && !countEvidence) {
      throw new InventoryServiceError("Registre a evidência da divergência encontrada.");
    }
    if (countedQuantity !== item.expectedQuantity && !adjustmentReason) {
      throw new InventoryServiceError("Informe a justificativa do ajuste de inventário.");
    }

    return tx.inventorySessionItem.update({
      where: { id: item.id },
      data: { countedQuantity, divergenceType, countEvidence, adjustmentReason, countedAt: new Date() },
    });
  });
}

export async function submitInventoryForApproval(db: PrismaClient, sessionId: string) {
  const id = required(sessionId, "Inventário");
  return db.$transaction(async (tx) => {
    const session = await tx.inventorySession.findUnique({
      where: { id },
      include: { items: { select: { countedQuantity: true } } },
    });
    if (!session) throw new InventoryServiceError("Inventário não encontrado.");
    if (session.status !== "COUNTING") throw new InventoryServiceError("O inventário não está aberto para envio.");
    if (session.items.some((item) => item.countedQuantity === null)) {
      throw new InventoryServiceError("Todos os itens devem ser contados antes do envio para aprovação.");
    }
    return tx.inventorySession.update({ where: { id }, data: { status: "PENDING_APPROVAL", submittedAt: new Date() } });
  });
}

export async function closeApprovedInventory(db: PrismaClient, input: {
  sessionId: string;
  approvalEvidence: string;
  actor: InventoryActor;
}) {
  const sessionId = required(input.sessionId, "Inventário");
  const approvalEvidence = required(input.approvalEvidence, "Evidência da aprovação");
  const approvedByUsuarioId = required(input.actor.usuarioId, "Usuário aprovador");

  return db.$transaction(async (tx) => {
    const session = await tx.inventorySession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            stock: { select: { warehouseId: true, materialId: true, batchNumber: true, unitCost: true } },
          },
        },
      },
    });
    if (!session) throw new InventoryServiceError("Inventário não encontrado.");
    if (session.status !== "PENDING_APPROVAL") throw new InventoryServiceError("O inventário ainda não está aguardando aprovação.");
    if (session.createdByUsuarioId === approvedByUsuarioId && process.env.STRICT_SEGREGATION === "true") {
      throw new InventoryServiceError("Segregação de Funções: O aprovador do inventário deve ser diferente do servidor inventoriante que iniciou a sessão.");
    }

    for (const item of session.items) {
      if (item.countedQuantity === null) throw new InventoryServiceError("Todos os itens devem ser contados antes do encerramento.");
      const adjustment = item.countedQuantity - item.expectedQuantity;
      if (adjustment === 0) continue;
      if (!item.adjustmentReason) throw new InventoryServiceError("Toda divergência deve ter justificativa de ajuste.");

      const { movement } = await applyStockMovement(tx, {
        kind: "ADJUSTMENT",
        warehouseId: item.stock.warehouseId,
        materialId: item.stock.materialId,
        batchNumber: item.stock.batchNumber,
        quantity: adjustment,
        unitCost: item.stock.unitCost,
        reason: `Inventário ${session.id}: ${item.adjustmentReason}`,
        inventorySessionId: session.id,
        actor: { usuarioId: approvedByUsuarioId, employeeId: input.actor.employeeId },
      });
      await tx.inventorySessionItem.update({ where: { id: item.id }, data: { adjustmentMovementId: movement.id } });
    }

    return tx.inventorySession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        lockMovements: false,
        approvedAt: new Date(),
        closedAt: new Date(),
        approvalEvidence,
        approvedByUsuarioId,
      },
    });
  });
}

export type InventoryTransaction = Prisma.TransactionClient;
