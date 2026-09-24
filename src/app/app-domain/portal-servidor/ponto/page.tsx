import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { getEmployeePortalAccess } from "@/lib/portal-servidor/access";
import type { Prisma } from "@prisma/client";
import { Clock3, FileClock, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = {
  month?: string | string[];
  page?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseMonth(value: string | string[] | undefined) {
  const month = firstValue(value);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : "";
}

function resolvePage(value: string | string[] | undefined, total: number) {
  const requested = Number.parseInt(firstValue(value), 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
}

function hrefFor(page: number, month: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/portal-servidor/ponto" + (query ? "?" + query : "");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
}

function formatTime(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(value);
}

function formatHours(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " h";
}

function statusClass(status: string) {
  if (status === "Presente") return "bg-emerald-100 text-emerald-800";
  if (status === "Falta") return "bg-red-100 text-red-800";
  if (status === "Atraso") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function PortalUnavailable() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <FileClock className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Espelho de ponto indisponível</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Seu acesso ainda não está vinculado a um cadastro funcional ativo.</p>
      </section>
    </div>
  );
}

export default async function PontoPortalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getEmployeePortalAccess();
  if (access.status !== "AVAILABLE") return <PortalUnavailable />;

  const params = await searchParams;
  const month = parseMonth(params.month);
  const { context, employee } = access;
  const where: Prisma.AttendanceRecordWhereInput = { employeeId: employee.id };

  if (month) {
    const [year, monthNumber] = month.split("-").map(Number);
    where.date = {
      gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
      lt: new Date(Date.UTC(year, monthNumber, 1)),
    };
  }

  const total = await context.prisma.attendanceRecord.count({ where });
  const page = resolvePage(params.page, total);
  const records = await context.prisma.attendanceRecord.findMany({
    where,
    select: {
      id: true,
      date: true,
      entryTime: true,
      exitTime: true,
      hoursWorked: true,
      extraHours: true,
      bankHours: true,
      status: true,
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Meu espelho de ponto"
        description="Registros de jornada vinculados exclusivamente ao seu cadastro funcional."
        icon={<Clock3 className="size-5 shrink-0 text-emerald-700" />}
        action={<Link href="/portal-servidor/ferias" className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Férias e afastamentos</Link>}
      />

      <ErpListFrame
        toolbar={
          <form className="grid items-center gap-2 sm:grid-cols-[minmax(11rem,1fr)_auto_auto]" role="search">
            <label className="relative block"><span className="sr-only">Competência</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="month" name="month" defaultValue={month} aria-label="Filtrar por competência" className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
            <button type="submit" className={buttonVariants({ size: "sm", className: "h-7 px-3 text-xs" })}>Aplicar</button>
            <Link href="/portal-servidor/ponto" className="inline-flex h-7 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limpar</Link>
          </form>
        }
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{total}</strong> registro(s) de ponto{month ? " na competência selecionada" : " no histórico disponibilizado"}</p>}
        pagination={<ErpPagination page={page} total={total} pageSize={PAGE_SIZE} label="registros de ponto" previousHref={hrefFor(Math.max(1, page - 1), month)} nextHref={hrefFor(page + 1, month)} />}
      >
        {records.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><FileClock className="size-5 text-slate-400" /><h2 className="mt-2 text-sm font-semibold text-slate-700">Nenhum registro de ponto encontrado</h2><p className="mt-1 max-w-md text-xs text-slate-500">Os registros liberados pela gestão de pessoas aparecerão nesta área.</p></div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
                <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-[15%] px-3">Data</th><th className="w-[16%] px-3">Entrada / saída</th><th className="w-[14%] px-3 text-right">Horas</th><th className="hidden w-[14%] px-3 text-right lg:table-cell">Extras</th><th className="hidden w-[16%] px-3 text-right xl:table-cell">Banco de horas</th><th className="w-[18%] px-3">Situação</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => <tr key={record.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50"><td className="px-3 py-0 whitespace-nowrap font-medium">{formatDate(record.date)}</td><td className="px-3 py-0 whitespace-nowrap">{formatTime(record.entryTime)} <span className="text-slate-400">/</span> {formatTime(record.exitTime)}</td><td className="px-3 py-0 text-right font-medium tabular-nums">{formatHours(record.hoursWorked)}</td><td className="hidden px-3 py-0 text-right tabular-nums lg:table-cell">{formatHours(record.extraHours)}</td><td className="hidden px-3 py-0 text-right tabular-nums xl:table-cell">{formatHours(record.bankHours)}</td><td className="px-3 py-0"><span className={["inline-flex max-w-full truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-4", statusClass(record.status)].join(" ")}>{record.status}</span></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {records.map((record) => <article key={record.id} className="space-y-1.5 p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-900">{formatDate(record.date)}</p><span className={["rounded px-1.5 py-0.5 text-[10px] font-semibold", statusClass(record.status)].join(" ")}>{record.status}</span></div><p className="text-[11px] text-slate-600">{formatTime(record.entryTime)} / {formatTime(record.exitTime)} · {formatHours(record.hoursWorked)}</p><p className="text-[11px] text-slate-500">Extras: {formatHours(record.extraHours)} · Banco: {formatHours(record.bankHours)}</p></article>)}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
