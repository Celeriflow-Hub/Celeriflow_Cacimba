import { FileSignature } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ContratosClient, type ContractRow } from "./ContratosClient";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const { prisma } = await getTenantContextForModule("TRANSPARENCIA");
  const contracts = await prisma.contract.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      supplier: {
        include: { company: true, person: true }
      }
    }
  });
  const rows: ContractRow[] = contracts.map((contract) => ({
    id: contract.id,
    number: contract.number,
    supplierName: contract.supplier.company?.tradeName || contract.supplier.company?.corporateName || contract.supplier.person?.fullName || "Desconhecido",
    object: contract.object,
    startDate: contract.startDate.toISOString(),
    endDate: contract.endDate.toISOString(),
    value: contract.updatedValue,
    status: contract.status,
  }));

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Contratos públicos" icon={<FileSignature className="size-4 shrink-0 text-emerald-600" />} />
      <ContratosClient rows={rows} />
    </PageFrame>
  );
}
