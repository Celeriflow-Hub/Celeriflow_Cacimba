"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("TRIBUTACAO", operation)).prisma;
}

export async function createRealEstate(data: {
  municipalInsc: string;
  streetName: string;
  number: string;
  propertyType: string;
  landArea: number;
  builtArea: number;
  taxpayerId?: string;
  registration?: string;
  propertyUse?: string;
  fiscalZone?: string;
  lot?: string;
  block?: string;
}) {
  const prisma = await getTenantPrisma("create");
  const result = await prisma.realEstate.create({
    data: {
      municipalInsc: data.municipalInsc || undefined,
      streetName: data.streetName,
      number: data.number,
      propertyType: data.propertyType,
      landArea: data.landArea,
      builtArea: data.builtArea,
      taxpayerId: data.taxpayerId || undefined,
      registration: data.registration || undefined,
      propertyUse: data.propertyUse || undefined,
      fiscalZone: data.fiscalZone || undefined,
      lot: data.lot || undefined,
      block: data.block || undefined,
      status: "Regular"
    }
  });

  revalidatePath("/tributacao/imoveis");
  return result;
}

export async function updateRealEstate(id: string, data: {
  municipalInsc?: string | null;
  streetName?: string | null;
  number?: string | null;
  propertyType?: string;
  landArea?: number | null;
  builtArea?: number | null;
}) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.realEstate.update({
    where: { id },
    data
  });

  revalidatePath("/tributacao/imoveis");
  return result;
}

export async function deactivateRealEstate(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.realEstate.update({
    where: { id },
    data: { status: "Inativo" }
  });

  revalidatePath("/tributacao/imoveis");
  return result;
}

export async function activateRealEstate(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.realEstate.update({
    where: { id },
    data: { status: "Regular" }
  });

  revalidatePath("/tributacao/imoveis");
  return result;
}
