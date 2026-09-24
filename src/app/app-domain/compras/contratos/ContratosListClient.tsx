"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ChevronLeft, ChevronRight, FilePlus2, Handshake, Plus, Search, Scale, X } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ContratoRowActions } from "./ContratoRowActions";

type ContractListRow = {
  id: string;
  number: string;
  supplierName: string;
  object: string;
  secretariatName: string;
  budgetUnitLabel: string | null;
  startDate: string;
  endDate: string;
  termDays: number;
  updatedValue: number;
  amendmentCount: number;
  status: string;
};

const pageSize = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "Vigente") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["Suspenso", "Rescindido"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "Encerrado") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-700";
}

export function ContratosListClient({ contracts }: { contracts: ContractListRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const statuses = [...new Set(contracts.map((contract) => contract.status))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const filteredContracts = contracts.filter((contract) => {
    const matchesQuery = !normalizedQuery || [contract.number, contract.supplierName, contract.object, contract.secretariatName, contract.budgetUnitLabel ?? "", contract.status].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesQuery && (status === "ALL" || contract.status === status);
  });
  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleContracts = filteredContracts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(query || status !== "ALL");

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <ErpPageTitle title="Gestão de Contratos" description="Instrumentos administrativos e execução vinculada" icon={<Scale className="size-4 shrink-0 text-indigo-700" />} action={<><Link href="/compras/convenios" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Handshake className="size-3.5" />Convênios</Link><Link href="/compras/contratos/novo" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800"><Plus className="size-3.5" />Novo contrato</Link></>} />
      <ErpListFrame
        toolbar={<div className="flex flex-wrap items-center justify-between gap-2"><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:max-w-4xl"><label className="relative min-w-[13rem] flex-1"><span className="sr-only">Buscar contrato</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Número, fornecedor, objeto ou unidade" className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20" /></label><label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Situação<select value={status} onChange={(event) => updateStatus(event.target.value)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"><option value="ALL">Todas</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>{hasFilters && <button type="button" onClick={() => { setQuery(""); setStatus("ALL"); setPage(1); }} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"><X className="size-3.5" />Limpar</button>}</div><p className="text-[11px] text-slate-500">Medições e parcelas são geridas na ficha do instrumento.</p></div>}
        pagination={<div className="flex w-full items-center justify-between gap-3"><span className="text-xs text-slate-500"><strong className="font-semibold tabular-nums text-slate-700">{filteredContracts.length}</strong> {filteredContracts.length === 1 ? "registro" : "registros"}</span><div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /></button><span className="min-w-14 text-center text-[11px] font-medium tabular-nums text-slate-600">{currentPage} de {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-3.5" /></button></div></div>}
      >
        {!visibleContracts.length ? <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-slate-100"><FilePlus2 className="size-5 text-slate-400" /></div><h2 className="mt-3 text-sm font-semibold text-slate-700">Nenhum contrato encontrado</h2><p className="mt-1 max-w-sm text-xs text-slate-500">Revise os filtros ou registre um novo contrato administrativo.</p></div> : <><div className="hidden h-full md:block"><table className="w-full table-fixed border-collapse text-left text-[11px]"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><tr><th className="w-[12%] px-3 py-2">Contrato</th><th className="w-[16%] px-3 py-2">Fornecedor</th><th className="px-3 py-2">Objeto</th><th className="w-[13%] px-3 py-2">Vigência</th><th className="w-[13%] px-3 py-2">Unidade</th><th className="w-[11%] px-3 py-2 text-right">Valor atual</th><th className="w-20 px-3 py-2 text-center">Aditivos</th><th className="w-28 px-3 py-2">Situação</th><th className="w-24 px-3 py-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleContracts.map((contract) => <tr key={contract.id} className="h-[38px] hover:bg-slate-50"><td className="px-3 py-1.5"><Link href={`/compras/contratos/${contract.id}`} className="font-semibold text-slate-900 hover:text-indigo-800 hover:underline">{contract.number}</Link></td><td className="truncate px-3 py-1.5 text-slate-700" title={contract.supplierName}>{contract.supplierName}</td><td className="truncate px-3 py-1.5 text-slate-700" title={contract.object}>{contract.object}</td><td className="px-3 py-1.5 tabular-nums text-slate-700"><span className="block truncate" title={`${formatDate(contract.startDate)} a ${formatDate(contract.endDate)} · ${contract.termDays} dias`}>{formatDate(contract.startDate)} a {formatDate(contract.endDate)}</span></td><td className="truncate px-3 py-1.5 text-slate-700" title={contract.budgetUnitLabel ?? "Pendente de regularização"}>{contract.budgetUnitLabel ?? "Pendente"}</td><td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800">{money.format(contract.updatedValue)}</td><td className="px-3 py-1.5 text-center tabular-nums text-slate-700">{contract.amendmentCount || "-"}</td><td className="px-3 py-1.5"><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(contract.status)}`}>{contract.status}</span></td><td className="px-3 py-1.5"><ContratoRowActions id={contract.id} /></td></tr>)}</tbody></table></div><div className="space-y-2 p-2 md:hidden">{visibleContracts.map((contract) => <article key={contract.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/compras/contratos/${contract.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-800">{contract.number}</Link><p className="mt-0.5 truncate text-xs text-slate-500">{contract.supplierName}</p></div><span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClass(contract.status)}`}>{contract.status}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-700">{contract.object}</p><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-slate-500">Vigência</dt><dd className="mt-0.5 text-slate-800">{formatDate(contract.startDate)} a {formatDate(contract.endDate)}</dd></div><div><dt className="text-slate-500">Valor atual</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-800">{money.format(contract.updatedValue)}</dd></div><div><dt className="text-slate-500">Unidade</dt><dd className="mt-0.5 truncate text-slate-800">{contract.budgetUnitLabel ?? "Pendente"}</dd></div><div><dt className="text-slate-500">Aditivos</dt><dd className="mt-0.5 text-slate-800">{contract.amendmentCount}</dd></div></dl><div className="mt-3 flex justify-end border-t pt-2"><ContratoRowActions id={contract.id} /></div></article>)}</div></>}
      </ErpListFrame>
    </PageFrame>
  );
}
