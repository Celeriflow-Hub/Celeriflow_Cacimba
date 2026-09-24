import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import CulturaProjetosClient, { type CulturaProjetoListItem } from "../components/CulturaProjetosClient";

export const dynamic = "force-dynamic";

export default async function FomentoProjetosPage() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const projetos = await prisma.culturaProjeto.findMany({
    include: {
      agente: {
        include: {
          person: true,
          company: true,
        },
      },
      appropriation: true,
      commitment: true,
      purchaseProcess: true,
      contract: true,
      documentos: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const projetosParaExibicao: CulturaProjetoListItem[] = projetos.map((projeto) => ({
    id: projeto.id,
    numero: projeto.numero,
    nome: projeto.nome,
    descricao: projeto.descricao,
    categoria: projeto.categoria,
    status: projeto.status,
    valorSolicitado: projeto.valorSolicitado,
    createdAt: projeto.createdAt.toISOString(),
    agente: {
      nome: projeto.agente.nome,
      tipo: projeto.agente.tipo,
      segmento: projeto.agente.segmento,
      pessoaNome: projeto.agente.person?.fullName ?? null,
      empresaNome: projeto.agente.company?.tradeName ?? projeto.agente.company?.corporateName ?? null,
    },
    appropriation: projeto.appropriation
      ? { id: projeto.appropriation.id, code: projeto.appropriation.code }
      : null,
    commitment: projeto.commitment
      ? { id: projeto.commitment.id, number: projeto.commitment.number }
      : null,
    purchaseProcess: projeto.purchaseProcess
      ? { id: projeto.purchaseProcess.id, number: projeto.purchaseProcess.number }
      : null,
    contract: projeto.contract
      ? { id: projeto.contract.id, number: projeto.contract.number }
      : null,
    documentCount: projeto.documentos.length,
  }));

  return <CulturaProjetosClient projetos={projetosParaExibicao} />;
}
