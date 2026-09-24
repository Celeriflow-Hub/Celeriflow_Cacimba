"use server";

import {
  closeApprovedInventory,
  createInventorySession,
  InventoryServiceError,
  recordInventoryCount,
  submitInventoryForApproval,
} from "@/lib/patrimonio/inventory-service";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string; message?: string };

const text = z.string().trim().min(1, "Campo obrigatório.");

function resultMessage(error: unknown, fallback: string): ActionResult {
  return { error: error instanceof Error ? error.message : fallback };
}

function invalidateInventoryPaths(sessionId?: string) {
  revalidatePath("/patrimonio/inventarios");
  revalidatePath("/patrimonio/materiais");
  revalidatePath("/patrimonio");
  if (sessionId) revalidatePath(`/patrimonio/inventarios/${sessionId}`);
}

export async function createInventorySessionAction(data: { warehouseId: string }): Promise<ActionResult> {
  const parsed = z.object({ warehouseId: text }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados do inventário inválidos." };
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    const session = await createInventorySession(context.prisma, {
      warehouseId: parsed.data.warehouseId,
      actor: { usuarioId: context.user.id, employeeId: context.user.employeeId },
    });
    invalidateInventoryPaths(session.id);
    return { message: "Inventário iniciado; as movimentações deste almoxarifado estão bloqueadas." };
  } catch (error) {
    return resultMessage(error, "Não foi possível iniciar o inventário.");
  }
}

export async function recordInventoryCountAction(data: {
  sessionId: string;
  itemId: string;
  countedQuantity: number;
  divergenceType?: string;
  countEvidence?: string;
  adjustmentReason?: string;
}): Promise<ActionResult> {
  const parsed = z.object({
    sessionId: text,
    itemId: text,
    countedQuantity: z.number().finite().nonnegative("A quantidade contada deve ser maior ou igual a zero."),
    divergenceType: z.string().trim().optional(),
    countEvidence: z.string().trim().max(2000).optional(),
    adjustmentReason: z.string().trim().max(1000).optional(),
  }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados da contagem inválidos." };
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    await recordInventoryCount(context.prisma, parsed.data);
    invalidateInventoryPaths(parsed.data.sessionId);
    return { message: "Contagem registrada." };
  } catch (error) {
    return resultMessage(error, "Não foi possível registrar a contagem.");
  }
}

export async function submitInventoryForApprovalAction(data: { sessionId: string }): Promise<ActionResult> {
  const parsed = z.object({ sessionId: text }).safeParse(data);
  if (!parsed.success) return { error: "Inventário inválido." };
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    await submitInventoryForApproval(context.prisma, parsed.data.sessionId);
    invalidateInventoryPaths(parsed.data.sessionId);
    return { message: "Inventário enviado para aprovação; o bloqueio de movimentações foi mantido." };
  } catch (error) {
    return resultMessage(error, "Não foi possível enviar o inventário.");
  }
}

export async function closeApprovedInventoryAction(data: { sessionId: string; approvalEvidence: string }): Promise<ActionResult> {
  const parsed = z.object({ sessionId: text, approvalEvidence: text.max(2000) }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados da aprovação inválidos." };
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    await closeApprovedInventory(context.prisma, {
      ...parsed.data,
      actor: { usuarioId: context.user.id, employeeId: context.user.employeeId },
    });
    invalidateInventoryPaths(parsed.data.sessionId);
    return { message: "Inventário aprovado, ajustado e encerrado." };
  } catch (error) {
    // Preserve business errors for the client action contract.
    if (error instanceof InventoryServiceError) return { error: error.message };
    return resultMessage(error, "Não foi possível encerrar o inventário.");
  }
}
