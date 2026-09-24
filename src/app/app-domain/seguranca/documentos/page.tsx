import SegMobCrudClient from "../components/SegMobCrudClient";
import { getRegistrosByCategorias } from "../data";
import type { SegMobPageConfig } from "../types";

const categories = ["Documento", "Relatorio"];

const config: SegMobPageConfig = {
  title: "Documentos e Relatorios",
  description:
    "Repositorio administrativo de relatorios operacionais, atas, planos, decretos, escalas de servico e oficios do modulo.",
  newLabel: "Novo documento",
  kind: "registro",
  categories,
  typeOptions: [
    "Relatorio Mensal",
    "Relatorio de Ocorrencia",
    "Ata de Reuniao",
    "Plano Operacional",
    "Decreto",
    "Oficio",
    "Escala de Servico",
    "Portaria",
  ],
  statusOptions: ["Rascunho", "Em Revisao", "Publicado", "Arquivado", "Cancelado"],
  priorityOptions: ["Baixa", "Normal", "Alta"],
  codeLabel: "Numero / Codigo",
  titleLabel: "Titulo do documento",
  typeLabel: "Tipo",
  locationLabel: "Setor responsavel",
  showCategory: true,
  showDate: true,
  showResponsible: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function DocumentosPage() {
  const items = await getRegistrosByCategorias(categories);
  return <SegMobCrudClient items={items} config={config} />;
}
