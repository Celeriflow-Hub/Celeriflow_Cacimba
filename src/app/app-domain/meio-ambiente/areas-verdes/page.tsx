import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Sprout, Search } from "lucide-react";
import { NewGreenAreaSheet } from "../components/NewGreenAreaSheet";
import { QuickFilters } from "../components/QuickFilters";
import { GreenAreaRowActions } from "../components/GreenAreaRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function AreasVerdesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvGreenAreaWhereInput = {};
  if (searchParams.status) where.status = searchParams.status;

  const greenAreas = await prisma.envGreenArea.findMany({ where, orderBy: { name: "asc" } });

  const list = filterAndPaginate(greenAreas, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Áreas Verdes e Preservação" icon={<Sprout className="size-4 shrink-0 text-green-600" />} action={<NewGreenAreaSheet />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de áreas verdes">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/areas-verdes" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar área verde" placeholder="Buscar área verde..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "status", label: "Conservacao", options: [{ value: "Preservado", label: "Preservado" }, { value: "Em Recuperacao", label: "Em Recuperacao" }, { value: "Degradado", label: "Degradado" }, { value: "Monitorado", label: "Monitorado" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Sprout className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-bounce" />
            <p>Nenhuma area verde cadastrada.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Nome da Area</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Tamanho (m2)</th>
                  <th className="px-3 py-2">Localizacao</th>
                  <th className="px-3 py-2">Conservacao</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((area) => (
                  <tr key={area.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{area.name}</td>
                    <td className="px-3 py-1.5 text-gray-500">{area.areaType}</td>
                    <td className="px-3 py-1.5 text-gray-500">{area.sizeSqm ? area.sizeSqm.toLocaleString("pt-BR") : "-"}</td>
                    <td className="px-3 py-1.5 text-gray-500">{area.location || "-"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${area.status === "Preservado" ? "bg-green-100 text-green-700" : area.status === "Em Recuperacao" ? "bg-amber-100 text-amber-700" : area.status === "Degradado" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {area.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <GreenAreaRowActions area={area} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/areas-verdes', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/areas-verdes', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
