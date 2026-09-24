import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RH_PAGE_SIZE, rhPageHref } from "@/lib/rh/list-pagination";

export function RhPagination({ total, page, pages, pathname, filters = {} }: {
  total: number;
  page: number;
  pages: number;
  pathname: string;
  filters?: Record<string, string | undefined>;
}) {
  const controlClass = "inline-flex size-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:hover:bg-slate-800";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span aria-live="polite">{total} registros{total > 0 && ` · ${(page - 1) * RH_PAGE_SIZE + 1}–${Math.min(page * RH_PAGE_SIZE, total)}`}</span>
      <nav aria-label="Paginação" className="flex items-center gap-2">
        {page > 1 ? <Link aria-label="Página anterior" scroll={false} href={rhPageHref(pathname, filters, page - 1)} className={controlClass}><ChevronLeft className="size-4" /></Link> : <button type="button" disabled aria-label="Página anterior" className={`${controlClass} opacity-40`}><ChevronLeft className="size-4" /></button>}
        <span>Página {page} de {pages}</span>
        {page < pages ? <Link aria-label="Próxima página" scroll={false} href={rhPageHref(pathname, filters, page + 1)} className={controlClass}><ChevronRight className="size-4" /></Link> : <button type="button" disabled aria-label="Próxima página" className={`${controlClass} opacity-40`}><ChevronRight className="size-4" /></button>}
      </nav>
    </div>
  );
}
