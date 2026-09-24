import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import { Home, Plus, Upload, Download } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import ImoveisClient from "./ImoveisClient";

export const dynamic = "force-dynamic";

export default async function ImoveisPage() {
  const { prisma } = await getTenantContextForModule("CADASTROS");
  const realEstates = await prisma.realEstate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      neighborhood: true,
      taxpayer: {
        include: {
          person: true,
          company: true,
        }
      }
    }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Imóveis" icon={<Home className="size-4 shrink-0 text-sky-600" />} action={<div className="flex items-center gap-1">
          <button type="button" className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-label="Importar imóveis">
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button type="button" className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-label="Exportar imóveis">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link href="/cadastros/imoveis/novo" className="inline-flex h-7 items-center gap-1 rounded bg-sky-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-800">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Adicionar imóvel</span>
            <span className="sm:hidden">Adicionar</span>
          </Link>
        </div>} />

      <ImoveisClient realEstates={realEstates} />
    </PageFrame>
  );
}
