import React, { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes, type HTMLAttributes } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Padrão Oficial de Tabelas ERP Celeriflow
 * - Densidade de alta produtividade (linhas compactas h-[38px], fonte 11px)
 * - Cabeçalho fixo (sticky top-0) e linhas estabelecidas
 * - Viewport 100% contido (sem barra de rolagem lateral na tela)
 * - Cores e badges padronizados conforme design system ERP
 */

export function ErpTableContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-900", className)}>
      <table className="w-full table-fixed border-collapse text-left text-[11px] leading-tight">
        {children}
      </table>
    </div>
  );
}

export function ErpTableThead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-800/95 dark:text-slate-400",
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function ErpTableTh({
  children,
  sortable,
  sortDirection,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
}) {
  return (
    <th
      className={cn(
        "select-none px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400",
        sortable && "cursor-pointer hover:text-slate-800 dark:hover:text-slate-200",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1">
        <span className="truncate">{children}</span>
        {sortable && (
          <span className="shrink-0 text-slate-400">
            {sortDirection === "asc" ? (
              <ArrowUp className="size-3 text-slate-700 dark:text-slate-200" />
            ) : sortDirection === "desc" ? (
              <ArrowDown className="size-3 text-slate-700 dark:text-slate-200" />
            ) : (
              <ArrowUpDown className="size-3 opacity-60" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export function ErpTableTr({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "h-[38px] border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function ErpTableTd({
  children,
  className,
  title,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("truncate px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200", className)}
      title={typeof children === "string" ? title ?? children : title}
      {...props}
    >
      {children}
    </td>
  );
}

export type ErpStatusVariant = "success" | "warning" | "info" | "neutral" | "danger";

export function ErpStatusBadge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: ErpStatusVariant;
  className?: string;
}) {
  const variantClasses: Record<ErpStatusVariant, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    neutral: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold leading-none select-none",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ErpPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600 active:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
