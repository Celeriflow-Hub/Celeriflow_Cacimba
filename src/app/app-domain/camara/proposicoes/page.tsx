import { FileText } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { NewProposicaoSheet } from "../components/NewProposicaoSheet";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ProposicoesClient } from "./ProposicoesClient";

export default async function ProposicoesPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const [proposicoes, vereadores] = await Promise.all([
    prisma.camProposicao.findMany({ include: { autor: true, sessao: true }, orderBy: { createdAt: "desc" } }),
    prisma.camVereador.findMany({ where: { status: "Em Exercício" }, orderBy: { nomeParlamentar: "asc" } }),
  ]);
  const rows = proposicoes.map((proposicao) => ({
    id: proposicao.id,
    numero: proposicao.numero,
    tipo: proposicao.tipo,
    autoria: proposicao.autor.nomeParlamentar,
    assunto: proposicao.ementa,
    data: proposicao.createdAt.toISOString(),
    status: proposicao.status,
  }));
  return <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3"><PageHeader title="Proposições Legislativas" icon={<FileText className="size-4 shrink-0 text-[#9333EA]" />} action={<NewProposicaoSheet vereadores={vereadores} />} /><ProposicoesClient rows={rows} /></PageFrame>;
}
