"use client";

import Link from "next/link";
import { FileText, Pencil, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import {
  ErpTableContainer,
  ErpTableThead,
  ErpTableTh,
  ErpTableTr,
  ErpTableTd,
  ErpStatusBadge,
  type ErpStatusVariant,
} from "@/components/app-ui/erp/ErpTable";

type Processo = {
  id: string;
  protocolNumber: string;
  status: string;
  createdAt: Date;
  processType: { name: string };
  subject: { name: string };
  person: { fullName: string } | null;
  company: { corporateName: string } | null;
};

function searchListHref(query: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? "/protocolos/busca?" + search : "/protocolos/busca";
}

function interestedName(processo: Processo) {
  return processo.person?.fullName || processo.company?.corporateName || "Não informado";
}

function getStatusVariant(status: string): ErpStatusVariant {
  if (["Concluido", "Concluído", "Finalizada"].includes(status)) return "success";
  if (["Aguardando Recebimento", "Pendente"].includes(status)) return "warning";
  if (["Em Analise", "Recebido", "Atendimento"].includes(status)) return "info";
  if (["Cancelado", "Rejeitado"].includes(status)) return "danger";
  return "neutral";
}

export default function BuscaClient({
  processos,
  query,
  total,
  page,
  pageSize,
}: {
  processos: Processo[];
  query: string;
  total: number;
  page: number;
  pageSize: number;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle title="Buscar processos" />

      <ErpListFrame
        toolbar={(
          <form action="/protocolos/busca" method="GET" className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl">
              <span className="sr-only">Buscar processo</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Buscar por número do protocolo, interessado, tipo ou assunto"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <button
              type="submit"
              className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Pesquisar
            </button>
            <Link
              href="/protocolos/busca"
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpar
            </Link>
          </form>
        )}
        pagination={
          <ErpPagination
            page={page}
            total={total}
            pageSize={pageSize}
            previousHref={searchListHref(query, page - 1)}
            nextHref={searchListHref(query, page + 1)}
            label="processos encontrados"
          />
        }
      >
        {processos.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <FileText className="size-5 text-slate-400" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum processo encontrado</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">Revise os termos digitados ou consulte o número exato do protocolo.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <ErpTableContainer>
                <ErpTableThead>
                  <tr>
                    <ErpTableTh sortable className="w-[140px]">Protocolo</ErpTableTh>
                    <ErpTableTh sortable>Tipo / Assunto</ErpTableTh>
                    <ErpTableTh sortable className="w-[24%]">Interessado</ErpTableTh>
                    <ErpTableTh sortable className="w-[110px]">Abertura</ErpTableTh>
                    <ErpTableTh sortable className="w-[120px] text-center">Status</ErpTableTh>
                    <th className="w-[90px] px-2.5 py-2 text-right font-semibold text-slate-500">Ação</th>
                  </tr>
                </ErpTableThead>
                <tbody>
                  {processos.map((processo) => {
                    const processLabel = processo.processType.name + " · " + processo.subject.name;
                    return (
                      <ErpTableTr key={processo.id}>
                        <ErpTableTd className="font-semibold text-slate-800 dark:text-slate-100">
                          {processo.protocolNumber}
                        </ErpTableTd>
                        <ErpTableTd title={processLabel}>
                          {processLabel}
                        </ErpTableTd>
                        <ErpTableTd title={interestedName(processo)}>
                          {interestedName(processo)}
                        </ErpTableTd>
                        <ErpTableTd className="text-slate-500 tabular-nums">
                          {new Date(processo.createdAt).toLocaleDateString("pt-BR")}
                        </ErpTableTd>
                        <td className="px-2.5 py-1.5 text-center">
                          <ErpStatusBadge variant={getStatusVariant(processo.status)}>
                            {processo.status}
                          </ErpStatusBadge>
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={"/protocolos/processos/" + processo.id}
                              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                            >
                              Abrir
                            </Link>
                            <Link
                              href={"/protocolos/processos/" + processo.id}
                              title="Ver detalhes"
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              <Pencil className="size-3.5" />
                            </Link>
                          </div>
                        </td>
                      </ErpTableTr>
                    );
                  })}
                </tbody>
              </ErpTableContainer>
            </div>

            {/* Mobile View */}
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden dark:divide-slate-800">
              {processos.map((processo) => (
                <article key={processo.id} className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{processo.protocolNumber}</span>
                    <ErpStatusBadge variant={getStatusVariant(processo.status)}>
                      {processo.status}
                    </ErpStatusBadge>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {processo.processType.name} · {processo.subject.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{interestedName(processo)}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">
                      {new Date(processo.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <Link
                      href={"/protocolos/processos/" + processo.id}
                      className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
                    >
                      Abrir detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
