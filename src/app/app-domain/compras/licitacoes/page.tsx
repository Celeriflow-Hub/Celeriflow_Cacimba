import Link from "next/link";
import { ChevronLeft, ChevronRight, Gavel, Plus, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { biddingStatusLabel } from "@/lib/compras/bidding-workflow";
import { LicitacaoRowActions } from "./LicitacaoRowActions";
import { DispensaRowActions } from "../dispensas/DispensaRowActions";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

type SearchValues = { q?: string | string[]; type?: string | string[]; status?: string | string[]; page?: string | string[] };

type BiddingRow = {
  kind: "BIDDING";
  id: string;
  number: string;
  modality: string;
  status: string;
  sessionDate: Date | null;
  createdAt: Date;
  processNumber: string;
  object: string;
};

type DirectContractingRow = {
  kind: "DIRECT";
  id: string;
  number: string;
  modality: string;
  status: string;
  sessionDate: null;
  createdAt: Date;
  processNumber: string;
  object: string;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function LicitacoesPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const context = await getTenantContextForModule("COMPRAS");
  const filters = await searchParams;
  const query = valueOf(filters.q).trim().toLocaleLowerCase("pt-BR");
  const typeFilter = valueOf(filters.type).trim();
  const statusFilter = valueOf(filters.status).trim();
  const requestedPage = Number(valueOf(filters.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [biddings, directContractings] = await Promise.all([
    context.prisma.bidding.findMany({
      include: { process: { select: { number: true, object: true } } },
      orderBy: { createdAt: "desc" },
    }),
    context.prisma.directContracting.findMany({
      include: { process: { select: { number: true, object: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const rows: Array<BiddingRow | DirectContractingRow> = [
    ...biddings.map((bidding) => ({
      kind: "BIDDING" as const,
      id: bidding.id,
      number: bidding.number,
      modality: bidding.modality,
      status: bidding.status,
      sessionDate: bidding.sessionDate,
      createdAt: bidding.createdAt,
      processNumber: bidding.process.number,
      object: bidding.process.object,
    })),
    ...directContractings.map((contracting) => ({
      kind: "DIRECT" as const,
      id: contracting.id,
      number: "Contratação direta",
      modality: contracting.type,
      status: contracting.status,
      sessionDate: null,
      createdAt: contracting.createdAt,
      processNumber: contracting.process.number,
      object: contracting.process.object,
    })),
  ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  const statuses = [...new Set(rows.map((row) => row.status))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const filteredRows = rows.filter((row) => {
    const matchesType = !typeFilter || row.kind === typeFilter;
    const matchesStatus = !statusFilter || row.status === statusFilter;
    const haystack = [row.number, row.processNumber, row.modality, row.object].join(" ").toLocaleLowerCase("pt-BR");
    return matchesType && matchesStatus && (!query || haystack.includes(query));
  });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize);
  const linkForPage = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (nextPage > 1) params.set("page", String(nextPage));
    const serialized = params.toString();
    return `/compras/licitacoes${serialized ? `?${serialized}` : ""}`;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <div className="flex shrink-0 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-600 text-white"><Gavel className="size-4" /></div><div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">Licitações e dispensas</h1><p className="truncate text-xs text-slate-500">Certames e contratações diretas do módulo de compras</p></div></div><div className="flex shrink-0 items-center gap-2"><Link href="/compras/dispensas/novo" className={buttonVariants({ variant: "outline", size: "sm" })}><Plus className="size-3.5" /><span className="hidden sm:inline">Nova dispensa</span></Link><Link href="/compras/licitacoes/novo" className={buttonVariants({ size: "sm" })}><Plus className="size-3.5" /><span className="hidden sm:inline">Nova licitação</span></Link></div></div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2.5 dark:border-slate-800"><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:max-w-3xl"><label className="relative min-w-44 flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={query} placeholder="Buscar número, processo, modalidade ou objeto" className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-2 text-xs outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-slate-700 dark:bg-slate-950" /></label><select name="type" defaultValue={typeFilter} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Todos os tipos</option><option value="BIDDING">Licitações</option><option value="DIRECT">Dispensas e inexigibilidades</option></select><select name="status" defaultValue={statusFilter} className="h-9 max-w-44 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Todas as situações</option>{statuses.map((status) => <option key={status} value={status}>{biddingStatusLabel(status)}</option>)}</select><button type="submit" className="inline-flex h-9 items-center rounded-md bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">Filtrar</button></div><span className="text-xs text-slate-500">{filteredRows.length} registro(s)</span></form>
        <div className="flex-1 overflow-auto"><table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="px-3 py-2.5">Certame / processo</th><th className="px-3 py-2.5">Modalidade</th><th className="hidden px-3 py-2.5 md:table-cell">Objeto</th><th className="hidden px-3 py-2.5 lg:table-cell">Sessão / prazo</th><th className="px-3 py-2.5">Situação</th><th className="px-3 py-2.5 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visibleRows.map((row) => <tr key={`${row.kind}-${row.id}`} className="h-[38px] hover:bg-slate-50/80 dark:hover:bg-slate-800/60"><td className="px-3 py-2.5"><p className="truncate font-semibold text-slate-900 dark:text-white" title={`${row.number} · Proc. ${row.processNumber}`}>{row.number} · {row.processNumber}</p></td><td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{row.modality}</td><td className="hidden max-w-[420px] px-3 py-2.5 md:table-cell"><p className="truncate text-slate-600 dark:text-slate-300" title={row.object}>{row.object}</p></td><td className="hidden px-3 py-2.5 text-slate-600 dark:text-slate-300 lg:table-cell">{row.sessionDate ? dateTime.format(row.sessionDate) : "Sem sessão"}</td><td className="px-3 py-2.5"><span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{row.kind === "BIDDING" ? biddingStatusLabel(row.status) : row.status}</span></td><td className="px-3 py-2.5 text-right">{row.kind === "BIDDING" ? <LicitacaoRowActions id={row.id} /> : <DispensaRowActions id={row.id} />}</td></tr>)}{!visibleRows.length ? <tr><td colSpan={6} className="px-3 py-12 text-center text-sm text-slate-500">Nenhum certame corresponde aos filtros selecionados.</td></tr> : null}</tbody></table></div>
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800"><span>Exibindo {visibleRows.length} de {filteredRows.length}</span><div className="flex items-center gap-2"><span>Página {activePage} de {pageCount}</span><Link aria-disabled={activePage <= 1} href={linkForPage(Math.max(1, activePage - 1))} className={`inline-flex size-7 items-center justify-center rounded border ${activePage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}><ChevronLeft className="size-3.5" /></Link><Link aria-disabled={activePage >= pageCount} href={linkForPage(Math.min(pageCount, activePage + 1))} className={`inline-flex size-7 items-center justify-center rounded border ${activePage >= pageCount ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}><ChevronRight className="size-3.5" /></Link></div></div>
      </div>
    </div>
  );
}
