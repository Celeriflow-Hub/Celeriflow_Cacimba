"use client";

import { useState } from "react";
import { Download, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type EducationColumn = { key: string; label: string; responsive?: "sm" | "md" | "lg"; align?: "right" | "center"; width?: "narrow" | "medium" };
export type EducationRow = { id: string; cells: Record<string, string>; detail?: Record<string, string> };
type Props = {
  rows: EducationRow[];
  columns: EducationColumn[];
  searchPlaceholder: string;
  label: string;
  statusKey?: string;
  filterKey?: string;
  filterLabel?: string;
  actions?: boolean;
  detailTitleKey?: string;
};

const PAGE_SIZE = 20;
const responsiveClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

export function EducationListClient({ rows, columns, searchPlaceholder, label, statusKey, filterKey, filterLabel = "Todos", actions = false, detailTitleKey }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<EducationRow | null>(null);
  const values = filterKey ? Array.from(new Set(rows.map((row) => row.cells[filterKey]).filter(Boolean))).sort() : [];
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => (!term || Object.values(row.cells).some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!filterKey || !filter || row.cells[filterKey] === filter));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const actionColumn = actions || rows.some((row) => row.detail);
  const exportCsv = () => {
    const escape = (text: string) => `"${text.replaceAll('"', '""')}"`;
    const csv = [columns.map((column) => escape(column.label)).join(";"), ...filtered.map((row) => columns.map((column) => escape(row.cells[column.key] || "")).join(";"))].join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${label.replaceAll(" ", "-")}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <>
    <ErpListFrame toolbar={<div className="flex gap-2"><div className={filterKey ? "grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem]" : "flex min-w-0 flex-1"}><label className="relative w-full"><span className="sr-only">Buscar {label}</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-blue-600" /></label>{filterKey && <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">{filterLabel}</option>{values.map((value) => <option key={value}>{value}</option>)}</select>}</div><button type="button" onClick={exportCsv} className="inline-flex h-8 shrink-0 items-center gap-1 rounded border border-slate-200 px-2 text-xs font-semibold text-slate-700" title="Exportar resultado em CSV"><Download className="size-3.5"/><span className="hidden sm:inline">Exportar</span></button></div>} summary={<p className="text-[11px] text-slate-500">{filtered.length} {label} encontrados</p>} pagination={<ErpPagination page={activePage} total={filtered.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label={label} onPageChange={setPage} />}>
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr>{columns.map((column) => <th key={column.key} className={`${column.responsive ? responsiveClass[column.responsive] : ""} ${column.width === "narrow" ? "w-20" : column.width === "medium" ? "w-28" : ""} p-2 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""}`}>{column.label}</th>)}{actionColumn && <th className="w-20 p-2 text-right">Ações</th>}</tr></thead><tbody className="divide-y divide-slate-100">{visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50">{columns.map((column) => <td key={column.key} className={`${column.responsive ? responsiveClass[column.responsive] : ""} max-w-0 p-2 ${column.align === "right" ? "text-right tabular-nums" : column.align === "center" ? "text-center" : ""}`}>{column.key === statusKey ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">{row.cells[column.key]}</span> : <span className="block truncate" title={row.cells[column.key]}>{row.cells[column.key]}</span>}</td>)}{actionColumn && <td className="p-2 text-right">{row.detail && <Button variant="ghost" size="icon" className="size-7" onClick={() => setDetail(row)} title="Ver detalhes"><Eye className="size-3.5" /></Button>}{actions && <><button type="button" className="inline-flex size-7 items-center justify-center rounded text-blue-600 hover:bg-blue-50" title="Editar"><Pencil className="size-3.5" /></button><button type="button" className="inline-flex size-7 items-center justify-center rounded text-red-600 hover:bg-red-50" title="Inativar"><Trash2 className="size-3.5" /></button></>}</td>}</tr>)}{visible.length === 0 && <tr><td colSpan={columns.length + (actionColumn ? 1 : 0)} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>}</tbody></table>
    </ErpListFrame>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>{detail ? detail.cells[detailTitleKey || columns[0].key] : "Detalhes"}</DialogTitle><DialogDescription>Informações completas do registro</DialogDescription></DialogHeader><dl className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">{Object.entries(detail?.detail || {}).map(([key, value]) => <div key={key} className={value.length > 100 ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold text-slate-500">{key}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-800">{value}</dd></div>)}</dl><DialogFooter><Button onClick={() => setDetail(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
