import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { ImportExportDropdown } from "@/components/ui/ImportExportDropdown";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import PessoasJuridicasClient from "./PessoasJuridicasClient";

export const dynamic = "force-dynamic";

export default async function PessoasJuridicasPage() {
  const { prisma } = await getTenantContextForModule("CADASTROS");
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: { taxpayerInfo: true }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Pessoas Jurídicas" icon={<Building2 className="size-4 shrink-0 text-emerald-600" />} action={<div className="flex items-center gap-2">
          <ImportExportDropdown />
          <Link href="/cadastros/pessoas-juridicas/novo" className="inline-flex h-7 items-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Adicionar empresa</span>
            <span className="sm:hidden">Adicionar</span>
          </Link>
        </div>} />

      <PessoasJuridicasClient companies={companies} />
    </PageFrame>
  );
}
