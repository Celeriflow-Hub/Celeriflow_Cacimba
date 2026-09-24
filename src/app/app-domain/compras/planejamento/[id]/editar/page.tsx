import { notFound } from "next/navigation";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { PlanningForm } from "../../PlanningForm";

export default async function EditarPlanejamentoComprasPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModuleOperation("COMPRAS", "update");
  const { id } = await params;
  const [planning, catalogItems, purchaseRequests] = await Promise.all([
    prisma.purchasePlanning.findUnique({ where: { id } }),
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

  if (!planning) notFound();

  return <PlanningForm
    catalogItems={catalogItems}
    purchaseRequests={purchaseRequests}
    data={{
      id: planning.id,
      description: planning.description,
      catalogItemId: planning.catalogItemId,
      originPurchaseRequestId: planning.originPurchaseRequestId,
      unit: planning.unit,
      quantity: planning.quantity,
      expectedPeriodStart: planning.expectedPeriodStart.toISOString().slice(0, 10),
      expectedPeriodEnd: planning.expectedPeriodEnd.toISOString().slice(0, 10),
      estimatedValueDecimal: Number(planning.estimatedValueDecimal),
      status: planning.status,
    }}
  />;
}
