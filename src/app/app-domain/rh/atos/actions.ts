"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "update" | "delete") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function saveAtoPessoal(formData: FormData) {
  const id = formData.get("id") as string | null;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  try {
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as string;
    const date = formData.get("date") as string;
    const actNumber = formData.get("actNumber") as string;
    const documentUrl = formData.get("documentUrl") as string;

    if (!employeeId || !type || !date) {
      return { success: false, error: "Servidor, Tipo e Data são obrigatórios." };
    }

    const data = {
      employeeId,
      type,
      date: new Date(date),
      actNumber: actNumber || null,
      documentUrl: documentUrl || null,
    };

    if (id) {
      await prisma.personnelAct.update({
        where: { id },
        data,
      });
    } else {
      await prisma.personnelAct.create({
        data,
      });
    }

    revalidatePath("/rh/atos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar ato de pessoal:", error);
    return { success: false, error: "Falha ao salvar o ato de pessoal." };
  }
}

export async function deleteAtoPessoal(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.personnelAct.delete({
      where: { id },
    });
    revalidatePath("/rh/atos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir ato de pessoal:", error);
    return { success: false, error: "Falha ao excluir o ato de pessoal." };
  }
}
