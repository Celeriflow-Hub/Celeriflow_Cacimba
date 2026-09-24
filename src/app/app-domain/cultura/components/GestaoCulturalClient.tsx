"use client";

import { useDeferredValue, useState } from "react";
import { Eye, Landmark, MapPin, Search, Users } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type RecordKind = "Agente" | "Espaço" | "Patrimônio";
export type CulturalRecord = { id: string; kind: RecordKind; name: string; classification: string; status: string; active: boolean; references: { label: string; value: string }[] };
const PAGE_SIZE = 20;

function KindIcon({ kind }: { kind: RecordKind }) {
  if (kind === "Agente") return <Users className="size-3.5" />;
  if (kind === "Espaço") return <MapPin className="size-3.5" />;
  return <Landmark className="size-3.5" />;
}

export function GestaoCulturalClient({ records }: { records: CulturalRecord[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<RecordKind | "Todos">("Todos");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<CulturalRecord | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("pt-BR"));
  const filtered = records.filter((record) => {
    const text = [record.name, record.classification, record.status, ...record.references.map((reference) => reference.value)].join(" ").toLocaleLowerCase("pt-BR");
    return (kind === "Todos" || record.kind === kind) && (!deferredSearch || text.includes(deferredSearch));
  });
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem]"><label className="relative"><span className="sr-only">Buscar registros culturais</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar nome, referência ou status..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-pink-600" /></label><select value={kind} onChange={(event) => { setKind(event.target.value as RecordKind | "Todos"); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option>Todos</option><option>Agente</option><option>Espaço</option><option>Patrimônio</option></select></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} registros culturais encontrados</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="registros" onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Identificação</th><th className="p-2">Categoria</th><th className="hidden p-2 md:table-cell">Classificação</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((record) => <tr key={record.kind + record.id} className="h-9 hover:bg-slate-50"><td className="truncate p-2 font-semibold text-slate-900" title={record.name}>{record.name}</td><td className="p-2"><span className="inline-flex items-center gap-1"><KindIcon kind={record.kind} />{record.kind}</span></td><td className="hidden truncate p-2 md:table-cell" title={record.classification}>{record.classification}</td><td className="p-2"><span className={record.active ? "rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700" : "rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"}>{record.status}</span></td><td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(record)} title="Ver detalhes"><Eye className="size-3.5" /></Button></td></tr>)}{visible.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>{detail?.name}</DialogTitle><DialogDescription>{detail?.kind} · {detail?.classification}</DialogDescription></DialogHeader><dl className="space-y-3">{detail?.references.map((reference) => <div key={reference.label}><dt className="text-xs font-semibold text-slate-500">{reference.label}</dt><dd className="mt-0.5 break-words text-sm text-slate-700">{reference.value}</dd></div>)}</dl><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
