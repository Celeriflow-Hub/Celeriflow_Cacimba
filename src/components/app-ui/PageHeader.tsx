import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function PageHeader({ title, action, icon, className }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("page-header mb-2 flex min-h-9 flex-wrap items-center gap-2 border-b border-slate-300 bg-white px-2 py-1 shadow-sm sm:h-9 sm:flex-nowrap sm:justify-between sm:px-3 sm:py-0", className)}
    >
      <h1 className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
        {icon}
        <span className="truncate">{title}</span>
      </h1>
      {action && <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">{action}</div>}
    </header>
  );
}
