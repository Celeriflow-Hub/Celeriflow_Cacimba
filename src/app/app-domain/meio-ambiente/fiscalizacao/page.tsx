import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Search, MapPin } from "lucide-react";
import { NewInspectionSheet } from "../components/NewInspectionSheet";
import { QuickFilters } from "../components/QuickFilters";
import { InspectionRowActions } from "../components/InspectionRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function FiscalizacaoPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvInspectionWhereInput = {};
  if (searchParams.status) where.status = searchParams.status;

  const inspections = await prisma.envInspection.findMany({ where, include: { enterprise: true }, orderBy: { dateScheduled: "desc" } });
  const enterprises = await prisma.envEnterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const list = filterAndPaginate(inspections, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Fiscalização e Vistorias" icon={<Search className="size-4 shrink-0 text-purple-600" />} action={<NewInspectionSheet enterprises={enterprises} />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de vistorias">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/fiscalizacao" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar vistoria" placeholder="Buscar vistoria..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "status", label: "Status", options: [{ value: "Agendada", label: "Agendada" }, { value: "Em Andamento", label: "Em Andamento" }, { value: "Realizada", label: "Realizada" }, { value: "Cancelada", label: "Cancelada" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma vistoria agendada.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Data Agendada</th>
                  <th className="px-3 py-2">Fiscal Responsavel</th>
                  <th className="px-3 py-2">Empreendimento</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Observacoes</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((insp) => (
                  <tr key={insp.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{insp.dateScheduled ? new Date(insp.dateScheduled).toLocaleString("pt-BR") : "-"}</td>
                    <td className="px-3 py-1.5 text-gray-500">{insp.inspector}</td>
                    <td className="px-3 py-1.5 text-gray-500">{insp.enterprise ? insp.enterprise.name : "Nenhum"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${insp.status === "Realizada" ? "bg-green-100 text-green-700" : insp.status === "Cancelada" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {insp.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate" title={insp.notes || ""}>{insp.notes || "-"}</td>
                    <td className="px-3 py-1.5 text-right">
                      <InspectionRowActions inspection={insp} enterprises={enterprises} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/fiscalizacao', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/fiscalizacao', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
