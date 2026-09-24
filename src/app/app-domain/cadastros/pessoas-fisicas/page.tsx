import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { ImportExportDropdown } from "@/components/ui/ImportExportDropdown";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import PessoasFisicasClient from "./PessoasFisicasClient";

export const dynamic = "force-dynamic";

export default async function PessoasFisicasPage() {
  const { prisma } = await getTenantContextForModule("CADASTROS");
  const persons = await prisma.person.findMany({
    orderBy: { createdAt: 'desc' },
    include: { taxpayerInfo: true }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Pessoas Físicas" icon={<Users className="size-4 shrink-0 text-indigo-600" />} action={<div className="flex items-center gap-2">
          <ImportExportDropdown />
          <Link href="/cadastros/pessoas-fisicas/novo" className="inline-flex h-7 items-center gap-1.5 rounded bg-indigo-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Adicionar pessoa</span>
            <span className="sm:hidden">Adicionar</span>
          </Link>
        </div>} />

      <PessoasFisicasClient persons={persons} />
    </PageFrame>
  );
}
