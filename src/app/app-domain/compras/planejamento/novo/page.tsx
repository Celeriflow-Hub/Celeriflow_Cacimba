import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { PlanningForm } from "../PlanningForm";

export default async function NovoPlanejamentoComprasPage() {
  const { prisma } = await getTenantContextForModuleOperation("COMPRAS", "create");
  const [catalogItems, purchaseRequests] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.purchaseRequest.findMany({
      select: { id: true, number: true, object: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <PlanningForm catalogItems={catalogItems} purchaseRequests={purchaseRequests} />;
}
