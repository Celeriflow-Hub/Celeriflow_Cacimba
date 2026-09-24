"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ChevronLeft, ChevronRight, FilePlus2, Handshake, Plus, Scale, Search, X } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ConvenioRowActions } from "./ConvenioRowActions";

type CovenantListRow = {
  id: string;
  number: string;
  grantor: string;
  description: string;
  totalValueDecimal: number;
  startDate: string;
  endDate: string;
  termDays: number;
  status: string;
  partyCount: number;
  measurementCount: number;
  installmentCount: number;
};

const pageSize = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "Ativo") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["Suspenso", "Rescindido"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "Encerrado") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-700";
}

export function ConveniosListClient({ covenants }: { covenants: CovenantListRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const statuses = [...new Set(covenants.map((covenant) => covenant.status))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const filteredCovenants = covenants.filter((covenant) => {
    const matchesQuery = !normalizedQuery || [covenant.number, covenant.grantor, covenant.description, covenant.status].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesQuery && (status === "ALL" || covenant.status === status);
  });
  const totalPages = Math.max(1, Math.ceil(filteredCovenants.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleCovenants = filteredCovenants.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(query || status !== "ALL");

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle title="Gestão de Convênios" description="Instrumentos, execução física e cronograma" icon={<Handshake className="size-4 shrink-0 text-indigo-700" />} action={<><Link href="/compras/contratos" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Scale className="size-3.5" />Contratos</Link><Link href="/compras/convenios/novo" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800"><Plus className="size-3.5" />Novo convênio</Link></>} />
      <ErpListFrame
        toolbar={<div className="flex flex-wrap items-center justify-between gap-2"><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:max-w-4xl"><label className="relative min-w-[13rem] flex-1"><span className="sr-only">Buscar convênio</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Número, concedente ou objeto" className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20" /></label><label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Situação<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"><option value="ALL">Todas</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>{hasFilters && <button type="button" onClick={() => { setQuery(""); setStatus("ALL"); setPage(1); }} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"><X className="size-3.5" />Limpar</button>}</div><p className="text-[11px] text-slate-500">Financeiro é exibido apenas quando houver vínculo real.</p></div>}
        pagination={<div className="flex w-full items-center justify-between gap-3"><span className="text-xs text-slate-500"><strong className="font-semibold tabular-nums text-slate-700">{filteredCovenants.length}</strong> {filteredCovenants.length === 1 ? "registro" : "registros"}</span><div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /></button><span className="min-w-14 text-center text-[11px] font-medium tabular-nums text-slate-600">{currentPage} de {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-3.5" /></button></div></div>}
      >
        {!visibleCovenants.length ? <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-slate-100"><FilePlus2 className="size-5 text-slate-400" /></div><h2 className="mt-3 text-sm font-semibold text-slate-700">Nenhum convênio encontrado</h2><p className="mt-1 max-w-sm text-xs text-slate-500">Revise os filtros ou registre um novo instrumento de convênio.</p></div> : <><div className="hidden h-full md:block"><table className="w-full table-fixed border-collapse text-left text-[11px]"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><tr><th className="w-[13%] px-3 py-2">Convênio</th><th className="w-[16%] px-3 py-2">Concedente</th><th className="px-3 py-2">Objeto</th><th className="w-[14%] px-3 py-2">Vigência</th><th className="w-[11%] px-3 py-2 text-right">Valor total</th><th className="w-28 px-3 py-2 text-center">Execução</th><th className="w-28 px-3 py-2">Situação</th><th className="w-24 px-3 py-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleCovenants.map((covenant) => <tr key={covenant.id} className="h-[38px] hover:bg-slate-50"><td className="px-3 py-1.5"><Link href={`/compras/convenios/${covenant.id}`} className="font-semibold text-slate-900 hover:text-indigo-800 hover:underline">{covenant.number}</Link></td><td className="truncate px-3 py-1.5 text-slate-700" title={covenant.grantor}>{covenant.grantor}</td><td className="truncate px-3 py-1.5 text-slate-700" title={covenant.description}>{covenant.description}</td><td className="px-3 py-1.5 tabular-nums text-slate-700">{formatDate(covenant.startDate)} a {formatDate(covenant.endDate)}</td><td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800">{money.format(covenant.totalValueDecimal)}</td><td className="px-3 py-1.5 text-center text-slate-700"><span>{covenant.measurementCount} med.</span><span className="mx-1 text-slate-300">·</span><span>{covenant.installmentCount} parc.</span></td><td className="px-3 py-1.5"><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(covenant.status)}`}>{covenant.status}</span></td><td className="px-3 py-1.5"><ConvenioRowActions id={covenant.id} /></td></tr>)}</tbody></table></div><div className="space-y-2 p-2 md:hidden">{visibleCovenants.map((covenant) => <article key={covenant.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/compras/convenios/${covenant.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-800">{covenant.number}</Link><p className="mt-0.5 truncate text-xs text-slate-500">{covenant.grantor}</p></div><span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(covenant.status)}`}>{covenant.status}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-700">{covenant.description}</p><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-slate-500">Vigência</dt><dd className="mt-0.5 text-slate-800">{formatDate(covenant.startDate)} a {formatDate(covenant.endDate)}</dd></div><div><dt className="text-slate-500">Valor total</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-800">{money.format(covenant.totalValueDecimal)}</dd></div><div><dt className="text-slate-500">Medições</dt><dd className="mt-0.5 text-slate-800">{covenant.measurementCount}</dd></div><div><dt className="text-slate-500">Parcelas</dt><dd className="mt-0.5 text-slate-800">{covenant.installmentCount}</dd></div></dl><div className="mt-3 flex justify-end border-t pt-2"><ConvenioRowActions id={covenant.id} /></div></article>)}</div></>}
      </ErpListFrame>
    </PageFrame>
  );
}
