import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ErpPageTitleProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function ErpPageTitle({ title, description, action, icon, className }: ErpPageTitleProps) {
  return (
    <header className={cn("flex min-h-8 shrink-0 flex-wrap items-center justify-between gap-2 px-1 py-0.5", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <h1 className="truncate text-[18px] font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        {description && <span className="hidden text-[11px] text-slate-400 xl:inline">· {description}</span>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
