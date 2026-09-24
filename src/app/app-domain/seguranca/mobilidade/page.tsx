import SegMobCrudClient from "../components/SegMobCrudClient";
import { getRegistrosByCategorias } from "../data";
import type { SegMobPageConfig } from "../types";

const categories = [
  "Mobilidade Urbana",
  "Transporte",
  "Interdicao",
  "Estacionamento",
  "Acessibilidade",
];

const config: SegMobPageConfig = {
  title: "Mobilidade e Rotas Urbanas",
  description:
    "Gestao de linhas de transporte, interdicoes viarias, vagas especiais, ciclovias e acessibilidade urbana municipal.",
  newLabel: "Novo registro",
  kind: "registro",
  categories,
  typeOptions: [
    "Linha de Onibus",
    "Ponto de Parada",
    "Interdicao Viaria",
    "Vaga Especial",
    "Ciclovia",
    "Calcada",
    "Terminal",
    "Faixa Exclusiva",
  ],
  statusOptions: [
    "Ativo",
    "Em Analise",
    "Interditado",
    "Concluido",
    "Suspenso",
    "Pendente",
  ],
  priorityOptions: ["Baixa", "Normal", "Alta", "Urgente"],
  codeLabel: "Codigo",
  titleLabel: "Descricao / Rota",
  typeLabel: "Tipo",
  locationLabel: "Local / Trecho",
  showCategory: true,
  showDate: true,
  showResponsible: true,
  showPriority: true,
  showValue: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function MobilidadePage() {
  const items = await getRegistrosByCategorias(categories);
  return <SegMobCrudClient items={items} config={config} />;
}
