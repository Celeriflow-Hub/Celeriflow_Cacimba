"use server";

import {
  approveMaterialRequest,
  createMaterialRequest,
  issueMaterialRequestInFull,
  issueMaterialRequestItem,
  ProcurementLifecycleError,
} from "@/lib/compras/procurement-lifecycle";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string; message?: string };

const createMaterialRequestInput = z.object({
  number: z.string().trim().max(100, "O número deve ter no máximo 100 caracteres.").optional(),
  justification: z.string().trim().max(1000, "A justificativa deve ter no máximo 1000 caracteres.").optional(),
  idempotencyKey: z.string().trim().min(1, "Chave de idempotência inválida."),
  items: z.array(z.object({
    materialId: z.string().trim().min(1, "Selecione um material."),
    quantityRequested: z.number().finite().positive("A quantidade solicitada deve ser maior que zero."),
  })).min(1, "Adicione ao menos um item."),
});

const fullIssueInput = z.object({
  requestId: z.string().trim().min(1, "Requisição inválida."),
  stockByItem: z.array(z.object({
    requestItemId: z.string().trim().min(1, "Item de requisição inválido."),
    stockId: z.string().trim().min(1, "Selecione a posição de estoque."),
  })),
});

export async function createMaterialRequestAction(data: {
  number?: string;
  justification?: string;
  idempotencyKey: string;
  items: Array<{ materialId: string; quantityRequested: number }>;
}): Promise<ActionResult> {
  const parsed = createMaterialRequestInput.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados da requisição inválidos." };

  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    const request = await createMaterialRequest(context.prisma, {
      usuarioId: context.user.id,
      employeeId: context.user.employeeId,
    }, parsed.data);
    revalidatePath("/patrimonio/requisicoes");
    return { message: `Requisição ${request.number} registrada.` };
  } catch (error) {
    return { error: error instanceof ProcurementLifecycleError ? error.message : "Não foi possível registrar a requisição." };
  }
}

export async function approveMaterialRequestAction(requestId: string, quantities: Array<{ itemId: string; quantityApproved: number }>): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    await approveMaterialRequest(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { requestId, quantities });
    revalidatePath("/patrimonio/requisicoes");
    return {};
  } catch (error) {
    return { error: error instanceof ProcurementLifecycleError ? error.message : "Não foi possível aprovar a requisição." };
  }
}

export async function issueMaterialRequestItemAction(data: { requestItemId: string; stockId: string; quantity: number }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    await issueMaterialRequestItem(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidatePath("/patrimonio/requisicoes");
    revalidatePath("/patrimonio/materiais");
    return {};
  } catch (error) {
    return { error: error instanceof ProcurementLifecycleError ? error.message : "Não foi possível atender a requisição." };
  }
}

export async function issueMaterialRequestInFullAction(data: {
  requestId: string;
  stockByItem: Array<{ requestItemId: string; stockId: string }>;
}): Promise<ActionResult> {
  const parsed = fullIssueInput.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados da entrega inválidos." };

  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    await issueMaterialRequestInFull(context.prisma, {
      usuarioId: context.user.id,
      employeeId: context.user.employeeId,
    }, parsed.data);
    revalidatePath("/patrimonio/requisicoes");
    revalidatePath(`/patrimonio/requisicoes/${parsed.data.requestId}`);
    revalidatePath("/patrimonio/materiais");
    revalidatePath("/patrimonio");
    return { message: "Entrega integral registrada." };
  } catch (error) {
    return { error: error instanceof ProcurementLifecycleError ? error.message : "Não foi possível registrar a entrega integral." };
  }
}
