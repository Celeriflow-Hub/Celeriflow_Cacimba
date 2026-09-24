"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "update" | "delete") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function saveLicenca(formData: FormData) {
  const id = formData.get("id") as string | null;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  try {
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;
    const status = formData.get("status") as string;

    if (!employeeId || !type || !startDate || !endDate) {
      return { success: false, error: "Servidor, Tipo e Período são obrigatórios." };
    }

    const data = {
      employeeId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || null,
      status: status || "Ativa",
    };

    if (id) {
      await prisma.leave.update({
        where: { id },
        data,
      });
    } else {
      await prisma.leave.create({
        data,
      });
    }

    revalidatePath("/rh/licencas");
    revalidatePath("/portal-servidor");
    revalidatePath("/portal-servidor/ferias");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar licença:", error);
    return { success: false, error: "Falha ao salvar a licença." };
  }
}

export async function deleteLicenca(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.leave.delete({
      where: { id },
    });
    revalidatePath("/rh/licencas");
    revalidatePath("/portal-servidor");
    revalidatePath("/portal-servidor/ferias");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir licença:", error);
    return { success: false, error: "Falha ao excluir o registro de licença." };
  }
}

