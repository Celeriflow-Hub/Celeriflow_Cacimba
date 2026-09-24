import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import SessoesClient from "./SessoesClient";

export default async function SessoesPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const sessoes = await prisma.camSessao.findMany({
    orderBy: { data: 'desc' },
    include: {
      proposicoes: true,
      ata: true
    }
  });

  const sessoesWithAtas = sessoes.map(({ ata, ...sessao }) => ({
    ...sessao,
    atas: ata ? [ata] : []
  }));

  return <SessoesClient sessoes={sessoesWithAtas} />;
}
