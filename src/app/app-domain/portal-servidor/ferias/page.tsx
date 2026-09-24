import type { ReactNode } from "react";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { getEmployeePortalAccess } from "@/lib/portal-servidor/access";
import type { Prisma } from "@prisma/client";
import { CalendarDays, FileClock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const vacationStatuses = ["A vencer", "Disponível", "Programada", "Em gozo", "Concluída"] as const;
const leaveStatuses = ["Ativa", "Concluída", "Cancelada"] as const;

type PortalView = "ferias" | "afastamentos";
type SearchParams = {
  view?: string | string[];
  status?: string | string[];
  page?: string | string[];
};
type VacationRecord = {
  id: string;
  acquisitionStart: Date;
  acquisitionEnd: Date;
  enjoymentStart: Date | null;
  enjoymentEnd: Date | null;
  days: number;
  status: string;
};
type LeaveRecord = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseView(value: string | string[] | undefined): PortalView {
  return firstValue(value) === "afastamentos" ? "afastamentos" : "ferias";
}

function parseStatus(value: string | string[] | undefined, view: PortalView) {
  const status = firstValue(value);
  const allowed = view === "ferias" ? vacationStatuses : leaveStatuses;
  return allowed.includes(status as never) ? status : "";
}

function resolvePage(value: string | string[] | undefined, total: number) {
  const requested = Number.parseInt(firstValue(value), 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
}

function hrefFor(view: PortalView, page: number, status = "") {
  const params = new URLSearchParams();
  if (view === "afastamentos") params.set("view", view);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/portal-servidor/ferias" + (query ? "?" + query : "");
}

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value) : "A definir";
}

function statusClass(status: string) {
  if (["Concluída", "Concluida"].includes(status)) return "bg-emerald-100 text-emerald-800";
  if (status === "Ativa" || status === "Em gozo") return "bg-blue-100 text-blue-800";
  if (status === "Cancelada") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function PortalUnavailable() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <CalendarDays className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Consulta indisponível</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Seu acesso ainda não está vinculado a um cadastro funcional ativo.</p>
      </section>
    </div>
  );
}

