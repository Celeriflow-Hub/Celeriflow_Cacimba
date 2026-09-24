import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { IluminacaoEnergiaClient } from "../components/IluminacaoEnergiaClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export default async function IluminacaoEnergiaPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const servicos = await prisma.obrasServico.findMany({
    where: { tipo: "Iluminação" },
    orderBy: { createdAt: "desc" },
    include: {
      targetAsset: { include: { realEstate: true } },
      department: true,
      budgetAppropriation: true,
      commitment: true,
      employees: { include: { employee: true } },
      teams: { include: { equipe: true } },
      equipment: { include: { asset: true } },
      materials: { include: { material: true, stock: true } },
      documents: { include: { document: true } },
      purchases: { include: { purchaseRequest: true, purchaseProcess: true } },
    },
  });

  return <PageFrame className="px-1 py-1 md:px-2"><IluminacaoEnergiaClient servicos={servicos} /></PageFrame>;
}
