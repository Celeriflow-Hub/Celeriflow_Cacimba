import SegMobCrudClient from "../components/SegMobCrudClient";
import { getRegistrosByCategorias } from "../data";
import type { SegMobPageConfig } from "../types";

const categories = ["Ordem de Servico", "Equipamento"];

const config: SegMobPageConfig = {
  title: "Ordens de Servico e Equipamentos",
  description:
    "Controle administrativo de ordens de servico, manutencao de viaturas, radios, cones e demais ativos operacionais.",
  newLabel: "Nova OS / Equipamento",
  kind: "registro",
  categories,
  typeOptions: [
    "Manutencao de Viatura",
    "Reparo de Radio",
    "Manutencao Preventiva",
    "Aquisicao de Material",
    "Baixa Patrimonial",
    "Vistoria de Equipamento",
    "Abastecimento",
  ],
  statusOptions: [
    "Aberta",
    "Em Execucao",
    "Concluida",
    "Cancelada",
    "Aguardando Peca",
    "Aguardando Aprovacao",
  ],
  priorityOptions: ["Baixa", "Normal", "Alta", "Urgente"],
  codeLabel: "Numero da OS",
  titleLabel: "Descricao do servico",
  typeLabel: "Tipo",
  locationLabel: "Setor / Deposito",
  showCategory: true,
  showDate: true,
  showPlate: true,
  showValue: true,
  showResponsible: true,
  showPriority: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function OrdensPage() {
  const items = await getRegistrosByCategorias(categories);
  return <SegMobCrudClient items={items} config={config} />;
}
