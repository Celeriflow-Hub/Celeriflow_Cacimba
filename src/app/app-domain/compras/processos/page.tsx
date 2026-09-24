import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ProcessosListClient } from "./ProcessosListClient";

export default async function ProcessosComprasPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const processos = await prisma.purchaseProcess.findMany({
    include: {
      secretariat: true,
      _count: {
        select: {
          preliminaryStudies: true,
          termsOfReference: true,
          items: true,
          requestOrigins: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return <ProcessosListClient processes={processos.map((process) => ({
    id: process.id,
    number: process.number,
    object: process.object,
    type: process.type,
    modality: process.modality,
    status: process.status,
    estimatedValue: process.estimatedValue,
    secretariatName: process.secretariat.acronym || process.secretariat.name,
    itemCount: process._count.items,
    originCount: process._count.requestOrigins,
    preliminaryStudyCount: process._count.preliminaryStudies,
    termOfReferenceCount: process._count.termsOfReference,
    createdAt: process.createdAt.toISOString(),
  }))} />;
}
