"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

type Column = { key: string; label: string; responsive?: "sm" | "md" | "lg"; align?: "right" | "center"; width?: "narrow" | "medium" };
type Row = { id: string; cells: Record<string, string> };
type ServerPagination = { page: number; total: number; pathname: string; search?: string; filter?: string; filterOptions?: string[]; extra?: Record<string, string | undefined> };
type Props = { rows: Row[]; columns: Column[]; label: string; searchPlaceholder: string; filterKey?: string; filterLabel?: string; serverPagination?: ServerPagination };

const PAGE_SIZE = 20;
const responsiveClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

export function HealthSimpleListClient({ rows, columns, label, searchPlaceholder, filterKey, filterLabel = "Todos", serverPagination }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const values = serverPagination?.filterOptions || (filterKey ? [...new Set(rows.map((row) => row.cells[filterKey]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")) : []);
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = serverPagination ? rows : rows.filter((row) => (!term || Object.values(row.cells).some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) && (!filterKey || !filter || row.cells[filterKey] === filter));
  const activePage = serverPagination?.page || Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = serverPagination ? rows : filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const total = serverPagination?.total ?? filtered.length;
  const href = (targetPage: number) => {
    if (!serverPagination) return "#";
    const query = new URLSearchParams({ page: String(targetPage) });
    if (serverPagination.search) query.set("q", serverPagination.search);
    if (serverPagination.filter) query.set("filter", serverPagination.filter);
    for (const [key, value] of Object.entries(serverPagination.extra || {})) {
      if (value) query.set(key, value);
    }
    return `${serverPagination.pathname}?${query}`;
  };

  return (
    <ErpListFrame
      toolbar={serverPagination ? <form method="get" action={serverPagination.pathname} className={filterKey ? "grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem_auto]" : "flex gap-2"}><label className="relative w-full"><span className="sr-only">Buscar {label}</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" name="q" defaultValue={serverPagination.search} placeholder={searchPlaceholder} className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600" /></label>{filterKey && <select name="filter" defaultValue={serverPagination.filter} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">{filterLabel}</option>{values.map((value) => <option key={value}>{value}</option>)}</select>}<button className="h-8 rounded bg-slate-800 px-3 text-xs font-semibold text-white">Buscar</button></form> : <div className={filterKey ? "grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_11rem]" : "flex"}><label className="relative w-full"><span className="sr-only">Buscar {label}</span><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="h-8 w-full rounded border border-slate-200 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600" /></label>{filterKey && <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="h-8 rounded border border-slate-200 px-2 text-xs"><option value="">{filterLabel}</option>{values.map((value) => <option key={value}>{value}</option>)}</select>}</div>}
      summary={<p className="text-[11px] text-slate-500">{total} {label} encontrados</p>}
      pagination={<ErpPagination page={activePage} total={total} pageSize={PAGE_SIZE} previousHref={href(Math.max(1, activePage - 1))} nextHref={href(activePage + 1)} label={label} {...(serverPagination ? { jumpTo: { pathname: serverPagination.pathname, values: { q: serverPagination.search, filter: serverPagination.filter, ...(serverPagination.extra || {}) } } } : { onPageChange: setPage })} />}
    >
      <table className="w-full table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr>{columns.map((column) => <th key={column.key} className={`${column.responsive ? responsiveClass[column.responsive] : ""} ${column.width === "narrow" ? "w-20" : column.width === "medium" ? "w-28" : ""} p-2 ${column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""}`}>{column.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visible.map((row) => <tr key={row.id} className="h-9 hover:bg-slate-50">{columns.map((column) => <td key={column.key} className={`${column.responsive ? responsiveClass[column.responsive] : ""} max-w-0 p-2 ${column.align === "right" ? "text-right tabular-nums" : column.align === "center" ? "text-center" : ""}`}><span className="block truncate" title={row.cells[column.key]}>{row.cells[column.key]}</span></td>)}</tr>)}{visible.length === 0 && <tr><td colSpan={columns.length} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>}</tbody></table>
    </ErpListFrame>
  );
}
