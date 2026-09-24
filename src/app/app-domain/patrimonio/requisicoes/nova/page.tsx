import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { MaterialRequestForm } from "./MaterialRequestForm";

export default async function NovaRequisicaoMaterialPage() {
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, unitOfMeasure: true },
    orderBy: { name: "asc" },
  });

  return <MaterialRequestForm materials={materials} />;
}
