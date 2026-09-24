"use server";

import { recordStockMovement, StockServiceError, type StockMovementKind } from "@/lib/patrimonio/stock-service";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string; message?: string };

const text = z.string().trim().min(1, "Campo obrigatório.");
const stockInput = z.object({
  warehouseId: text,
  materialId: text,
  batchNumber: z.string().trim().max(100, "O lote deve ter no máximo 100 caracteres.").optional(),
  expirationDate: z.string().trim().optional(),
  unitCost: z.number().finite().nonnegative("O custo unitário deve ser maior ou igual a zero.").optional(),
  reason: z.string().trim().max(500, "A justificativa deve ter no máximo 500 caracteres.").optional(),
  settlementId: z.string().trim().min(1, "Liquidação inválida.").optional(),
});

function expirationDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new StockServiceError("Data de validade inválida.");
  }
  return date;
}

async function registerMovement(kind: StockMovementKind, data: {
  warehouseId: string;
  materialId: string;
  batchNumber?: string;
  expirationDate?: string;
  unitCost?: number;
  reason?: string;
  settlementId?: string;
  quantity: number;
}): Promise<ActionResult> {
  const parsed = stockInput.extend({ quantity: z.number().finite() }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados de estoque inválidos." };
  if (!parsed.data.reason) return { error: "Informe a justificativa da movimentação." };

  try {
    const operation = kind === "ENTRY" ? "create" : kind === "EXIT" ? "delete" : "update";
    const context = await getTenantContextForModuleOperation("PATRIMONIO", operation);
    await recordStockMovement(context.prisma, {
      kind,
      ...parsed.data,
      expirationDate: expirationDate(parsed.data.expirationDate),
      actor: { usuarioId: context.user.id, employeeId: context.user.employeeId },
    });
    revalidatePath("/patrimonio/materiais");
    revalidatePath("/patrimonio");
    return { message: kind === "ENTRY" ? "Entrada registrada." : kind === "EXIT" ? "Saída registrada." : "Ajuste registrado." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível registrar a movimentação." };
  }
}

export async function registerMaterialEntryAction(data: {
  warehouseId: string;
  materialId: string;
  quantity: number;
  batchNumber?: string;
  expirationDate?: string;
  unitCost?: number;
  reason?: string;
}): Promise<ActionResult> {
  void data;
  return { error: "Entradas manuais foram desabilitadas. Registre o recebimento aprovado da compra." };
}

export async function registerMaterialExitAction(data: {
  warehouseId: string;
  materialId: string;
  quantity: number;
  batchNumber?: string;
  reason?: string;
  settlementId?: string;
}) {
  return registerMovement("EXIT", data);
}

export async function adjustMaterialStockAction(data: {
  warehouseId: string;
  materialId: string;
  quantity: number;
  batchNumber?: string;
  expirationDate?: string;
  unitCost?: number;
  reason?: string;
}) {
  return registerMovement("ADJUSTMENT", data);
}
