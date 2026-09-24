"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Plus, Search, SearchCheck, X } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";

type PriceResearchListRow = {
  id: string;
  status: string;
  deadlineAt: string;
  estimatedValue: number | null;
  process: { number: string; object: string; purchaseRequestNumber: string | null };
  submittedQuoteCount: number;
};

const pageSize = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function researchStatusLabel(status: string) {
  return status === "Em Andamento" ? "Em andamento" : status;
}

export function PriceResearchListClient({ researches }: { researches: PriceResearchListRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredResearches = researches.filter((research) => {
    const matchesQuery = !normalizedQuery || [research.process.number, research.process.object, research.process.purchaseRequestNumber ?? "", researchStatusLabel(research.status)].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    const matchesStatus = status === "ALL" || (status === "OPEN" ? research.status === "Em Andamento" : research.status !== "Em Andamento");
    return matchesQuery && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredResearches.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleResearches = filteredResearches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(query || status !== "ALL");

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
    setPage(1);
  }

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-2 overflow-hidden">
      <ErpPageTitle title="Pesquisas de Preços" description="Referência por média das propostas apresentadas" icon={<SearchCheck className="size-4 shrink-0 text-emerald-700" />} action={<Link href="/compras/pesquisas-precos/nova" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"><Plus className="size-3.5" />Nova pesquisa</Link>} />
      <ErpListFrame
        toolbar={(
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:max-w-3xl">
              <label className="relative min-w-[13rem] flex-1">
                <span className="sr-only">Buscar pesquisa de preços</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Processo, solicitação ou objeto" className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20" />
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                Situação
                <select value={status} onChange={(event) => updateStatus(event.target.value)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"><option value="ALL">Todas</option><option value="OPEN">Em andamento</option><option value="CLOSED">Encerradas</option></select>
              </label>
              {hasFilters ? <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"><X className="size-3.5" />Limpar</button> : null}
            </div>
            <p className="text-[11px] text-slate-500">Disponibilidade orçamentária não é inferida nesta rotina.</p>
          </div>
        )}
        pagination={(
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-xs text-slate-500"><strong className="font-semibold tabular-nums text-slate-700">{filteredResearches.length}</strong> {filteredResearches.length === 1 ? "registro" : "registros"}</span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
              <span className="min-w-14 text-center text-[11px] font-medium tabular-nums text-slate-600">{currentPage} de {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-3.5" /></button>
            </div>
          </div>
        )}
      >
        {!visibleResearches.length ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-slate-100"><ClipboardList className="size-5 text-slate-400" /></div><h2 className="mt-3 text-sm font-semibold text-slate-700">Nenhuma pesquisa encontrada</h2><p className="mt-1 max-w-sm text-xs text-slate-500">Revise a busca ou crie uma pesquisa vinculada a um processo de compra.</p></div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed border-collapse text-left text-[11px]">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><tr><th className="w-[16%] px-3 py-2">Processo / solicitação</th><th className="px-3 py-2">Objeto</th><th className="w-[10rem] px-3 py-2">Encerramento</th><th className="w-20 px-3 py-2 text-right">Cotações</th><th className="w-28 px-3 py-2 text-right">Referência</th><th className="w-28 px-3 py-2">Situação</th><th className="w-16 px-3 py-2 text-right">Ação</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleResearches.map((research) => <tr key={research.id} className="h-[38px] hover:bg-slate-50"><td className="px-3 py-1.5"><Link href={`/compras/pesquisas-precos/${research.id}`} className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline">{research.process.number}</Link></td><td className="truncate px-3 py-1.5 text-slate-700" title={research.process.object}>{research.process.object}</td><td className="px-3 py-1.5 tabular-nums text-slate-700">{new Date(research.deadlineAt).toLocaleString("pt-BR")}</td><td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{research.submittedQuoteCount}</td><td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800">{research.estimatedValue === null ? "Sem proposta" : money.format(research.estimatedValue)}</td><td className="px-3 py-1.5"><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${research.status === "Em Andamento" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}`}>{researchStatusLabel(research.status)}</span></td><td className="px-3 py-1.5 text-right"><Link href={`/compras/pesquisas-precos/${research.id}`} className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline">Abrir</Link></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 p-2 md:hidden">
              {visibleResearches.map((research) => <article key={research.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/compras/pesquisas-precos/${research.id}`} className="text-sm font-semibold text-slate-900 hover:text-emerald-800">{research.process.number}</Link><p className="mt-0.5 text-xs text-slate-500">Solicitação {research.process.purchaseRequestNumber ?? "não vinculada"}</p></div><span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${research.status === "Em Andamento" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}`}>{researchStatusLabel(research.status)}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-700">{research.process.object}</p><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-slate-500">Encerramento</dt><dd className="mt-0.5 tabular-nums text-slate-800">{new Date(research.deadlineAt).toLocaleString("pt-BR")}</dd></div><div><dt className="text-slate-500">Referência</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-800">{research.estimatedValue === null ? "Sem proposta" : money.format(research.estimatedValue)}</dd></div></dl><Link href={`/compras/pesquisas-precos/${research.id}`} className="mt-3 inline-flex text-xs font-semibold text-emerald-800 hover:underline">Abrir pesquisa</Link></article>)}
            </div>
          </>
        )}
      </ErpListFrame>
    </PageFrame>
  );
}
