import { getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import { SolicitacaoForm } from "../../SolicitacaoForm";
import { notFound } from "next/navigation";
import { canManagePurchaseRequest, canSelectAnyPurchaseRequestOrigin, purchaseRequestOriginScope } from "@/lib/compras/purchase-request-policy";

export default async function EditarSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getTenantContextForModule("COMPRAS");
  const { prisma } = context;
  const resolvedParams = await params;
  const solicitacao = await prisma.purchaseRequest.findUnique({
    where: { id: resolvedParams.id },
    include: { items: { include: { budgetAllocations: true } } },
  });

  if (!solicitacao || !canManagePurchaseRequest(context.user, solicitacao)) {
    notFound();
  }
  const origin = purchaseRequestOriginScope(context.user);
  const canSelectAnyOrigin = canSelectAnyPurchaseRequestOrigin(context.user);
  const budgetUnitScope = isSystemAdministrator(context.user) ? {} : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } };
  const [catalogItems, secretarias, departments, budgetAppropriations] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { isActive: true, materials: { none: { isActive: false } } },
      orderBy: { name: 'asc' }
    }),
    prisma.secretariat.findMany({
      where: origin ? { id: origin.secretariatId } : canSelectAnyOrigin ? undefined : { id: "__sem-origem-autorizada__" },
      orderBy: { name: 'asc' }
    }),
    prisma.department.findMany({ where: { isActive: true, ...(origin ? { id: origin.departmentId } : canSelectAnyOrigin ? {} : { id: "__sem-origem-autorizada__" }) }, select: { id: true, name: true, secretariatId: true }, orderBy: { name: 'asc' } }),
    prisma.budgetAppropriation.findMany({
      where: budgetUnitScope,
      select: {
        id: true,
        code: true,
        budgetUnit: { select: { name: true, secretariatId: true } },
        expenseNature: { select: { code: true, name: true } },
        resourceSource: { select: { code: true, name: true } },
        financialYear: { select: { year: true } },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const mappedSolicitacao = {
    ...solicitacao,
    items: solicitacao.items.map((item) => ({
      id: item.id,
      catalogItemId: item.catalogItemId ?? (item.customName ? "custom" : ""),
      customName: item.customName ?? "",
      quantity: item.quantity,
      estimatedUnitValue: item.estimatedUnitValue ?? 0,
      allocations: item.budgetAllocations.map((allocation) => ({
        budgetAppropriationId: allocation.budgetAppropriationId,
        quantity: allocation.quantity,
        value: allocation.valueDecimal.toNumber(),
      })),
    }))
  };

  return <SolicitacaoForm
    data={mappedSolicitacao}
    catalogItems={catalogItems}
    secretarias={secretarias}
    departments={departments}
    budgetAppropriations={budgetAppropriations.map((appropriation) => ({
      id: appropriation.id,
      code: appropriation.code,
      secretariatId: appropriation.budgetUnit.secretariatId,
      budgetUnitName: appropriation.budgetUnit.name,
      expenseNatureCode: appropriation.expenseNature.code,
      expenseNatureName: appropriation.expenseNature.name,
      resourceSourceCode: appropriation.resourceSource.code,
      resourceSourceName: appropriation.resourceSource.name,
      financialYear: appropriation.financialYear.year,
    }))}
    initialOrigin={origin}
    originLocked={!canSelectAnyOrigin}
  />;
}
