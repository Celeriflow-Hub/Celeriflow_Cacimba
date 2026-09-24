"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "delete") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function addBenefitToEmployee(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  try {
    const employeeId = formData.get("employeeId") as string;
    const benefitConfigId = formData.get("benefitConfigId") as string;
    const customValueStr = formData.get("customValue") as string;
    
    if (!employeeId || !benefitConfigId) {
      return { success: false, error: "Servidor e Benefício são obrigatórios." };
    }

    const customValue = customValueStr ? parseFloat(customValueStr) : null;

    await prisma.payrollBenefit.create({
      data: {
        employeeId,
        benefitConfigId,
        customValue,
      }
    });

    revalidatePath(`/rh/servidores/${employeeId}/editar`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao conceder benefício:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao conceder benefício." };
  }
}

export async function removeBenefitFromEmployee(benefitId: string, employeeId: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.payrollBenefit.delete({
      where: { id: benefitId }
    });
    revalidatePath(`/rh/servidores/${employeeId}/editar`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover benefício:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao remover benefício." };
  }
}
