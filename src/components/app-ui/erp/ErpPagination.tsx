"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ErpPaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  previousHref: string;
  nextHref: string;
  label?: string;
  jumpTo?: {
    pathname: string;
    values?: Record<string, string | undefined>;
  };
  onPageChange?: (page: number) => void;
};

export function ErpPagination({
  page,
  total,
  pageSize = 20,
  previousHref,
  nextHref,
  label = "registros",
  jumpTo,
  onPageChange,
}: ErpPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const previousDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav aria-label={"Paginação de " + label} className="flex min-h-7 items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="tabular-nums font-medium text-slate-500 dark:text-slate-400">
        {total ? `${total} ${label}` : `0 ${label}`}
      </span>
      <div className="flex items-center gap-1.5">
        {onPageChange ? (
          <button
            type="button"
            disabled={previousDisabled}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-medium transition-colors",
              previousDisabled
                ? "cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
            )}
          >
            <ChevronLeft className="size-3.5" />
            <span>Anterior</span>
          </button>
        ) : <Link
          aria-disabled={previousDisabled}
          href={previousHref}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-medium transition-colors",
            previousDisabled
              ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
          )}
        >
          <ChevronLeft className="size-3.5" />
          <span>Anterior</span>
        </Link>}
        <span className="whitespace-nowrap px-1 text-[11px] font-medium text-slate-600 tabular-nums dark:text-slate-300">
          {page} de {totalPages}
        </span>
        {jumpTo && totalPages > 1 && (
          <form method="get" action={jumpTo.pathname} className="flex items-center gap-1">
            {Object.entries(jumpTo.values || {}).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
            <label className="sr-only" htmlFor={`jump-page-${label}`}>Ir para página</label>
            <input id={`jump-page-${label}`} type="number" name="page" min={1} max={totalPages} defaultValue={page} aria-label="Ir para página" className="h-7 w-12 rounded border border-slate-200 bg-white px-1 text-center text-[11px] text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            <button type="submit" className="h-7 rounded border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Ir</button>
          </form>
        )}
        {onPageChange ? (
          <button
            type="button"
            disabled={nextDisabled}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-medium transition-colors",
              nextDisabled
                ? "cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
            )}
          >
            <span>Próxima</span>
            <ChevronRight className="size-3.5" />
          </button>
        ) : <Link
          aria-disabled={nextDisabled}
          href={nextHref}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-medium transition-colors",
            nextDisabled
              ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
          )}
        >
          <span>Próxima</span>
          <ChevronRight className="size-3.5" />
        </Link>}
      </div>
    </nav>
  );
}