function PortalListLayout({
  view,
  status,
  total,
  page,
  children,
}: {
  view: PortalView;
  status: string;
  total: number;
  page: number;
  children: ReactNode;
}) {
  const isVacationView = view === "ferias";
  const statuses = isVacationView ? vacationStatuses : leaveStatuses;
  const label = isVacationView ? "férias" : "afastamentos";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Férias e afastamentos"
        description="Histórico funcional disponibilizado para sua consulta pessoal."
        icon={<CalendarDays className="size-5 shrink-0 text-emerald-700" />}
        action={<Link href="/portal-servidor/ponto" className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Meu ponto</Link>}
      />

      <ErpListFrame
        toolbar={
          <div className="grid gap-2 lg:grid-cols-[minmax(18rem,auto)_minmax(0,1fr)] lg:items-center">
            <nav className="flex h-7 items-center gap-1" aria-label="Tipo de histórico funcional">
              <Link href={hrefFor("ferias", 1)} aria-current={isVacationView ? "page" : undefined} className={["inline-flex h-7 items-center rounded px-3 text-xs font-semibold", isVacationView ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"].join(" ")}>Férias</Link>
              <Link href={hrefFor("afastamentos", 1)} aria-current={!isVacationView ? "page" : undefined} className={["inline-flex h-7 items-center rounded px-3 text-xs font-semibold", !isVacationView ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"].join(" ")}>Afastamentos</Link>
            </nav>
            <form className="grid items-center gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto_auto]" role="search">
              <input type="hidden" name="view" value={view} />
              <select name="status" defaultValue={status} aria-label="Filtrar por situação" className="h-7 rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"><option value="">Todas as situações</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <button type="submit" className={buttonVariants({ size: "sm", className: "h-7 px-3 text-xs" })}>Aplicar</button>
              <Link href={hrefFor(view, 1)} className="inline-flex h-7 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limpar</Link>
            </form>
          </div>
        }
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{total}</strong> registro(s) de {label} no histórico disponibilizado</p>}
        pagination={<ErpPagination page={page} total={total} pageSize={PAGE_SIZE} label={label} previousHref={hrefFor(view, Math.max(1, page - 1), status)} nextHref={hrefFor(view, page + 1, status)} />}
      >
        {children}
      </ErpListFrame>
    </div>
  );
}

function VacationResults({ records }: { records: VacationRecord[] }) {
  if (!records.length) {
    return <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><CalendarDays className="size-5 text-slate-400" /><h2 className="mt-2 text-sm font-semibold text-slate-700">Nenhuma férias encontrada</h2><p className="mt-1 max-w-md text-xs text-slate-500">Os períodos aquisitivos e de gozo liberados pela gestão de pessoas aparecerão aqui.</p></div>;
  }

  return (
    <>
      <div className="hidden h-full md:block">
        <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
          <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-[27%] px-3">Período aquisitivo</th><th className="w-[27%] px-3">Gozo programado</th><th className="w-[14%] px-3 text-right">Dias</th><th className="w-[20%] px-3">Situação</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => <tr key={record.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50"><td className="px-3 py-0 whitespace-nowrap">{formatDate(record.acquisitionStart)} <span className="text-slate-400">a</span> {formatDate(record.acquisitionEnd)}</td><td className="px-3 py-0 whitespace-nowrap">{formatDate(record.enjoymentStart)}{record.enjoymentEnd ? <><span className="text-slate-400"> a </span>{formatDate(record.enjoymentEnd)}</> : ""}</td><td className="px-3 py-0 text-right font-medium tabular-nums">{record.days}</td><td className="px-3 py-0"><span className={["inline-flex max-w-full truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-4", statusClass(record.status)].join(" ")}>{record.status}</span></td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
        {records.map((record) => <article key={record.id} className="space-y-1.5 p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-900">Período aquisitivo</p><span className={["rounded px-1.5 py-0.5 text-[10px] font-semibold", statusClass(record.status)].join(" ")}>{record.status}</span></div><p className="text-[11px] text-slate-600">{formatDate(record.acquisitionStart)} a {formatDate(record.acquisitionEnd)}</p><p className="text-[11px] text-slate-500">Gozo: {formatDate(record.enjoymentStart)}{record.enjoymentEnd ? ` a ${formatDate(record.enjoymentEnd)}` : ""} · {record.days} dia(s)</p></article>)}
      </div>
    </>
  );
}

function LeaveResults({ records }: { records: LeaveRecord[] }) {
  if (!records.length) {
    return <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><FileClock className="size-5 text-slate-400" /><h2 className="mt-2 text-sm font-semibold text-slate-700">Nenhum afastamento encontrado</h2><p className="mt-1 max-w-md text-xs text-slate-500">Afastamentos funcionais liberados para consulta aparecerão nesta área.</p></div>;
  }

  return (
    <>
      <div className="hidden h-full md:block">
        <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
          <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-[36%] px-3">Início</th><th className="w-[36%] px-3">Término</th><th className="w-[28%] px-3">Situação</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => <tr key={record.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50"><td className="px-3 py-0 whitespace-nowrap font-medium">{formatDate(record.startDate)}</td><td className="px-3 py-0 whitespace-nowrap">{formatDate(record.endDate)}</td><td className="px-3 py-0"><span className={["inline-flex max-w-full truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-4", statusClass(record.status)].join(" ")}>{record.status}</span></td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
        {records.map((record) => <article key={record.id} className="space-y-1.5 p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-900">Afastamento funcional</p><span className={["rounded px-1.5 py-0.5 text-[10px] font-semibold", statusClass(record.status)].join(" ")}>{record.status}</span></div><p className="text-[11px] text-slate-600">{formatDate(record.startDate)} a {formatDate(record.endDate)}</p></article>)}
      </div>
    </>
  );
}

export default async function FeriasPortalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getEmployeePortalAccess();
  if (access.status !== "AVAILABLE") return <PortalUnavailable />;

  const params = await searchParams;
  const view = parseView(params.view);
  const status = parseStatus(params.status, view);
  const { context, employee } = access;

  if (view === "afastamentos") {
    const where: Prisma.LeaveWhereInput = { employeeId: employee.id };
    if (status) where.status = status;
    const total = await context.prisma.leave.count({ where });
    const page = resolvePage(params.page, total);
    const records = await context.prisma.leave.findMany({
      where,
      select: { id: true, startDate: true, endDate: true, status: true },
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return <PortalListLayout view={view} status={status} total={total} page={page}><LeaveResults records={records} /></PortalListLayout>;
  }

  const where: Prisma.VacationWhereInput = { employeeId: employee.id };
  if (status) where.status = status;
  const total = await context.prisma.vacation.count({ where });
  const page = resolvePage(params.page, total);
  const records = await context.prisma.vacation.findMany({
    where,
    select: { id: true, acquisitionStart: true, acquisitionEnd: true, enjoymentStart: true, enjoymentEnd: true, days: true, status: true },
    orderBy: [{ acquisitionStart: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return <PortalListLayout view={view} status={status} total={total} page={page}><VacationResults records={records} /></PortalListLayout>;
}
