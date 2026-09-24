"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: "create" | "update") {
  return (await getTenantContextForModuleOperation("RH", operation)).prisma;
}

export async function saveEvent(formData: FormData) {
  const id = formData.get("id") as string;
  const prisma = await getTenantPrisma(id ? "update" : "create");
  try {
    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const formula = formData.get("formula") as string;
    const isActive = formData.get("isActive") === "true";

    if (!code || !name || !type) {
      return { success: false, error: "Código, Nome e Tipo são obrigatórios." };
    }

    // Verificar se código já existe (se for novo ou se mudou de código)
    const existing = await prisma.payrollEvent.findUnique({
      where: { code }
    });

    if (existing && existing.id !== id) {
      return { success: false, error: "Este código já está em uso por outro evento." };
    }

    const data = {
      code,
      name,
      type,
      formula: formula || null,
      isActive,
    };

    if (id) {
      await prisma.payrollEvent.update({
        where: { id },
        data,
      });
    } else {
      await prisma.payrollEvent.create({
        data,
      });
    }

    revalidatePath("/rh/folha/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ocorreu um erro ao salvar." };
  }
}
