import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { FileText, Search } from "lucide-react";
import { QuickFilters } from "../components/QuickFilters";
import { Pencil, CheckCircle, XCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export default async function SolicitacoesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});

  const where: Prisma.EnvRequestWhereInput = {};
  if (searchParams.tipo) where.requestType = { contains: searchParams.tipo, mode: 'insensitive' };
  if (searchParams.status) where.status = searchParams.status;

  const requests = await prisma.envRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  const list = filterAndPaginate(requests, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Solicitações e Podas" icon={<FileText className="size-4 shrink-0 text-emerald-600" />} action={<button type="button" className="flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700">Nova Solicitação</button>} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de solicitações ambientais">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/solicitacoes" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search" name="q" defaultValue={list.query}
              aria-label="Buscar solicitação"
              placeholder="Buscar solicitação..."
              className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900 dark:text-white"
            />
          </form>
          <QuickFilters filters={[
            { name: "tipo", label: "Tipo", options: [{ value: "Poda", label: "Poda" }, { value: "Supressão", label: "Supressão" }, { value: "Análise de Projeto", label: "Análise de Projeto" }] },
            { name: "status", label: "Status", options: [{ value: "Pendente", label: "Pendente" }, { value: "Em Análise", label: "Em Análise" }, { value: "Autorizado", label: "Autorizado" }, { value: "Negado", label: "Negado" }] }
          ]} />
        </div>

        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma solicitação registrada.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Solicitante</th>
                  <th className="px-3 py-2">Endereço / Local</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((req) => (
                  <tr key={req.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">
                      {req.requestType}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{req.requesterName || '-'}</td>
                    <td className="px-3 py-1.5 text-gray-500">{req.address || '-'}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${req.status === 'Autorizado' ? 'bg-green-100 text-green-700' :
                          req.status === 'Negado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Autorizar">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Negar">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/solicitacoes', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/solicitacoes', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
