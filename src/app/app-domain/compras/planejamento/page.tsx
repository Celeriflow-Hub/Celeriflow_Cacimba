import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PlanningListClient } from "./PlanningListClient";

export default async function PlanejamentoComprasPage() {
  const { prisma, user } = await getTenantContextForModule("COMPRAS");
  const plannings = await prisma.purchasePlanning.findMany({
    select: {
      id: true,
      description: true,
      unit: true,
      quantity: true,
      expectedPeriodStart: true,
      expectedPeriodEnd: true,
      estimatedValueDecimal: true,
      status: true,
      catalogItem: { select: { name: true } },
      originPurchaseRequest: { select: { id: true, number: true, object: true } },
    },
    orderBy: [{ expectedPeriodStart: "asc" }, { createdAt: "desc" }],
  });

  return <PlanningListClient
    canCreate={canPerformModuleOperation(user, "COMPRAS", "create")}
    canUpdate={canPerformModuleOperation(user, "COMPRAS", "update")}
    plannings={plannings.map((planning) => ({
      id: planning.id,
      itemName: planning.catalogItem?.name ?? planning.description ?? "Item sem especificação",
      description: planning.catalogItem ? planning.description : null,
      unit: planning.unit,
      quantity: planning.quantity,
      expectedPeriodStart: planning.expectedPeriodStart.toISOString(),
      expectedPeriodEnd: planning.expectedPeriodEnd.toISOString(),
      estimatedValueDecimal: Number(planning.estimatedValueDecimal),
      status: planning.status,
      originId: planning.originPurchaseRequest?.id ?? null,
      originNumber: planning.originPurchaseRequest?.number ?? null,
      originObject: planning.originPurchaseRequest?.object ?? null,
    }))}
  />;
}
