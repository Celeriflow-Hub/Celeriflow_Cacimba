"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("TRIBUTACAO", operation)).prisma;
}

export async function createCertificate(data: {
  certificateType: string;
  taxpayerId: string;
  validUntil: string;
}) {
  const prisma = await getTenantPrisma("create");
  const result = await prisma.taxCertificate.create({
    data: {
      certificateType: data.certificateType,
      taxpayerId: data.taxpayerId,
      validUntil: new Date(data.validUntil),
      authCode: `INTERNO-${randomUUID()}`,
      status: "Rascunho Interno"
    }
  });

  revalidatePath("/tributacao/certidoes");
  return result;
}

export async function cancelCertificate(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.taxCertificate.update({
    where: { id },
    data: { status: "Revogada" }
  });

  revalidatePath("/tributacao/certidoes");
  return result;
}
