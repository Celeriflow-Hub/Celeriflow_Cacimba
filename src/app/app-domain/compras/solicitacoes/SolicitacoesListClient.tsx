"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, ShoppingCart, X } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { SolicitacaoRowActions } from "./SolicitacaoRowActions";

export type PurchaseRequestListRow = {
  id: string;
  number: string;
  object: string;
  status: string;
  priority: string;
  estimatedValue: number | null;
  createdAt: string;
  secretariatName: string;
  departmentName: string;
  requesterName: string;
  itemCount: number;
  canManage: boolean;
};

const pageSize = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusClass(status: string) {
  if (status === "Aprovada") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Rascunho") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function priorityClass(priority: string) {
  if (priority === "Urgente") return "bg-rose-50 text-rose-700";
  if (priority === "Alta") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function SolicitacoesListClient({ requests }: { requests: PurchaseRequestListRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const statuses = [...new Set(requests.map((request) => request.status))].sort();
  const priorities = [...new Set(requests.map((request) => request.priority))].sort();
  const filteredRequests = requests.filter((request) => {
    const matchesQuery = !normalizedQuery || [request.number, request.object, request.secretariatName, request.departmentName, request.requesterName].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesQuery && (status === "ALL" || request.status === status) && (priority === "ALL" || request.priority === priority);
  });
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(query || status !== "ALL" || priority !== "ALL");

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
    setPriority("ALL");
    setPage(1);
  }

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-2 overflow-hidden p-3">
      <ErpPageTitle
        title="Solicitações de Compra"
        description="Planejamento, alocação orçamentária e origem dos processos"
        icon={<ShoppingCart className="size-4 shrink-0 text-emerald-700" />}
        action={<Link href="/compras/solicitacoes/novo" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"><Plus className="size-3.5" />Nova solicitação</Link>}
      />
      <ErpListFrame
        toolbar={(
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:max-w-4xl">
              <label className="relative min-w-[13rem] flex-1">
                <span className="sr-only">Buscar solicitação</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Número, objeto, secretaria ou solicitante" className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20" />
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Situação<select value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600"><option value="ALL">Todas</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Prioridade<select value={priority} onChange={(event) => { setPriority(event.target.value); resetPage(); }} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600"><option value="ALL">Todas</option>{priorities.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              {hasFilters ? <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"><X className="size-3.5" />Limpar</button> : null}
            </div>
            <p className="text-[11px] text-slate-500">Não gera reserva ou empenho automaticamente.</p>
          </div>
        )}
        pagination={(
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-xs text-slate-500"><strong className="font-semibold tabular-nums text-slate-700">{filteredRequests.length}</strong> {filteredRequests.length === 1 ? "registro" : "registros"}</span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
              <span className="min-w-14 text-center text-[11px] font-medium tabular-nums text-slate-600">{currentPage} de {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-3.5" /></button>
            </div>
          </div>
        )}
      >
        {!visibleRequests.length ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-slate-100"><ShoppingCart className="size-5 text-slate-400" /></div><h2 className="mt-3 text-sm font-semibold text-slate-700">Nenhuma solicitação encontrada</h2><p className="mt-1 max-w-sm text-xs text-slate-500">Revise os filtros ou registre uma nova necessidade de compra.</p></div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="w-[12%] px-3 py-2">Número</th><th className="px-3 py-2">Objeto / planejamento</th><th className="w-[11%] px-3 py-2">Itens</th><th className="w-[15%] px-3 py-2">Origem</th><th className="w-[10%] px-3 py-2 text-right">Estimativa</th><th className="w-[10%] px-3 py-2">Situação</th><th className="w-20 px-3 py-2">Prioridade</th><th className="w-[5.5rem] px-3 py-2 text-right">Ações</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleRequests.map((request) => <tr key={request.id} className="h-[38px] hover:bg-slate-50"><td className="px-3 py-1.5"><Link href={`/compras/solicitacoes/${request.id}`} className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline">{request.number}</Link></td><td className="px-3 py-1.5"><p className="truncate font-medium text-slate-800" title={`${request.object} · ${request.requesterName}`}>{request.object}</p></td><td className="px-3 py-1.5 tabular-nums text-slate-700">{request.itemCount}</td><td className="px-3 py-1.5"><p className="truncate text-slate-700" title={`${request.secretariatName} · ${request.departmentName}`}>{request.secretariatName}</p></td><td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800">{request.estimatedValue === null ? "-" : money.format(request.estimatedValue)}</td><td className="px-3 py-1.5"><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(request.status)}`}>{request.status}</span></td><td className="px-3 py-1.5"><span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${priorityClass(request.priority)}`}>{request.priority}</span></td><td className="px-3 py-1.5"><SolicitacaoRowActions id={request.id} canManage={request.canManage} /></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 p-2 md:hidden">
              {visibleRequests.map((request) => <article key={request.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/compras/solicitacoes/${request.id}`} className="text-sm font-semibold text-slate-900 hover:text-emerald-800">{request.number}</Link><p className="mt-0.5 text-xs text-slate-500">{request.secretariatName} · {request.departmentName}</p></div><span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(request.status)}`}>{request.status}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-700">{request.object}</p><dl className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-slate-500">Itens</dt><dd className="mt-0.5 font-semibold text-slate-800">{request.itemCount}</dd></div><div><dt className="text-slate-500">Estimativa</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-800">{request.estimatedValue === null ? "-" : money.format(request.estimatedValue)}</dd></div><div><dt className="text-slate-500">Prioridade</dt><dd className="mt-0.5 font-semibold text-slate-800">{request.priority}</dd></div></dl><div className="mt-2 border-t pt-2"><SolicitacaoRowActions id={request.id} canManage={request.canManage} /></div></article>)}
            </div>
          </>
        )}
      </ErpListFrame>
    </PageFrame>
  );
}
