"use client";

import { useState } from "react";
import { Eye, Search, ShieldAlert } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type AttendanceRow = {
  id: string;
  date: string;
  familyName: string;
  personName: string | null;
  type: string;
  unitName: string;
  professionalName: string | null;
  description: string;
  secrecyLevel: string;
};

const PAGE_SIZE = 20;

export function AtendimentosClient({ rows }: { rows: AttendanceRow[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AttendanceRow | null>(null);
  const types = Array.from(new Set(rows.map((row) => row.type))).sort();
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) =>
    (!term || [row.familyName, row.personName, row.type, row.unitName, row.professionalName].some((value) => value?.toLocaleLowerCase("pt-BR").includes(term)))
    && (!type || row.type === type)
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return <>
    <ErpListFrame
      toolbar={<div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_12rem]">
        <label className="relative"><span className="sr-only">Buscar atendimentos</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar família, unidade ou técnico..." className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600" /></label>
        <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">Todos os tipos</option>{types.map((value) => <option key={value}>{value}</option>)}</select>
      </div>}
      summary={<p className="text-[11px] text-slate-500">{filtered.length} atendimentos encontrados</p>}
      pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="atendimentos" onPageChange={setPage} />}
    >
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">Data</th><th className="p-2">Usuário/família</th><th className="p-2">Tipo</th><th className="hidden p-2 md:table-cell">Unidade</th><th className="hidden p-2 lg:table-cell">Técnico</th><th className="p-2">Situação</th><th className="p-2 text-right">Ações</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50">
            <td className="whitespace-nowrap p-2">{new Date(row.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
            <td className="truncate p-2 font-medium text-slate-800" title={row.personName || row.familyName}>{row.personName || row.familyName}</td>
            <td className="truncate p-2" title={row.type}>{row.type}</td>
            <td className="hidden truncate p-2 md:table-cell" title={row.unitName}>{row.unitName}</td>
            <td className="hidden truncate p-2 lg:table-cell" title={row.professionalName || undefined}>{row.professionalName || "-"}</td>
            <td className="p-2"><span className={row.secrecyLevel === "Normal" ? "rounded bg-slate-100 px-1.5 py-0.5 text-[10px]" : "inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700"}>{row.secrecyLevel !== "Normal" && <ShieldAlert className="size-3" />}{row.secrecyLevel}</span></td>
            <td className="p-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Abrir detalhes"><Eye className="size-3.5" /></Button></td>
          </tr>)}
          {visible.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhum atendimento encontrado.</td></tr>}
        </tbody>
      </table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
      <DialogContent><DialogHeader><DialogTitle>{detail?.type}</DialogTitle><DialogDescription>{detail?.familyName} · {detail?.unitName}</DialogDescription></DialogHeader><div className="whitespace-pre-wrap break-words text-sm text-slate-700">{detail?.description || "Sem relato."}</div><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent>
    </Dialog>
  </>;
}

