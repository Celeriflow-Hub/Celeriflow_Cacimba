import SegMobCrudClient from "../components/SegMobCrudClient";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { getRegistrosByCategorias, mapInfracao } from "../data";
import type { SegMobItem, SegMobPageConfig } from "../types";

const categories = ["Sinalizacao", "Transito"];

const config: SegMobPageConfig = {
  title: "Transito, Infracoes e Sinalizacao",
  description: "Controle interno de autos, operacoes viarias, semaforos, placas, faixas e demandas de sinalizacao.",
  newLabel: "Novo registro de transito",
  kind: "registro",
  categories,
  typeOptions: ["Operacao Viaria", "Semaforo", "Placa", "Faixa de Pedestre", "Redutor", "Fiscalizacao"],
  statusOptions: ["Registrado", "Notificado", "Em Recurso", "Pago", "Em Execucao", "Concluida", "Pendente", "Cancelado"],
  priorityOptions: ["Baixa", "Normal", "Alta", "Urgente"],
  codeLabel: "Codigo/Auto",
  titleLabel: "Registro administrativo",
  typeLabel: "Tipo",
  locationLabel: "Local",
  showCategory: true,
  showDate: true,
  showPlate: true,
  showValue: true,
  showResponsible: true,
  showPriority: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function TransitoPage() {
  const { prisma } = await getTenantContextForModule("SEGURANCA");
  const [infracoes, registros] = await Promise.all([
    prisma.segurancaInfracao.findMany({ orderBy: { createdAt: "desc" } }),
    getRegistrosByCategorias(categories),
  ]);

  const infracaoItems: SegMobItem[] = infracoes.map((item) => ({ ...mapInfracao(item), category: "Infracao" }));
  return <SegMobCrudClient items={[...infracaoItems, ...registros]} config={config} />;
}