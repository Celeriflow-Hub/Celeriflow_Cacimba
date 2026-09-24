"use client";

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type PropositionRow = { id: string; numero: string; tipo: string; autoria: string; assunto: string; data: string; status: string };
const PAGE_SIZE = 20;

export function ProposicoesClient({ rows }: { rows: PropositionRow[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<PropositionRow | null>(null);
  const types = Array.from(new Set(rows.map((row) => row.tipo))).sort();
  const statuses = Array.from(new Set(rows.map((row) => row.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => (!term || [row.numero, row.autoria, row.assunto].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!type || row.tipo === type) && (!status || row.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem_10rem]"><label className="relative"><span className="sr-only">Buscar proposições</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar número, assunto ou autoria..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-purple-600" /></label><select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os tipos</option>{types.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} proposições encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="proposições" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Número</th><th className="p-2">Tipo</th><th className="hidden p-2 md:table-cell">Autoria</th><th className="p-2">Assunto</th><th className="hidden p-2 lg:table-cell">Data</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-medium text-slate-900">{row.numero}</td><td className="truncate p-2">{row.tipo}</td><td className="hidden truncate p-2 md:table-cell">{row.autoria}</td><td className="truncate p-2" title={row.assunto}>{row.assunto}</td><td className="hidden whitespace-nowrap p-2 lg:table-cell">{new Date(row.data).toLocaleDateString("pt-BR")}</td><td className="p-2"><span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-700">{row.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Ver assunto completo"><Eye className="size-3.5" /></Button></td></tr>)}{visible.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhuma proposição encontrada.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>{detail?.tipo} {detail?.numero}</DialogTitle><DialogDescription>{detail?.autoria} · {detail?.status}</DialogDescription></DialogHeader><div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.assunto}</div><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

