import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import MedicoesClient from "../components/MedicoesClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export default async function FiscalizacaoMedicoesPage() {
  const { prisma } = await getTenantContextForModule("OBRAS");
  const [medicoes, obras] = await Promise.all([
    prisma.obrasMedicao.findMany({
      include: {
        obra: {
          select: {
            numero: true,
            nome: true,
          },
        },
      },
      orderBy: [{ data: "desc" }, { numero: "desc" }],
    }),
    prisma.obrasObra.findMany({
      where: { active: true },
      select: {
        id: true,
        numero: true,
        nome: true,
        status: true,
      },
      orderBy: { numero: "asc" },
    }),
  ]);

  return (
    <PageFrame className="h-full min-h-0 overflow-hidden p-2 sm:p-3">
      <MedicoesClient
      medicoes={medicoes.map((medicao) => ({
        ...medicao,
        data: medicao.data.toISOString().slice(0, 10),
      }))}
      obras={obras}
      />
    </PageFrame>
  );
}
