import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { AlertTriangle, Search } from "lucide-react";
import { NewComplaintSheet } from "../components/NewComplaintSheet";
import { QuickFilters } from "../components/QuickFilters";
import { ComplaintRowActions } from "../components/ComplaintRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function DenunciasPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvComplaintWhereInput = {};
  if (searchParams.tipo) where.complaintType = { contains: searchParams.tipo, mode: "insensitive" };
  if (searchParams.status) where.status = searchParams.status;

  const complaints = await prisma.envComplaint.findMany({ where, orderBy: { createdAt: "desc" } });

  const list = filterAndPaginate(complaints, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Denúncias Ambientais" icon={<AlertTriangle className="size-4 shrink-0 text-red-600" />} action={<NewComplaintSheet />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de denúncias ambientais">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/denuncias" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar denúncia" placeholder="Buscar denúncia..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "status", label: "Status", options: [{ value: "Recebida", label: "Recebida" }, { value: "Em Triagem", label: "Em Triagem" }, { value: "Em Vistoria", label: "Em Vistoria" }, { value: "Encerrada", label: "Encerrada" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma denuncia registrada.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Descricao Resumida</th>
                  <th className="px-3 py-2">Endereco</th>
                  <th className="px-3 py-2">Anonima</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((comp) => (
                  <tr key={comp.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{comp.complaintType}</td>
                    <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate" title={comp.description}>{comp.description}</td>
                    <td className="px-3 py-1.5 text-gray-500">{comp.address || "-"}</td>
                    <td className="px-3 py-1.5 text-gray-500">{comp.isAnonymous ? "Sim" : "Nao"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${comp.status === "Recebida" ? "bg-yellow-100 text-yellow-700" : comp.status === "Encerrada" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{new Date(comp.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-1.5 text-right">
                      <ComplaintRowActions complaint={comp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/denuncias', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/denuncias', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
