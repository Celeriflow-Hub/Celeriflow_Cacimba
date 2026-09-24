"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getTenantPrisma() {
  return (await getTenantContextForModuleOperation("EDUCACAO", "create")).prisma;
}

export async function createSchool(formData: FormData) {
  const prisma = await getTenantPrisma();
  const name = formData.get("name") as string;
  const inepCode = formData.get("inepCode") as string;
  const cnpj = formData.get("cnpj") as string;
  const capacity = Number(formData.get("capacity")) || 0;
  const directorId = formData.get("directorId") as string;
  const realEstateId = formData.get("realEstateId") as string;

  if (!name) {
    throw new Error("O nome da escola é obrigatório.");
  }

  try {
    await prisma.school.create({
      data: {
        name,
        inepCode: inepCode || null,
        cnpj: cnpj || null,
        capacity,
        directorId: directorId || null,
        realEstateId: realEstateId || null,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Erro ao criar escola:", error);
    throw new Error("Erro ao cadastrar escola. Verifique se o INEP já existe.");
  }

  revalidatePath("/app-domain/educacao/escolas");
  redirect("/educacao/escolas");
}
