"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { nextYearlyCode } from "@/lib/sequence";
import { Prisma } from "@prisma/client";
import { createPurchaseProcessFromApprovedRequests, ProcurementLifecycleError } from "@/lib/compras/procurement-lifecycle";
import { normalizePurchaseItems, PurchaseItemInputError } from "./purchase-item-input";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("COMPRAS", operation)).prisma;
}

type PurchaseProcessItemInput = {
  id?: string;
  catalogItemId: string;
  customName: string;
  quantity: number;
  estimatedUnitValue: number;
};

type PurchaseProcessInput = {
  id?: string;
  number: string;
  object: string;
  type: string;
  modality: string;
  estimatedValue: number;
  items: PurchaseProcessItemInput[];
  purchaseRequestId?: string;
  purchaseRequestIds?: string[];
};

export async function deletePurchaseProcess(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    const affectedPurchaseRequestIds = await prisma.$transaction(async (tx) => {
      const process = await tx.purchaseProcess.findUnique({
        where: { id },
        select: {
          purchaseRequestId: true,
          items: { select: { id: true } },
          requestOrigins: { select: { purchaseRequestId: true } },
        },
      });
      if (!process) throw new Error("Processo não encontrado.");
      if (process.items.length) {
        await tx.purchaseProcessItemOrigin.deleteMany({
          where: { purchaseProcessItemId: { in: process.items.map((item) => item.id) } },
        });
      }
      await tx.purchaseProcessRequestOrigin.deleteMany({ where: { purchaseProcessId: id } });
      await tx.purchaseProcess.delete({ where: { id } });
      return [...new Set([
        ...(process.purchaseRequestId ? [process.purchaseRequestId] : []),
        ...process.requestOrigins.map((origin) => origin.purchaseRequestId),
      ])];
    });
    revalidatePath("/compras/processos");
    revalidatePath("/compras/solicitacoes");
    affectedPurchaseRequestIds.forEach((purchaseRequestId) => revalidatePath(`/compras/solicitacoes/${purchaseRequestId}`));
    return { success: true };
  } catch (error) {
    console.error("Error deleting purchase process:", error);
    return { success: false, error: "Falha ao excluir o processo." };
  }
}

