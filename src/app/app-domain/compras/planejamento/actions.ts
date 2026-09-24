"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import {
  normalizePurchasePlanningInput,
  PurchasePlanningError,
} from "@/lib/compras/purchase-planning";

export type PurchasePlanningActionResult = { success: true; id: string } | { success: false; error: string };

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function revalidatePlanningPaths(id: string) {
  revalidatePath("/compras/planejamento");
  revalidatePath(`/compras/planejamento/${id}`);
  revalidatePath(`/compras/planejamento/${id}/editar`);
}

function actionFailure(error: unknown): PurchasePlanningActionResult {
  if (error instanceof PurchasePlanningError || error instanceof AccessError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    return { success: false, error: "O item de catálogo ou a solicitação de origem não está mais disponível." };
  }
  console.error("Unable to save purchase planning:", error);
  return { success: false, error: "Não foi possível salvar o planejamento de compra." };
}

export async function savePurchasePlanning(formData: FormData): Promise<PurchasePlanningActionResult> {
  const id = formString(formData, "id");

  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", id ? "update" : "create");
    const input = normalizePurchasePlanningInput({
      description: formString(formData, "description"),
      catalogItemId: formString(formData, "catalogItemId"),
      originPurchaseRequestId: formString(formData, "originPurchaseRequestId"),
      unit: formString(formData, "unit"),
      quantity: formString(formData, "quantity"),
      expectedPeriodStart: formString(formData, "expectedPeriodStart"),
      expectedPeriodEnd: formString(formData, "expectedPeriodEnd"),
      estimatedValueDecimal: formString(formData, "estimatedValueDecimal"),
      status: formString(formData, "status"),
    });

    const [catalogItem, originPurchaseRequest] = await Promise.all([
      input.catalogItemId
        ? context.prisma.catalogItem.findFirst({
          where: { id: input.catalogItemId, isActive: true },
          select: { id: true },
        })
        : null,
      input.originPurchaseRequestId
        ? context.prisma.purchaseRequest.findUnique({
          where: { id: input.originPurchaseRequestId },
          select: { id: true },
        })
        : null,
    ]);

    if (input.catalogItemId && !catalogItem) {
      return { success: false, error: "Selecione um item ativo do catálogo." };
    }
    if (input.originPurchaseRequestId && !originPurchaseRequest) {
      return { success: false, error: "Selecione uma solicitação de origem existente." };
    }

    const data = {
      description: input.description,
      catalogItemId: input.catalogItemId,
      originPurchaseRequestId: input.originPurchaseRequestId,
      unit: input.unit,
      quantity: input.quantity,
      expectedPeriodStart: input.expectedPeriodStart,
      expectedPeriodEnd: input.expectedPeriodEnd,
      estimatedValueDecimal: input.estimatedValueDecimal,
      status: input.status,
    };

    if (id) {
      const existing = await context.prisma.purchasePlanning.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) return { success: false, error: "Planejamento de compra não encontrado." };

      await context.prisma.purchasePlanning.update({ where: { id: existing.id }, data });
      revalidatePlanningPaths(existing.id);
      return { success: true, id: existing.id };
    }

    const planning = await context.prisma.purchasePlanning.create({ data });
    revalidatePlanningPaths(planning.id);
    return { success: true, id: planning.id };
  } catch (error) {
    return actionFailure(error);
  }
}
