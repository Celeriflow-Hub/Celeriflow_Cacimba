"use client";

import Link from "next/link";
import { FileText, Folder, Search, ArrowUpRight } from "lucide-react";
import { useState } from "react";

type DocumentoObra = {
  id: string;
  purpose: string;
  obrasServico: {
    protocolo: string;
    descricao: string;
    tipo: string;
    status: string;
  };
  document: {
    title: string;
    documentType: string;
    status: string;
    folder: { name: string } | null;
  };
};

function statusClassName(status: string) {
  if (status === "Válido") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "Pendente" || status === "Pendente Assinatura") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (status === "Vencido") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200";
}

export function ObrasDocumentosClient({ documentos }: { documentos: DocumentoObra[] }) {
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const purposes = Array.from(new Set(documentos.map((documento) => documento.purpose))).sort();
  const statuses = Array.from(new Set(documentos.map((documento) => documento.document.status))).sort();
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const filteredDocumentos = documentos.filter((documento) => {
    const matchesSearch = !query || [
      documento.document.title,
      documento.document.documentType,
      documento.document.folder?.name,
      documento.obrasServico.protocolo,
      documento.obrasServico.descricao,
      documento.obrasServico.tipo,
      documento.purpose,
    ].some((value) => value?.toLocaleLowerCase("pt-BR").includes(query));

    return matchesSearch
      && (purposeFilter === "Todos" || documento.purpose === purposeFilter)
      && (statusFilter === "Todos" || documento.document.status === statusFilter);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documentos de Obras</h1>
          <p className="text-slate-500 dark:text-slate-400">Documentos vinculados aos serviços de Obras e Serviços.</p>
        </div>
        <Link href="/documentos/ged" className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
          Abrir GED
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="overflow-hidden rounded-md border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-label="Documentos de obras">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar por documento, pasta ou serviço..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-slate-900 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 md:ml-auto md:w-auto">
            <select value={purposeFilter} onChange={(event) => setPurposeFilter(event.target.value)} aria-label="Filtrar por finalidade" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option>Todos</option>
              {purposes.map((purpose) => <option key={purpose}>{purpose}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status do documento" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option>Todos</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{filteredDocumentos.length} {filteredDocumentos.length === 1 ? "documento encontrado" : "documentos encontrados"}. O gerenciamento de arquivos é realizado no GED.</p>
          {filteredDocumentos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Nenhum documento encontrado.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ajuste os filtros ou vincule documentos aos serviços pelo GED.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {filteredDocumentos.map((documento) => (
                <li key={documento.id}>
                  <Link href="/documentos/ged" className="group block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 md:p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"><FileText className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">{documento.document.title}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{documento.document.documentType} <span className="px-1 text-slate-300">|</span> {documento.purpose}</p>
                          </div>
                          <span className={`inline-flex w-fit shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium ${statusClassName(documento.document.status)}`}>{documento.document.status}</span>
                        </div>
                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Pasta GED</dt><dd className="mt-1 flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-300"><Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" />{documento.document.folder?.name ?? "Sem pasta"}</dd></div>
                          <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Serviço</dt><dd className="mt-1 truncate font-medium text-slate-700 dark:text-slate-300">{documento.obrasServico.protocolo}</dd></div>
                          <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Descrição do serviço</dt><dd className="mt-1 truncate text-slate-700 dark:text-slate-300">{documento.obrasServico.descricao}</dd></div>
                        </dl>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
