import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { OrdensServicoClient } from "../components/OrdensServicoClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export default async function OrdensServicoPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const ordens = await prisma.obrasServico.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { name: true } },
      targetAsset: {
        select: {
          patrimonyNumber: true,
          name: true,
          realEstate: {
            select: {
              municipalInsc: true,
              propertyType: true,
              streetName: true,
              number: true,
              complement: true,
            },
          },
        },
      },
      employees: { include: { employee: { select: { name: true } } } },
      teams: { include: { equipe: { select: { code: true, name: true } } } },
      materials: { include: { material: { select: { code: true, name: true, unitOfMeasure: true } } } },
      materialMoves: { include: { material: { select: { code: true, name: true, unitOfMeasure: true } } } },
      budgetAppropriation: { select: { code: true } },
      commitment: { select: { number: true, status: true, value: true } },
      documents: { include: { document: { select: { title: true, documentType: true, status: true } } } },
      purchases: {
        include: {
          purchaseRequest: { select: { number: true, status: true } },
          purchaseProcess: { select: { number: true, status: true } },
        },
      },
    },
  });

  return <PageFrame className="px-1 py-1 md:px-2"><OrdensServicoClient ordens={ordens.map((ordem) => ({
    ...ordem,
    scheduledFor: ordem.scheduledFor?.toISOString() ?? null,
    completedAt: ordem.completedAt?.toISOString() ?? null,
  }))} /></PageFrame>;
}
