import SegMobCrudClient from "../components/SegMobCrudClient";
import { getRegistrosByCategorias } from "../data";
import type { SegMobPageConfig } from "../types";

const categories = ["Defesa Civil"];

const config: SegMobPageConfig = {
  title: "Defesa Civil Municipal",
  description: "Mapeamento de riscos, vistorias preventivas, apoio emergencial e planos de contingencia da prefeitura.",
  newLabel: "Novo registro",
  kind: "registro",
  categories,
  typeOptions: ["Vistoria de Risco", "Area Monitorada", "Apoio Emergencial", "Plano de Contingencia", "Abrigo Temporario"],
  statusOptions: ["Aberto", "Em Analise", "Monitorado", "Resolvido", "Interditado"],
  priorityOptions: ["Baixa", "Normal", "Alta", "Urgente"],
  codeLabel: "Codigo",
  titleLabel: "Acao/Area de risco",
  typeLabel: "Tipo",
  locationLabel: "Local",
  showCategory: true,
  showDate: true,
  showResponsible: true,
  showPriority: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function DefesaCivilPage() {
  const items = await getRegistrosByCategorias(categories);
  return <SegMobCrudClient items={items} config={config} />;
}