import Link from "next/link";
import { ChevronLeft, ChevronRight, Gavel, LogIn, Search } from "lucide-react";
import { getCurrentTenantContext } from "@/lib/platform/tenant-context";
import { biddingStatusLabel } from "@/lib/compras/bidding-workflow";

export const dynamic = "force-dynamic";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

type SearchValues = { q?: string | string[]; status?: string | string[]; page?: string | string[] };

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function supplierName(supplier: {
  company: { corporateName: string; tradeName: string | null } | null;
  person: { fullName: string } | null;
}) {
  return supplier.company?.tradeName || supplier.company?.corporateName || supplier.person?.fullName || "Fornecedor";
}

function PortalUnavailable() {
  return <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl items-center px-4 py-8"><section className="w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"><div className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-800"><LogIn className="size-5" /></div><h1 className="mt-4 text-lg font-semibold text-slate-900">Portal do fornecedor</h1><p className="mt-2 text-sm leading-6 text-slate-600">Entre com uma conta vinculada a um fornecedor participante para visualizar suas licitações.</p><Link href="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Entrar</Link></section></main>;
}

async function loadPortalData(searchValues: SearchValues) {
  try {
    const context = await getCurrentTenantContext();
    const query = valueOf(searchValues.q).trim().toLocaleLowerCase("pt-BR");
    const statusFilter = valueOf(searchValues.status).trim();
    const requestedPage = Number(valueOf(searchValues.page));
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const identities = await context.prisma.supplierPortalIdentity.findMany({
      where: {
        usuarioId: context.user.id,
        status: "Ativo",
        supplier: { is: { status: "Ativo" } },
      },
      select: { supplierId: true },
    });
    const participations = await context.prisma.biddingParticipant.findMany({
      where: { supplierId: { in: identities.map((identity) => identity.supplierId) } },
      orderBy: { registeredAt: "desc" },
      include: {
        supplier: {
          select: {
            company: { select: { corporateName: true, tradeName: true } },
            person: { select: { fullName: true } },
          },
        },
        bidding: {
          include: {
            process: { select: { number: true, object: true } },
            _count: { select: { biddingLots: true } },
          },
        },
      },
    });
    const statuses = [...new Set(participations.map((participant) => participant.bidding.status))].sort((left, right) => left.localeCompare(right, "pt-BR"));
    const filtered = participations.filter((participant) => {
      const matchesStatus = !statusFilter || participant.bidding.status === statusFilter;
      const haystack = [
        participant.bidding.number,
        participant.bidding.process.number,
        participant.bidding.process.object,
        supplierName(participant.supplier),
        participant.displayCode || "",
      ].join(" ").toLocaleLowerCase("pt-BR");
      return matchesStatus && (!query || haystack.includes(query));
    });
    const pageSize = 20;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const activePage = Math.min(page, pageCount);
    return {
      query,
      statusFilter,
      statuses,
      filtered,
      items: filtered.slice((activePage - 1) * pageSize, activePage * pageSize),
      activePage,
      pageCount,
    };
  } catch {
    return null;
  }
}

function portalPageHref(query: string, statusFilter: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (statusFilter) params.set("status", statusFilter);
  if (page > 1) params.set("page", String(page));
  const serialized = params.toString();
  return `/compras/licitacoes/portal${serialized ? `?${serialized}` : ""}`;
}

export default async function SupplierBiddingPortalListPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const portal = await loadPortalData(await searchParams);
  if (!portal) return <PortalUnavailable />;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2 overflow-hidden bg-slate-50 p-3 dark:bg-slate-950">
      <div className="flex shrink-0 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white"><Gavel className="size-4" /></div><div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">Portal do fornecedor</h1><p className="truncate text-xs text-slate-500">Participações e lances vinculados à sua conta autenticada</p></div></div><Link href="/login" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><LogIn className="size-3.5" /><span className="hidden sm:inline">Trocar conta</span></Link></div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2.5 dark:border-slate-800"><div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xl"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={portal.query} placeholder="Buscar licitação, processo ou fornecedor" className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-2 text-xs outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950" /></label><select name="status" defaultValue={portal.statusFilter} className="h-9 max-w-40 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Todas as situações</option>{portal.statuses.map((status) => <option key={status} value={status}>{biddingStatusLabel(status)}</option>)}</select><button type="submit" className="inline-flex h-9 items-center rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800">Filtrar</button></div></form>
        <div className="flex-1 overflow-auto"><table className="w-full table-fixed border-collapse text-left text-[11px] sm:text-xs"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><tr><th className="px-3 py-2.5">Licitação</th><th className="px-3 py-2.5">Fornecedor</th><th className="hidden px-3 py-2.5 sm:table-cell">Objeto</th><th className="hidden px-3 py-2.5 md:table-cell">Prazo</th><th className="px-3 py-2.5">Situação</th><th className="px-3 py-2.5 text-right">Acesso</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{portal.items.map((participant) => <tr key={participant.id} className="h-[38px] hover:bg-slate-50/80 dark:hover:bg-slate-800/60"><td className="px-3 py-2.5"><p className="truncate font-semibold text-slate-900 dark:text-white" title={`${participant.bidding.number} · Proc. ${participant.bidding.process.number}`}>{participant.bidding.number} · {participant.bidding.process.number}</p></td><td className="px-3 py-2.5"><p className="truncate font-medium text-slate-800 dark:text-slate-100" title={`${supplierName(participant.supplier)} · ${participant.displayCode || "Participante credenciado"}`}>{supplierName(participant.supplier)}</p></td><td className="hidden max-w-96 px-3 py-2.5 sm:table-cell"><p className="truncate text-slate-600 dark:text-slate-300" title={`${participant.bidding.process.object} · ${participant.bidding._count.biddingLots} lote(s)`}>{participant.bidding.process.object}</p></td><td className="hidden px-3 py-2.5 text-slate-600 dark:text-slate-300 md:table-cell">{participant.bidding.sessionDate ? dateTime.format(participant.bidding.sessionDate) : "Não definido"}</td><td className="px-3 py-2.5"><span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{biddingStatusLabel(participant.bidding.status)}</span></td><td className="px-3 py-2.5 text-right"><Link href={`/compras/licitacoes/portal/${participant.id}`} className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-100">Acessar</Link></td></tr>)}{!portal.items.length ? <tr><td colSpan={6} className="px-3 py-12 text-center text-sm text-slate-500">Nenhuma participação foi encontrada para esta conta.</td></tr> : null}</tbody></table></div>
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800"><span>{portal.filtered.length} registro(s)</span><div className="flex items-center gap-2"><span>Página {portal.activePage} de {portal.pageCount}</span><Link aria-disabled={portal.activePage <= 1} href={portalPageHref(portal.query, portal.statusFilter, Math.max(1, portal.activePage - 1))} className={`inline-flex size-7 items-center justify-center rounded border ${portal.activePage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}><ChevronLeft className="size-3.5" /></Link><Link aria-disabled={portal.activePage >= portal.pageCount} href={portalPageHref(portal.query, portal.statusFilter, Math.min(portal.pageCount, portal.activePage + 1))} className={`inline-flex size-7 items-center justify-center rounded border ${portal.activePage >= portal.pageCount ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}><ChevronRight className="size-3.5" /></Link></div></div>
      </div>
    </div>
  );
}
