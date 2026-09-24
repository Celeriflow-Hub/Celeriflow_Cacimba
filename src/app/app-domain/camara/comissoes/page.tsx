import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import ComissoesClient from "./ComissoesClient";

export default async function ComissoesPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const comissoes = await prisma.camComissao.findMany({
    orderBy: { nome: 'asc' },
    include: {
      membros: {
        include: {
          vereador: true
        }
      }
    }
  });

  return <ComissoesClient comissoes={comissoes} />;
}
