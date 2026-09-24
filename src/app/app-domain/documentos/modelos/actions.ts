"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("DOCUMENTOS", operation)).prisma;
}

export async function updateModelo(
  id: string,
  data: { title?: string; notes?: string | null; status?: string }
) {
  const prisma = await getTenantPrisma("update");
  await prisma.document.update({ where: { id }, data });
  revalidatePath("/documentos/modelos");
  revalidatePath("/documentos");
}

export async function deleteModelo(id: string) {
  const prisma = await getTenantPrisma("delete");
  await prisma.document.delete({ where: { id } });
  revalidatePath("/documentos/modelos");
  revalidatePath("/documentos");
}

export async function createModelo(title: string, notes: string) {
  const prisma = await getTenantPrisma("create");
  if (!title.trim()) throw new Error("Título obrigatório");
  await prisma.document.create({
    data: {
      title: title.trim(),
      documentType: "Modelo",
      fileUrl: `/modelos/${Date.now()}_${title.trim().replace(/\s+/g, "_")}.docx`,
      status: "Ativo",
      notes: notes?.trim() || null,
    },
  });
  revalidatePath("/documentos/modelos");
  revalidatePath("/documentos");
}
