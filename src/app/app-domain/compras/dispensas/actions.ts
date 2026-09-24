"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("COMPRAS", operation)).prisma;
}

export async function deleteDispensa(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.directContracting.delete({ where: { id } });
    revalidatePath("/compras/licitacoes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting dispensa:", error);
    return { success: false, error: "Falha ao excluir a dispensa." };
  }
}

export async function saveDispensa(formData: FormData) {
  const id = formData.get("id") as string | null;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  const type = formData.get("type") as string;
  const status = formData.get("status") as string;
  const justification = formData.get("justification") as string;
  
  const processId = formData.get("processId") as string;
  const supplierId = formData.get("supplierId") as string;
  const value = Number(formData.get("value") || 0);

  if (!processId || !supplierId) {
    return { success: false, error: "Selecione o processo e o fornecedor vinculados." };
  }

  const data: Prisma.DirectContractingUncheckedCreateInput = {
    type: type || "Dispensa",
    status: status || "Em Elaboração",
    justification,
    processId,
    supplierId,
    value,
  };

  try {
    if (id) {
      await prisma.directContracting.update({ where: { id }, data });
    } else {
      await prisma.directContracting.create({ data });
    }
    revalidatePath("/compras/licitacoes");
    return { success: true };
  } catch (error) {
    console.error("Error saving dispensa:", error);
    return { success: false, error: "Falha ao salvar a dispensa." };
  }
}
