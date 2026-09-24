import { Scale } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { LeisClient } from "./LeisClient";

export default async function LeisPage() {
  const { prisma } = await getTenantContextForModule("CAMARA");
  const leis = await prisma.camLei.findMany({ include: { proposicao: { include: { autor: true } } }, orderBy: { dataPublicacao: "desc" } });
  const rows = leis.map((lei) => ({
    id: lei.id,
    numero: lei.numero,
    tipo: lei.tipo,
    ementa: lei.ementa,
    autoria: lei.proposicao?.autor.nomeParlamentar ?? "Poder Executivo",
    publicacao: lei.dataPublicacao?.toISOString() ?? null,
    status: lei.status,
  }));
  return <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3"><PageHeader title="Leis e Atos Normativos" icon={<Scale className="size-4 shrink-0 text-[#9333EA]" />} /><LeisClient rows={rows} /></PageFrame>;
}
