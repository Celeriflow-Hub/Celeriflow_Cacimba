import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { FolderOpen, Search, Download } from "lucide-react";
import { NewDocumentSheet } from "../components/NewDocumentSheet";
import { QuickFilters } from "../components/QuickFilters";
import { DocumentRowActions } from "../components/DocumentRowActions";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function DocumentosAmbientaisPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvDocumentWhereInput = {};
  if (searchParams.tipo) where.docType = searchParams.tipo;

  const documents = await prisma.envDocument.findMany({ where, include: { enterprise: true }, orderBy: { createdAt: "desc" } });
  const enterprises = await prisma.envEnterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const list = filterAndPaginate(documents, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Central de Documentos" icon={<FolderOpen className="size-4 shrink-0 text-green-600" />} action={<NewDocumentSheet enterprises={enterprises} />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de documentos ambientais">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/documentos" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar documentos" placeholder="Buscar documentos..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "tipo", label: "Tipo", options: [{ value: "Laudo/Relatorio Tecnico", label: "Laudo/Relatorio Tecnico" }, { value: "Termo de Compromisso", label: "Termo de Compromisso" }, { value: "Parecer Tecnico", label: "Parecer Tecnico" }, { value: "Alvara/Autorizacao Especial", label: "Alvara/Autorizacao Especial" }, { value: "Outros", label: "Outros" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-bounce" />
            <p>Nenhum documento anexado.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">Titulo do Documento</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Empreendimento</th>
                  <th className="px-3 py-2">Data de Cadastro</th>
                  <th className="px-3 py-2 text-center">Download</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((doc) => (
                  <tr key={doc.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{doc.title}</td>
                    <td className="px-3 py-1.5 text-gray-500">{doc.docType}</td>
                    <td className="px-3 py-1.5 text-gray-500">
                      {doc.enterprise ? doc.enterprise.name : <span className="text-gray-400 italic">Documento Geral</span>}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-1.5 text-center">
                      {doc.fileUrl ? (
                        <a href={doc.fileUrl.startsWith("http") ? `/api/download?url=${encodeURIComponent(doc.fileUrl)}` : doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors" title="Baixar arquivo">
                          <Download className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Sem arquivo</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <DocumentRowActions doc={doc} enterprises={enterprises} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/documentos', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/documentos', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
