"use client";

import { useDeferredValue, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type PriceResearchItemRow = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
};

type CompactItemsTableProps = {
  items: PriceResearchItemRow[];
  title: string;
  description?: string;
  className?: string;
  printAll?: boolean;
};

const pageSize = 8;
const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export function CompactItemsTable({ items, title, description, className, printAll = false }: CompactItemsTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredItems = items.filter((item) => !normalizedQuery || `${item.name} ${item.unit}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm print:h-auto print:overflow-visible print:border-0 print:shadow-none", className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white p-2.5 print:hidden">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p> : null}
        </div>
        <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar item</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Buscar item ou unidade"
            className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto print:hidden">
        {!visibleItems.length ? (
          <div className="flex h-full min-h-28 items-center justify-center p-4 text-center text-xs text-slate-500">Nenhum item encontrado.</div>
        ) : (
          <>
            <div className="space-y-2 p-2 sm:hidden">
              {visibleItems.map((item) => (
                <article key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600">
                    <span>{item.unit}</span>
                    <span className="font-semibold tabular-nums">{quantity.format(item.quantity)}</span>
                  </div>
                </article>
              ))}
            </div>
            <table className="hidden min-w-[480px] w-full border-collapse text-left text-[11px] sm:table">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="w-32 px-3 py-2">Unidade</th>
                  <th className="w-32 px-3 py-2 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleItems.map((item) => (
                  <tr key={item.id} className="h-9 hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-medium text-slate-800">{item.name}</td>
                    <td className="px-3 py-1.5 text-slate-600">{item.unit}</td>
                    <td className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-800">{quantity.format(item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 print:hidden">
        <span className="tabular-nums">{filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
          <span className="min-w-14 text-center text-[11px] font-medium tabular-nums text-slate-600">{currentPage} de {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex h-7 items-center rounded border border-slate-200 px-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-3.5" /></button>
        </div>
      </footer>

      {printAll ? (
        <div className="hidden print:block">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-300 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              <tr><th className="px-2 py-1.5">Item</th><th className="px-2 py-1.5">Unidade</th><th className="px-2 py-1.5 text-right">Quantidade</th></tr>
            </thead>
            <tbody>
              {items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="px-2 py-1.5">{item.name}</td><td className="px-2 py-1.5">{item.unit}</td><td className="px-2 py-1.5 text-right tabular-nums">{quantity.format(item.quantity)}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
