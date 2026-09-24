import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Trash2, Search } from "lucide-react";
import { NewWasteSheet } from "../components/NewWasteSheet";
import { QuickFilters } from "../components/QuickFilters";
import { WasteRowActions } from "../components/WasteRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function ResiduosPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvWasteWhereInput = {};
  if (searchParams.tipo) where.wasteType = { contains: searchParams.tipo, mode: "insensitive" };

  const wastes = await prisma.envWaste.findMany({ where, include: { enterprise: true }, orderBy: { date: "desc" } });
  const enterprises = await prisma.envEnterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const list = filterAndPaginate(wastes, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Controle de Resíduos" icon={<Trash2 className="size-4 shrink-0 text-green-600" />} action={<NewWasteSheet enterprises={enterprises} />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de resíduos">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/residuos" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar registro de resíduo" placeholder="Buscar registros..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "tipo", label: "Tipo", options: [{ value: "Organico", label: "Organico" }, { value: "Reciclavel", label: "Reciclavel" }, { value: "Perigoso", label: "Perigoso" }, { value: "Eletronico", label: "Eletronico" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-bounce" />
            <p>Nenhum registro de residuo encontrado.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Gerador / Empresa</th>
                  <th className="px-3 py-2">Tipo de Residuo</th>
                  <th className="px-3 py-2">Quantidade (Kg)</th>
                  <th className="px-3 py-2">Destinacao Final</th>
                  <th className="px-3 py-2">Data Registro</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((w) => (
                  <tr key={w.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{w.generatorName}</td>
                    <td className="px-3 py-1.5 text-gray-500">{w.wasteType}</td>
                    <td className="px-3 py-1.5 font-semibold text-gray-700">{w.quantityKg.toLocaleString("pt-BR")} Kg</td>
                    <td className="px-3 py-1.5 text-gray-500">{w.destination}</td>
                    <td className="px-3 py-1.5 text-gray-500">{new Date(w.date).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-1.5 text-right">
                      <WasteRowActions waste={w} enterprises={enterprises} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/residuos', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/residuos', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
