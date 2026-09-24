import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ErpListFrameProps = {
  toolbar?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  className?: string;
};

export function ErpListFrame({ toolbar, summary, children, pagination, className }: ErpListFrameProps) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}>
      {toolbar && <div className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">{toolbar}</div>}
      {summary && <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900/50">{summary}</div>}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      {pagination && <div className="shrink-0 border-t border-slate-200/80 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">{pagination}</div>}
    </section>
  );
}
