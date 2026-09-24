import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import EmpenhosClient from "./EmpenhosClient"

export default async function EmpenhosPage() {
  const { prisma } = await getTenantContextForModule("FINANCEIRO");
  const commitments = await prisma.commitment.findMany({
    include: {
      supplier: {
        include: {
          person: true,
          company: true
        }
      },
      appropriation: {
        include: {
          budgetUnit: true
        }
      },
      financialDocument: { select: { id: true, number: true, title: true } },
      obrasServices: { select: { id: true, protocolo: true } },
      purchaseReceipt: { select: { number: true } },
    },
    orderBy: {
      date: 'desc'
    },
    take: 50
  })

  const suppliers = await prisma.supplier.findMany({
    include: {
      person: true,
      company: true
    },
    where: {
      status: "Ativo"
    }
  })

  const appropriations = await prisma.budgetAppropriation.findMany({
    include: {
      budgetUnit: true
    }
  })

  const reservations = await prisma.budgetReservation.findMany({
    where: { status: "Ativa" },
    include: {
      appropriation: { include: { budgetUnit: true } },
      expense: {
        select: {
          supplierId: true,
          sourceModule: true,
          sourceType: true,
          sourceId: true,
          purchaseReceipt: { select: { number: true, contractId: true, contract: { select: { supplierId: true } } } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const [processes, contracts, obrasServices, covenants, publicityCampaigns, fundedDebts] = await Promise.all([
    prisma.process.findMany({ select: { id: true, protocolNumber: true, description: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.contract.findMany({ select: { id: true, number: true, object: true, supplierId: true, status: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.obrasServico.findMany({
      where: { active: true, commitmentId: null },
      select: { id: true, protocolo: true, tipo: true, descricao: true, local: true, budgetAppropriationId: true, budgetAppropriation: { select: { code: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.covenant.findMany({
      where: { status: "Ativo" },
      select: { id: true, number: true, grantor: true, startDate: true, endDate: true },
      orderBy: { number: "asc" },
    }),
    prisma.publicityCampaign.findMany({
      where: { status: "Ativa" },
      select: { id: true, name: true, agency: true, startDate: true, endDate: true },
      orderBy: { name: "asc" },
    }),
    prisma.fundedDebt.findMany({
      where: { status: "Ativa" },
      select: { id: true, lawNumber: true, creditorName: true },
      orderBy: { lawNumber: "asc" },
    }),
  ]);

  const displayCommitments = commitments.map(({ valueDecimal, ...commitment }) => ({
    ...commitment,
    value: Number(valueDecimal ?? commitment.value),
  }))

  const displayReservations = reservations.map(({ valueDecimal, ...reservation }) => ({
    ...reservation,
    value: Number(valueDecimal ?? reservation.value),
  }));

  return <EmpenhosClient commitments={displayCommitments} suppliers={suppliers} appropriations={appropriations} reservations={displayReservations} processes={processes} contracts={contracts} obrasServices={obrasServices} covenants={covenants} publicityCampaigns={publicityCampaigns} fundedDebts={fundedDebts} />
}
