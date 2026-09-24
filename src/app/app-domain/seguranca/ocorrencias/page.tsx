import SegMobCrudClient from "../components/SegMobCrudClient";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { mapOcorrencia } from "../data";
import type { SegMobPageConfig } from "../types";

const config: SegMobPageConfig = {
  title: "Ocorrencias e Despachos Operacionais",
  description: "Registro administrativo de ocorrencias atendidas pela guarda, transito e defesa civil municipal.",
  newLabel: "Nova ocorrencia",
  kind: "ocorrencia",
  typeOptions: ["Patrulhamento", "Apoio a Fiscalizacao", "Acidente de Transito", "Perturbacao", "Risco Estrutural", "Evento Publico"],
  statusOptions: ["Registrada", "Em Atendimento", "Resolvida", "Encerrada", "Cancelada"],
  priorityOptions: ["Baixa", "Normal", "Alta", "Urgente"],
  codeLabel: "Numero",
  titleLabel: "Resumo administrativo",
  typeLabel: "Tipo de ocorrencia",
  locationLabel: "Local",
  showPriority: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function OcorrenciasPage() {
  const { prisma } = await getTenantContextForModule("SEGURANCA");
  const ocorrencias = await prisma.segurancaOcorrencia.findMany({ orderBy: { createdAt: "desc" } });
  return <SegMobCrudClient items={ocorrencias.map(mapOcorrencia)} config={config} />;
}