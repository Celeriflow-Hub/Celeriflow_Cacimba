import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Building2, Search } from "lucide-react";
import { NewEnterpriseSheet } from "../components/NewEnterpriseSheet";
import { QuickFilters } from "../components/QuickFilters";
import { EnterpriseRowActions } from "../components/EnterpriseRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function EmpreendimentosPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvEnterpriseWhereInput = {};
  if (searchParams.atividade) where.activityType = { contains: searchParams.atividade, mode: "insensitive" };
  if (searchParams.risco) where.potentialRisk = searchParams.risco;
  if (searchParams.status) where.status = searchParams.status;

  const enterprises = await prisma.envEnterprise.findMany({ where, orderBy: { createdAt: "desc" } });

  const list = filterAndPaginate(enterprises, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Empreendimentos" icon={<Building2 className="size-4 shrink-0 text-green-600" />} action={<NewEnterpriseSheet />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de empreendimentos">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/empreendimentos" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar empreendimento" placeholder="Buscar empreendimento..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "risco", label: "Risco", options: [{ value: "Alto", label: "Alto" }, { value: "Medio", label: "Medio" }, { value: "Baixo", label: "Baixo" }] },
            { name: "status", label: "Status", options: [{ value: "Ativo", label: "Ativo" }, { value: "Inativo", label: "Inativo" }, { value: "Irregular", label: "Irregular" }, { value: "Embargado", label: "Embargado" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum empreendimento cadastrado.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Razao Social / Nome</th>
                  <th className="px-3 py-2">CNPJ/CPF</th>
                  <th className="px-3 py-2">Atividade</th>
                  <th className="px-3 py-2">Risco</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((ent) => (
                  <tr key={ent.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{ent.name}</td>
                    <td className="px-3 py-1.5 text-gray-500">{ent.cnpjCpf || "-"}</td>
                    <td className="px-3 py-1.5 text-gray-500">{ent.activityType || "-"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ent.potentialRisk === "Alto" ? "bg-red-100 text-red-700" : ent.potentialRisk === "Medio" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {ent.potentialRisk || "Baixo"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ent.status === "Ativo" ? "bg-blue-100 text-blue-700" : ent.status === "Embargado" ? "bg-red-100 text-red-700" : ent.status === "Irregular" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                        {ent.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <EnterpriseRowActions enterprise={ent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/empreendimentos', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/empreendimentos', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
