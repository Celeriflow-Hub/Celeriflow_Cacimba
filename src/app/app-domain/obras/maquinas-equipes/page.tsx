import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { MaquinasEquipesClient } from "../components/MaquinasEquipesClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export default async function MaquinasEquipesPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const [teams, assets] = await Promise.all([
    prisma.obrasEquipe.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        department: { select: { name: true } },
        members: {
          select: {
            isLeader: true,
            isActive: true,
            employee: {
              select: {
                id: true,
                name: true,
                registration: true,
                role: { select: { name: true } },
              },
            },
          },
          orderBy: { isLeader: "desc" },
        },
        assignments: {
          where: { releasedAt: null },
          select: {
            obrasServico: {
              select: {
                protocolo: true,
                descricao: true,
                status: true,
                active: true,
              },
            },
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.asset.findMany({
      where: {
        OR: [
          { category: { name: { contains: "Obras" } } },
          { category: { name: { contains: "Iluminação" } } },
        ],
      },
      select: {
        id: true,
        patrimonyNumber: true,
        name: true,
        brand: true,
        model: true,
        status: true,
        category: { select: { name: true } },
        department: { select: { name: true } },
        responsible: { select: { name: true } },
        serviceEquipment: {
          where: { releasedAt: null },
          select: {
            obrasServico: {
              select: {
                protocolo: true,
                descricao: true,
                status: true,
                active: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return <PageFrame className="px-1 py-1 md:px-2"><MaquinasEquipesClient teams={teams} assets={assets} /></PageFrame>;
}
