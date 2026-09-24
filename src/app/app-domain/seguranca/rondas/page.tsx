import SegMobCrudClient from "../components/SegMobCrudClient";
import { getRegistrosByCategorias } from "../data";
import type { SegMobPageConfig } from "../types";

const categories = ["Ronda", "Videomonitoramento"];

const config: SegMobPageConfig = {
  title: "Rondas e Videomonitoramento",
  description: "Planejamento de rondas preventivas, pontos monitorados, cameras e registros de supervisao territorial.",
  newLabel: "Novo registro",
  kind: "registro",
  categories,
  typeOptions: ["Ronda Escolar", "Ronda Patrimonial", "Ronda Rural", "Camera Fixa", "Camera OCR", "Sala de Monitoramento"],
  statusOptions: ["Programada", "Em Execucao", "Concluida", "Pendente", "Manutencao"],
  priorityOptions: ["Baixa", "Normal", "Alta", "Urgente"],
  codeLabel: "Codigo",
  titleLabel: "Roteiro/Ponto monitorado",
  typeLabel: "Tipo",
  locationLabel: "Local de cobertura",
  showCategory: true,
  showDate: true,
  showResponsible: true,
  showPriority: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function RondasPage() {
  const items = await getRegistrosByCategorias(categories);
  return <SegMobCrudClient items={items} config={config} />;
}