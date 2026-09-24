import Link from "next/link";
import { Search } from "lucide-react";

export function RhSearchToolbar({ pathname, query, placeholder }: { pathname: string; query: string; placeholder: string }) {
  return (
    <form action={pathname} method="GET" className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 flex-1 sm:max-w-xl">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        <input name="q" defaultValue={query} placeholder={placeholder} className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
      </label>
      <button type="submit" className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-700">Filtrar</button>
      <Link href={pathname} className="inline-flex h-8 items-center rounded-md border border-slate-200 px-2.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Limpar</Link>
    </form>
  );
}
