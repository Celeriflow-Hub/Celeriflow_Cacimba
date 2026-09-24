"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("COMPRAS", operation)).prisma;
}

type CatalogItemFormData = {
  id: string | null;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  estimatedValue: number;
  isActive: boolean;
};

export async function saveCatalogItem(formData: CatalogItemFormData) {
  const prisma = await getTenantPrisma(formData.id ? "update" : "create");
  try {
    let finalCode = formData.code;

    // Se não tiver código, gerar automaticamente
    if (!finalCode || finalCode.trim() === "") {
      // Pega o último código gerado ou a quantidade total para gerar um próximo
      const count = await prisma.catalogItem.count();
      const nextId = count + 1;
      finalCode = `CAT-${String(nextId).padStart(4, '0')}`;
      
      // Validação de segurança, caso a exclusão de itens cause colisões
      let existing = await prisma.catalogItem.findUnique({ where: { code: finalCode } });
      let increment = nextId;
      while (existing) {
        increment++;
        finalCode = `CAT-${String(increment).padStart(4, '0')}`;
        existing = await prisma.catalogItem.findUnique({ where: { code: finalCode } });
      }
    } else {
      // Se tiver código, verificar se já existe em outro item
      const existing = await prisma.catalogItem.findUnique({ where: { code: finalCode } });
      if (existing && existing.id !== formData.id) {
        return { success: false, error: "Este código já está em uso por outro item. Escolha outro código ou deixe em branco para auto-gerar." };
      }
    }

    if (formData.id) {
      await prisma.catalogItem.update({
        where: { id: formData.id },
        data: {
          code: finalCode,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          unit: formData.unit,
          estimatedValue: formData.estimatedValue,
          isActive: formData.isActive
        }
      });
    } else {
      await prisma.catalogItem.create({
        data: {
          code: finalCode,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          unit: formData.unit,
          estimatedValue: formData.estimatedValue,
          isActive: formData.isActive
        }
      });
    }
    revalidatePath("/compras/catalogo");
    return { success: true };
  } catch (error) {
    console.error("Error saving catalog item:", error);
    return { success: false, error: "Falha ao salvar o item do catálogo." };
  }
}

export async function toggleCatalogItemStatus(id: string, isActive: boolean) {
  const prisma = await getTenantPrisma("update");
  try {
    await prisma.catalogItem.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/compras/catalogo");
    return { success: true };
  } catch (error) {
    console.error("Error toggling catalog item status:", error);
    return { success: false, error: "Falha ao alterar o status do item." };
  }
}
