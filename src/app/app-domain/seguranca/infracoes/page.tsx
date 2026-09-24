import SegMobCrudClient from "../components/SegMobCrudClient";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { mapInfracao } from "../data";
import type { SegMobPageConfig } from "../types";
import { InfracoesInteractiveClient } from "./InfracoesInteractiveClient";

const config: SegMobPageConfig = {
  title: "Autos de Infracao",
  description: "Controle administrativo de infracoes de transito registradas pela fiscalizacao municipal.",
  newLabel: "Novo auto",
  kind: "infracao",
  typeOptions: ["Estacionamento irregular", "Avanco de sinal", "Carga e descarga", "Bloqueio de via", "Transporte irregular"],
  statusOptions: ["Registrado", "Notificado", "Em Recurso", "Pago", "Cancelado"],
  codeLabel: "Numero do auto",
  titleLabel: "Placa",
  typeLabel: "Tipo da infracao",
  locationLabel: "Local",
  showDate: true,
  showPlate: true,
  showValue: true,
  accentClass: "bg-cyan-700 hover:bg-cyan-800",
};

export default async function InfracoesPage() {
  const { prisma } = await getTenantContextForModule("SEGURANCA");
  const infracoes = await prisma.segurancaInfracao.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <details className="shrink-0 rounded-lg border border-cyan-900 bg-slate-950 text-white"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-cyan-200">Emissão instantânea de auto de infração</summary><InfracoesInteractiveClient /></details>
      <div className="min-h-0 flex-1"><SegMobCrudClient items={infracoes.map(mapInfracao)} config={config} /></div>
    </div>
  );
}
