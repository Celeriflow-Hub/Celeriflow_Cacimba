import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { getEmployeePortalAccess } from "@/lib/portal-servidor/access";
import { BriefcaseBusiness, Building2, FileText, UserRound } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = { page?: string | string[] };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function resolvePage(value: string | string[] | undefined, total: number) {
  const requested = Number.parseInt(firstValue(value), 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
}

function hrefFor(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/portal-servidor/ficha-funcional" + (query ? "?" + query : "");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
}

function PortalUnavailable() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <UserRound className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Ficha funcional indisponível</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Seu acesso ainda não está vinculado a um cadastro funcional ativo. Procure a área de gestão de pessoas.</p>
      </section>
    </div>
  );
}

export default async function FichaFuncionalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getEmployeePortalAccess();
  if (access.status !== "AVAILABLE") return <PortalUnavailable />;

  const { context, employee } = access;
  const [profile, totalActs] = await Promise.all([
    context.prisma.employee.findUnique({
      where: { id: employee.id },
      select: {
        name: true,
        registration: true,
        isActive: true,
        contractedHours: true,
        role: { select: { name: true } },
        department: { select: { name: true } },
        secretariat: { select: { name: true } },
      },
    }),
    context.prisma.personnelAct.count({ where: { employeeId: employee.id } }),
  ]);

  if (!profile) return <PortalUnavailable />;

  const page = resolvePage((await searchParams).page, totalActs);
  const acts = await context.prisma.personnelAct.findMany({
    where: { employeeId: employee.id },
    select: {
      id: true,
      type: true,
      actNumber: true,
      date: true,
      createdAt: true,
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const lotacao = profile.department?.name || profile.secretariat?.name || "Não informada";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Minha ficha funcional"
        description="Dados funcionais disponibilizados para consulta pessoal."
        icon={<UserRound className="size-5 shrink-0 text-emerald-700" />}
        action={<Link href="/portal-servidor/documentos" className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Documentos</Link>}
      />

      <section className="grid shrink-0 grid-cols-2 border border-slate-300 bg-white shadow-sm md:grid-cols-4" aria-label="Resumo funcional">
        <div className="min-w-0 border-b border-r border-slate-200 px-3 py-2 md:border-b-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Servidor</p>
          <p className="truncate text-xs font-semibold text-slate-900" title={profile.name}>{profile.name}</p>
        </div>
        <div className="min-w-0 border-b border-slate-200 px-3 py-2 md:border-b-0 md:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Matrícula</p>
          <p className="truncate text-xs font-semibold text-slate-800">{profile.registration || "Não informada"}</p>
        </div>
        <div className="min-w-0 border-r border-slate-200 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Cargo</p>
          <p className="truncate text-xs font-semibold text-slate-800" title={profile.role?.name || "Não informado"}>{profile.role?.name || "Não informado"}</p>
        </div>
        <div className="min-w-0 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Lotação</p>
          <p className="truncate text-xs font-semibold text-slate-800" title={lotacao}>{lotacao}</p>
        </div>
      </section>

      <section className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4" aria-label="Indicadores funcionais">
        <div className="flex min-h-[44px] items-center gap-2 border border-slate-300 bg-white px-3 py-1 shadow-sm">
          <UserRound className="size-4 shrink-0 text-emerald-700" />
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Situação</p><p className="truncate text-xs font-semibold text-slate-800">{profile.isActive ? "Ativo" : "Inativo"}</p></div>
        </div>
        <div className="flex min-h-[44px] items-center gap-2 border border-slate-300 bg-white px-3 py-1 shadow-sm">
          <BriefcaseBusiness className="size-4 shrink-0 text-emerald-700" />
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Jornada contratada</p><p className="truncate text-xs font-semibold text-slate-800">{profile.contractedHours} h/mês</p></div>
        </div>
        <div className="flex min-h-[44px] items-center gap-2 border border-slate-300 bg-white px-3 py-1 shadow-sm">
          <Building2 className="size-4 shrink-0 text-emerald-700" />
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Secretaria</p><p className="truncate text-xs font-semibold text-slate-800" title={profile.secretariat?.name || "Não informada"}>{profile.secretariat?.name || "Não informada"}</p></div>
        </div>
        <div className="flex min-h-[44px] items-center gap-2 border border-slate-300 bg-white px-3 py-1 shadow-sm">
          <FileText className="size-4 shrink-0 text-emerald-700" />
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Atos funcionais</p><p className="truncate text-xs font-semibold text-slate-800">{totalActs} registrado(s)</p></div>
        </div>
      </section>

      <ErpListFrame
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{totalActs}</strong> ato(s) funcional(is) disponibilizado(s)</p>}
        pagination={<ErpPagination page={page} total={totalActs} pageSize={PAGE_SIZE} label="atos funcionais" previousHref={hrefFor(Math.max(1, page - 1))} nextHref={hrefFor(page + 1)} />}
      >
        {acts.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center p-5 text-center">
            <FileText className="size-5 text-slate-400" />
            <p className="mt-2 text-xs font-semibold text-slate-700">Nenhum ato funcional disponibilizado</p>
            <p className="mt-1 text-[11px] text-slate-500">Os atos relacionados ao seu vínculo aparecerão nesta área.</p>
          </div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
                <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr><th className="w-[22%] px-3">Data</th><th className="w-[38%] px-3">Tipo de ato</th><th className="w-[25%] px-3">Número</th><th className="w-[15%] px-3 text-right">Registro</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acts.map((act) => <tr key={act.id} className="h-[clamp(17px,2.25vh,24px)] hover:bg-slate-50"><td className="px-3 py-0 whitespace-nowrap font-medium">{formatDate(act.date)}</td><td className="px-3 py-0"><span className="block truncate" title={act.type}>{act.type}</span></td><td className="px-3 py-0"><span className="block truncate">{act.actNumber || "Não informado"}</span></td><td className="px-3 py-0 text-right text-[10px] text-slate-500">{formatDate(act.createdAt)}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {acts.map((act) => <article key={act.id} className="space-y-1 p-3"><div className="flex items-start justify-between gap-3"><p className="min-w-0 truncate text-xs font-semibold text-slate-900">{act.type}</p><time className="shrink-0 text-[11px] text-slate-500">{formatDate(act.date)}</time></div><p className="text-[11px] text-slate-600">{act.actNumber || "Número não informado"}</p></article>)}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
