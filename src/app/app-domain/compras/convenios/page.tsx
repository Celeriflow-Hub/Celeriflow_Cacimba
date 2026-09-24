import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { calculateInclusiveContractTermDays } from "@/lib/compras/contract-lifecycle";
import { ConveniosListClient } from "./ConveniosListClient";

export default async function ConveniosPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const covenants = await prisma.covenant.findMany({
    select: {
      id: true,
      number: true,
      grantor: true,
      description: true,
      totalValueDecimal: true,
      startDate: true,
      endDate: true,
      status: true,
      _count: { select: { instrumentParties: true, measurements: true, installments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <ConveniosListClient covenants={covenants.map((covenant) => ({
    id: covenant.id,
    number: covenant.number,
    grantor: covenant.grantor,
    description: covenant.description,
    totalValueDecimal: Number(covenant.totalValueDecimal),
    startDate: covenant.startDate.toISOString(),
    endDate: covenant.endDate.toISOString(),
    termDays: calculateInclusiveContractTermDays(covenant.startDate, covenant.endDate),
    status: covenant.status,
    partyCount: covenant._count.instrumentParties,
    measurementCount: covenant._count.measurements,
    installmentCount: covenant._count.installments,
  }))} />;
}
