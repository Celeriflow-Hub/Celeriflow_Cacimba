import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { EyeOff, MessageSquareWarning, Plus, Search } from "lucide-react";
import { canViewOmbudsmanIdentity, getOmbudsmanContextForProtocols, ombudsmanScope } from "@/lib/attendance/access";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type QueryValue = string | string[] | undefined;

type SearchParams = {
  q?: QueryValue;
  type?: QueryValue;
  status?: QueryValue;
  page?: QueryValue;
};

type ListingFilters = {
  q: string;
  type: string;
  status: string;
};

function valueOf(value: QueryValue) {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}
function listHref(filters: ListingFilters, page = 1) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? "/protocolos/ouvidoria?" + query : "/protocolos/ouvidoria";
}

export default async function OuvidoriaProtocolosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await getOmbudsmanContextForProtocols();
  const raw = await searchParams;
  const filters: ListingFilters = {
    q: valueOf(raw.q).slice(0, 120),
    type: valueOf(raw.type).slice(0, 80),
    status: valueOf(raw.status).slice(0, 80),
  };
  const requestedPage = Number.parseInt(valueOf(raw.page), 10);
  const conditions: Prisma.OmbudsmanWhereInput[] = [ombudsmanScope(context)];

  if (filters.type) conditions.push({ type: filters.type });
  if (filters.status) conditions.push({ status: filters.status });
  if (filters.q) {
    conditions.push({
      OR: [
        { protocolNumber: { contains: filters.q, mode: "insensitive" } },
        { subject: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.OmbudsmanWhereInput = { AND: conditions };
  const total = await context.prisma.ombudsman.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const manifestacoes = await context.prisma.ombudsman.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      protocolNumber: true,
      type: true,
      subject: true,
      isAnonymous: true,
      isConfidential: true,
      status: true,
      createdAt: true,
      person: { select: { fullName: true } },
      accessGrants: { where: { userId: context.user.id }, select: { canViewIdentity: true } },
    },
  });
  const safeManifestacoes = manifestacoes.map((manifestacao) => ({
    ...manifestacao,
    person: canViewOmbudsmanIdentity(context, manifestacao.isConfidential, manifestacao.accessGrants.some((grant) => grant.canViewIdentity))
      ? manifestacao.person
      : null,
  }));
  const canCreateOmbudsman = context.attendanceAccess.isOmbudsman && context.attendanceAccess.canCreate;
  const firstVisible = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(page * PAGE_SIZE, total);
  const returnTo = listHref(filters, page);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-2 lg:p-3">
      <ErpPageTitle
        title="Ouvidoria"
        description="Manifestações internas com acesso controlado aos dados de identidade."
        icon={<MessageSquareWarning className="size-5 shrink-0 text-amber-700" />}
        action={canCreateOmbudsman ? (
          <Link href="/protocolos/ouvidoria/nova" className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white outline-none hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
            <Plus className="size-3.5" />
            Nova manifestação
          </Link>
        ) : undefined}
      />

      <ErpListFrame
        toolbar={(
          <form action="/protocolos/ouvidoria" method="GET" className="flex flex-wrap items-end gap-x-2 gap-y-1.5">
            <label className="min-w-48 flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Busca
              <span className="relative mt-0.5 block">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input name="q" defaultValue={filters.q} placeholder="Protocolo ou assunto" className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-7 pr-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" />
              </span>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Tipo
              <select name="type" defaultValue={filters.type} className="mt-0.5 h-7 max-w-32 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                <option value="">Todos</option><option>Denúncia</option><option>Reclamação</option><option>Sugestão</option><option>Elogio</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Situação
              <select name="status" defaultValue={filters.status} className="mt-0.5 h-7 max-w-40 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                <option value="">Todas</option><option>Recebida</option><option>Em Triagem</option><option>Encaminhada</option><option>Em Apuração</option><option>Aguardando Resposta</option><option>Concluída</option>
              </select>
            </label>
            <button className="h-7 rounded bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700">Aplicar</button>
            <Link href="/protocolos/ouvidoria" className="inline-flex h-7 items-center justify-center px-1 text-xs font-semibold text-slate-600 hover:text-emerald-800">Limpar</Link>
          </form>
        )}
        summary={(
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span><strong className="text-slate-900">{total}</strong> manifestação(ões) no recorte autorizado{total ? " · exibindo " + firstVisible + "–" + lastVisible : ""}.</span>
            <span className="inline-flex items-center gap-1 text-amber-900"><EyeOff className="size-3 shrink-0" />Identidade e narrativa confidenciais só aparecem para pessoas autorizadas.</span>
          </div>
        )}
        pagination={<ErpPagination page={page} total={total} pageSize={PAGE_SIZE} previousHref={listHref(filters, page - 1)} nextHref={listHref(filters, page + 1)} label="manifestações" />}
      >
        {safeManifestacoes.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-slate-100"><MessageSquareWarning className="size-5 text-slate-400" /></div>
            <h2 className="text-sm font-bold text-slate-700">Nenhuma manifestação encontrada</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">Revise os filtros ou aguarde uma nova manifestação no recorte autorizado.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed border-collapse text-left text-[11px] leading-3">
                <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">
                  <tr className="h-7">
                    <th className="w-[17%] px-2 text-left">Protocolo</th>
                    <th className="w-[15%] px-2 text-left">Tipo</th>
                    <th className="px-2 text-left">Assunto</th>
                    <th className="hidden w-[17%] px-2 text-left 2xl:table-cell">Manifestante</th>
                    <th className="w-[18%] px-2 text-left">Situação</th>
                    <th className="w-[9%] px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeManifestacoes.map((item) => {
                    const identity = item.isAnonymous ? "Anônimo" : item.person?.fullName || "Identidade restrita";
                    return (
                      <tr key={item.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50">
                        <td className="truncate px-2 py-0 font-semibold text-slate-900" title={item.protocolNumber}>{item.protocolNumber}</td>
                        <td className="truncate px-2 py-0 text-slate-700" title={item.type}>{item.type}</td>
                        <td className="truncate px-2 py-0 font-medium text-slate-800" title={item.subject}>{item.subject}</td>
                        <td className="hidden truncate px-2 py-0 text-slate-600 2xl:table-cell" title={identity}>{identity}</td>
                        <td className="px-2 py-0"><span className="inline-flex max-w-full truncate rounded bg-amber-100 px-1.5 py-0 text-[10px] font-semibold leading-3 text-amber-800">{item.status}</span></td>
                        <td className="px-2 py-0 text-right"><Link href={"/protocolos/ouvidoria/" + item.id + "?returnTo=" + encodeURIComponent(returnTo)} className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900">Abrir</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {safeManifestacoes.map((item) => (
                <article key={item.id} className="space-y-1.5 p-3">
                  <div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-900">{item.protocolNumber}</span><span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{item.status}</span></div>
                  <p className="truncate text-xs font-medium text-slate-800">{item.subject}</p>
                  <p className="text-xs text-slate-600">{item.type} · {item.isAnonymous ? "Anônimo" : item.person?.fullName || "Identidade restrita"}</p>
                  <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span><Link href={"/protocolos/ouvidoria/" + item.id + "?returnTo=" + encodeURIComponent(returnTo)} className="font-semibold text-emerald-700">Abrir</Link></div>
                </article>
              ))}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
