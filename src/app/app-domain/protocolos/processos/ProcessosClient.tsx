"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckSquare, FileText, Pencil, Plus, Search } from "lucide-react";
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
import type { ProcessListFilters } from "@/lib/protocols/process-listing-policy";
import { processListHref } from "@/lib/protocols/process-listing-policy";
import { receiveProcess, receiveProcessesBatch } from "../actions";

type Processo = {
  id: string;
  protocolNumber: string;
  status: string;
  createdAt: Date;
  currentDepartmentId: string | null;
  processType: { name: string };
  subject: { name: string };
  person: { fullName: string } | null;
  company: { corporateName: string } | null;
};

function getStatusVariant(status: string): ErpStatusVariant {
  if (["Concluido", "Concluído", "Finalizada"].includes(status)) return "success";
  if (["Aguardando Recebimento", "Pendente"].includes(status)) return "warning";
  if (["Em Analise", "Recebido", "Atendimento"].includes(status)) return "info";
  if (["Cancelado", "Rejeitado"].includes(status)) return "danger";
  return "neutral";
}

function interestedName(processo: Processo) {
  return processo.person?.fullName || processo.company?.corporateName || "Não informado";
}

export default function ProcessosClient({
  processos,
  filters,
  total,
  page,
  pageSize,
  canReceive,
  currentDepartmentId,
  canCreate,
  returnTo,
}: {
  processos: Processo[];
  filters: ProcessListFilters;
  total: number;
  page: number;
  pageSize: number;
  canReceive: boolean;
  currentDepartmentId: string | null;
  canCreate: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const receivableIds = processos
    .filter((processo) => canReceive && processo.currentDepartmentId === currentDepartmentId && processo.status === "Aguardando Recebimento")
    .map((processo) => processo.id);
  const selectedReceivableIds = selectedIds.filter((id) => receivableIds.includes(id));

  function setSelected(processId: string, selected: boolean) {
    setSelectedIds((current) => selected ? [...new Set([...current, processId])] : current.filter((id) => id !== processId));
  }

  function processHref(processId: string) {
    return "/protocolos/processos/" + processId + "?returnTo=" + encodeURIComponent(returnTo);
  }

  function handleReceive(processId: string) {
    setNotice(null);
    startTransition(async () => {
      const result = await receiveProcess(processId);
      if (result.error) {
        setNotice(result.error);
        return;
      }
      setSelectedIds((current) => current.filter((id) => id !== processId));
      setNotice("Recebimento registrado.");
      router.refresh();
    });
  }

  function handleBatchReceive() {
    if (!selectedReceivableIds.length) return;
    setNotice(null);
    startTransition(async () => {
      const { results } = await receiveProcessesBatch(selectedReceivableIds);
      const failed = results.filter((result) => result.error);
      const received = results.length - failed.length;
      setSelectedIds([]);
      setNotice(
        failed.length
          ? received + " processo(s) recebido(s). " + failed.length + " item(ns) precisa(m) de revisão: " + failed.map((item) => item.error).join(" ")
          : received + " processo(s) recebido(s) com sucesso.",
      );
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Protocolos"
        action={canCreate ? (
          <Link
            href="/protocolos/processos/novo"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600 active:bg-amber-700"
          >
            <Plus className="size-3.5" />
            Novo protocolo
          </Link>
        ) : undefined}
      />

      <ErpListFrame
        toolbar={(
          <form action="/protocolos/processos" method="GET" className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-1 flex-wrap items-center gap-2 max-w-2xl">
              <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
                <span className="sr-only">Buscar processo</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Buscar protocolo, interessado, tipo ou assunto"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <div className="flex items-center gap-1.5">
                <label htmlFor="status" className="text-[11px] font-medium text-slate-500">Status</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={filters.status || "ATIVOS"}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ATIVOS">Todos ativos</option>
                  <option value="Aguardando Recebimento">Aguardando recebimento</option>
                  <option value="Recebido">Recebido</option>
                  <option value="Em Analise">Em análise</option>
                  <option value="Concluido">Concluído</option>
                  <option value="Arquivado">Arquivado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <button
                type="submit"
                className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Filtrar
              </button>
              <Link
                href="/protocolos/processos"
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Limpar
              </Link>
            </div>

            {selectedReceivableIds.length > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleBatchReceive}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-800 disabled:opacity-50"
              >
                <CheckSquare className="size-3.5" />
                Receber ({selectedReceivableIds.length})
              </button>
            )}
          </form>
        )}
        summary={notice ? (
          <div className="flex items-center text-[11px] font-medium text-emerald-700 dark:text-emerald-400" aria-live="polite">
            {notice}
          </div>
        ) : undefined}
        pagination={
          <ErpPagination
            page={page}
            total={total}
            pageSize={pageSize}
            previousHref={processListHref(filters, page - 1)}
            nextHref={processListHref(filters, page + 1)}
            label="protocolos"
          />
        }
      >
        {processos.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <FileText className="size-5 text-slate-400" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum protocolo encontrado</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">Revise os filtros de busca ou aguarde novas distribuições.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <ErpTableContainer>
                <ErpTableThead>
                  <tr>
                    <th className="w-8 select-none px-2 py-2 text-center">
                      <span className="sr-only">Selecionar</span>
                    </th>
                    <ErpTableTh sortable className="w-[140px]">Protocolo</ErpTableTh>
                    <ErpTableTh sortable className="w-[130px]">Origem</ErpTableTh>
                    <ErpTableTh sortable>Tipo / Assunto</ErpTableTh>
                    <ErpTableTh sortable className="w-[22%]">Interessado</ErpTableTh>
                    <ErpTableTh sortable className="w-[110px]">Data</ErpTableTh>
                    <ErpTableTh sortable className="w-[120px] text-center">Status</ErpTableTh>
                    <th className="w-[100px] px-2.5 py-2 text-right font-semibold text-slate-500">Ação</th>
                  </tr>
                </ErpTableThead>
                <tbody>
                  {processos.map((processo) => {
                    const canReceiveThis = canReceive && processo.currentDepartmentId === currentDepartmentId && processo.status === "Aguardando Recebimento";
                    const processLabel = processo.processType.name + " · " + processo.subject.name;
                    return (
                      <ErpTableTr key={processo.id}>
                        <td className="w-8 px-2 py-1 text-center">
                          {canReceiveThis ? (
                            <input
                              aria-label={"Selecionar " + processo.protocolNumber}
                              type="checkbox"
                              checked={selectedIds.includes(processo.id)}
                              onChange={(event) => setSelected(processo.id, event.target.checked)}
                              className="size-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                          ) : (
                            <span className="inline-block size-3.5" />
                          )}
                        </td>
                        <ErpTableTd className="font-semibold text-slate-800 dark:text-slate-100">
                          {processo.protocolNumber}
                        </ErpTableTd>
                        <ErpTableTd className="text-slate-500">
                          Digital
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
                              href={processHref(processo.id)}
                              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                            >
                              Ver atendimento...
                            </Link>
                            {canReceiveThis && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleReceive(processo.id)}
                                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-50 dark:text-amber-400"
                              >
                                Receber
                              </button>
                            )}
                            <Link
                              href={processHref(processo.id)}
                              title="Abrir processo"
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

            {/* Mobile / Tablet Responsive View */}
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden dark:divide-slate-800">
              {processos.map((processo) => {
                const canReceiveThis = canReceive && processo.currentDepartmentId === currentDepartmentId && processo.status === "Aguardando Recebimento";
                return (
                  <article key={processo.id} className="space-y-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {canReceiveThis && (
                          <input
                            aria-label={"Selecionar " + processo.protocolNumber}
                            type="checkbox"
                            checked={selectedIds.includes(processo.id)}
                            onChange={(event) => setSelected(processo.id, event.target.checked)}
                            className="size-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                        )}
                        <span className="font-bold text-slate-900 dark:text-slate-100">{processo.protocolNumber}</span>
                      </div>
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
                      <div className="flex items-center gap-3">
                        <Link href={processHref(processo.id)} className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
                          Ver atendimento...
                        </Link>
                        {canReceiveThis && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleReceive(processo.id)}
                            className="font-semibold text-amber-700 hover:underline disabled:opacity-50 dark:text-amber-400"
                          >
                            Receber
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
