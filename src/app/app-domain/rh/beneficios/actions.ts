"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "update" | "delete") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function saveBeneficio(formData: FormData) {
  const id = formData.get("id") as string;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  try {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const baseValue = parseFloat(formData.get("baseValue") as string);
    const supplierId = formData.get("supplierId") as string;
    const isActive = formData.get("isActive") === "true";

    if (!name || !type || isNaN(baseValue)) {
      return { success: false, error: "Nome, Tipo e Valor Base são obrigatórios." };
    }

    const data = {
      name,
      type,
      baseValue,
      supplierId: supplierId && supplierId !== 'none' ? supplierId : null,
      isActive,
    };

    if (id) {
      await prisma.benefitConfig.update({
        where: { id },
        data,
      });
    } else {
      await prisma.benefitConfig.create({
        data,
      });
    }

    revalidatePath("/rh/beneficios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar benefício master:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ocorreu um erro ao salvar." };
  }
}

export async function toggleBeneficioStatus(id: string, isActive: boolean) {
  const prisma = await getTenantPrisma("update");
  try {
    await prisma.benefitConfig.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/rh/beneficios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alternar status do benefício:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao alternar status do benefício." };
  }
}

export async function deleteBeneficio(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    // Should check if it has payroll benefits linked before deleting
    const count = await prisma.payrollBenefit.count({ where: { benefitConfigId: id } });
    if (count > 0) {
      return { success: false, error: "Este benefício já está vinculado a servidores e não pode ser excluído. Inative-o em vez disso." };
    }

    await prisma.benefitConfig.delete({
      where: { id },
    });
    revalidatePath("/rh/beneficios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir benefício:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao excluir benefício." };
  }
}
