"use client";

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type VisitRow = { id: string; date: string; familyName: string; address: string; professionalName: string; objective: string; status: string };
const PAGE_SIZE = 20;

export function VisitasClient({ rows }: { rows: VisitRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<VisitRow | null>(null);
  const statuses = Array.from(new Set(rows.map((row) => row.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => (!term || [row.familyName, row.address, row.professionalName, row.objective].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!status || row.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame
      toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem]"><label className="relative"><span className="sr-only">Buscar visitas</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar família, local ou técnico..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-teal-600" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>}
      summary={<p className="text-[11px] text-slate-500">{filtered.length} visitas encontradas</p>}
      pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="visitas" onPageChange={setPage} />}
    >
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Família</th><th className="p-2">Local</th><th className="hidden p-2 md:table-cell">Técnico</th><th className="p-2">Data</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">
        {visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-medium text-slate-800" title={row.familyName}>{row.familyName}</td><td className="truncate p-2" title={row.address}>{row.address}</td><td className="hidden truncate p-2 md:table-cell" title={row.professionalName}>{row.professionalName}</td><td className="whitespace-nowrap p-2">{new Date(row.date).toLocaleDateString("pt-BR")}</td><td className="p-2"><span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-700">{row.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Abrir detalhes"><Eye className="size-3.5" /></Button></td></tr>)}
        {visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma visita encontrada.</td></tr>}
      </tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>Detalhes da visita</DialogTitle><DialogDescription>{detail?.familyName} · {detail?.address}</DialogDescription></DialogHeader><div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.objective || "Sem objetivo informado."}</div><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

