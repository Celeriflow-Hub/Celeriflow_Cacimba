"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ContractRow = { id: string; number: string; supplierName: string; object: string; startDate: string; endDate: string; value: number; status: string };
const PAGE_SIZE = 20;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");

export function ContratosClient({ rows }: { rows: ContractRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ContractRow | null>(null);
  const statuses = Array.from(new Set(rows.map((row) => row.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => (!term || [row.number, row.supplierName, row.object].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!status || row.status === status));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem]"><label className="relative"><span className="sr-only">Buscar contratos</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar número, fornecedor ou objeto..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} contratos encontrados</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="contratos" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="w-28 p-2">Número</th><th className="p-2">Fornecedor</th><th className="p-2">Objeto</th><th className="hidden w-24 p-2 md:table-cell">Início</th><th className="hidden w-24 p-2 lg:table-cell">Fim</th><th className="hidden w-28 p-2 text-right xl:table-cell">Valor</th><th className="w-24 p-2">Situação</th><th className="w-20 p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-medium text-slate-900">{row.number}</td><td className="max-w-0 p-2"><span className="block truncate" title={row.supplierName}>{row.supplierName}</span></td><td className="max-w-0 p-2"><span className="block truncate" title={row.object}>{row.object}</span></td><td className="hidden whitespace-nowrap p-2 md:table-cell">{date(row.startDate)}</td><td className="hidden whitespace-nowrap p-2 lg:table-cell">{date(row.endDate)}</td><td className="hidden whitespace-nowrap p-2 text-right tabular-nums xl:table-cell">{money.format(row.value)}</td><td className="p-2"><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{row.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Ver objeto completo"><Eye className="size-3.5" /></Button><Link href="/compras/contratos" title="Abrir em Compras" className="inline-flex size-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100"><ExternalLink className="size-3.5" /></Link></td></tr>)}{visible.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">Nenhum contrato encontrado.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>Contrato {detail?.number}</DialogTitle><DialogDescription>{detail?.supplierName} · {detail?.status}</DialogDescription></DialogHeader><div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.object}</div><dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-xs font-semibold text-slate-500">Vigência</dt><dd>{detail ? `${date(detail.startDate)} — ${date(detail.endDate)}` : ""}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Valor atualizado</dt><dd>{detail ? money.format(detail.value) : ""}</dd></div></dl><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
