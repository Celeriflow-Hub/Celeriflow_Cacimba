"use client";

import Link from "next/link";
import { Database, ShieldCheck, ArrowRight } from "lucide-react";

export default function PocHeaderBanner() {
  return (
    <div className="flex w-full items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400 sm:text-[11px]">
          Ambiente de demonstração
        </span>
        <span className="hidden md:inline text-slate-400">|</span>
        <span className="hidden truncate text-slate-400 md:inline">
          Lançamentos reais no CeleriFlow e integração exclusiva com o Banco Virtual Robonuvem
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sandbox de Notificação Ativo</span>
        </div>
        <Link
          href="/administracao/poc-control"
          className="hidden items-center gap-1 rounded border border-indigo-400/30 bg-indigo-600/30 px-2 py-0.5 text-[11px] font-semibold text-indigo-200 transition-colors hover:bg-indigo-600/50 hover:text-white sm:flex"
        >
          <Database className="w-3 h-3 text-indigo-400" />
          <span>Painel POC & Reset Base</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}
