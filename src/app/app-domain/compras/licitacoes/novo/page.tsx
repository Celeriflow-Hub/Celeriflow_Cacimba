import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { LicitacaoForm } from "../LicitacaoForm";

export default async function NovaLicitacaoPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const processos = await prisma.purchaseProcess.findMany({
    orderBy: { number: 'desc' }
  });

  return <LicitacaoForm processos={processos} />;
}
