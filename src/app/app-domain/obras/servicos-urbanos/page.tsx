import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ServicosUrbanosClient } from "../components/ServicosUrbanosClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export default async function ServicosUrbanosPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const servicos = await prisma.obrasServico.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <PageFrame className="h-full min-h-0 overflow-hidden p-2 sm:p-3"><ServicosUrbanosClient servicos={servicos} /></PageFrame>;
}