export async function savePurchaseProcess(payload: PurchaseProcessInput) {
  try {
    const { id, number, object, type, modality, items, purchaseRequestId, purchaseRequestIds } = payload;
    const context = await getTenantContextForModuleOperation("COMPRAS", id ? "update" : "create");
    const { prisma } = context;
    let finalNumber = number?.trim();
    if (!finalNumber && !id) {
      const processes = await prisma.purchaseProcess.findMany({ select: { number: true } });
      finalNumber = await nextYearlyCode({ prisma, key: "compras-processo", prefix: "PROC", existingCodes: processes.map(({ number }) => ({ code: number })) });
    }
    if (!finalNumber) {
      return { success: false, error: "Informe o número do processo." };
    }

    if (!id) {
      const selectedPurchaseRequestIds = Array.isArray(purchaseRequestIds)
        ? purchaseRequestIds.map((requestId) => requestId.trim()).filter(Boolean)
        : purchaseRequestId?.trim() ? [purchaseRequestId.trim()] : [];
      if (!selectedPurchaseRequestIds.length) return { success: false, error: "Selecione ao menos uma solicitação de compra aprovada." };
      await createPurchaseProcessFromApprovedRequests(prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, {
        purchaseRequestIds: selectedPurchaseRequestIds,
        number: finalNumber,
        object,
        type,
        modality,
      });
      revalidatePath("/compras/processos");
      revalidatePath("/compras/solicitacoes");
      selectedPurchaseRequestIds.forEach((selectedPurchaseRequestId) => revalidatePath(`/compras/solicitacoes/${selectedPurchaseRequestId}`));
      return { success: true };
    }

    const normalizedItems = normalizePurchaseItems(items);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseProcess.findUnique({
        where: { id },
        select: {
          status: true,
          items: {
            select: {
              id: true,
              catalogItemId: true,
              customName: true,
              materialId: true,
              quantity: true,
              estimatedUnitValue: true,
              receiptItems: {
                select: {
                  quantity: true,
                  purchaseReceipt: { select: { status: true } },
                },
              },
              requestItemOrigins: {
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      });
      if (!existing || existing.status !== "Em Planejamento") {
        return { error: "Somente processos em planejamento podem ser editados." };
      }

      const existingItemsById = new Map(existing.items.map((item) => [item.id, item]));
      const suppliedItemIds = new Set<string>();
      for (const item of normalizedItems.items) {
        if (!item.id) continue;
        if (suppliedItemIds.has(item.id) || !existingItemsById.has(item.id)) {
          return { error: "Os itens informados não pertencem a este processo." };
        }
        suppliedItemIds.add(item.id);
      }

      const catalogItemIdsToResolve = normalizedItems.items.flatMap((item) => {
        if (!item.catalogItemId) return [];
        const existingItem = item.id ? existingItemsById.get(item.id) : null;
        return !existingItem || existingItem.catalogItemId !== item.catalogItemId ? [item.catalogItemId] : [];
      });
      const catalogItems = catalogItemIdsToResolve.length
        ? await tx.catalogItem.findMany({
          where: { id: { in: catalogItemIdsToResolve }, isActive: true },
          select: { id: true, materials: { select: { id: true } } },
        })
        : [];
      if (catalogItems.length !== new Set(catalogItemIdsToResolve).size) {
        return { error: "Selecione itens ativos do catálogo ou descreva o item livre." };
      }
      if (catalogItems.some((item) => item.materials.length > 1)) {
        return { error: "Um item do catálogo está vinculado a mais de um material. Corrija o cadastro antes de salvar o processo." };
      }

      const materialIdByCatalogItemId = new Map(catalogItems.map((item) => [item.id, item.materials[0]?.id ?? null]));
      const itemsToSave = normalizedItems.items.map((item) => {
        const existingItem = item.id ? existingItemsById.get(item.id) : null;
        // Keep the material copied into an existing line until its catalog item changes.
        const keepsCatalogIdentity = Boolean(existingItem && existingItem.catalogItemId === item.catalogItemId);
        return {
          ...item,
          materialId: keepsCatalogIdentity ? existingItem!.materialId : item.catalogItemId ? materialIdByCatalogItemId.get(item.catalogItemId) ?? null : null,
        };
      });

      for (const item of itemsToSave) {
        if (!item.id) continue;
        const existingItem = existingItemsById.get(item.id)!;
        if (existingItem.requestItemOrigins.length) {
          const originatedQuantity = existingItem.requestItemOrigins.reduce((total, origin) => total + origin.quantity, 0);
          if (
            existingItem.catalogItemId !== item.catalogItemId
            || existingItem.materialId !== item.materialId
            || existingItem.customName !== item.customName
            || item.quantity !== originatedQuantity
            || item.estimatedUnitValue !== (existingItem.estimatedUnitValue ?? 0)
          ) {
            return { error: "Não é possível alterar um item formado a partir de solicitações de compra." };
          }
        }
        if (!existingItem.receiptItems.length) continue;

        if (existingItem.catalogItemId !== item.catalogItemId || existingItem.materialId !== item.materialId || existingItem.customName !== item.customName) {
          return { error: "Não é possível alterar a identificação de um item que já possui recebimentos." };
        }
        const receivedQuantity = existingItem.receiptItems
          .filter((receiptItem) => receiptItem.purchaseReceipt.status === "APPROVED")
          .reduce((total, receiptItem) => total + receiptItem.quantity, 0);
        if (item.quantity < receivedQuantity) {
          return { error: "A quantidade de um item não pode ser menor que o total já recebido." };
        }
      }

      const removedItems = existing.items.filter((item) => !suppliedItemIds.has(item.id));
      if (removedItems.some((item) => item.requestItemOrigins.length)) {
        return { error: "Não é possível remover um item formado a partir de solicitações de compra." };
      }
      if (removedItems.some((item) => item.receiptItems.length)) {
        return { error: "Não é possível remover um item que já possui recebimentos." };
      }

      await tx.purchaseProcess.update({
        where: { id },
        data: {
          number: finalNumber,
          object,
          type,
          modality,
          estimatedValue: normalizedItems.estimatedValue,
        },
      });
      if (removedItems.length) {
        await tx.purchaseProcessItem.deleteMany({ where: { id: { in: removedItems.map((item) => item.id) } } });
      }
      for (const item of itemsToSave) {
        const data = {
          catalogItemId: item.catalogItemId,
          materialId: item.materialId,
          customName: item.customName,
          quantity: item.quantity,
          estimatedUnitValue: item.estimatedUnitValue,
        };
        if (item.id) {
          await tx.purchaseProcessItem.update({ where: { id: item.id }, data });
        } else {
          await tx.purchaseProcessItem.create({ data: { purchaseProcessId: id, ...data } });
        }
      }

      return { id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if ("error" in result) return { success: false, error: result.error };
    revalidatePath("/compras/processos");
    revalidatePath(`/compras/processos/${result.id}`);
    revalidatePath("/compras/recebimentos");
    return { success: true };
  } catch (error) {
    if (error instanceof PurchaseItemInputError) return { success: false, error: error.message };
    if (error instanceof ProcurementLifecycleError) return { success: false, error: error.message };
    console.error("Error saving purchase process:", error);
    return { success: false, error: "Falha ao salvar o processo." };
  }
}
