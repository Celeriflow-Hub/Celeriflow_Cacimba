import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { GraduationCap, Search } from "lucide-react";
import { NewEduProgramSheet } from "../components/NewEduProgramSheet";
import { QuickFilters } from "../components/QuickFilters";
import { EduProgramRowActions } from "../components/EduProgramRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function EducacaoAmbientalPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvEduProgramWhereInput = {};
  if (searchParams.status) where.status = searchParams.status;

  const programs = await prisma.envEduProgram.findMany({ where, orderBy: { startDate: "desc" } });

  const list = filterAndPaginate(programs, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Educação Ambiental" icon={<GraduationCap className="size-4 shrink-0 text-green-600" />} action={<NewEduProgramSheet />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de ações de educação ambiental">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/educacao" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar campanha" placeholder="Buscar campanhas..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "status", label: "Status", options: [{ value: "Planejado", label: "Planejado" }, { value: "Em Execucao", label: "Em Execucao" }, { value: "Concluido", label: "Concluido" }, { value: "Cancelado", label: "Cancelado" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-bounce" />
            <p>Nenhuma acao educativa registrada.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Titulo da Acao</th>
                  <th className="px-3 py-2">Publico-Alvo</th>
                  <th className="px-3 py-2">Inicio / Fim</th>
                  <th className="px-3 py-2">Participantes</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((prog) => (
                  <tr key={prog.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{prog.title}</td>
                    <td className="px-3 py-1.5 text-gray-500">{prog.targetAudience || "-"}</td>
                    <td className="px-3 py-1.5 text-gray-500">
                      {new Date(prog.startDate).toLocaleDateString("pt-BR")}
                      {prog.endDate && ` a ${new Date(prog.endDate).toLocaleDateString("pt-BR")}`}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-gray-700">{prog.participantsCount ? prog.participantsCount.toLocaleString("pt-BR") : "-"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${prog.status === "Concluido" ? "bg-green-100 text-green-700" : prog.status === "Em Execucao" ? "bg-blue-100 text-blue-700" : prog.status === "Cancelado" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {prog.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <EduProgramRowActions program={prog} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/educacao', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/educacao', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
