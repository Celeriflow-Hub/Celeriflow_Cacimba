"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Pencil, Plus, Search, X } from "lucide-react";

export type PurchasePlanningListRow = {
  id: string;
  itemName: string;
  description: string | null;
  unit: string;
  quantity: number;
  expectedPeriodStart: string;
  expectedPeriodEnd: string;
  estimatedValueDecimal: number;
  status: string;
  originId: string | null;
  originNumber: string | null;
  originObject: string | null;
};

type PlanningListClientProps = {
  plannings: PurchasePlanningListRow[];
  canCreate: boolean;
  canUpdate: boolean;
};

const pageSize = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function statusClass(status: string) {
  if (status === "Rascunho") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Planejado") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function PlanningListClient({ plannings, canCreate, canUpdate }: PlanningListClientProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const statuses = [...new Set(plannings.map((planning) => planning.status))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const filteredPlannings = plannings.filter((planning) => {
    const values = [planning.itemName, planning.description, planning.unit, planning.originNumber, planning.originObject, planning.status];
    const matchesQuery = !normalizedQuery || values.filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesQuery && (status === "ALL" || planning.status === status);
  });
  const totalPages = Math.max(1, Math.ceil(filteredPlannings.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePlannings = filteredPlannings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(query || status !== "ALL");

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
    setPage(1);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2 p-3 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Planejamento de Compras</h1>
        <div className="flex items-center gap-2">
          {canCreate ? <Link href="/compras/planejamento/novo" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"><Plus className="size-3.5" />Novo planejamento</Link> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2.5 shrink-0 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar planejamento</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Item, especificação ou solicitação" className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Situação<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="ALL">Todas</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            {hasFilters ? <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"><X className="size-3.5" />Limpar</button> : null}
          </div>
          <div className="flex items-center gap-1.5"><span className="text-[11px] text-slate-500">Não gera contratação, reserva ou empenho.</span></div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed text-left border-collapse text-[11px] sm:text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2">Item / serviço</th>
                <th className="px-3 py-2">Quantidade</th>
                <th className="px-3 py-2">Período esperado</th>
                <th className="px-3 py-2 text-right">Valor estimado</th>
                <th className="px-3 py-2">Origem</th>
                <th className="px-3 py-2">Situação</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visiblePlannings.length ? visiblePlannings.map((planning) => (
                <tr key={planning.id} className="h-[38px] hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="truncate px-3 py-1.5" title={planning.description || planning.itemName}><Link href={`/compras/planejamento/${planning.id}`} className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline dark:text-slate-100">{planning.itemName}</Link></td>
                  <td className="px-3 py-1.5 tabular-nums text-slate-700 dark:text-slate-200">{planning.quantity} {planning.unit}</td>
                  <td className="truncate px-3 py-1.5 tabular-nums text-slate-700 dark:text-slate-200">{formatDate(planning.expectedPeriodStart)} a {formatDate(planning.expectedPeriodEnd)}</td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800 dark:text-slate-100">{money.format(planning.estimatedValueDecimal)}</td>
                  <td className="truncate px-3 py-1.5 text-slate-700 dark:text-slate-200" title={planning.originObject || undefined}>{planning.originId && planning.originNumber ? <Link href={`/compras/solicitacoes/${planning.originId}`} className="font-medium text-emerald-800 hover:underline dark:text-emerald-300">{planning.originNumber}</Link> : <span className="text-slate-500">Direta</span>}</td>
                  <td className="px-3 py-1.5"><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(planning.status)}`}>{planning.status}</span></td>
                  <td className="px-3 py-1.5"><div className="flex justify-end gap-1"><Link href={`/compras/planejamento/${planning.id}`} aria-label={`Consultar ${planning.itemName}`} title="Consultar" className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><FileText className="size-3.5" /></Link>{canUpdate ? <Link href={`/compras/planejamento/${planning.id}/editar`} aria-label={`Editar ${planning.itemName}`} title="Editar" className="rounded p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-800"><Pencil className="size-3.5" /></Link> : null}</div></td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-3 py-12 text-center"><CalendarDays className="mx-auto size-7 text-slate-300" /><p className="mt-2 font-medium text-slate-700 dark:text-slate-200">Nenhum planejamento encontrado</p><p className="mt-1 text-slate-500">Revise os filtros ou registre uma necessidade futura.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 shrink-0 text-xs text-slate-500 dark:border-slate-800">
          <span>{filteredPlannings.length} {filteredPlannings.length === 1 ? "registro" : "registros"}</span>
          <div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ChevronLeft className="size-3.5" /></button><span className="min-w-14 text-center tabular-nums">{currentPage} de {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><ChevronRight className="size-3.5" /></button></div>
        </div>
      </div>
    </div>
  );
}
