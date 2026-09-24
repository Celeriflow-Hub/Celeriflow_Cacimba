import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { calculateInclusiveContractTermDays } from "@/lib/compras/contract-lifecycle";
import { ContratosListClient } from "./ContratosListClient";

export default async function ContratosPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const contracts = await prisma.contract.findMany({
    include: {
      supplier: { include: { person: true, company: true } },
      secretariat: { select: { name: true } },
      sourceBudgetUnit: { select: { code: true, name: true } },
      _count: { select: { amendments: true } },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return <ContratosListClient contracts={contracts.map((contract) => ({
    id: contract.id,
    number: contract.number,
    supplierName: contract.supplier?.company?.corporateName || contract.supplier?.company?.tradeName || contract.supplier?.person?.fullName || "Não informado",
    object: contract.object,
    secretariatName: contract.secretariat.name,
    budgetUnitLabel: contract.sourceBudgetUnit ? `${contract.sourceBudgetUnit.code} - ${contract.sourceBudgetUnit.name}` : null,
    startDate: contract.startDate.toISOString(),
    endDate: contract.endDate.toISOString(),
    termDays: calculateInclusiveContractTermDays(contract.startDate, contract.endDate),
    updatedValue: contract.updatedValue,
    amendmentCount: contract._count.amendments,
    status: contract.status,
  }))} />;
}
