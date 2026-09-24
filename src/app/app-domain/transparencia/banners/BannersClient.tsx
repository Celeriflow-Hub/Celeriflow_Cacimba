"use client";
/* eslint-disable @next/next/no-img-element -- URLs são cadastradas pelo município e podem usar domínios externos. */

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type BannerRow = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
  order: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

const PAGE_SIZE = 20;
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString("pt-BR") : "Sem limite";

export function BannersClient({ rows }: { rows: BannerRow[] }) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<BannerRow | null>(null);
  const positions = Array.from(new Set(rows.map((row) => row.position))).sort();
  const statuses = Array.from(new Set(rows.map((row) => row.status))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) =>
    (!term || [row.title, row.position, row.linkUrl || ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)))
    && (!position || row.position === position)
    && (!status || row.status === status)
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame
      toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem_9rem]"><label className="relative"><span className="sr-only">Buscar banners</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar título, posição ou link..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-blue-600" /></label><select value={position} onChange={(event) => { setPosition(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todas as posições</option>{positions.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>}
      summary={<p className="text-[11px] text-slate-500">{filtered.length} banners encontrados</p>}
      pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="banners" onPageChange={setPage} />}
    >
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Título</th><th className="p-2">Posição</th><th className="hidden p-2 md:table-cell">Vigência</th><th className="w-16 p-2 text-right">Ordem</th><th className="w-24 p-2">Situação</th><th className="w-14 p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50"><td className="max-w-0 p-2"><span className="block truncate font-medium text-slate-900" title={row.title}>{row.title}</span></td><td className="truncate p-2">{row.position}</td><td className="hidden whitespace-nowrap p-2 md:table-cell">{formatDate(row.startDate)} — {formatDate(row.endDate)}</td><td className="p-2 text-right tabular-nums">{row.order}</td><td className="p-2"><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{row.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Ver banner"><Eye className="size-3.5" /></Button></td></tr>)}{visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhum banner encontrado.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>{detail?.title}</DialogTitle><DialogDescription>{detail?.position} · {detail?.status}</DialogDescription></DialogHeader>{detail?.imageUrl && <div className="overflow-hidden rounded border border-slate-200 bg-slate-50"><img src={detail.imageUrl} alt={detail.title} className="max-h-64 w-full object-contain" /></div>}<dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-500">Vigência</dt><dd>{formatDate(detail?.startDate || null)} — {formatDate(detail?.endDate || null)}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Ordem</dt><dd>{detail?.order}</dd></div>{detail?.linkUrl && <div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Destino</dt><dd className="break-all">{detail.linkUrl}</dd></div>}</dl><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
