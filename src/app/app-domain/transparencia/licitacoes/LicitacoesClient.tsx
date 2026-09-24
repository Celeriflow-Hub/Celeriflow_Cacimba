"use client";

import { useState } from "react";
import { Download, Eye, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type BiddingRow = { id: string; number: string; processNumber: string; modality: string; object: string; estimatedValue: number; openingDate: string | null; status: string };
const PAGE_SIZE = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function LicitacoesClient({ rows }: { rows: BiddingRow[] }) {
  const [search, setSearch] = useState("");
  const [modality, setModality] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<BiddingRow | null>(null);
  const modalities = Array.from(new Set(rows.map((row) => row.modality))).sort();
  const statuses = Array.from(new Set(rows.map((row) => row.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => (!term || [row.number, row.processNumber, row.object, row.modality].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!modality || row.modality === modality) && (!status || row.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem_10rem]"><label className="relative"><span className="sr-only">Buscar licitações</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar número, processo ou objeto..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-amber-600" /></label><select value={modality} onChange={(event) => { setModality(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todas as modalidades</option>{modalities.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} licitações encontradas</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="licitações" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="w-28 p-2">Número</th><th className="hidden w-32 p-2 md:table-cell">Modalidade</th><th className="p-2">Objeto</th><th className="hidden w-24 p-2 lg:table-cell">Abertura</th><th className="w-32 p-2">Situação</th><th className="w-20 p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50"><td className="max-w-0 p-2"><span className="block truncate font-medium text-slate-900" title={`${row.number} · ${row.processNumber}`}>{row.number}</span></td><td className="hidden truncate p-2 md:table-cell">{row.modality}</td><td className="max-w-0 p-2"><span className="block truncate" title={row.object}>{row.object}</span></td><td className="hidden whitespace-nowrap p-2 lg:table-cell">{row.openingDate ? new Date(row.openingDate).toLocaleDateString("pt-BR") : "-"}</td><td className="p-2"><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">{row.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Ver objeto completo"><Eye className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-7" title="Baixar edital"><Download className="size-3.5" /></Button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma licitação encontrada.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>Licitação {detail?.number}</DialogTitle><DialogDescription>{detail?.modality} · Processo {detail?.processNumber} · {detail?.status}</DialogDescription></DialogHeader><div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.object}</div><dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-xs font-semibold text-slate-500">Abertura</dt><dd>{detail?.openingDate ? new Date(detail.openingDate).toLocaleDateString("pt-BR") : "Não informada"}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Valor estimado</dt><dd>{detail ? money.format(detail.estimatedValue) : ""}</dd></div></dl><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
